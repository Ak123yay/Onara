"use client";

import {
  AlertTriangle,
  ArrowLeft,
  Check,
  Clock3,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AGENT_STEPS,
  type AgentStatus,
  type AgentStep,
  previewHtmlForStep,
} from "@/lib/build/agent-progress";

type StoredGenerationPackage = {
  business?: {
    address?: string | null;
    category?: string | null;
    name?: string;
    phone?: string | null;
    rating?: number | null;
    review_count?: number | null;
  };
  created_at?: string;
  style?: {
    cta?: string;
    layout?: string;
    palette?: string;
    tone?: string;
  };
};

type StreamPayload = {
  agent?: AgentStep;
  elapsedSeconds?: number;
  html?: string;
  message?: string;
  position?: number;
  progress?: number;
  publicUrl?: string;
  siteId?: string;
  stepIndex?: number;
};

type StatusPayload = StreamPayload & {
  complete?: boolean;
  currentStepIndex?: number;
  queued?: boolean;
  retrying?: boolean;
};

type ConnectionMode = "connecting" | "sse" | "polling" | "complete" | "error";

const emptyStatuses = AGENT_STEPS.map<AgentStatus>(() => "pending");
const previewCachePrefix = "onara:build-preview:";

function statusForStep(index: number, activeIndex: number, status: AgentStatus) {
  if (index < activeIndex) {
    return "done";
  }

  if (index === activeIndex) {
    return status;
  }

  return "pending";
}

function safeProgress(value: number | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(value)));
}

function readStoredPackage(jobId: string, projectId: string | null): StoredGenerationPackage | null {
  const keys = [
    `onara:generation:${jobId}`,
    projectId ? `onara:generation:project:${projectId}` : "",
    "onara:last-generation-package",
  ].filter(Boolean);
  const stores = [window.sessionStorage, window.localStorage];

  for (const store of stores) {
    for (const key of keys) {
      const value = store.getItem(key);

      if (!value) {
        continue;
      }

      try {
        return JSON.parse(value) as StoredGenerationPackage;
      } catch {
        continue;
      }
    }
  }

  return null;
}

function readCachedPreview(jobId: string) {
  try {
    return window.sessionStorage.getItem(`${previewCachePrefix}${jobId}`);
  } catch {
    return null;
  }
}

function cachePreview(jobId: string, html: string) {
  try {
    if (html.length <= 500_000) {
      window.sessionStorage.setItem(`${previewCachePrefix}${jobId}`, html);
    }
  } catch {
    // Preview caching is an instant-render optimization, not required state.
  }
}

export function AgentProgressExperience() {
  const searchParams = useSearchParams();
  const jobId = searchParams.get("jobId") || "mock-local";
  const projectId = searchParams.get("projectId");
  const [businessName, setBusinessName] = useState("Your Contractor Site");
  const [businessMeta, setBusinessMeta] = useState("Google Business data confirmed");
  const [connectionMode, setConnectionMode] = useState<ConnectionMode>("connecting");
  const [currentMessage, setCurrentMessage] = useState("Preparing the agent workspace.");
  const [previewHtml, setPreviewHtml] = useState(() => previewHtmlForStep(0, "Your Contractor Site"));
  const [progress, setProgress] = useState(0);
  const [publicUrl, setPublicUrl] = useState<string | null>(null);
  const [queuePosition, setQueuePosition] = useState<number | null>(null);
  const [siteId, setSiteId] = useState<string | null>(null);
  const [statuses, setStatuses] = useState<AgentStatus[]>(emptyStatuses);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const activeIndex = useMemo(() => {
    const active = statuses.findIndex((status) => status === "active" || status === "retry");

    if (active >= 0) {
      return active;
    }

    return Math.min(statuses.filter((status) => status === "done").length, AGENT_STEPS.length - 1);
  }, [statuses]);

  const completedCount = statuses.filter((status) => status === "done").length;
  const etaSeconds = connectionMode === "complete" ? 0 : Math.max(6, Math.round((100 - progress) * 0.82));
  const activeAgent = AGENT_STEPS[activeIndex];
  const progressLabel = connectionMode === "complete"
    ? "Complete"
    : connectionMode === "error"
      ? "Needs attention"
      : `${progress}% complete`;
  const etaLabel = connectionMode === "complete" ? "Ready" : `${etaSeconds}s est.`;
  const hasConnectionIssue = connectionMode === "error";

  useEffect(() => {
    const storedPackage = readStoredPackage(jobId, projectId);
    const nextBusinessName = storedPackage?.business?.name?.trim() || "Your Contractor Site";
    const metaParts = [
      storedPackage?.business?.category,
      storedPackage?.business?.address,
      storedPackage?.business?.phone,
    ].filter(Boolean);

    setBusinessName(nextBusinessName);
    setBusinessMeta(metaParts.join(" / ") || "Google Business data confirmed");
    setPreviewHtml(readCachedPreview(jobId) || previewHtmlForStep(0, nextBusinessName));
    setStartedAt(Date.now());
  }, [jobId, projectId]);

  useEffect(() => {
    if (!startedAt) {
      return;
    }

    const streamStartedAt = startedAt;
    const businessParam = encodeURIComponent(businessName);
    const projectParam = projectId ? `&projectId=${encodeURIComponent(projectId)}` : "";
    const streamUrl = `/api/build/progress/stream?jobId=${encodeURIComponent(jobId)}&businessName=${businessParam}${projectParam}`;
    let pollingTimer: ReturnType<typeof setInterval> | null = null;
    let closedByComplete = false;
    let disposed = false;
    let pollingFailures = 0;

    function applyStep(stepIndex: number, status: AgentStatus, message?: string, nextProgress?: number) {
      if (disposed) {
        return;
      }

      setStatuses(AGENT_STEPS.map((_, index) => statusForStep(index, stepIndex, status)));
      setCurrentMessage(message || AGENT_STEPS[stepIndex]?.task || "Working through the build pipeline.");
      setProgress(safeProgress(nextProgress));
    }

    function applyPreview(html: string | undefined) {
      if (disposed || !html) {
        return;
      }

      setPreviewHtml(html);
      cachePreview(jobId, html);
    }

    async function pollStatus() {
      const elapsedMs = Date.now() - streamStartedAt;
      const statusUrl = `/api/build/progress/status?jobId=${encodeURIComponent(jobId)}&businessName=${businessParam}&elapsedMs=${elapsedMs}${projectParam}`;
      const response = await fetch(statusUrl, { cache: "no-store" });

      if (!response.ok) {
        throw new Error("Progress status unavailable.");
      }

      const data = (await response.json()) as StatusPayload;
      if (disposed) {
        return;
      }

      pollingFailures = 0;

      applyPreview(data.html);

      if (data.complete) {
        setConnectionMode("complete");
        setStatuses(AGENT_STEPS.map(() => "done"));
        setProgress(100);
        setCurrentMessage(data.message || "Generation complete.");
        setPublicUrl(data.publicUrl || null);
        setSiteId(data.siteId || null);
        return;
      }

      if (data.queued) {
        setQueuePosition(1);
        setCurrentMessage(data.message || "Your site is queued.");
        setProgress(0);
        return;
      }

      applyStep(
        data.currentStepIndex ?? 0,
        data.retrying ? "retry" : "active",
        data.message,
        data.progress,
      );
    }

    function hydrateSnapshot() {
      void pollStatus().catch(() => {
        if (disposed) {
          return;
        }

        pollingFailures += 1;
        setCurrentMessage("Build stream is reconnecting. The job is still saved.");
      });
    }

    function startPolling() {
      if (pollingTimer) {
        return;
      }

      setConnectionMode("polling");
      pollingTimer = setInterval(() => {
        pollStatus().catch(() => {
          if (disposed) {
            return;
          }

          pollingFailures += 1;
          setCurrentMessage("Build stream is reconnecting. The job is still saved.");

          if (pollingFailures >= 10) {
            setConnectionMode("error");
            setCurrentMessage("Connection lost. Refresh to reconnect to the build stream.");
          }
        });
      }, 900);
      void pollStatus().catch(() => {
        if (disposed) {
          return;
        }

        pollingFailures += 1;
        setCurrentMessage("Build stream is reconnecting. The job is still saved.");
      });
    }

    if (!("EventSource" in window)) {
      startPolling();
      return () => {
        disposed = true;

        if (pollingTimer) {
          clearInterval(pollingTimer);
        }
      };
    }

    hydrateSnapshot();
    setConnectionMode("connecting");
    const eventSource = new EventSource(streamUrl);
    eventSourceRef.current = eventSource;

    eventSource.addEventListener("open", () => {
      setConnectionMode("sse");
    });

    eventSource.addEventListener("heartbeat", () => {
      setConnectionMode("sse");
    });

    eventSource.addEventListener("queued", (event) => {
      const data = JSON.parse((event as MessageEvent).data) as StreamPayload;
      setQueuePosition(typeof data.position === "number" ? data.position : 1);
      setCurrentMessage(data.message || "Your site is queued.");
      setProgress(safeProgress(data.progress));
    });

    eventSource.addEventListener("step", (event) => {
      const data = JSON.parse((event as MessageEvent).data) as StreamPayload;
      setQueuePosition(null);
      applyStep(data.stepIndex ?? 0, "active", data.message, data.progress);
    });

    eventSource.addEventListener("agent_retry", (event) => {
      const data = JSON.parse((event as MessageEvent).data) as StreamPayload;
      applyStep(data.stepIndex ?? 0, "retry", data.message, data.progress);
    });

    eventSource.addEventListener("agent_complete", (event) => {
      const data = JSON.parse((event as MessageEvent).data) as StreamPayload;
      const stepIndex = data.stepIndex ?? 0;

      setStatuses(AGENT_STEPS.map((_, index) => {
        if (index <= stepIndex) {
          return "done";
        }

        if (index === stepIndex + 1) {
          return "active";
        }

        return "pending";
      }));
      setProgress(safeProgress(data.progress));
    });

    eventSource.addEventListener("preview", (event) => {
      const data = JSON.parse((event as MessageEvent).data) as StreamPayload;

      applyPreview(data.html);
    });

    eventSource.addEventListener("reconnecting", (event) => {
      const data = JSON.parse((event as MessageEvent).data) as StreamPayload;
      setConnectionMode("sse");
      setCurrentMessage(data.message || "Build stream is reconnecting. The job is still saved.");
    });

    eventSource.addEventListener("complete", (event) => {
      const data = JSON.parse((event as MessageEvent).data) as StreamPayload;
      closedByComplete = true;
      setConnectionMode("complete");
      setStatuses(AGENT_STEPS.map(() => "done"));
      setProgress(100);
      setCurrentMessage(data.message || "Generation complete.");
      setPublicUrl(data.publicUrl || null);
      setSiteId(data.siteId || null);
      eventSource.close();
    });

    eventSource.addEventListener("error", (event) => {
      if (closedByComplete) {
        return;
      }

      const messageEvent = event as MessageEvent;

      if (messageEvent.data) {
        const data = JSON.parse(messageEvent.data) as StreamPayload;
        setCurrentMessage(data.message || "The build stream failed.");
        setConnectionMode("error");
        eventSource.close();
        return;
      }

      eventSource.close();
      startPolling();
    });

    return () => {
      disposed = true;
      closedByComplete = true;
      eventSource.close();

      if (pollingTimer) {
        clearInterval(pollingTimer);
      }
    };
  }, [businessName, jobId, projectId, startedAt]);

  return (
    <div className="agent-progress-shell fadein-up">
      <section className="agent-progress-grid">
        <aside className="agent-progress-panel">
          <Link className="agent-progress-back" href="/dashboard">
            <ArrowLeft aria-hidden="true" size={14} />
            Dashboard
          </Link>

          <section className="agent-command-card card">
            <div className="agent-command-card-top">
              <div className="agent-command-card-copy">
                <p className="eyebrow">Build command center</p>
                <h1 className="serif">{businessName}</h1>
                <span className="agent-progress-heading-meta">{businessMeta}</span>
              </div>
              <div className={`agent-progress-kicker agent-progress-kicker-${connectionMode}`}>
                <span>{connectionLabel(connectionMode)}</span>
              </div>
            </div>

            <div className="agent-command-meter">
              <div className="agent-progress-meter-head">
                <p className="mono">Progress</p>
                <strong>{completedCount} / {AGENT_STEPS.length}</strong>
              </div>
              <div className="agent-progress-bar" aria-label={`${progress}% complete`}>
                <span style={{ width: `${progress}%` }} />
              </div>
              <div className="agent-progress-meter-footer">
                <span>{progress}% complete</span>
                <span>{etaSeconds}s est.</span>
              </div>
            </div>

            <dl className="agent-progress-stats" aria-label="Build summary">
              <div className="agent-progress-stat">
                <dt>Status</dt>
                <dd>{progressLabel}</dd>
              </div>
              <div className="agent-progress-stat">
                <dt>Agents</dt>
                <dd>{completedCount} / {AGENT_STEPS.length}</dd>
              </div>
              <div className="agent-progress-stat">
                <dt>ETA</dt>
                <dd>{etaLabel}</dd>
              </div>
            </dl>

            <div className="agent-progress-save-note">
              <Clock3 aria-hidden="true" size={15} />
              <span>Saved automatically. You can leave and reopen live status from the dashboard.</span>
            </div>
          </section>

          <div className={`agent-active-card card${hasConnectionIssue ? " agent-active-card-error" : ""}`}>
            <div className="agent-active-card-head">
              <p className="mono">{connectionMode === "complete" ? "Ready" : "Current agent"}</p>
              {hasConnectionIssue ? (
                <span className="agent-active-state">
                  <AlertTriangle size={12} aria-hidden="true" />
                  Attention
                </span>
              ) : null}
            </div>
            <strong>{connectionMode === "complete" ? "Generation complete" : activeAgent.name}</strong>
            <span>{currentMessage}</span>
          </div>

          {queuePosition ? (
            <div className="agent-progress-notice agent-progress-notice-queue">
              <Clock3 size={15} aria-hidden="true" />
              Queue position {queuePosition}. Starting the build stream.
            </div>
          ) : null}

          <div className="agent-step-list-card card">
            <div className="agent-step-list-head">
              <p className="mono">Agent queue</p>
              <span>{AGENT_STEPS.length} steps</span>
            </div>
            <div className="agent-step-list" aria-label="Agent progress">
              {AGENT_STEPS.map((agent, index) => (
                <AgentStepRow
                  agent={agent}
                  index={index}
                  key={agent.id}
                  status={statuses[index]}
                />
              ))}
            </div>
          </div>
        </aside>

        <section className="agent-preview-panel">
          <div className="agent-preview-toolbar">
            <div className="agent-preview-dots" aria-hidden="true">
              <span className="window-dot window-dot-red" />
              <span className="window-dot window-dot-yellow" />
              <span className="window-dot window-dot-green" />
            </div>
            <div className="agent-preview-url">
              {connectionMode === "complete" && publicUrl ? displayUrl(publicUrl) : `preview - ${connectionMode === "complete" ? "ready" : "building"}`}
            </div>
            <span className="badge agent-preview-badge">
              {connectionMode === "complete" ? "ready" : "live"}
            </span>
          </div>

          <div className="agent-preview-frame-wrap">
            <iframe
              className="agent-preview-frame"
              sandbox=""
              srcDoc={previewHtml}
              title="Generated website preview"
            />
          </div>

          <div className="agent-preview-footer">
            <div>
              <p className="mono">Current agent</p>
              <strong>{connectionMode === "complete" ? "Generation complete" : activeAgent.name}</strong>
              <span>{currentMessage}</span>
            </div>
            <div className="agent-preview-actions">
              <Link className="btn btn-soft" href="/dashboard/build">
                New build
              </Link>
              {connectionMode === "complete" && publicUrl ? (
                <Link className="btn btn-accent" href={publicUrl} target="_blank" rel="noreferrer">
                  Open site
                </Link>
              ) : (
                <button className="btn btn-accent" disabled type="button">
                  {siteId ? "Draft ready" : "Waiting"}
                </button>
              )}
            </div>
          </div>
        </section>
      </section>
    </div>
  );
}

function displayUrl(value: string) {
  return value.replace(/^https?:\/\//, "").replace(/\/+$/, "");
}

function AgentStepRow({
  agent,
  index,
  status,
}: {
  agent: AgentStep;
  index: number;
  status: AgentStatus;
}) {
  const active = status === "active" || status === "retry";

  return (
    <div className={`agent-step-row agent-step-row-${status}`}>
      <span className="agent-step-index">
        {status === "done" ? (
          <Check size={13} aria-hidden="true" />
        ) : status === "retry" ? (
          <RefreshCw size={13} aria-hidden="true" />
        ) : active ? (
          <LoaderCircle size={13} aria-hidden="true" />
        ) : (
          String(index + 1).padStart(2, "0")
        )}
      </span>
      <span className="agent-step-copy">
        <strong>{agent.name}</strong>
        <span>{active ? agent.task : agent.model}</span>
      </span>
      <span className="agent-step-model">
        {status === "retry" ? "retry" : status}
      </span>
    </div>
  );
}

function connectionLabel(mode: ConnectionMode) {
  if (mode === "sse") {
    return "Live build";
  }

  if (mode === "polling") {
    return "Live build";
  }

  if (mode === "complete") {
    return "Build complete";
  }

  if (mode === "error") {
    return "Connection needs attention";
  }

  return "Starting build";
}
