"use client";

import {
  ArrowUpRight,
  CheckCircle2,
  GitCompareArrows,
  Loader2,
  RotateCcw,
  Send,
  TriangleAlert,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

type RevisionStatus = "pending" | "running" | "done" | "failed";

type RevisionHistoryItem = {
  affected_components: string[] | null;
  agent_summary: string | null;
  before_public_url: string | null;
  changed_files: Array<Record<string, unknown>> | null;
  created_at: string;
  error_message: string | null;
  id: string;
  instruction: string;
  parent_revision_id: string | null;
  revision_kind: "edit" | "rollback";
  result_public_url: string | null;
  status: RevisionStatus;
};

type RevisionMessage = {
  content: string;
  created_at: string;
  id: string;
  metadata: Record<string, unknown>;
  revision_id: string;
  role: "user" | "assistant" | "system";
};

type RevisionWorkspaceProps = {
  latestRevisions: RevisionHistoryItem[];
  messages: RevisionMessage[];
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

type ChangedFile = {
  path: string;
  status: string;
  summary: string;
};

const COMPONENT_OPTIONS = [
  { id: "site_header", label: "Header" },
  { id: "hero", label: "Hero" },
  { id: "services", label: "Services" },
  { id: "trust", label: "Trust" },
  { id: "reviews", label: "Reviews" },
  { id: "service_area", label: "Service area" },
  { id: "contact", label: "Contact" },
  { id: "site_footer", label: "Footer" },
  { id: "shared_styles", label: "Shared CSS" },
];

export function RevisionWorkspace({
  latestRevisions,
  messages,
  project,
  revisionsLimit,
  revisionsUsed,
}: RevisionWorkspaceProps) {
  const [message, setMessage] = useState("");
  const [selectedComponents, setSelectedComponents] = useState<string[]>([]);
  const [lines, setLines] = useState<ProgressLine[]>(initialLines(latestRevisions));
  const [active, setActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState(project.public_url);
  const [used, setUsed] = useState(revisionsUsed);
  const [revisionHistory, setRevisionHistory] = useState(latestRevisions);
  const [conversation, setConversation] = useState(messages);
  const [selectedRevisionId, setSelectedRevisionId] = useState(() => latestRevisions.find((item) => item.status === "done")?.id ?? latestRevisions[0]?.id ?? null);

  const selectedRevision = useMemo(
    () => revisionHistory.find((revision) => revision.id === selectedRevisionId) ?? revisionHistory[0] ?? null,
    [revisionHistory, selectedRevisionId],
  );
  const changedFiles = useMemo(() => normalizeChangedFiles(selectedRevision?.changed_files), [selectedRevision]);
  const remainingLabel = useMemo(() => {
    if (revisionsLimit === -1) {
      return "Unlimited revisions";
    }

    return `${Math.max(0, revisionsLimit - used)} revisions left`;
  }, [revisionsLimit, used]);

  const hasCredit = revisionsLimit === -1 || used < revisionsLimit;
  const canSubmit = project.status === "live" && !active && message.trim().length >= 3 && hasCredit;
  const diffBeforeUrl = selectedRevision?.before_public_url ?? null;
  const diffAfterUrl = selectedRevision?.result_public_url ?? previewUrl;

  async function submitRevision() {
    if (!canSubmit) {
      return;
    }

    const instruction = message.trim();
    setMessage("");
    setError(null);
    setActive(true);
    appendConversation("user", instruction, { component_selection: selectedComponents });
    setLines([
      {
        id: crypto.randomUUID(),
        level: "info",
        message: `Queued revision: ${instruction}`,
      },
    ]);

    const response = await fetch("/api/revisions/start", {
      body: JSON.stringify({
        componentSelection: selectedComponents,
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

    appendConversation("assistant", "Started revision. I will stream the work here as it runs.", {});
    streamRevision(revisionId, "edit", instruction);
  }

  async function rollbackRevision(revisionId: string) {
    if (active || !hasCredit) {
      return;
    }

    setError(null);
    setActive(true);
    setLines([
      {
        id: crypto.randomUUID(),
        level: "info",
        message: "Queued rollback.",
      },
    ]);
    appendConversation("user", "Rollback to this previous version.", { rollback_revision_id: revisionId });

    const response = await fetch(`/api/revisions/${encodeURIComponent(revisionId)}/rollback`, {
      method: "POST",
    });
    const payload = (await response.json().catch(() => ({}))) as StartRevisionResponse;

    if (!response.ok) {
      const nextError = payload.message ?? "Rollback could not start.";
      setError(nextError);
      appendLine(nextError, "error");
      setActive(false);
      return;
    }

    const rollbackId = payload.revisionId ?? payload.revision_id;
    if (!rollbackId) {
      setError("Rollback started but did not return a stream id.");
      setActive(false);
      return;
    }

    appendConversation("assistant", "Started rollback. I will redeploy the stored previous snapshot.", {});
    streamRevision(rollbackId, "rollback", "Rollback to previous version");
  }

  function streamRevision(revisionId: string, kind: "edit" | "rollback", displayInstruction: string) {
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
      const agentSummary = typeof payload?.agentSummary === "string" ? payload.agentSummary : null;
      const beforePublicUrl = typeof payload?.beforePublicUrl === "string" ? payload.beforePublicUrl : null;
      const changedFiles = Array.isArray(payload?.changedFiles)
        ? payload.changedFiles.filter(isRecord)
        : [];

      appendLine(kind === "rollback" ? "Rollback deployed" : "Revision deployed", "success");
      appendConversation("assistant", agentSummary ?? "Deployed the requested change.", { changed_files: changedFiles });
      if (nextUrl) {
        setPreviewUrl(nextUrl);
      }
      if (revisionsLimit !== -1) {
        setUsed((current) => current + 1);
      }

      const nextRevision: RevisionHistoryItem = {
        affected_components: Array.isArray(payload?.affectedComponents)
          ? payload.affectedComponents.filter((item): item is string => typeof item === "string")
          : selectedComponents,
        agent_summary: agentSummary,
        before_public_url: beforePublicUrl,
        changed_files: changedFiles,
        created_at: new Date().toISOString(),
        error_message: null,
        id: revisionId,
        instruction: displayInstruction,
        parent_revision_id: null,
        revision_kind: kind,
        result_public_url: nextUrl,
        status: "done",
      };
      setRevisionHistory((current) => [nextRevision, ...current]);
      setSelectedRevisionId(revisionId);
      setActive(false);
      setSelectedComponents([]);
      events.close();
    });

    events.addEventListener("revision-error", (event) => {
      const payload = parseEventPayload(event);
      const nextError = typeof payload?.message === "string" ? payload.message : "Revision stream disconnected.";
      setError(nextError);
      appendLine(nextError, "error");
      appendConversation("assistant", nextError, { status: "failed" });
      setActive(false);
      events.close();
    });
  }

  function toggleComponent(componentId: string) {
    setSelectedComponents((current) =>
      current.includes(componentId)
        ? current.filter((item) => item !== componentId)
        : [...current, componentId],
    );
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

  function appendConversation(role: RevisionMessage["role"], content: string, metadata: Record<string, unknown>) {
    setConversation((current) => [
      ...current,
      {
        content,
        created_at: new Date().toISOString(),
        id: crypto.randomUUID(),
        metadata,
        revision_id: "local",
        role,
      },
    ]);
  }

  return (
    <div className="revision-workspace revision-workspace-expanded">
      <section className="revision-panel revision-chat-panel">
        <div className="revision-panel-header">
          <p className="mono">Revision studio</p>
          <span>{remainingLabel}</span>
        </div>
        <h1 className="serif">Tell Onara what to change.</h1>
        <p>
          Send multiple revision messages over time. Pick components when you want precision, or leave
          them unchecked and Onara will choose the affected areas.
        </p>

        <div className="revision-component-picker" aria-label="Component selection">
          <div>
            <p className="mono">Component target</p>
            <button
              className="revision-clear-components"
              disabled={selectedComponents.length === 0 || active}
              onClick={() => setSelectedComponents([])}
              type="button"
            >
              Auto-pick
            </button>
          </div>
          <div className="revision-component-grid">
            {COMPONENT_OPTIONS.map((component) => (
              <label key={component.id}>
                <input
                  checked={selectedComponents.includes(component.id)}
                  disabled={active}
                  onChange={() => toggleComponent(component.id)}
                  type="checkbox"
                />
                <span>{component.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="revision-thread" aria-label="Revision conversation">
          {conversation.length === 0 ? (
            <div className="revision-message revision-message-assistant">
              <span>Onara</span>
              <p>Ready. Tell me the change and I’ll show the short work log while it runs.</p>
            </div>
          ) : (
            conversation.map((item) => (
              <div className={`revision-message revision-message-${item.role}`} key={item.id}>
                <span>{item.role === "user" ? "You" : "Onara"}</span>
                <p>{item.content}</p>
              </div>
            ))
          )}
        </div>

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
            placeholder="Example: Make the hero CTA bigger and tighten the service-area section."
            rows={5}
            value={message}
          />
          <button className="btn btn-accent" disabled={!canSubmit} onClick={submitRevision} type="button">
            <Send aria-hidden="true" size={16} />
            {active ? "Revising" : "Send revision"}
          </button>
        </div>
      </section>

      <section className="revision-panel revision-preview-panel">
        <div className="revision-preview-topbar">
          <div>
            <p className="mono">Live site and diff</p>
            <h2 className="serif">{project.business_name}</h2>
          </div>
          {previewUrl ? (
            <Link className="btn btn-soft btn-sm" href={previewUrl} target="_blank">
              Open site
              <ArrowUpRight aria-hidden="true" size={14} />
            </Link>
          ) : null}
        </div>

        <div className="revision-diff-toolbar">
          <GitCompareArrows aria-hidden="true" size={16} />
          <div>
            <p className="mono">Visual diff</p>
            <span>{diffBeforeUrl && diffAfterUrl ? "Before and after are available." : "Diff appears after a completed revision."}</span>
          </div>
        </div>

        {diffBeforeUrl && diffAfterUrl ? (
          <div className="revision-diff-grid">
            <div>
              <p className="mono">Before</p>
              <iframe className="revision-preview-frame revision-diff-frame" src={diffBeforeUrl} title="Before revision" />
            </div>
            <div>
              <p className="mono">After</p>
              <iframe className="revision-preview-frame revision-diff-frame" src={diffAfterUrl} title="After revision" />
            </div>
          </div>
        ) : previewUrl ? (
          <iframe className="revision-preview-frame" src={previewUrl} title={`${project.business_name} preview`} />
        ) : (
          <div className="revision-preview-empty">This site does not have a public URL yet.</div>
        )}

        <div className="revision-history-panel">
          <div className="revision-history-header">
            <div>
              <p className="mono">Revision history</p>
              <h3 className="serif">What changed</h3>
            </div>
            {selectedRevision?.status === "done" ? (
              <button
                className="btn btn-soft btn-sm"
                disabled={active || !hasCredit || !selectedRevision.before_public_url}
                onClick={() => {
                  void rollbackRevision(selectedRevision.id);
                }}
                type="button"
              >
                <RotateCcw aria-hidden="true" size={14} />
                Roll back
              </button>
            ) : null}
          </div>

          <div className="revision-history-list">
            {revisionHistory.length === 0 ? (
              <p>No revisions yet.</p>
            ) : (
              revisionHistory.map((revision) => (
                <button
                  className={revision.id === selectedRevision?.id ? "revision-history-item active" : "revision-history-item"}
                  key={revision.id}
                  onClick={() => setSelectedRevisionId(revision.id)}
                  type="button"
                >
                  <span className="mono">{revision.revision_kind}</span>
                  <strong>{revision.status === "done" ? "Deployed" : revision.status}</strong>
                  <small>{revision.agent_summary ?? revision.instruction}</small>
                </button>
              ))
            )}
          </div>

          <div className="revision-file-summary">
            {changedFiles.length === 0 ? (
              <p>No changed-file summary yet.</p>
            ) : (
              changedFiles.map((file) => (
                <div key={`${file.path}-${file.status}`} className="revision-file-row">
                  <span>{file.status}</span>
                  <strong>{file.path}</strong>
                  <p>{file.summary}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function initialLines(revisions: RevisionHistoryItem[]): ProgressLine[] {
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

function normalizeChangedFiles(value: RevisionHistoryItem["changed_files"]): ChangedFile[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => ({
      path: typeof item.path === "string" ? item.path : "unknown",
      status: typeof item.status === "string" ? item.status : "changed",
      summary: typeof item.summary === "string" ? item.summary : "Updated by the revision agent.",
    }))
    .slice(0, 24);
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
  if (event.includes("completed") || event.includes("deployed") || event.includes("summary")) {
    return "success";
  }
  return "info";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
