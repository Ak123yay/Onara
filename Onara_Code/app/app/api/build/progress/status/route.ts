import {
  AGENT_STEPS,
  MOCK_STEP_MS,
  previewHtmlForStep,
  progressForElapsed,
} from "@/lib/build/agent-progress";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get("jobId") || "mock-job";
  const businessName = searchParams.get("businessName") || "Your Contractor Site";
  const elapsedMs = Number(searchParams.get("elapsedMs") || "0");
  const progress = progressForElapsed(Number.isFinite(elapsedMs) ? elapsedMs : 0);
  const activeAgent = AGENT_STEPS[progress.currentStepIndex];
  const retrying = activeAgent?.id === "debug" && elapsedMs % MOCK_STEP_MS > MOCK_STEP_MS * 0.42;

  return Response.json({
    activeAgent,
    complete: progress.complete,
    currentStepIndex: progress.currentStepIndex,
    html: previewHtmlForStep(progress.complete ? AGENT_STEPS.length : progress.currentStepIndex, businessName),
    jobId,
    message: progress.queued
      ? "Your site is queued. Preparing the agent workspace."
      : progress.complete
        ? "Mock generation complete. FastAPI will replace this status route in Phase 15."
        : retrying
          ? "Spacing mismatch caught. Retrying with stricter layout rules."
          : activeAgent?.task,
    progress: progress.progress,
    queued: progress.queued,
    retrying,
    totalSteps: AGENT_STEPS.length,
  });
}
