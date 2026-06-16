import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type GenerateRequestBody = {
  agent_6_model?: unknown;
  business_data?: unknown;
  generation_package?: {
    agent_6_model?: unknown;
    business?: unknown;
    style?: unknown;
  };
  project_id?: unknown;
  style_preferences?: unknown;
};

type PipelineStartResponse = {
  agent_6_model?: string;
  agent_6_model_reason?: string | null;
  agent_6_model_requested?: string | null;
  deduped?: boolean;
  job_id?: string;
  project_id?: string;
  queue_position?: number | null;
  queued?: boolean;
  status?: string;
};

type UserProfile = {
  is_trial: boolean | null;
  plan: string | null;
};

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: GenerateRequestBody;
  try {
    body = (await request.json()) as GenerateRequestBody;
  } catch {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const businessData = businessDataFromBody(body);
  const stylePreferences = stylePreferencesFromBody(body);

  if (!isPlainObject(businessData) || typeof businessData.name !== "string" || !businessData.name.trim()) {
    return NextResponse.json(
      { error: "validation_error", message: "business_data.name is required" },
      { status: 422 },
    );
  }

  const pipelineServerUrl = process.env.PIPELINE_SERVER_URL?.replace(/\/+$/, "");
  const pipelineSecret = process.env.PIPELINE_API_SECRET;

  if (!pipelineServerUrl || !pipelineSecret) {
    return NextResponse.json({ error: "pipeline_not_configured" }, { status: 500 });
  }

  const { data: profile } = await supabase
    .from("users")
    .select("plan, is_trial")
    .eq("id", user.id)
    .maybeSingle<UserProfile>();

  const userPlan = planForPipeline(profile);
  const agent6Model = agent6ModelFromBody(body);
  const projectId = typeof body.project_id === "string" && body.project_id.trim()
    ? body.project_id.trim()
    : undefined;
  const placeId = typeof businessData.place_id === "string" && businessData.place_id.trim()
    ? businessData.place_id.trim()
    : undefined;

  let pipelineResponse: Response;
  try {
    pipelineResponse = await fetch(`${pipelineServerUrl}/pipeline/start`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Pipeline-Secret": pipelineSecret,
      },
      body: JSON.stringify({
        agent_6_model: agent6Model,
        business_data: businessData,
        is_trial: Boolean(profile?.is_trial),
        place_id: placeId,
        project_id: projectId,
        style_preferences: isPlainObject(stylePreferences) ? stylePreferences : {},
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

  let payload: PipelineStartResponse & { detail?: unknown; error?: string; message?: string };
  try {
    payload = (await pipelineResponse.json()) as PipelineStartResponse;
  } catch {
    payload = {};
  }

  if (!pipelineResponse.ok || !payload.job_id) {
    return NextResponse.json(
      {
        error: payload.error ?? "pipeline_start_failed",
        message: payload.message ?? errorMessageFromDetail(payload.detail) ?? "Pipeline job could not start.",
      },
      { status: pipelineResponse.status },
    );
  }

  const returnedProjectId = typeof payload.project_id === "string" && payload.project_id.trim()
    ? payload.project_id.trim()
    : null;
  const projectPersistResult = returnedProjectId
    ? await persistQueuedProject({
        businessData,
        jobId: payload.job_id,
        pipelineStatus: payload.status ?? "queued",
        projectId: returnedProjectId,
        stylePreferences: isPlainObject(stylePreferences) ? stylePreferences : {},
        supabase,
        userId: user.id,
      })
    : { error: "Pipeline did not return a project id.", stored: false };

  return NextResponse.json(
    {
      agent6Model: payload.agent_6_model,
      agent6ModelReason: payload.agent_6_model_reason ?? null,
      agent6ModelRequested: payload.agent_6_model_requested ?? null,
      agent_6_model: payload.agent_6_model,
      agent_6_model_reason: payload.agent_6_model_reason ?? null,
      agent_6_model_requested: payload.agent_6_model_requested ?? null,
      deduped: Boolean(payload.deduped),
      jobId: payload.job_id,
      job_id: payload.job_id,
      projectId: returnedProjectId,
      project_id: returnedProjectId,
      projectPersisted: projectPersistResult.stored,
      project_persisted: projectPersistResult.stored,
      projectPersistError: projectPersistResult.error,
      project_persist_error: projectPersistResult.error,
      queuePosition: payload.queue_position ?? null,
      queue_position: payload.queue_position ?? null,
      queued: payload.queued ?? true,
      status: payload.status ?? "queued",
    },
    { status: 202 },
  );
}

async function persistQueuedProject({
  businessData,
  jobId,
  pipelineStatus,
  projectId,
  stylePreferences,
  supabase,
  userId,
}: {
  businessData: Record<string, unknown>;
  jobId: string;
  pipelineStatus: string;
  projectId: string;
  stylePreferences: Record<string, unknown>;
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
}) {
  const { error } = await supabase
    .from("projects")
    .upsert(
      {
        business_address: optionalString(businessData.address),
        business_category: optionalString(businessData.category),
        business_email: optionalString(businessData.email),
        business_hours: jsonValue(businessData.hours),
        business_name: requiredBusinessName(businessData),
        business_phone: optionalString(businessData.phone),
        business_photos: photoSources(businessData),
        business_website: optionalString(businessData.website),
        current_agent: "analyst",
        google_place_id: optionalString(businessData.place_id),
        google_rating: ratingValue(businessData.rating),
        google_review_count: intValue(businessData.review_count),
        id: projectId,
        pipeline_job_id: jobId,
        public_url: publicJobUrl(jobId),
        status: pipelineStatus === "running" ? "generating" : "queued",
        style_preferences: stylePreferences,
        updated_at: new Date().toISOString(),
        user_id: userId,
      },
      { onConflict: "id" },
    );

  if (error) {
    return { error: error.message, stored: false };
  }

  return { error: null, stored: true };
}

function agent6ModelFromBody(body: GenerateRequestBody) {
  if (typeof body.agent_6_model === "string" && body.agent_6_model.trim()) {
    return body.agent_6_model.trim();
  }

  if (
    typeof body.generation_package?.agent_6_model === "string" &&
    body.generation_package.agent_6_model.trim()
  ) {
    return body.generation_package.agent_6_model.trim();
  }

  return "onara-default";
}

function businessDataFromBody(body: GenerateRequestBody) {
  if (isPlainObject(body.business_data)) {
    return body.business_data;
  }

  if (isPlainObject(body.generation_package?.business)) {
    return body.generation_package.business;
  }

  return null;
}

function stylePreferencesFromBody(body: GenerateRequestBody) {
  if (isPlainObject(body.style_preferences)) {
    return body.style_preferences;
  }

  if (isPlainObject(body.generation_package?.style)) {
    return body.generation_package.style;
  }

  return {};
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

function planForPipeline(profile: UserProfile | null) {
  if (profile?.is_trial) {
    return "pro";
  }

  if (profile?.plan === "starter" || profile?.plan === "pro") {
    return profile.plan;
  }

  return "free";
}

function requiredBusinessName(businessData: Record<string, unknown>) {
  return optionalString(businessData.name) || "Generated Business";
}

function optionalString(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const text = String(value).trim();
  return text || null;
}

function jsonValue(value: unknown) {
  if (
    value === null ||
    Array.isArray(value) ||
    ["boolean", "number", "string"].includes(typeof value) ||
    isPlainObject(value)
  ) {
    return value;
  }

  return String(value);
}

function ratingValue(value: unknown) {
  const rating = Number(value);
  if (!Number.isFinite(rating) || rating < 0 || rating > 5) {
    return null;
  }

  return Math.round(rating * 10) / 10;
}

function intValue(value: unknown) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 0) {
    return null;
  }

  return number;
}

function photoSources(businessData: Record<string, unknown>) {
  const sources: string[] = [];

  for (const key of ["resolved_photos", "photos"]) {
    const collection = businessData[key];
    if (!Array.isArray(collection)) {
      continue;
    }

    for (const item of collection) {
      const src = photoSource(item);
      if (src && !sources.includes(src)) {
        sources.push(src);
      }
    }
  }

  return sources;
}

function photoSource(value: unknown) {
  if (typeof value === "string") {
    return value.startsWith("https://") || value.startsWith("data:image/") ? value : null;
  }

  if (!isPlainObject(value)) {
    return null;
  }

  for (const key of ["src", "url", "photo_url", "photoUrl", "preview_url"]) {
    const text = optionalString(value[key]);
    if (text?.startsWith("https://") || text?.startsWith("data:image/")) {
      return text;
    }
  }

  return null;
}

function publicJobUrl(jobId: string) {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "https://onara.tech").replace(/\/+$/, "");
  return `${appUrl}/${jobId}`;
}
