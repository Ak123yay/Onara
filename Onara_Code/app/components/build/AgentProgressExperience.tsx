"use client";

/* eslint-disable @next/next/no-img-element */

import {
  AlertTriangle,
  ArrowLeft,
  Check,
  Clock3,
  LoaderCircle,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AGENT_STEPS,
  loadingPreviewHtml,
  type AgentStatus,
  type AgentStep,
} from "@/lib/build/agent-progress";
import { fetchWithTimeout } from "@/lib/resilience";

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
  candidate?: CandidateSummary;
  candidates?: CandidateSummary[];
  candidateKey?: string;
  componentId?: string;
  components?: ComponentProgress[];
  elapsedSeconds?: number;
  etaSeconds?: number | null;
  fallbackUsed?: boolean;
  html?: string;
  message?: string;
  notice?: string;
  position?: number;
  progress?: number;
  publicUrl?: string;
  qualityBadges?: string[];
  selectedCandidateId?: string | null;
  siteId?: string;
  stepIndex?: number;
};

type StatusPayload = StreamPayload & {
  complete?: boolean;
  currentStepIndex?: number;
  failed?: boolean;
  queued?: boolean;
  retrying?: boolean;
};

type ConnectionMode = "connecting" | "sse" | "polling" | "complete" | "error";

type CandidateSummary = {
  candidateKey?: string;
  componentCount?: number;
  degradedReason?: string | null;
  deterministicScore?: number;
  directionName?: string;
  fallbackComponentCount?: number;
  fallbackUsed?: boolean;
  finalScore?: number;
  hardBlockers?: string[];
  qualityMode?: "full" | "static";
  recipe?: string;
  selected?: boolean;
  thumbnailDataUrl?: string | null;
  visualScore?: number;
  warnings?: string[];
};

type ComponentProgress = {
  candidateKey?: string;
  componentId?: string;
  fallbackUsed?: boolean;
};

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

function isRenderablePreviewHtml(html: string | null | undefined): html is string {
  if (!html) {
    return false;
  }

  const normalized = html.trim();
  if (
    normalized.length < 120
    || !/<(?:html|body)\b/i.test(normalized)
    || !/<\/body\s*>/i.test(normalized)
    || !/<\/html\s*>/i.test(normalized)
  ) {
    return false;
  }

  const visibleText = normalized
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(?:script|style)\b[\s\S]*?<\/(?:script|style)>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&(?:nbsp|#160);/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  return visibleText.length >= 20;
}

function readCachedPreview(jobId: string) {
  try {
    const cached = window.sessionStorage.getItem(`${previewCachePrefix}${jobId}`);
    if (isRenderablePreviewHtml(cached)) {
      return cached;
    }

    window.sessionStorage.removeItem(`${previewCachePrefix}${jobId}`);
    return null;
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

function mergeCandidateList(current: CandidateSummary[], incoming: CandidateSummary) {
  const key = incoming.candidateKey;
  if (!key) {
    return current;
  }

  const existingIndex = current.findIndex((candidate) => candidate.candidateKey === key);
  if (existingIndex < 0) {
    return [...current, incoming].sort((left, right) =>
      String(left.candidateKey).localeCompare(String(right.candidateKey)),
    );
  }

  return current.map((candidate, index) =>
    index === existingIndex ? { ...candidate, ...incoming } : candidate,
  );
}

export function AgentProgressExperience() {
  const searchParams = useSearchParams();
  const jobId = searchParams.get("jobId") || "mock-local";
  const projectId = searchParams.get("projectId");
  const [businessName, setBusinessName] = useState("Your Contractor Site");
  const [businessMeta, setBusinessMeta] = useState("Google Business data confirmed");
  const [connectionMode, setConnectionMode] = useState<ConnectionMode>("connecting");
  const [currentMessage, setCurrentMessage] = useState("Preparing the agent workspace.");
  const [aiNotice, setAiNotice] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState(() => loadingPreviewHtml("Your Contractor Site"));
  const [progress, setProgress] = useState(0);
  const [publicUrl, setPublicUrl] = useState<string | null>(null);
  const [queuePosition, setQueuePosition] = useState<number | null>(null);
  const [siteId, setSiteId] = useState<string | null>(null);
  const [statuses, setStatuses] = useState<AgentStatus[]>(emptyStatuses);
  const [candidates, setCandidates] = useState<CandidateSummary[]>([]);
  const [components, setComponents] = useState<ComponentProgress[]>([]);
  const [etaSeconds, setEtaSeconds] = useState<number | null>(null);
  const [fallbackUsed, setFallbackUsed] = useState(false);
  const [qualityBadges, setQualityBadges] = useState<string[]>([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
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
  const activeAgent = AGENT_STEPS[activeIndex];
  const progressLabel = connectionMode === "complete"
    ? "Complete"
    : connectionMode === "error"
      ? "Needs attention"
      : `${progress}% complete`;
  const etaLabel = connectionMode === "complete"
    ? "Ready"
    : typeof etaSeconds === "number"
      ? `${etaSeconds}s est.`
      : "Calculating";
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
    setPreviewHtml(readCachedPreview(jobId) || loadingPreviewHtml(nextBusinessName));
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
    let sseErrorCount = 0;

    function applyStep(stepIndex: number, status: AgentStatus, message?: string, nextProgress?: number) {
      if (disposed) {
        return;
      }

      setStatuses(AGENT_STEPS.map((_, index) => statusForStep(index, stepIndex, status)));
      setCurrentMessage(message || AGENT_STEPS[stepIndex]?.task || "Working through the build pipeline.");
      setProgress(safeProgress(nextProgress));
    }

    function applyPreview(html: string | undefined) {
      if (disposed || !isRenderablePreviewHtml(html)) {
        return;
      }

      setPreviewHtml(html);
      cachePreview(jobId, html);
    }

    function applyBuildMetadata(data: StreamPayload) {
      if (typeof data.etaSeconds === "number" || data.etaSeconds === null) {
        setEtaSeconds(data.etaSeconds ?? null);
      }
      if (data.candidates) {
        setCandidates(data.candidates);
      }
      if (data.components) {
        setComponents(data.components);
      }
      if (data.candidate) {
        setCandidates((current) => mergeCandidateList(current, data.candidate as CandidateSummary));
      }
      if (data.qualityBadges) {
        setQualityBadges(data.qualityBadges);
      }
      if (data.selectedCandidateId !== undefined) {
        setSelectedCandidateId(data.selectedCandidateId ?? null);
      }
      if (data.fallbackUsed !== undefined) {
        setFallbackUsed(Boolean(data.fallbackUsed));
      }
    }

    function stopPolling() {
      if (pollingTimer) {
        clearInterval(pollingTimer);
        pollingTimer = null;
      }
    }

    async function pollStatus() {
      const elapsedMs = Date.now() - streamStartedAt;
      const statusUrl = `/api/build/progress/status?jobId=${encodeURIComponent(jobId)}&businessName=${businessParam}&elapsedMs=${elapsedMs}${projectParam}`;
      const response = await fetchWithTimeout(statusUrl, { cache: "no-store" }, 10_000);

      if (!response.ok) {
        throw new Error("Progress status unavailable.");
      }

      const data = (await response.json()) as StatusPayload;
      if (disposed) {
        return;
      }

      pollingFailures = 0;

      applyPreview(data.html);
      applyBuildMetadata(data);
      setAiNotice(data.notice || null);

      if (data.complete) {
        stopPolling();
        setConnectionMode("complete");
        setStatuses(AGENT_STEPS.map(() => "done"));
        setProgress(100);
        setEtaSeconds(0);
        setCurrentMessage(data.message || "Generation complete.");
        setPublicUrl(data.publicUrl || null);
        setSiteId(data.siteId || null);
        return;
      }

      if (data.failed) {
        stopPolling();
        setConnectionMode("error");
        setCurrentMessage(data.message || "This build stopped before publishing.");
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
      }, 4000);
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
      sseErrorCount = 0;
    });

    eventSource.addEventListener("heartbeat", () => {
      setConnectionMode("sse");
      sseErrorCount = 0;
    });

    eventSource.addEventListener("queued", (event) => {
      const data = JSON.parse((event as MessageEvent).data) as StreamPayload;
      applyBuildMetadata(data);
      setQueuePosition(typeof data.position === "number" ? data.position : 1);
      setCurrentMessage(data.message || "Your site is queued.");
      setProgress(safeProgress(data.progress));
    });

    eventSource.addEventListener("step", (event) => {
      const data = JSON.parse((event as MessageEvent).data) as StreamPayload;
      applyBuildMetadata(data);
      setQueuePosition(null);
      applyStep(data.stepIndex ?? 0, "active", data.message, data.progress);
    });

    eventSource.addEventListener("agent_retry", (event) => {
      const data = JSON.parse((event as MessageEvent).data) as StreamPayload;
      applyBuildMetadata(data);
      applyStep(data.stepIndex ?? 0, "retry", data.message, data.progress);
    });

    eventSource.addEventListener("agent_complete", (event) => {
      const data = JSON.parse((event as MessageEvent).data) as StreamPayload;
      applyBuildMetadata(data);
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

    eventSource.addEventListener("notice", (event) => {
      const data = JSON.parse((event as MessageEvent).data) as StreamPayload;
      const nextNotice = data.notice || data.message;

      if (nextNotice) {
        setAiNotice(nextNotice);
      }
    });

    for (const candidateEvent of ["candidate_ready", "candidate_scored"]) {
      eventSource.addEventListener(candidateEvent, (event) => {
        const data = JSON.parse((event as MessageEvent).data) as StreamPayload;
        applyBuildMetadata(data);
      });
    }

    eventSource.addEventListener("component_ready", (event) => {
      const data = JSON.parse((event as MessageEvent).data) as StreamPayload;
      if (!data.candidateKey || !data.componentId) {
        return;
      }
      setComponents((current) => {
        const next = {
          candidateKey: data.candidateKey,
          componentId: data.componentId,
          fallbackUsed: data.fallbackUsed,
        };
        const exists = current.some(
          (item) => item.candidateKey === next.candidateKey && item.componentId === next.componentId,
        );
        return exists ? current : [...current, next];
      });
    });

    eventSource.addEventListener("reconnecting", (event) => {
      const data = JSON.parse((event as MessageEvent).data) as StreamPayload;
      setConnectionMode("sse");
      setCurrentMessage(data.message || "Build stream is reconnecting. The job is still saved.");
    });

    eventSource.addEventListener("complete", (event) => {
      const data = JSON.parse((event as MessageEvent).data) as StreamPayload;
      applyBuildMetadata(data);
      closedByComplete = true;
      setConnectionMode("complete");
      setStatuses(AGENT_STEPS.map(() => "done"));
      setProgress(100);
      setEtaSeconds(0);
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

      sseErrorCount += 1;
      if (sseErrorCount >= 3) {
        eventSource.close();
        startPolling();
      }
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
              <p className="eyebrow">Build command center</p>
              <div className={`agent-progress-kicker agent-progress-kicker-${connectionMode}`}>
                <span>{connectionLabel(connectionMode)}</span>
              </div>
            </div>
            <div className="agent-command-card-copy">
              <h1 className="serif">{businessName}</h1>
              <span className="agent-progress-heading-meta">{businessMeta}</span>
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
                <span>{etaLabel}</span>
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
              <p className="mono">{connectionMode === "complete" ? "Ready" : "Current stage"}</p>
              {hasConnectionIssue ? (
                <span className="agent-active-state">
                  <AlertTriangle size={12} aria-hidden="true" />
                  Attention
                </span>
              ) : null}
            </div>
            <strong>{connectionMode === "complete" ? "Generation complete" : activeAgent.name}</strong>
            <span>{currentMessage}</span>
            {hasConnectionIssue ? (
              <Link className="agent-active-retry" href="/dashboard/build">
                Try another build
              </Link>
            ) : null}
          </div>

          {queuePosition ? (
            <div className="agent-progress-notice agent-progress-notice-queue">
              <Clock3 size={15} aria-hidden="true" />
              Queue position {queuePosition}. Starting the build stream.
            </div>
          ) : null}

          {aiNotice ? (
            <details className="agent-progress-notice agent-progress-notice-ai">
              <summary>
                <Sparkles size={15} aria-hidden="true" />
                Build detail
              </summary>
              <p>{aiNotice}</p>
            </details>
          ) : null}

          {candidates.length > 0 ? (
            <section className="agent-concepts card" aria-label="Website concepts">
              <div className="agent-step-list-head">
                <p className="mono">Concepts</p>
                <span>{candidates.length} generated</span>
              </div>
              <div className="agent-concept-grid">
                {candidates.map((candidate) => (
                  <CandidateCard
                    candidate={candidate}
                    key={candidate.candidateKey}
                    selected={candidate.candidateKey === selectedCandidateId || candidate.selected}
                  />
                ))}
              </div>
            </section>
          ) : null}

          {components.length > 0 && connectionMode !== "complete" ? (
            <section className="agent-components card" aria-label="Component build progress">
              <div className="agent-step-list-head">
                <p className="mono">Component build</p>
                <span>{components.length} ready</span>
              </div>
              <div className="agent-component-groups">
                {["a", "b"].map((candidateKey) => {
                  const ready = components.filter((item) => item.candidateKey === candidateKey);
                  if (!ready.length) {
                    return null;
                  }
                  return (
                    <div className="agent-component-group" key={candidateKey}>
                      <strong>Concept {candidateKey.toUpperCase()}</strong>
                      <div>
                        {ready.map((item) => (
                          <span
                            className={item.fallbackUsed ? "agent-component-safe" : undefined}
                            key={`${candidateKey}-${item.componentId}`}
                          >
                            <Check aria-hidden="true" size={10} />
                            {item.componentId?.replaceAll("_", " ")}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ) : null}

          {qualityBadges.length > 0 ? (
            <section className="agent-readiness card" aria-label="Release readiness">
              <p className="mono">Release readiness</p>
              <div>
                {qualityBadges.map((badge) => (
                  <span key={badge}>
                    <Check aria-hidden="true" size={11} />
                    {badge}
                  </span>
                ))}
              </div>
              {fallbackUsed ? (
                <small>The safe fallback was used and still passed the release checks.</small>
              ) : null}
            </section>
          ) : null}

          <div className="agent-step-list-card card">
            <div className="agent-step-list-head">
              <p className="mono">Build stages</p>
              <span>{AGENT_STEPS.length} stages</span>
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
              <p className="mono">Current stage</p>
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
        <span>{agent.task}</span>
      </span>
      <span className="agent-step-model">
        {status === "retry" ? "retry" : status}
      </span>
    </div>
  );
}

function CandidateCard({
  candidate,
  selected,
}: {
  candidate: CandidateSummary;
  selected?: boolean;
}) {
  const label = candidate.candidateKey?.toUpperCase() || "?";
  const score = typeof candidate.finalScore === "number" ? Math.round(candidate.finalScore) : null;

  return (
    <article className={`agent-concept-card${selected ? " agent-concept-card-selected" : ""}`}>
      <div className="agent-concept-thumb">
        {candidate.thumbnailDataUrl ? (
          <img alt={`Generated concept ${label}`} src={candidate.thumbnailDataUrl} />
        ) : candidate.qualityMode === "static" ? (
          <span>Static safety audit</span>
        ) : (
          <span>Rendering concept {label}</span>
        )}
      </div>
      <div className="agent-concept-copy">
        <span className="mono">Concept {label}</span>
        <strong>{candidate.directionName || candidate.recipe || "Custom direction"}</strong>
        <small>
          {score === null
            ? `${candidate.componentCount || 0} components ready`
            : candidate.qualityMode === "static"
              ? `${score}/100 static quality score`
              : `${score}/100 quality score`}
        </small>
      </div>
      {selected ? <span className="agent-concept-selected">Selected</span> : null}
    </article>
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
