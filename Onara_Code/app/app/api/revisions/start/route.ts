import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type RevisionStartBody = {
  message?: unknown;
  projectId?: unknown;
};

type ProjectForRevision = {
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
  job_id?: string;
  queue_position?: number | null;
  revision_id?: string;
  status?: string;
  detail?: unknown;
  error?: string;
  message?: string;
};

type UserPlan = "free" | "starter" | "pro";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: RevisionStartBody;
  try {
    body = (await request.json()) as RevisionStartBody;
  } catch {
    return NextResponse.json({ error: "invalid_request", message: "Request body must be JSON." }, { status: 400 });
  }

  const projectId = typeof body.projectId === "string" ? body.projectId.trim() : "";
  const instruction = typeof body.message === "string" ? body.message.trim() : "";

  if (!UUID_RE.test(projectId)) {
    return NextResponse.json({ error: "invalid_project_id", message: "Project id is invalid." }, { status: 400 });
  }

  if (instruction.length < 3) {
    return NextResponse.json(
      { error: "validation_error", message: "Tell Onara what to change." },
      { status: 422 },
    );
  }

  if (instruction.length > 4000) {
    return NextResponse.json(
      { error: "validation_error", message: "Revision instructions must be under 4,000 characters." },
      { status: 422 },
    );
  }

  const pipelineServerUrl = process.env.PIPELINE_SERVER_URL?.replace(/\/+$/, "");
  const pipelineSecret = process.env.PIPELINE_API_SECRET;

  if (!pipelineServerUrl || !pipelineSecret) {
    return NextResponse.json({ error: "pipeline_not_configured", message: "Pipeline is not configured." }, { status: 500 });
  }

  const db = createAdminClient();
  const [{ data: project, error: projectError }, { data: profile, error: profileError }] = await Promise.all([
    db
      .from("projects")
      .select(
        "id, business_name, business_address, business_phone, business_email, business_website, business_hours, business_photos, business_category, google_place_id, google_rating, google_review_count, style_preferences, status, github_path, public_url, cloudflare_project_name",
      )
      .eq("id", projectId)
      .eq("user_id", user.id)
      .maybeSingle<ProjectForRevision>(),
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

  if (!project) {
    return NextResponse.json({ error: "not_found", message: "Site was not found." }, { status: 404 });
  }

  if (project.status !== "live") {
    return NextResponse.json(
      { error: "revision_not_allowed", message: "Revisions are available after a site is live." },
      { status: 409 },
    );
  }

  if (!hasRevisionCredit(profile)) {
    return NextResponse.json(
      {
        error: "revision_limit_reached",
        message: "You have no revisions remaining this month.",
        revisionsLimit: profile?.revisions_limit ?? 0,
        revisionsUsed: profile?.revisions_used ?? 0,
      },
      { status: 403 },
    );
  }

  const initialProgress = [
    progressEntry("revision_created", "Revision request received."),
  ];
  const { data: revision, error: revisionError } = await db
    .from("revisions")
    .insert({
      instruction,
      project_id: project.id,
      progress_log: initialProgress,
      status: "pending",
      user_id: user.id,
    })
    .select("id")
    .single<{ id: string }>();

  if (revisionError || !revision) {
    return NextResponse.json(
      { error: "revision_create_failed", message: revisionError?.message ?? "Revision could not be created." },
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
        github_path: project.github_path,
        instruction,
        is_trial: Boolean(profile?.is_trial),
        project_id: project.id,
        public_url: project.public_url,
        revision_id: revision.id,
        style_preferences: project.style_preferences ?? {},
        user_id: user.id,
        user_plan: planForPipeline(profile),
      }),
      cache: "no-store",
    });
  } catch {
    await markRevisionFailed(db, revision.id, "FastAPI pipeline server is unreachable.", initialProgress);
    return NextResponse.json(
      { error: "pipeline_unavailable", message: "FastAPI pipeline server is unreachable." },
      { status: 503 },
    );
  }

  const payload = (await pipelineResponse.json().catch(() => ({}))) as PipelineRevisionStartResponse;
  if (!pipelineResponse.ok || !payload.job_id) {
    const message = payload.message ?? errorMessageFromDetail(payload.detail) ?? "Revision job could not start.";
    await markRevisionFailed(db, revision.id, message, initialProgress);
    return NextResponse.json(
      { error: payload.error ?? "revision_start_failed", message },
      { status: pipelineResponse.status },
    );
  }

  await db
    .from("revisions")
    .update({
      pipeline_job_id: payload.job_id,
      progress_log: [...initialProgress, progressEntry("revision_queued", "Revision job queued.")],
      started_at: new Date().toISOString(),
      status: "running",
    })
    .eq("id", revision.id)
    .eq("user_id", user.id);

  return NextResponse.json(
    {
      jobId: payload.job_id,
      job_id: payload.job_id,
      queuePosition: payload.queue_position ?? null,
      queue_position: payload.queue_position ?? null,
      remainingRevisions: remainingRevisions(profile),
      revisionId: revision.id,
      revision_id: revision.id,
      status: payload.status ?? "queued",
    },
    { status: 202 },
  );
}

function hasRevisionCredit(profile: UserProfile | null) {
  if (!profile) {
    return false;
  }

  if (profile.revisions_limit === -1) {
    return true;
  }

  return profile.revisions_used < profile.revisions_limit;
}

function remainingRevisions(profile: UserProfile | null) {
  if (!profile) {
    return 0;
  }

  if (profile.revisions_limit === -1) {
    return -1;
  }

  return Math.max(0, profile.revisions_limit - profile.revisions_used);
}

function businessDataFromProject(project: ProjectForRevision) {
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
