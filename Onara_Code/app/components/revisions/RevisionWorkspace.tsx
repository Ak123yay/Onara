"use client";

import {
  ArrowUpRight,
  CheckCircle2,
  Code2,
  Copy,
  Files,
  GitCompareArrows,
  Loader2,
  MessageSquare,
  RotateCcw,
  Send,
  TriangleAlert,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { fetchWithTimeout } from "@/lib/resilience";

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
  planLabel?: string | null;
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
  planLabel,
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
  const [failedPreviewUrl, setFailedPreviewUrl] = useState<string | null>(null);
  const [selectedRevisionId, setSelectedRevisionId] = useState(() => latestRevisions.find((item) => item.status === "done")?.id ?? latestRevisions[0]?.id ?? null);
  const seenProgressKeysRef = useRef(new Set<string>());
  const activeStreamRef = useRef<EventSource | null>(null);
  const progressLinesRef = useRef<HTMLDivElement | null>(null);
  const conversationRef = useRef<HTMLElement | null>(null);
  const revisionDetailsRef = useRef<HTMLElement | null>(null);

  const selectedRevision = useMemo(
    () => revisionHistory.find((revision) => revision.id === selectedRevisionId) ?? revisionHistory[0] ?? null,
    [revisionHistory, selectedRevisionId],
  );
  const changedFiles = useMemo(() => normalizeChangedFiles(selectedRevision?.changed_files), [selectedRevision]);
  const planName = useMemo(() => formatPlanLabel(planLabel), [planLabel]);
  const remainingLabel = useMemo(() => {
    const prefix = planName ? `${planName} plan - ` : "";
    const safeUsed = Math.max(0, used);

    if (revisionsLimit === -1) {
      return `${prefix}unlimited revisions (${safeUsed} used)`;
    }

    const safeLimit = Math.max(0, revisionsLimit);
    const cappedUsed = Math.min(safeUsed, safeLimit);
    const remaining = Math.max(0, safeLimit - cappedUsed);
    const revisionWord = remaining === 1 ? "revision" : "revisions";

    return `${prefix}${remaining} ${revisionWord} left (${cappedUsed}/${safeLimit} used)`;
  }, [planName, revisionsLimit, used]);

  const hasCredit = revisionsLimit === -1 || used < revisionsLimit;
  const canSubmit = project.status === "live" && !active && message.trim().length >= 3 && hasCredit;
  const diffBeforeUrl = selectedRevision?.before_public_url ?? null;
  const diffAfterUrl = selectedRevision?.result_public_url ?? previewUrl;
  const hasPreviewUrl = Boolean(previewUrl);
  const canShowLivePreview = Boolean(previewUrl && failedPreviewUrl !== previewUrl);
  const visibleChangedFiles = changedFiles.slice(0, 3);
  const hiddenChangedFileCount = Math.max(0, changedFiles.length - visibleChangedFiles.length);
  const workStatusLabel = active
    ? "Working"
    : selectedRevision?.status === "failed"
      ? "Needs attention"
      : selectedRevision
        ? "Ready for next revision"
        : "Ready";
  const previewLabel = previewUrl ? previewUrl.replace(/^https?:\/\//, "") : "No public URL";
  const selectedStatusLabel = selectedRevision
    ? revisionStatusLabel(selectedRevision)
    : "No revision selected";
  const reviewButtonLabel = changedFiles.length > 0 ? "Review changes" : "Review";
  const changedFilesLabel = changedFiles.length > 0
    ? `+${changedFiles.length} file${changedFiles.length === 1 ? "" : "s"}`
    : "No changes";
  const composerHelpText = active
    ? "Revision is running. Keep the preview open and watch the work log."
    : project.status !== "live"
      ? "Revisions unlock after the site is live."
      : !hasCredit
        ? "No revisions left on this plan."
        : selectedComponents.length > 0
          ? "Selected components are attached as context. Keep the request short and specific."
          : "Auto-pick lets Onara choose the right components. Failed runs do not deduct.";
  const submitButtonLabel = active
    ? "Revising"
    : project.status !== "live"
      ? "Not live yet"
      : !hasCredit
        ? "No revisions left"
        : "Send revision";

  useEffect(() => {
    const progressLines = progressLinesRef.current;
    if (!progressLines) {
      return;
    }

    progressLines.scrollTo({
      top: progressLines.scrollHeight,
      behavior: active ? "smooth" : "auto",
    });
  }, [active, lines]);

  useEffect(() => {
    conversationRef.current?.scrollIntoView({
      block: "end",
      behavior: active ? "smooth" : "auto",
    });
  }, [active, conversation]);

  useEffect(() => {
    return () => {
      activeStreamRef.current?.close();
      activeStreamRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (failedPreviewUrl && failedPreviewUrl !== previewUrl) {
      setFailedPreviewUrl(null);
    }
  }, [failedPreviewUrl, previewUrl]);

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

    let response: Response;
    try {
      response = await fetchWithTimeout(
        "/api/revisions/start",
        {
          body: JSON.stringify({
            componentSelection: selectedComponents,
            message: instruction,
            projectId: project.id,
          }),
          headers: {
            "Content-Type": "application/json",
          },
          method: "POST",
        },
        20_000,
      );
    } catch {
      const nextError = "Revision could not start because the server is unreachable.";
      setError(nextError);
      appendLine(nextError, "error");
      setActive(false);
      return;
    }

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

    let response: Response;
    try {
      response = await fetchWithTimeout(
        `/api/revisions/${encodeURIComponent(revisionId)}/rollback`,
        { method: "POST" },
        20_000,
      );
    } catch {
      const nextError = "Rollback could not start because the server is unreachable.";
      setError(nextError);
      appendLine(nextError, "error");
      setActive(false);
      return;
    }
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
    activeStreamRef.current?.close();
    const events = new EventSource(`/api/revisions/${encodeURIComponent(revisionId)}/stream`);
    activeStreamRef.current = events;

    events.addEventListener("progress", (event) => {
      const payload = parseEventPayload(event);
      const text = typeof payload?.message === "string" ? payload.message : null;
      if (text) {
        appendProgressLine(payload, text);
      }
    });

    events.addEventListener("error", () => {
      appendProgressLine(
        { event: "revision_stream_warning", phase: "stream" },
        "Connection interrupted. Reconnecting to the revision stream.",
      );
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
      if (activeStreamRef.current === events) {
        activeStreamRef.current = null;
      }
    });

    events.addEventListener("revision-error", (event) => {
      const payload = parseEventPayload(event);
      const nextError = typeof payload?.message === "string" ? payload.message : "Revision stream disconnected.";
      setError(nextError);
      appendLine(nextError, "error");
      appendConversation("assistant", nextError, { status: "failed" });
      setActive(false);
      events.close();
      if (activeStreamRef.current === events) {
        activeStreamRef.current = null;
      }
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
          {changedFiles.length > 0 ? (
            <section className="revision-changes-card" aria-label="Changed files">
              <div className="revision-changes-icon" aria-hidden="true">
                <Files size={18} />
              </div>
              <div className="revision-changes-main">
                <div className="revision-changes-header">
                  <div>
                    <p className="mono">Review</p>
                    <strong>{`Edited ${changedFiles.length} file${changedFiles.length === 1 ? "" : "s"}`}</strong>
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
                <div className="revision-changes-list">
                  {visibleChangedFiles.map((file) => (
                    <div key={`${file.path}-${file.status}`}>
                      <span>{file.path}</span>
                      <small>{file.status}</small>
                    </div>
                  ))}
                  {hiddenChangedFileCount > 0 ? <em>{hiddenChangedFileCount} more files in the detailed summary</em> : null}
                </div>
              </div>
            </section>
          ) : null}

          <section className="revision-thread" aria-label="Revision conversation" ref={conversationRef}>
            <div className="revision-thread-header">
              <MessageSquare size={15} />
              <span>Conversation</span>
            </div>
            {conversation.length === 0 ? (
              <div className="revision-message revision-message-assistant">
                <p>Ready. Tell me the change and I&apos;ll show the short work log while it runs.</p>
                <MessageCopyButton content="Ready. Tell me the change and I'll show the short work log while it runs." />
              </div>
            ) : (
              conversation.map((item) => (
                <div className={`revision-message revision-message-${item.role}`} key={item.id}>
                  <p>{item.content}</p>
                  {item.role === "user" ? null : <MessageCopyButton content={item.content} />}
                </div>
              ))
            )}
          </section>

          <section aria-busy={active} className="revision-worklog" aria-label="Agent work log">
            <div className="revision-worklog-header">
              <div>
                <span>{active ? "Working now" : "Work log"}</span>
                <small>{lines.length} event{lines.length === 1 ? "" : "s"}</small>
              </div>
              <span>{selectedStatusLabel}</span>
            </div>
            <div className="revision-progress-lines" aria-live="polite" ref={progressLinesRef}>
              {lines.map((line) => {
                const lineCopy = progressLineCopy(line.message);

                return (
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
                    <span className="revision-progress-copy">
                      <span>{lineCopy.text}</span>
                      {lineCopy.label ? <small>{lineCopy.label}</small> : null}
                    </span>
                  </div>
                );
              })}
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
            {active ? <span>Streaming agent work</span> : null}
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
                aria-disabled={active}
                className={componentChipClassName({
                  active,
                  selected: selectedComponents.includes(component.id),
                })}
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
              {composerHelpText}
            </span>
            <button className="btn btn-accent" disabled={!canSubmit} type="submit">
              <Send aria-hidden="true" size={16} />
              {submitButtonLabel}
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
          ) : canShowLivePreview && previewUrl ? (
            <iframe
              className="revision-preview-frame"
              onError={() => setFailedPreviewUrl(previewUrl)}
              src={previewUrl}
              title={`${project.business_name} preview`}
            />
          ) : (
            <PreviewUnavailable hasPreviewUrl={hasPreviewUrl} />
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
                  className={[
                    "revision-history-item",
                    `revision-history-item-${revision.status}`,
                    revision.id === selectedRevision?.id ? "active" : null,
                  ].filter(Boolean).join(" ")}
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

function PreviewUnavailable({ hasPreviewUrl }: { hasPreviewUrl: boolean }) {
  return (
    <div className="revision-preview-empty" role="status">
      <TriangleAlert aria-hidden="true" size={20} />
      <div>
        <p className="mono">Preview unavailable</p>
        <strong>{hasPreviewUrl ? "Preview unavailable while revision is queued." : "This site does not have a public URL yet."}</strong>
        <span>{hasPreviewUrl ? "Open the live site in a new tab if you need to inspect it directly." : "A live preview appears here after the site is published."}</span>
      </div>
    </div>
  );
}

function MessageCopyButton({ content }: { content: string }) {
  const [copied, setCopied] = useState(false);
  const resetTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current) {
        window.clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  async function copyMessage() {
    setCopied(true);
    if (resetTimerRef.current) {
      window.clearTimeout(resetTimerRef.current);
    }

    const didCopy = await writeClipboardText(content);
    if (!didCopy) {
      setCopied(false);
      return;
    }

    resetTimerRef.current = window.setTimeout(() => setCopied(false), 1400);
  }

  return (
    <button
      aria-label={copied ? "Message copied" : "Copy message"}
      className={copied ? "revision-message-copy copied" : "revision-message-copy"}
      onClick={() => void copyMessage()}
      type="button"
    >
      <Copy aria-hidden="true" size={15} />
      <span>Copy</span>
    </button>
  );
}

async function writeClipboardText(text: string) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to the textarea fallback below.
    }
  }

  return fallbackCopyText(text);
}

function fallbackCopyText(text: string) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.top = "0";
  textarea.style.opacity = "0";

  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  try {
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    textarea.remove();
  }
}

function formatPlanLabel(planLabel: string | null | undefined) {
  if (!planLabel) {
    return "";
  }

  return planLabel
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function componentChipClassName({ active, selected }: { active: boolean; selected: boolean }) {
  return [
    "revision-component-chip",
    selected ? "selected" : null,
    active ? "disabled" : null,
  ].filter(Boolean).join(" ");
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
    message: revisionProgressMessage(revision),
  }));
}

function revisionProgressMessage(revision: RevisionHistoryItem) {
  if (revision.status === "done") {
    return `Deployed revision: ${revision.instruction}`;
  }

  if (revision.status === "failed") {
    return `Revision needs attention: ${revision.instruction}`;
  }

  if (revision.status === "running") {
    return `Working on revision: ${revision.instruction}`;
  }

  return `Queued revision: ${revision.instruction}`;
}

function progressLineCopy(message: string) {
  const match = /^(Queued revision|Working on revision|Deployed revision|Revision needs attention):\s*(.+)$/i.exec(message);

  if (!match) {
    return {
      label: "",
      text: message,
    };
  }

  return {
    label: progressLineStatusLabel(match[1]),
    text: match[2],
  };
}

function progressLineStatusLabel(label: string) {
  if (/^queued/i.test(label)) {
    return "Queued";
  }

  if (/^working/i.test(label)) {
    return "Working";
  }

  if (/^deployed/i.test(label)) {
    return "Deployed";
  }

  return "Needs attention";
}

function revisionStatusLabel(revision: RevisionHistoryItem) {
  const kind = revision.revision_kind === "rollback" ? "Rollback" : "Edit";
  const status =
    revision.status === "done"
      ? "Deployed"
      : revision.status === "failed"
        ? "Needs attention"
        : revision.status === "running"
          ? "Working"
          : "Queued";

  return `${status} ${kind.toLowerCase()}`;
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
  const phase = typeof payload?.phase === "string" ? payload.phase : "";
  const agentId = typeof payload?.agent_id === "string" ? payload.agent_id : "";
  const normalizedMessage = normalizeProgressMessage(message);

  if (isReplayedProgressMessage(normalizedMessage)) {
    return `message:${normalizedMessage}`;
  }

  return [event, phase, agentId, normalizedMessage].filter(Boolean).join(":");
}

function normalizeProgressMessage(message: string) {
  return message.trim().replace(/\s+/g, " ").toLowerCase();
}

function isReplayedProgressMessage(message: string) {
  return message === "revision request received." || message === "reading current site files";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
