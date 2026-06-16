import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type ProjectStatus = "queued" | "generating" | "deploying" | "live" | "failed" | "suspended";
type UserPlan = "free" | "starter" | "pro";

type ProjectForRetry = {
  business_address: string | null;
  business_category: string | null;
  business_email: string | null;
  business_hours: unknown;
  business_name: string;
  business_phone: string | null;
  business_photos: string[] | null;
  business_website: string | null;
  google_place_id: string | null;
  google_rating: number | string | null;
  google_review_count: number | null;
  id: string;
  status: ProjectStatus;
  style_preferences: Record<string, unknown> | null;
};

type UserProfile = {
  is_trial: boolean | null;
  plan: string | null;
};

type PipelineStartResponse = {
  job_id?: string;
  project_id?: string;
  queue_position?: number | null;
  status?: string;
  detail?: unknown;
  error?: string;
  message?: string;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(
  _request: Request,
  context: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await context.params;

  if (!UUID_RE.test(projectId)) {
    return NextResponse.json({ error: "invalid_project_id", message: "Project id is invalid." }, { status: 400 });
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
  const [{ data: project, error: projectError }, { data: profile, error: profileError }] = await Promise.all([
    db
      .from("projects")
      .select(
        "id, business_name, business_address, business_phone, business_email, business_website, business_hours, business_photos, business_category, google_place_id, google_rating, google_review_count, style_preferences, status",
      )
      .eq("id", projectId)
      .eq("user_id", user.id)
      .maybeSingle<ProjectForRetry>(),
    db
      .from("users")
      .select("plan, is_trial")
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

  if (project.status !== "failed") {
    return NextResponse.json(
      { error: "retry_not_allowed", message: "Only failed builds can be retried from this action." },
      { status: 409 },
    );
  }

  const businessData = businessDataFromProject(project);
  const userPlan = planForPipeline(profile);

  let pipelineResponse: Response;
  try {
    pipelineResponse = await fetch(`${pipelineServerUrl}/pipeline/start`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Pipeline-Secret": pipelineSecret,
      },
      body: JSON.stringify({
        agent_6_model: "onara-default",
        business_data: businessData,
        is_trial: Boolean(profile?.is_trial),
        place_id: project.google_place_id ?? undefined,
        project_id: project.id,
        style_preferences: project.style_preferences ?? {},
        user_id: user.id,
        user_plan: userPlan,
      }),
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { error: "pipeline_unavailable", message: "FastAPI pipeline server is unreachable." },
      { status: 503 },
    );
  }

  const payload = (await pipelineResponse.json().catch(() => ({}))) as PipelineStartResponse;
  if (!pipelineResponse.ok || !payload.job_id) {
    return NextResponse.json(
      {
        error: payload.error ?? "pipeline_start_failed",
        message: payload.message ?? errorMessageFromDetail(payload.detail) ?? "Retry job could not start.",
      },
      { status: pipelineResponse.status },
    );
  }

  const { error: updateError } = await db
    .from("projects")
    .update({
      current_agent: "analyst",
      error_message: null,
      pipeline_job_id: payload.job_id,
      public_url: publicJobUrl(payload.job_id),
      status: payload.status === "running" ? "generating" : "queued",
      updated_at: new Date().toISOString(),
    })
    .eq("id", project.id)
    .eq("user_id", user.id);

  if (updateError) {
    return NextResponse.json(
      { error: "project_update_failed", message: updateError.message },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      jobId: payload.job_id,
      job_id: payload.job_id,
      projectId: project.id,
      project_id: project.id,
      queuePosition: payload.queue_position ?? null,
      queue_position: payload.queue_position ?? null,
      status: payload.status ?? "queued",
    },
    { status: 202 },
  );
}

function businessDataFromProject(project: ProjectForRetry) {
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

function publicJobUrl(jobId: string) {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "https://onara.tech").replace(/\/+$/, "");
  return `${appUrl}/${jobId}`;
}
