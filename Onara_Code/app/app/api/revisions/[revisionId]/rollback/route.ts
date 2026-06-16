import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type UserPlan = "free" | "starter" | "pro";

type RevisionForRollback = {
  affected_components: string[] | null;
  before_files: unknown;
  before_public_url: string | null;
  id: string;
  project_id: string;
  status: string;
};

type ProjectForRollback = {
  business_address: string | null;
  business_category: string | null;
  business_email: string | null;
  business_hours: unknown;
  business_name: string;
  business_phone: string | null;
  business_photos: string[] | null;
  business_website: string | null;
  cloudflare_project_name: string | null;
  github_path: string | null;
  google_place_id: string | null;
  google_rating: number | string | null;
  google_review_count: number | null;
  id: string;
  public_url: string | null;
  status: string;
  style_preferences: Record<string, unknown> | null;
};

type UserProfile = {
  is_trial: boolean | null;
  plan: string | null;
  revisions_limit: number;
  revisions_used: number;
};

type PipelineRevisionStartResponse = {
  detail?: unknown;
  error?: string;
  job_id?: string;
  message?: string;
  queue_position?: number | null;
  status?: string;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(
  _request: Request,
  context: { params: Promise<{ revisionId: string }> },
) {
  const { revisionId } = await context.params;

  if (!UUID_RE.test(revisionId)) {
    return NextResponse.json({ error: "invalid_revision_id", message: "Revision id is invalid." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const pipelineServerUrl = process.env.PIPELINE_SERVER_URL?.replace(/\/+$/, "");
  const pipelineSecret = process.env.PIPELINE_API_SECRET;

  if (!pipelineServerUrl || !pipelineSecret) {
    return NextResponse.json({ error: "pipeline_not_configured", message: "Pipeline is not configured." }, { status: 500 });
  }

  const db = createAdminClient();
  const { data: sourceRevision, error: revisionError } = await db
    .from("revisions")
    .select("id, project_id, status, affected_components, before_files, before_public_url")
    .eq("id", revisionId)
    .eq("user_id", user.id)
    .maybeSingle<RevisionForRollback>();

  if (revisionError) {
    return NextResponse.json({ error: "revision_lookup_failed", message: revisionError.message }, { status: 500 });
  }

  if (!sourceRevision) {
    return NextResponse.json({ error: "not_found", message: "Revision was not found." }, { status: 404 });
  }

  if (sourceRevision.status !== "done") {
    return NextResponse.json(
      { error: "rollback_not_allowed", message: "Only completed revisions can be rolled back." },
      { status: 409 },
    );
  }

  const sourceFiles = sourceFilesFromSnapshot(sourceRevision.before_files);
  if (!sourceFiles) {
    return NextResponse.json(
      { error: "rollback_snapshot_missing", message: "This revision does not have a rollback snapshot." },
      { status: 409 },
    );
  }

  const [{ data: project, error: projectError }, { data: profile, error: profileError }] = await Promise.all([
    db
      .from("projects")
      .select(
        "id, business_name, business_address, business_phone, business_email, business_website, business_hours, business_photos, business_category, google_place_id, google_rating, google_review_count, style_preferences, status, github_path, public_url, cloudflare_project_name",
      )
      .eq("id", sourceRevision.project_id)
      .eq("user_id", user.id)
      .maybeSingle<ProjectForRollback>(),
    db
      .from("users")
      .select("plan, is_trial, revisions_used, revisions_limit")
      .eq("id", user.id)
      .maybeSingle<UserProfile>(),
  ]);

  if (projectError || profileError) {
    return NextResponse.json(
      { error: "lookup_failed", message: projectError?.message ?? profileError?.message },
      { status: 500 },
    );
  }

  if (!project || project.status !== "live") {
    return NextResponse.json(
      { error: "rollback_not_allowed", message: "Rollback is available only for live sites." },
      { status: 409 },
    );
  }

  if (!hasRevisionCredit(profile)) {
    return NextResponse.json(
      { error: "revision_limit_reached", message: "You have no revisions remaining this month." },
      { status: 403 },
    );
  }

  const instruction = `Rollback to the version before revision ${sourceRevision.id}.`;
  const componentSelection = sourceRevision.affected_components ?? [];
  const initialProgress = [progressEntry("rollback_created", "Rollback request received.")];
  const { data: rollbackRevision, error: createError } = await db
    .from("revisions")
    .insert({
      component_selection: componentSelection,
      instruction,
      parent_revision_id: sourceRevision.id,
      project_id: project.id,
      progress_log: initialProgress,
      revision_kind: "rollback",
      status: "pending",
      user_id: user.id,
    })
    .select("id")
    .single<{ id: string }>();

  if (createError || !rollbackRevision) {
    return NextResponse.json(
      { error: "rollback_create_failed", message: createError?.message ?? "Rollback could not be created." },
      { status: 500 },
    );
  }

  let pipelineResponse: Response;
  try {
    pipelineResponse = await fetch(`${pipelineServerUrl}/pipeline/revisions/start`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Pipeline-Secret": pipelineSecret,
      },
      body: JSON.stringify({
        business_data: businessDataFromProject(project),
        cloudflare_project_name: project.cloudflare_project_name,
        component_selection: componentSelection,
        github_path: project.github_path,
        instruction,
        is_trial: Boolean(profile?.is_trial),
        parent_revision_id: sourceRevision.id,
        project_id: project.id,
        public_url: project.public_url,
        revision_id: rollbackRevision.id,
        revision_kind: "rollback",
        source_files: sourceFiles,
        source_public_url: sourceRevision.before_public_url,
        style_preferences: project.style_preferences ?? {},
        user_id: user.id,
        user_plan: planForPipeline(profile),
      }),
      cache: "no-store",
    });
  } catch {
    await markRevisionFailed(db, rollbackRevision.id, "FastAPI pipeline server is unreachable.", initialProgress);
    return NextResponse.json(
      { error: "pipeline_unavailable", message: "FastAPI pipeline server is unreachable." },
      { status: 503 },
    );
  }

  const payload = (await pipelineResponse.json().catch(() => ({}))) as PipelineRevisionStartResponse;
  if (!pipelineResponse.ok || !payload.job_id) {
    const message = payload.message ?? errorMessageFromDetail(payload.detail) ?? "Rollback job could not start.";
    await markRevisionFailed(db, rollbackRevision.id, message, initialProgress);
    return NextResponse.json({ error: payload.error ?? "rollback_start_failed", message }, { status: pipelineResponse.status });
  }

  await db
    .from("revisions")
    .update({
      pipeline_job_id: payload.job_id,
      progress_log: [...initialProgress, progressEntry("rollback_queued", "Rollback job queued.")],
      started_at: new Date().toISOString(),
      status: "running",
    })
    .eq("id", rollbackRevision.id)
    .eq("user_id", user.id);

  await db.from("revision_messages").insert([
    {
      content: instruction,
      metadata: { rollback_of_revision_id: sourceRevision.id },
      project_id: project.id,
      revision_id: rollbackRevision.id,
      role: "user",
      user_id: user.id,
    },
    {
      content: "Started rollback. I will redeploy the stored previous snapshot and update the live site if deployment succeeds.",
      metadata: { pipeline_job_id: payload.job_id },
      project_id: project.id,
      revision_id: rollbackRevision.id,
      role: "assistant",
      user_id: user.id,
    },
  ]);

  return NextResponse.json(
    {
      jobId: payload.job_id,
      job_id: payload.job_id,
      revisionId: rollbackRevision.id,
      revision_id: rollbackRevision.id,
      status: payload.status ?? "queued",
    },
    { status: 202 },
  );
}

function sourceFilesFromSnapshot(value: unknown) {
  if (!isPlainObject(value)) {
    return null;
  }

  const files: Record<string, string> = {};
  for (const [key, content] of Object.entries(value)) {
    if (typeof content === "string") {
      files[key] = content;
    }
  }
  return files["index.html"] ? files : null;
}

function businessDataFromProject(project: ProjectForRollback) {
  return {
    address: project.business_address,
    category: project.business_category,
    email: project.business_email,
    hours: project.business_hours,
    name: project.business_name,
    phone: project.business_phone,
    photos: project.business_photos ?? [],
    place_id: project.google_place_id,
    rating: project.google_rating,
    review_count: project.google_review_count,
    website: project.business_website,
  };
}

function hasRevisionCredit(profile: UserProfile | null) {
  if (!profile) {
    return false;
  }
  return profile.revisions_limit === -1 || profile.revisions_used < profile.revisions_limit;
}

function planForPipeline(profile: UserProfile | null): UserPlan {
  if (profile?.is_trial) {
    return "pro";
  }
  if (profile?.plan === "starter" || profile?.plan === "pro") {
    return profile.plan;
  }
  return "free";
}

function progressEntry(event: string, message: string) {
  return {
    event,
    message,
    timestamp: new Date().toISOString(),
  };
}

async function markRevisionFailed(
  db: ReturnType<typeof createAdminClient>,
  revisionId: string,
  message: string,
  existingProgress: Array<Record<string, unknown>>,
) {
  await db
    .from("revisions")
    .update({
      completed_at: new Date().toISOString(),
      error_message: message,
      progress_log: [...existingProgress, progressEntry("revision_failed", message)],
      status: "failed",
    })
    .eq("id", revisionId);
}

function errorMessageFromDetail(detail: unknown) {
  if (typeof detail === "string") {
    return detail;
  }
  if (Array.isArray(detail)) {
    return detail
      .map((item) => (isPlainObject(item) && typeof item.msg === "string" ? item.msg : null))
      .filter(Boolean)
      .join("; ");
  }
  return null;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
