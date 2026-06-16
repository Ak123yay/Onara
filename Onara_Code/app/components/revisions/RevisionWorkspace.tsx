"use client";

import { ArrowUpRight, CheckCircle2, Loader2, Send, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

type RevisionWorkspaceProps = {
  latestRevisions: Array<{
    created_at: string;
    error_message: string | null;
    id: string;
    instruction: string;
    result_public_url: string | null;
    status: "pending" | "running" | "done" | "failed";
  }>;
  project: {
    business_name: string;
    id: string;
    public_url: string | null;
    status: string;
  };
  revisionsLimit: number;
  revisionsUsed: number;
};

type StartRevisionResponse = {
  message?: string;
  remainingRevisions?: number;
  revisionId?: string;
  revision_id?: string;
};

type ProgressLine = {
  id: string;
  level: "info" | "success" | "warning" | "error";
  message: string;
};

export function RevisionWorkspace({
  latestRevisions,
  project,
  revisionsLimit,
  revisionsUsed,
}: RevisionWorkspaceProps) {
  const [message, setMessage] = useState("");
  const [lines, setLines] = useState<ProgressLine[]>(initialLines(latestRevisions));
  const [active, setActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState(project.public_url);
  const [used, setUsed] = useState(revisionsUsed);

  const remainingLabel = useMemo(() => {
    if (revisionsLimit === -1) {
      return "Unlimited revisions";
    }

    return `${Math.max(0, revisionsLimit - used)} revisions left`;
  }, [revisionsLimit, used]);

  const canSubmit = project.status === "live" && !active && message.trim().length >= 3 && (
    revisionsLimit === -1 || used < revisionsLimit
  );

  async function submitRevision() {
    if (!canSubmit) {
      return;
    }

    const instruction = message.trim();
    setMessage("");
    setError(null);
    setActive(true);
    setLines([
      {
        id: crypto.randomUUID(),
        level: "info",
        message: `Queued revision: ${instruction}`,
      },
    ]);

    const response = await fetch("/api/revisions/start", {
      body: JSON.stringify({
        message: instruction,
        projectId: project.id,
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    const payload = (await response.json().catch(() => ({}))) as StartRevisionResponse;
    if (!response.ok) {
      const nextError = payload.message ?? "Revision could not start.";
      setError(nextError);
      appendLine(nextError, "error");
      setActive(false);
      return;
    }

    const revisionId = payload.revisionId ?? payload.revision_id;
    if (!revisionId) {
      setError("Revision started but did not return a stream id.");
      setActive(false);
      return;
    }

    appendLine("Reading current site files", "info");
    const events = new EventSource(`/api/revisions/${encodeURIComponent(revisionId)}/stream`);

    events.addEventListener("progress", (event) => {
      const payload = parseEventPayload(event);
      const text = typeof payload?.message === "string" ? payload.message : null;
      if (text) {
        appendLine(text, eventLevel(payload));
      }
    });

    events.addEventListener("complete", (event) => {
      const payload = parseEventPayload(event);
      const nextUrl = typeof payload?.publicUrl === "string" ? payload.publicUrl : null;
      appendLine("Revision deployed", "success");
      if (nextUrl) {
        setPreviewUrl(nextUrl);
      }
      if (revisionsLimit !== -1) {
        setUsed((current) => current + 1);
      }
      setActive(false);
      events.close();
    });

    events.addEventListener("revision-error", (event) => {
      const payload = parseEventPayload(event);
      const nextError = typeof payload?.message === "string" ? payload.message : "Revision stream disconnected.";
      setError(nextError);
      appendLine(nextError, "error");
      setActive(false);
      events.close();
    });
  }

  function appendLine(nextMessage: string, level: ProgressLine["level"] = "info") {
    setLines((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        level,
        message: nextMessage,
      },
    ]);
  }

  return (
    <div className="revision-workspace">
      <section className="revision-panel revision-chat-panel">
        <div className="revision-panel-header">
          <p className="mono">Revision studio</p>
          <span>{remainingLabel}</span>
        </div>
        <h1 className="serif">Tell Onara what to change.</h1>
        <p>
          One message starts one revision. Onara updates the affected sections, checks hard safety issues,
          deploys, then charges the revision only after success.
        </p>

        <div className="revision-progress-lines" aria-live="polite">
          {lines.map((line) => (
            <div className={`revision-progress-line revision-progress-line-${line.level}`} key={line.id}>
              {line.level === "success" ? (
                <CheckCircle2 aria-hidden="true" size={16} />
              ) : line.level === "error" ? (
                <TriangleAlert aria-hidden="true" size={16} />
              ) : active && line.id === lines[lines.length - 1]?.id ? (
                <Loader2 aria-hidden="true" className="spin" size={16} />
              ) : (
                <span aria-hidden="true" className="revision-dot" />
              )}
              <span>{line.message}</span>
            </div>
          ))}
        </div>

        {error ? <p className="revision-error">{error}</p> : null}

        <div className="revision-composer">
          <textarea
            aria-label="Revision instructions"
            disabled={active}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Example: Make the hero CTA bigger and add a stronger service-area section."
            rows={5}
            value={message}
          />
          <button className="btn btn-accent" disabled={!canSubmit} onClick={submitRevision} type="button">
            <Send aria-hidden="true" size={16} />
            {active ? "Revising" : "Start revision"}
          </button>
        </div>
      </section>

      <section className="revision-panel revision-preview-panel">
        <div className="revision-preview-topbar">
          <div>
            <p className="mono">Current site</p>
            <h2 className="serif">{project.business_name}</h2>
          </div>
          {previewUrl ? (
            <Link className="btn btn-soft btn-sm" href={previewUrl} target="_blank">
              Open site
              <ArrowUpRight aria-hidden="true" size={14} />
            </Link>
          ) : null}
        </div>
        {previewUrl ? (
          <iframe className="revision-preview-frame" src={previewUrl} title={`${project.business_name} preview`} />
        ) : (
          <div className="revision-preview-empty">This site does not have a public URL yet.</div>
        )}
      </section>
    </div>
  );
}

function initialLines(
  revisions: RevisionWorkspaceProps["latestRevisions"],
): ProgressLine[] {
  if (revisions.length === 0) {
    return [
      {
        id: "initial",
        level: "info",
        message: "Ready to revise the live site.",
      },
    ];
  }

  return revisions.slice(0, 4).map((revision) => ({
    id: revision.id,
    level: revision.status === "done" ? "success" : revision.status === "failed" ? "error" : "info",
    message: `${revision.status === "done" ? "Deployed" : revision.status}: ${revision.instruction}`,
  }));
}

function parseEventPayload(event: Event) {
  if (!(event instanceof MessageEvent) || typeof event.data !== "string") {
    return null;
  }

  try {
    return JSON.parse(event.data) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function eventLevel(payload: Record<string, unknown> | null): ProgressLine["level"] {
  const event = typeof payload?.event === "string" ? payload.event : "";
  if (event.includes("warning")) {
    return "warning";
  }
  if (event.includes("failed")) {
    return "error";
  }
  if (event.includes("completed") || event.includes("deployed")) {
    return "success";
  }
  return "info";
}
