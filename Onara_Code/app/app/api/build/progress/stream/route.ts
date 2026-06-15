import {
  AGENT_STEPS,
  MOCK_QUEUE_MS,
  MOCK_STEP_MS,
  previewHtmlForStep,
} from "@/lib/build/agent-progress";

export const dynamic = "force-dynamic";

type PipelineProgressEntry = {
  agent_id?: string | null;
  event?: string;
  message?: string;
  timestamp?: string;
};

type PipelineStatusResponse = {
  agents_completed: number;
  agents_total: number;
  current_agent: string | null;
  error_message?: string | null;
  job_id: string;
  preview_html?: string | null;
  progress_log: PipelineProgressEntry[];
  queue_position?: number | null;
  site_id?: string | null;
  status: "queued" | "running" | "completed" | "failed";
};

const PIPELINE_AGENT_TO_STEP_INDEX: Record<string, number> = {
  agent_01_analyst: 0,
  agent_02_content: 1,
  agent_03_style: 2,
  agent_04_planner: 3,
  agent_05_prompt_engineer: 4,
  agent_06_codegen: 5,
  agent_07_debugger: 6,
  agent_08_seo: 7,
  agent_09_qa: 8,
  agent_10_mobile: 9,
};

const POLL_INTERVAL_MS = 900;
const STREAM_TIMEOUT_MS = 240_000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function encodeEvent(event: string, data: Record<string, unknown>) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get("jobId") || crypto.randomUUID();
  const businessName = searchParams.get("businessName") || "Your Contractor Site";

  if (!isMockJob(jobId) && pipelineConfigured()) {
    return pipelineStream(jobId, businessName);
  }

  return mockStream(jobId, businessName);
}

function pipelineStream(jobId: string, businessName: string) {
  const encoder = new TextEncoder();
  let closed = false;
  let emittedProgressCount = 0;
  let queuedSent = false;
  let lastPreviewHtml = "";

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const startedAt = Date.now();

      function send(event: string, data: Record<string, unknown>) {
        if (closed) {
          return;
        }

        controller.enqueue(encoder.encode(encodeEvent(event, data)));
      }

      try {
        while (!closed) {
          const status = await fetchPipelineStatus(jobId);

          if ("error" in status) {
            send("error", {
              jobId,
              message: status.message,
            });
            break;
          }

          if (status.status === "queued" && !queuedSent) {
            queuedSent = true;
            send("queued", {
              jobId,
              message: "Your site is queued. Preparing the agent workspace.",
              position: status.queue_position ?? 1,
              progress: 0,
            });
          }

          for (const entry of status.progress_log.slice(emittedProgressCount)) {
            emitProgressEntry(send, status, entry, businessName);
          }
          emittedProgressCount = status.progress_log.length;

          if (status.preview_html && status.preview_html !== lastPreviewHtml) {
            lastPreviewHtml = status.preview_html;
            send("preview", {
              html: status.preview_html,
              jobId,
              stepIndex: AGENT_STEPS.length,
            });
          }

          if (status.status === "completed") {
            const html = status.preview_html || previewHtmlForStep(AGENT_STEPS.length, businessName);
            if (html !== lastPreviewHtml) {
              send("preview", {
                html,
                jobId,
                stepIndex: AGENT_STEPS.length,
              });
            }

            send("complete", {
              elapsedSeconds: Math.max(1, Math.round((Date.now() - startedAt) / 1000)),
              jobId,
              message: "Website draft ready. Review the preview before publishing.",
              previewUrl: "/dashboard/build/progress",
              progress: 100,
              siteId: status.site_id || `draft-${jobId.slice(0, 8)}`,
            });
            break;
          }

          if (status.status === "failed") {
            send("error", {
              jobId,
              message: status.error_message || "The build pipeline failed.",
            });
            break;
          }

          if (Date.now() - startedAt > STREAM_TIMEOUT_MS) {
            send("error", {
              jobId,
              message: "Build stream timed out. Refresh to reconnect.",
            });
            break;
          }

          await sleep(POLL_INTERVAL_MS);
        }

        if (!closed) {
          controller.close();
        }
      } catch (error) {
        send("error", {
          jobId,
          message: error instanceof Error ? error.message : "Build stream failed.",
        });

        if (!closed) {
          controller.close();
        }
      }
    },
    cancel() {
      closed = true;
    },
  });

  return sseResponse(stream);
}

function mockStream(jobId: string, businessName: string) {
  const encoder = new TextEncoder();
  let closed = false;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      function send(event: string, data: Record<string, unknown>) {
        if (closed) {
          return;
        }

        controller.enqueue(encoder.encode(encodeEvent(event, data)));
      }

      try {
        send("queued", {
          jobId,
          message: "Your site is queued. Preparing the agent workspace.",
          position: 1,
          progress: 0,
        });

        await sleep(MOCK_QUEUE_MS);

        for (let index = 0; index < AGENT_STEPS.length; index += 1) {
          const agent = AGENT_STEPS[index];
          const progress = Math.round((index / AGENT_STEPS.length) * 100);

          send("step", {
            agent,
            jobId,
            message: agent.task,
            progress,
            stepIndex: index,
          });

          send("preview", {
            html: previewHtmlForStep(index, businessName),
            jobId,
            stepIndex: index,
          });

          if (agent.id === "debug") {
            await sleep(Math.round(MOCK_STEP_MS * 0.42));
            send("agent_retry", {
              agent,
              jobId,
              message: "Spacing mismatch caught. Retrying with stricter layout rules.",
              progress: Math.round(((index + 0.42) / AGENT_STEPS.length) * 100),
              stepIndex: index,
            });
          }

          await sleep(agent.id === "debug" ? Math.round(MOCK_STEP_MS * 0.68) : MOCK_STEP_MS);

          send("agent_complete", {
            agent,
            jobId,
            progress: Math.round(((index + 1) / AGENT_STEPS.length) * 100),
            stepIndex: index,
          });
        }

        send("preview", {
          html: previewHtmlForStep(AGENT_STEPS.length, businessName),
          jobId,
          stepIndex: AGENT_STEPS.length,
        });

        send("complete", {
          elapsedSeconds: 14,
          jobId,
          message: "Website draft ready. Review the preview before publishing.",
          previewUrl: "/dashboard/build/progress",
          progress: 100,
          siteId: `mock-${jobId.slice(0, 8)}`,
        });

        if (!closed) {
          controller.close();
        }
      } catch (error) {
        send("error", {
          jobId,
          message: error instanceof Error ? error.message : "Build stream failed.",
        });

        if (!closed) {
          controller.close();
        }
      }
    },
    cancel() {
      closed = true;
    },
  });

  return sseResponse(stream);
}

function emitProgressEntry(
  send: (event: string, data: Record<string, unknown>) => void,
  status: PipelineStatusResponse,
  entry: PipelineProgressEntry,
  businessName: string,
) {
  const stepIndex = stepIndexForAgent(entry.agent_id);
  const agent = AGENT_STEPS[stepIndex];

  if (entry.event === "agent_started") {
    send("step", {
      agent,
      jobId: status.job_id,
      message: entry.message || agent.task,
      progress: progressForPipeline(status, stepIndex),
      stepIndex,
    });
    send("preview", {
      html: status.preview_html || previewHtmlForStep(stepIndex, businessName),
      jobId: status.job_id,
      stepIndex,
    });
  }

  if (entry.event === "agent_completed") {
    send("agent_complete", {
      agent,
      jobId: status.job_id,
      progress: progressAfterStep(stepIndex),
      stepIndex,
    });
  }

  if (entry.event === "pipeline_failed") {
    send("error", {
      jobId: status.job_id,
      message: entry.message || "The build pipeline failed.",
    });
  }
}

async function fetchPipelineStatus(jobId: string) {
  const pipelineServerUrl = process.env.PIPELINE_SERVER_URL?.replace(/\/+$/, "");
  const pipelineSecret = process.env.PIPELINE_API_SECRET;

  if (!pipelineServerUrl || !pipelineSecret) {
    return {
      error: "pipeline_not_configured",
      message: "Pipeline status is not configured.",
    };
  }

  try {
    const response = await fetch(`${pipelineServerUrl}/pipeline/status/${encodeURIComponent(jobId)}`, {
      cache: "no-store",
      headers: {
        "X-Pipeline-Secret": pipelineSecret,
      },
    });
    const body = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        error: "pipeline_status_failed",
        message: errorMessageFromBody(body) || "Pipeline status is unavailable.",
      };
    }

    return body as PipelineStatusResponse;
  } catch {
    return {
      error: "pipeline_unavailable",
      message: "FastAPI pipeline server is unreachable.",
    };
  }
}

function progressForPipeline(status: PipelineStatusResponse, stepIndex: number) {
  const total = Math.max(status.agents_total || AGENT_STEPS.length, AGENT_STEPS.length);
  const base = Math.max(status.agents_completed, stepIndex);
  return Math.max(1, Math.min(99, Math.round(((base + 0.18) / total) * 100)));
}

function progressAfterStep(stepIndex: number) {
  return Math.min(99, Math.round(((stepIndex + 1) / AGENT_STEPS.length) * 100));
}

function stepIndexForAgent(agentId: string | null | undefined) {
  if (agentId && agentId in PIPELINE_AGENT_TO_STEP_INDEX) {
    return PIPELINE_AGENT_TO_STEP_INDEX[agentId];
  }

  return 0;
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

function isMockJob(jobId: string) {
  return jobId.startsWith("mock");
}

function pipelineConfigured() {
  return Boolean(process.env.PIPELINE_SERVER_URL && process.env.PIPELINE_API_SECRET);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function sseResponse(stream: ReadableStream<Uint8Array>) {
  return new Response(stream, {
    headers: {
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "Content-Type": "text/event-stream; charset=utf-8",
      "X-Accel-Buffering": "no",
    },
  });
}
