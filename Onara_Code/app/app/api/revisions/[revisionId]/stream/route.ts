import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type RevisionRow = {
  affected_components: string[] | null;
  agent_summary: string | null;
  before_public_url: string | null;
  changed_files: Array<Record<string, unknown>> | null;
  error_message: string | null;
  id: string;
  pipeline_job_id: string | null;
  progress_log: Array<Record<string, unknown>> | null;
  result_public_url: string | null;
  status: "pending" | "running" | "done" | "failed";
};

type PipelineRevisionStatus = {
  affected_components?: string[];
  agent_summary?: string | null;
  before_public_url?: string | null;
  changed_files?: Array<Record<string, unknown>>;
  cloudflare_deployment_url?: string | null;
  current_step?: string | null;
  error_message?: string | null;
  github_commit_sha?: string | null;
  job_id?: string;
  progress_log?: Array<Record<string, unknown>>;
  public_url?: string | null;
  result_public_url?: string | null;
  revision_id?: string;
  status?: string;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  request: Request,
  context: { params: Promise<{ revisionId: string }> },
) {
  const { revisionId } = await context.params;

  if (!UUID_RE.test(revisionId)) {
    return NextResponse.json({ error: "invalid_revision_id" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const db = createAdminClient();
  const { data: revision, error } = await db
    .from("revisions")
    .select("id, status, pipeline_job_id, progress_log, result_public_url, error_message, affected_components, before_public_url, changed_files, agent_summary")
    .eq("id", revisionId)
    .eq("user_id", user.id)
    .maybeSingle<RevisionRow>();

  if (error) {
    return NextResponse.json({ error: "revision_lookup_failed", message: error.message }, { status: 500 });
  }

  if (!revision) {
    return NextResponse.json({ error: "not_found", message: "Revision was not found." }, { status: 404 });
  }

  const pipelineServerUrl = process.env.PIPELINE_SERVER_URL?.replace(/\/+$/, "");
  const pipelineSecret = process.env.PIPELINE_API_SECRET;
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let sentCount = 0;

      function send(event: string, payload: Record<string, unknown>) {
        controller.enqueue(encoder.encode(`event: ${event}\n`));
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
      }

      function sendProgress(entries: Array<Record<string, unknown>>) {
        for (const entry of entries.slice(sentCount)) {
          send("progress", entry);
        }
        sentCount = entries.length;
      }

      sendProgress(revision.progress_log ?? []);

      if (!revision.pipeline_job_id || !pipelineServerUrl || !pipelineSecret) {
        sendTerminalFromRevision(send, revision);
        controller.close();
        return;
      }

      while (!request.signal.aborted) {
        let payload: PipelineRevisionStatus | null = null;
        try {
          const response = await fetch(
            `${pipelineServerUrl}/pipeline/revisions/status/${encodeURIComponent(revision.pipeline_job_id)}`,
            {
              cache: "no-store",
              headers: {
                "X-Pipeline-Secret": pipelineSecret,
              },
            },
          );

          if (response.ok) {
            payload = (await response.json()) as PipelineRevisionStatus;
          }
        } catch {
          payload = null;
        }

        if (payload) {
          sendProgress(payload.progress_log ?? []);

          if (payload.status === "completed" || payload.status === "done") {
            send("complete", {
              affectedComponents: payload.affected_components ?? [],
              agentSummary: payload.agent_summary ?? null,
              beforePublicUrl: payload.before_public_url ?? null,
              changedFiles: payload.changed_files ?? [],
              cloudflareDeploymentUrl: payload.cloudflare_deployment_url ?? null,
              githubCommitSha: payload.github_commit_sha ?? null,
              publicUrl: payload.result_public_url ?? payload.public_url ?? null,
              revisionId,
              status: payload.status,
            });
            controller.close();
            return;
          }

          if (payload.status === "failed") {
            send("revision-error", {
              message: payload.error_message ?? "Revision failed.",
              revisionId,
              status: "failed",
            });
            controller.close();
            return;
          }
        }

        await sleep(900);
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "Content-Type": "text/event-stream",
    },
  });
}

function sendTerminalFromRevision(
  send: (event: string, payload: Record<string, unknown>) => void,
  revision: RevisionRow,
) {
  if (revision.status === "done") {
    send("complete", {
      affectedComponents: revision.affected_components ?? [],
      agentSummary: revision.agent_summary,
      beforePublicUrl: revision.before_public_url,
      changedFiles: revision.changed_files ?? [],
      publicUrl: revision.result_public_url,
      revisionId: revision.id,
      status: revision.status,
    });
    return;
  }

  if (revision.status === "failed") {
    send("revision-error", {
      message: revision.error_message ?? "Revision failed.",
      revisionId: revision.id,
      status: revision.status,
    });
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
