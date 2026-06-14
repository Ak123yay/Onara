import {
  AGENT_STEPS,
  MOCK_QUEUE_MS,
  MOCK_STEP_MS,
  previewHtmlForStep,
} from "@/lib/build/agent-progress";

export const dynamic = "force-dynamic";

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
          message: "Mock generation complete. FastAPI will replace this stream in Phase 15.",
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
          message: error instanceof Error ? error.message : "Mock stream failed.",
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

  return new Response(stream, {
    headers: {
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "Content-Type": "text/event-stream; charset=utf-8",
      "X-Accel-Buffering": "no",
    },
  });
}
