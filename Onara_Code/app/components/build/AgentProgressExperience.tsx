"use client";

import {
  AlertTriangle,
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
  siteId?: string;
  stepIndex?: number;
};

type ConnectionMode = "connecting" | "sse" | "polling" | "complete" | "error";

const emptyStatuses = AGENT_STEPS.map<AgentStatus>(() => "pending");

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

function readStoredPackage(jobId: string): StoredGenerationPackage | null {
  const keys = [`onara:generation:${jobId}`, "onara:last-generation-package"];

  for (const key of keys) {
    const value = window.sessionStorage.getItem(key);

    if (!value) {
      continue;
    }

    try {
      return JSON.parse(value) as StoredGenerationPackage;
    } catch {
      continue;
    }
  }

  return null;
}

export function AgentProgressExperience() {
  const searchParams = useSearchParams();
  const jobId = searchParams.get("jobId") || "mock-local";
  const [businessName, setBusinessName] = useState("Your Contractor Site");
  const [businessMeta, setBusinessMeta] = useState("Google Business data confirmed");
  const [connectionMode, setConnectionMode] = useState<ConnectionMode>("connecting");
  const [currentMessage, setCurrentMessage] = useState("Preparing the agent workspace.");
  const [previewHtml, setPreviewHtml] = useState(() => previewHtmlForStep(0, "Your Contractor Site"));
  const [progress, setProgress] = useState(0);
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

  useEffect(() => {
    const storedPackage = readStoredPackage(jobId);
    const nextBusinessName = storedPackage?.business?.name?.trim() || "Your Contractor Site";
    const metaParts = [
      storedPackage?.business?.category,
      storedPackage?.business?.address,
      storedPackage?.business?.phone,
    ].filter(Boolean);

    setBusinessName(nextBusinessName);
    setBusinessMeta(metaParts.join(" - ") || "Google Business data confirmed");
    setPreviewHtml(previewHtmlForStep(0, nextBusinessName));
    setStartedAt(Date.now());
  }, [jobId]);

  useEffect(() => {
    if (!startedAt) {
      return;
    }

    const streamStartedAt = startedAt;
    const businessParam = encodeURIComponent(businessName);
    const streamUrl = `/api/build/progress/stream?jobId=${encodeURIComponent(jobId)}&businessName=${businessParam}`;
    let pollingTimer: ReturnType<typeof setInterval> | null = null;
    let closedByComplete = false;

    function applyStep(stepIndex: number, status: AgentStatus, message?: string, nextProgress?: number) {
      setStatuses(AGENT_STEPS.map((_, index) => statusForStep(index, stepIndex, status)));
      setCurrentMessage(message || AGENT_STEPS[stepIndex]?.task || "Working through the build pipeline.");
      setProgress(safeProgress(nextProgress));
    }

    async function pollStatus() {
      const elapsedMs = Date.now() - streamStartedAt;
      const statusUrl = `/api/build/progress/status?jobId=${encodeURIComponent(jobId)}&businessName=${businessParam}&elapsedMs=${elapsedMs}`;
      const response = await fetch(statusUrl, { cache: "no-store" });

      if (!response.ok) {
        throw new Error("Progress status unavailable.");
      }

      const data = (await response.json()) as StreamPayload & {
        complete?: boolean;
        currentStepIndex?: number;
        queued?: boolean;
        retrying?: boolean;
      };

      if (data.html) {
        setPreviewHtml(data.html);
      }

      if (data.complete) {
        setConnectionMode("complete");
        setStatuses(AGENT_STEPS.map(() => "done"));
        setProgress(100);
        setCurrentMessage(data.message || "Generation complete.");
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

    function startPolling() {
      setConnectionMode("polling");
      pollingTimer = setInterval(() => {
        pollStatus().catch(() => {
          setConnectionMode("error");
          setCurrentMessage("Connection lost. Refresh to reconnect to the mock progress stream.");
        });
      }, 900);
      void pollStatus();
    }

    if (!("EventSource" in window)) {
      startPolling();
      return () => {
        if (pollingTimer) {
          clearInterval(pollingTimer);
        }
      };
    }

    setConnectionMode("connecting");
    const eventSource = new EventSource(streamUrl);
    eventSourceRef.current = eventSource;

    eventSource.addEventListener("open", () => {
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

      if (data.html) {
        setPreviewHtml(data.html);
      }
    });

    eventSource.addEventListener("complete", (event) => {
      const data = JSON.parse((event as MessageEvent).data) as StreamPayload;
      closedByComplete = true;
      setConnectionMode("complete");
      setStatuses(AGENT_STEPS.map(() => "done"));
      setProgress(100);
      setCurrentMessage(data.message || "Generation complete.");
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
        setCurrentMessage(data.message || "The mock stream failed.");
        setConnectionMode("error");
        eventSource.close();
        return;
      }

      eventSource.close();
      startPolling();
    });

    return () => {
      closedByComplete = true;
      eventSource.close();

      if (pollingTimer) {
        clearInterval(pollingTimer);
      }
    };
  }, [businessName, jobId, startedAt]);

  return (
    <div className="agent-progress-shell fadein-up">
      <section className="agent-progress-grid">
        <aside className="agent-progress-panel">
          <div className="agent-progress-heading">
            <div className="agent-progress-kicker">
              <span className={`agent-live-dot agent-live-dot-${connectionMode}`} />
              <span>{connectionLabel(connectionMode)}</span>
            </div>
            <p className="eyebrow">Building your site</p>
            <h1 className="serif">{businessName}</h1>
            <span>{businessMeta}</span>
            <p>10 small agents are building in sequence. Stay here or come back later; this job is saved in your browser session.</p>
          </div>

          <div className="agent-progress-meter card">
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

          <div className="agent-active-card card">
            <p className="mono">{connectionMode === "complete" ? "Ready" : "Now"}</p>
            <strong>{connectionMode === "complete" ? "Generation complete" : activeAgent.name}</strong>
            <span>{currentMessage}</span>
          </div>

          {queuePosition ? (
            <div className="agent-progress-notice agent-progress-notice-queue">
              <Clock3 size={15} aria-hidden="true" />
              Queue position {queuePosition}. Starting the local mock stream.
            </div>
          ) : null}

          {connectionMode === "error" ? (
            <div className="agent-progress-notice agent-progress-notice-error">
              <AlertTriangle size={15} aria-hidden="true" />
              {currentMessage}
            </div>
          ) : null}

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
        </aside>

        <section className="agent-preview-panel">
          <div className="agent-preview-toolbar">
            <div className="agent-preview-dots" aria-hidden="true">
              <span className="window-dot window-dot-red" />
              <span className="window-dot window-dot-yellow" />
              <span className="window-dot window-dot-green" />
            </div>
            <div className="agent-preview-url">
              preview - {connectionMode === "complete" ? "ready" : "building"}
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
              <button className="btn btn-accent" disabled={connectionMode !== "complete"} type="button">
                {siteId ? "Mock site ready" : "Waiting"}
              </button>
            </div>
          </div>
        </section>
      </section>
    </div>
  );
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
    return "SSE stream connected";
  }

  if (mode === "polling") {
    return "Fallback polling active";
  }

  if (mode === "complete") {
    return "Mock generation complete";
  }

  if (mode === "error") {
    return "Connection needs attention";
  }

  return "Connecting stream";
}
