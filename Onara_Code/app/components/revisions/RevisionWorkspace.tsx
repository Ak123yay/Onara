"use client";

import {
  ArrowUpRight,
  CheckCircle2,
  Code2,
  Files,
  GitCompareArrows,
  Loader2,
  MessageSquare,
  RotateCcw,
  Send,
  TriangleAlert,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";

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
  const seenProgressKeysRef = useRef(new Set<string>());
  const revisionDetailsRef = useRef<HTMLElement | null>(null);

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
  const visibleChangedFiles = changedFiles.slice(0, 3);
  const hiddenChangedFileCount = Math.max(0, changedFiles.length - visibleChangedFiles.length);
  const workStatusLabel = active
    ? "Working"
    : selectedRevision?.status === "failed"
      ? "Needs attention"
      : selectedRevision
        ? "Ready for next revision"
        : "Ready";
  const targetLabel =
    selectedComponents.length === 0
      ? "Auto-pick components"
      : `${selectedComponents.length} component${selectedComponents.length === 1 ? "" : "s"} selected`;
  const previewLabel = previewUrl ? previewUrl.replace(/^https?:\/\//, "") : "No public URL";
  const selectedStatusLabel = selectedRevision
    ? `${selectedRevision.revision_kind} / ${selectedRevision.status}`
    : "No revision selected";
  const reviewButtonLabel = changedFiles.length > 0 ? "Review changes" : "Review";
  const changedFilesLabel = changedFiles.length > 0
    ? `+${changedFiles.length} file${changedFiles.length === 1 ? "" : "s"}`
    : "No changes";

  async function submitRevision() {
    if (!canSubmit) {
      return;
    }

    const instruction = message.trim();
    setMessage("");
    setError(null);
    setActive(true);
    appendConversation("user", instruction, { component_selection: selectedComponents });
    resetProgressLines(`Queued revision: ${instruction}`);

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
    resetProgressLines("Queued rollback.");
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
    appendProgressLine({ event: "local_revision_stream_start" }, "Reading current site files");
    const events = new EventSource(`/api/revisions/${encodeURIComponent(revisionId)}/stream`);

    events.addEventListener("progress", (event) => {
      const payload = parseEventPayload(event);
      const text = typeof payload?.message === "string" ? payload.message : null;
      if (text) {
        appendProgressLine(payload, text);
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

  function appendProgressLine(payload: Record<string, unknown> | null, nextMessage: string) {
    const key = progressEventKey(payload, nextMessage);
    if (seenProgressKeysRef.current.has(key)) {
      return;
    }
    seenProgressKeysRef.current.add(key);
    appendLine(nextMessage, eventLevel(payload));
  }

  function resetProgressLines(firstMessage: string) {
    seenProgressKeysRef.current = new Set([`local:${firstMessage}`]);
    setLines([
      {
        id: crypto.randomUUID(),
        level: "info",
        message: firstMessage,
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

  function reviewSelectedRevision() {
    if (!selectedRevision) {
      return;
    }

    setSelectedRevisionId(selectedRevision.id);
    revisionDetailsRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  return (
    <div className="revision-workspace revision-workspace-expanded">
      <section className="revision-panel revision-chat-panel">
        <header className="revision-workbench-titlebar">
          <div className="revision-title-lockup">
            <span className="onara-logo-mark revision-app-mark" aria-hidden="true">
              <span className="onara-logo-dot" />
            </span>
            <div>
              <p className="mono">Revision desk</p>
              <h1 className="serif">Request a change</h1>
            </div>
          </div>
          <span className={active ? "revision-state revision-state-live" : "revision-state"}>{workStatusLabel}</span>
        </header>

        <div className="revision-console-scroll">
          <section className={changedFiles.length > 0 ? "revision-changes-card" : "revision-changes-card revision-changes-empty"} aria-label="Changed files">
            <div className="revision-changes-icon" aria-hidden="true">
              <Files size={18} />
            </div>
            <div className="revision-changes-main">
              <div className="revision-changes-header">
                <div>
                  <p className="mono">Review</p>
                  <strong>{changedFiles.length > 0 ? `Edited ${changedFiles.length} file${changedFiles.length === 1 ? "" : "s"}` : "No file changes yet"}</strong>
                </div>
                <div className="revision-change-meter" aria-label="Revision change summary">
                  <span>{changedFilesLabel}</span>
                  <small>{selectedRevision?.status === "done" ? "deployed" : selectedRevision?.status ?? "waiting"}</small>
                </div>
                <div className="revision-change-actions">
                  <button
                    className="revision-review-button"
                    disabled={changedFiles.length === 0}
                    onClick={reviewSelectedRevision}
                    type="button"
                  >
                    {reviewButtonLabel}
                  </button>
                  {selectedRevision?.status === "done" && selectedRevision.before_public_url ? (
                    <button
                      className="revision-review-button"
                      disabled={active || !hasCredit}
                      onClick={() => {
                        void rollbackRevision(selectedRevision.id);
                      }}
                      type="button"
                    >
                      Undo
                    </button>
                  ) : null}
                </div>
              </div>
              {visibleChangedFiles.length > 0 ? (
                <div className="revision-changes-list">
                  {visibleChangedFiles.map((file) => (
                    <div key={`${file.path}-${file.status}`}>
                      <span>{file.path}</span>
                      <small>{file.status}</small>
                    </div>
                  ))}
                  {hiddenChangedFileCount > 0 ? <em>{hiddenChangedFileCount} more files in the detailed summary</em> : null}
                </div>
              ) : (
                <p className="revision-empty-copy">Changed files, component notes, and rollback controls appear here after the agent deploys a revision.</p>
              )}
            </div>
          </section>

          <section className="revision-thread" aria-label="Revision conversation">
            <div className="revision-thread-header">
              <MessageSquare size={15} />
              <span>Conversation</span>
            </div>
            {conversation.length === 0 ? (
              <div className="revision-message revision-message-assistant">
                <span>Onara</span>
                <p>Ready. Tell me the change and I&apos;ll show the short work log while it runs.</p>
              </div>
            ) : (
              conversation.map((item) => (
                <div className={`revision-message revision-message-${item.role}`} key={item.id}>
                  <span>{item.role === "user" ? "You" : "Onara"}</span>
                  <p>{item.content}</p>
                </div>
              ))
            )}
          </section>

          <section className="revision-worklog" aria-label="Agent work log">
            <div className="revision-worklog-header">
              <div>
                <span>{active ? "Working now" : "Work log"}</span>
                <small>{lines.length} event{lines.length === 1 ? "" : "s"}</small>
              </div>
              <span>{selectedStatusLabel}</span>
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
          </section>

          {error ? <p className="revision-error">{error}</p> : null}
        </div>

        <form
          className="revision-composer"
          onSubmit={(event) => {
            event.preventDefault();
            void submitRevision();
          }}
        >
          <div className="revision-composer-top">
            <span>{remainingLabel}</span>
            <span>{active ? "Streaming agent work" : targetLabel}</span>
          </div>
          <div className="revision-component-strip" aria-label="Component selection">
            <button
              className={selectedComponents.length === 0 ? "revision-component-chip selected" : "revision-component-chip"}
              disabled={selectedComponents.length === 0 || active}
              onClick={() => setSelectedComponents([])}
              type="button"
            >
              Auto
            </button>
            {COMPONENT_OPTIONS.map((component) => (
              <label
                className={selectedComponents.includes(component.id) ? "revision-component-chip selected" : "revision-component-chip"}
                key={component.id}
              >
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
          <textarea
            aria-label="Revision instructions"
            disabled={active}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Tell Onara exactly what to change. Example: Make the hero CTA bigger and tighten the service-area section."
            rows={2}
            value={message}
          />
          <div className="revision-composer-actions">
            <span>
              <Code2 size={14} />
              One message creates one deployable revision. Failed runs do not deduct.
            </span>
            <button className="btn btn-accent" disabled={!canSubmit} type="submit">
              <Send aria-hidden="true" size={16} />
              {active ? "Revising" : "Send revision"}
            </button>
          </div>
        </form>
      </section>

      <section className="revision-panel revision-preview-panel">
        <div className="revision-preview-topbar">
          <div className="revision-browser-dots" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <div className="revision-browser-url">
            <p>{diffBeforeUrl && diffAfterUrl ? "Visual diff" : "Live preview"}</p>
            <span>{previewLabel}</span>
          </div>
          {previewUrl ? (
            <Link className="revision-open-site" href={previewUrl} target="_blank">
              Open site
              <ArrowUpRight aria-hidden="true" size={14} />
            </Link>
          ) : null}
        </div>

        <div className="revision-diff-toolbar">
          <GitCompareArrows aria-hidden="true" size={16} />
          <div>
            <p className="mono">Visual review</p>
            <span>{diffBeforeUrl && diffAfterUrl ? "Before and after are available." : "The current live site stays visible while the agent works."}</span>
          </div>
          <strong>{project.business_name}</strong>
        </div>

        <div className="revision-preview-stage">
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
        </div>

        <aside className="revision-history-panel" ref={revisionDetailsRef}>
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
        </aside>
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

function progressEventKey(payload: Record<string, unknown> | null, message: string) {
  const event = typeof payload?.event === "string" ? payload.event : "progress";
  const timestamp = typeof payload?.timestamp === "string" ? payload.timestamp : "";
  return `${event}:${timestamp}:${message}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
