import {
  AGENT_STEPS,
  MOCK_STEP_MS,
  previewHtmlForStep,
  progressForElapsed,
} from "@/lib/build/agent-progress";
import { fetchWithTimeout } from "@/lib/resilience";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type PipelineProgressEntry = {
  agent_id?: string | null;
  event?: string;
  message?: string;
  timestamp?: string;
};

type PipelineCandidate = {
  candidateKey?: string;
  degradedReason?: string | null;
  deterministicScore?: number;
  fallbackUsed?: boolean;
  finalScore?: number;
  hardBlockers?: string[];
  model?: string;
  provider?: string;
  qualityMode?: "full" | "static";
  recipe?: string;
  selected?: boolean;
  thumbnailDataUrl?: string | null;
  visualScore?: number;
  warnings?: string[];
};

type PipelineStatusResponse = {
  agents_completed: number;
  agents_total: number;
  candidates?: PipelineCandidate[];
  current_agent: string | null;
  eta_seconds?: number | null;
  error_message?: string | null;
  fallback_used?: boolean;
  job_id: string;
  pipeline_version?: string;
  preview_html?: string | null;
  progress_log: PipelineProgressEntry[];
  public_url?: string | null;
  quality_badges?: string[];
  queue_position?: number | null;
  selected_candidate_id?: string | null;
  site_id?: string | null;
  stage?: string | null;
  status: "queued" | "running" | "completed" | "failed";
};

type ProjectResumeStatus = {
  business_name: string;
  current_agent: string | null;
  error_message: string | null;
  id: string;
  pipeline_job_id: string | null;
  public_url: string | null;
  status: "queued" | "generating" | "deploying" | "live" | "failed" | "suspended";
};

const PIPELINE_AGENT_TO_STEP_INDEX: Record<string, number> = {
  agent_01_analyst: 0,
  agent_02_content: 1,
  agent_03_style: 2,
  agent_04_planner: 2,
  agent_05_prompt_engineer: 2,
  agent_06_codegen: 3,
  agent_07_debugger: 5,
  agent_08_seo: 5,
  agent_09_qa: 4,
  agent_10_mobile: 5,
  building_candidates: 3,
  designing_concepts: 2,
  polishing: 5,
  publishing: 6,
  testing_candidates: 4,
  understanding_business: 0,
  writing_content: 1,
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get("jobId") || "mock-job";
  const projectId = searchParams.get("projectId");
  const businessName = searchParams.get("businessName") || "Your Contractor Site";
  const elapsedMs = Number(searchParams.get("elapsedMs") || "0");

  if (!isMockJob(jobId) && pipelineConfigured()) {
    const status = await fetchPipelineStatus(jobId);

    if ("error" in status) {
      const projectStatus = projectId ? await fetchProjectResumeStatus(projectId) : null;
      if (projectStatus) {
        return Response.json(mapProjectResumeStatus(projectStatus, jobId));
      }

      return Response.json(status, { status: status.statusCode });
    }

    return Response.json(mapPipelineStatus(status));
  }

  return Response.json(mockStatus(jobId, businessName, Number.isFinite(elapsedMs) ? elapsedMs : 0));
}

async function fetchProjectResumeStatus(projectId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const db = createAdminClient();
  const { data } = await db
    .from("projects")
    .select("id, business_name, status, current_agent, error_message, pipeline_job_id, public_url")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .maybeSingle<ProjectResumeStatus>();

  return data ?? null;
}

function mapProjectResumeStatus(project: ProjectResumeStatus, jobId: string) {
  const pipelineStatus = projectStatusToPipelineStatus(project.status);
  const currentStepIndex = currentStepIndexForProject(project);
  const activeAgent = AGENT_STEPS[currentStepIndex];
  const complete = pipelineStatus === "completed";

  return {
    activeAgent,
    candidates: [],
    complete,
    currentStepIndex,
    failed: pipelineStatus === "failed",
    html: undefined,
    jobId: project.pipeline_job_id || jobId,
    message: project.error_message
      ? publicBuildError(project.error_message)
      : messageForProjectStatus(project.status, activeAgent?.task),
    etaSeconds: null,
    progress: progressForProjectStatus(project.status, currentStepIndex),
    publicUrl: project.public_url || publicJobUrl(project.pipeline_job_id || jobId),
    queued: project.status === "queued",
    queuePosition: null,
    retrying: false,
    qualityBadges: complete
      ? ["Desktop tested", "Mobile tested", "Business facts verified", "Contact form checked"]
      : [],
    siteId: project.id,
    totalSteps: AGENT_STEPS.length,
  };
}

function mapPipelineStatus(status: PipelineStatusResponse) {
  const currentStepIndex = currentStepIndexFor(status);
  const activeAgent = AGENT_STEPS[currentStepIndex];
  const complete = status.status === "completed";
  const queued = status.status === "queued";
  const latestMessage = latestProgressMessage(status);
  const progress = progressForPipeline(status, currentStepIndex);
  return {
    activeAgent,
    candidates: status.candidates ?? [],
    complete,
    currentStepIndex,
    failed: status.status === "failed",
    html: status.preview_html || undefined,
    jobId: status.job_id,
    message: status.error_message
      ? publicBuildError(status.error_message)
      : latestMessage || activeAgent?.task || "Build pipeline is running.",
    notice: latestBlackboardNotice(status),
    etaSeconds: status.eta_seconds ?? null,
    fallbackUsed: Boolean(status.fallback_used),
    progress,
    publicUrl: status.public_url || publicJobUrl(status.job_id),
    queued,
    queuePosition: status.queue_position ?? null,
    retrying: false,
    qualityBadges: status.quality_badges ?? [],
    selectedCandidateId: status.selected_candidate_id ?? null,
    siteId: status.site_id ?? null,
    totalSteps: AGENT_STEPS.length,
  };
}

function mockStatus(jobId: string, businessName: string, elapsedMs: number) {
  const progress = progressForElapsed(elapsedMs);
  const activeAgent = AGENT_STEPS[progress.currentStepIndex];
  const retrying = activeAgent?.id === "testing" && elapsedMs % MOCK_STEP_MS > MOCK_STEP_MS * 0.42;

  return {
    activeAgent,
    complete: progress.complete,
    currentStepIndex: progress.currentStepIndex,
    html: previewHtmlForStep(progress.complete ? AGENT_STEPS.length : progress.currentStepIndex, businessName),
    jobId,
    failed: false,
    message: progress.queued
      ? "Your site is queued. Preparing the agent workspace."
      : progress.complete
        ? "Website draft ready. Review the preview before publishing."
        : retrying
          ? "Spacing mismatch caught. Retrying with stricter layout rules."
          : activeAgent?.task,
    progress: progress.progress,
    publicUrl: publicJobUrl(jobId),
    queued: progress.queued,
    retrying,
    totalSteps: AGENT_STEPS.length,
  };
}

async function fetchPipelineStatus(jobId: string) {
  const pipelineServerUrl = process.env.PIPELINE_SERVER_URL?.replace(/\/+$/, "");
  const pipelineSecret = process.env.PIPELINE_API_SECRET;

  if (!pipelineServerUrl || !pipelineSecret) {
    return {
      error: "pipeline_not_configured",
      message: "Pipeline status is not configured.",
      statusCode: 500,
    };
  }

  try {
    const response = await fetchWithTimeout(
      `${pipelineServerUrl}/pipeline/status/${encodeURIComponent(jobId)}`,
      {
        cache: "no-store",
        headers: {
          "X-Pipeline-Secret": pipelineSecret,
        },
      },
      8_000,
    );
    const body = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        error: "pipeline_status_failed",
        message: errorMessageFromBody(body) || "Pipeline status is unavailable.",
        statusCode: response.status,
      };
    }

    return body as PipelineStatusResponse;
  } catch {
    return {
      error: "pipeline_unavailable",
      message: "FastAPI pipeline server is unreachable.",
      statusCode: 503,
    };
  }
}

function currentStepIndexFor(status: PipelineStatusResponse) {
  if (status.stage && status.stage in PIPELINE_AGENT_TO_STEP_INDEX) {
    return PIPELINE_AGENT_TO_STEP_INDEX[status.stage];
  }

  if (status.current_agent && status.current_agent in PIPELINE_AGENT_TO_STEP_INDEX) {
    return PIPELINE_AGENT_TO_STEP_INDEX[status.current_agent];
  }

  if (status.status === "completed") {
    return AGENT_STEPS.length - 1;
  }

  const completedIndex = Math.max(0, status.agents_completed - 1);
  return Math.min(completedIndex, AGENT_STEPS.length - 1);
}

function progressForPipeline(status: PipelineStatusResponse, currentStepIndex: number) {
  if (status.status === "completed") {
    return 100;
  }

  if (status.status === "queued") {
    return 0;
  }

  if (status.agents_total > 0) {
    const activeOffset = status.current_agent ? 0.35 : 0;
    return Math.max(
      1,
      Math.min(99, Math.round(((status.agents_completed + activeOffset) / status.agents_total) * 100)),
    );
  }

  const visibleStep = Math.max(0, Math.min(currentStepIndex, AGENT_STEPS.length - 1));
  return Math.max(1, Math.min(99, Math.round((visibleStep / AGENT_STEPS.length) * 100)));
}

function currentStepIndexForProject(project: ProjectResumeStatus) {
  const currentAgent = project.current_agent;
  if (currentAgent) {
    const mappedAgent = PROJECT_PHASE_TO_PIPELINE_AGENT[currentAgent];
    if (mappedAgent && mappedAgent in PIPELINE_AGENT_TO_STEP_INDEX) {
      return PIPELINE_AGENT_TO_STEP_INDEX[mappedAgent];
    }
  }

  if (project.status === "live") {
    return AGENT_STEPS.length - 1;
  }

  if (project.status === "deploying") {
    return AGENT_STEPS.length - 1;
  }

  return 0;
}

const PROJECT_PHASE_TO_PIPELINE_AGENT: Record<string, string> = {
  analyst: "agent_01_analyst",
  code_generator: "agent_06_codegen",
  content_writer: "agent_02_content",
  debugger: "agent_07_debugger",
  mobile_agent: "agent_10_mobile",
  planner: "agent_04_planner",
  prompt_engineer: "agent_05_prompt_engineer",
  qa_agent: "agent_09_qa",
  seo_agent: "agent_08_seo",
  style_agent: "agent_03_style",
  understanding_business: "understanding_business",
  writing_content: "writing_content",
  designing_concepts: "designing_concepts",
  building_candidates: "building_candidates",
  testing_candidates: "testing_candidates",
  polishing: "polishing",
  publishing: "publishing",
};

function projectStatusToPipelineStatus(status: ProjectResumeStatus["status"]): PipelineStatusResponse["status"] {
  if (status === "live") {
    return "completed";
  }

  if (status === "failed" || status === "suspended") {
    return "failed";
  }

  if (status === "queued") {
    return "queued";
  }

  return "running";
}

function progressForProjectStatus(status: ProjectResumeStatus["status"], currentStepIndex: number) {
  if (status === "live") {
    return 100;
  }

  if (status === "queued") {
    return 0;
  }

  if (status === "deploying") {
    return 92;
  }

  if (status === "failed" || status === "suspended") {
    return Math.max(1, progressAfterProjectStep(currentStepIndex));
  }

  return Math.max(1, Math.min(88, progressAfterProjectStep(currentStepIndex)));
}

function progressAfterProjectStep(currentStepIndex: number) {
  return Math.round(((currentStepIndex + 0.18) / AGENT_STEPS.length) * 100);
}

function messageForProjectStatus(status: ProjectResumeStatus["status"], activeTask: string | undefined) {
  if (status === "queued") {
    return "Your site is queued. Reconnecting to the saved build.";
  }

  if (status === "generating") {
    return activeTask || "Your site is still generating.";
  }

  if (status === "deploying") {
    return "Deployment is running. Your generated site is being published.";
  }

  if (status === "live") {
    return "Website draft ready. Review the preview before publishing.";
  }

  return "The saved build needs attention.";
}

function latestProgressMessage(status: PipelineStatusResponse) {
  for (let index = status.progress_log.length - 1; index >= 0; index -= 1) {
    const entry = status.progress_log[index];
    if (entry?.event === "blackboard_notice") {
      continue;
    }

    const message = entry?.message;
    if (message) {
      return message;
    }
  }

  return null;
}

function latestBlackboardNotice(status: PipelineStatusResponse) {
  for (let index = status.progress_log.length - 1; index >= 0; index -= 1) {
    const entry = status.progress_log[index];
    if (entry?.event === "blackboard_notice" && entry.message) {
      return entry.message;
    }
  }

  return null;
}

function errorMessageFromBody(body: unknown) {
  if (isRecord(body)) {
    if (typeof body.message === "string") {
      return body.message;
    }

    if (typeof body.detail === "string") {
      return body.detail;
    }
  }

  return null;
}

function publicBuildError(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("browser audit failed") || normalized.includes("browser audit timed out")) {
    return "The final website quality check could not run. Update the pipeline server, then try the build again.";
  }

  if (normalized.includes("no generated candidate passed release gates")) {
    return releaseGateMessage(message);
  }

  if (normalized.includes("pipeline job timed out")) {
    return "The build took too long and stopped safely. Try the build again.";
  }

  return message.length > 360
    ? "The build stopped during its final checks. Review the pipeline logs, then try another build."
    : message;
}

function releaseGateMessage(message: string) {
  const reason = message.split("release gates:", 2)[1]?.trim().toLowerCase() ?? "";
  const failures: string[] = [];

  if (reason.includes("accessibility") || reason.includes("axe")) {
    failures.push("accessibility");
  }
  if (reason.includes("controls below") || reason.includes("target")) {
    failures.push("tap-target sizing");
  }
  if (reason.includes("overflow") || reason.includes("reflow")) {
    failures.push("responsive layout");
  }
  if (reason.includes("image")) {
    failures.push("image loading");
  }
  if (reason.includes("contact form") || reason.includes("form controls")) {
    failures.push("contact form");
  }
  if (reason.includes("header") || reason.includes("hero") || reason.includes("html document")) {
    failures.push("page structure");
  }

  return failures.length
    ? `The strongest concept was stopped by ${[...new Set(failures)].join(" and ")} checks. Onara kept it unpublished so a broken site was not shipped.`
    : "Neither website concept passed the final quality checks. Onara kept them unpublished.";
}

function isMockJob(jobId: string) {
  return jobId.startsWith("mock");
}

function pipelineConfigured() {
  return Boolean(process.env.PIPELINE_SERVER_URL && process.env.PIPELINE_API_SECRET);
}

function publicJobUrl(jobId: string) {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "https://onara.tech").replace(/\/+$/, "");
  return `${appUrl}/${jobId}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
