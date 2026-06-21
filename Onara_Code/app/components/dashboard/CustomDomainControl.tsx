"use client";

import { Check, Copy, Globe2, RefreshCw } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { CustomDomainStatus } from "@/lib/custom-domain";
import { fetchWithTimeout, requestErrorMessage } from "@/lib/resilience";

type DomainValidation = {
  cname_target?: unknown;
  txt_name?: unknown;
  txt_value?: unknown;
};

type DomainState = {
  domain: string | null;
  error: string | null;
  purchased: boolean;
  status: CustomDomainStatus;
  validation: DomainValidation;
};

type CustomDomainControlProps = {
  initialDomain: string | null;
  initialError: string | null;
  initialPurchased: boolean;
  initialStatus: CustomDomainStatus;
  initialValidation: DomainValidation | null;
  projectId: string;
};

type CheckoutResponse = {
  message?: string;
  url?: string;
};

export function CustomDomainControl({
  initialDomain,
  initialError,
  initialPurchased,
  initialStatus,
  initialValidation,
  projectId,
}: CustomDomainControlProps) {
  const router = useRouter();
  const [copied, setCopied] = useState<string | null>(null);
  const [domain, setDomain] = useState(initialDomain ?? "");
  const [expanded, setExpanded] = useState(initialStatus !== "not_configured");
  const [isChecking, setIsChecking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [state, setState] = useState<DomainState>({
    domain: initialDomain,
    error: initialError,
    purchased: initialPurchased,
    status: initialStatus,
    validation: initialValidation ?? {},
  });

  useEffect(() => {
    if (!state.purchased || !["provisioning", "pending_dns"].includes(state.status)) {
      return;
    }

    const timer = window.setInterval(() => {
      void refreshStatus(false);
    }, 15_000);

    void refreshStatus(false);
    return () => window.clearInterval(timer);
  }, [projectId, state.purchased, state.status]);

  async function startCheckout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setState((current) => ({ ...current, error: null }));

    try {
      const response = await fetchWithTimeout(
        `/api/projects/${projectId}/custom-domain/checkout`,
        {
          body: JSON.stringify({ domain }),
          headers: { "content-type": "application/json" },
          method: "POST",
        },
        20_000,
      );
      const payload = (await response.json().catch(() => ({}))) as CheckoutResponse;

      if (!response.ok || !payload.url) {
        throw new Error(payload.message ?? "Custom-domain checkout could not be started.");
      }

      window.location.assign(payload.url);
    } catch (error) {
      setState((current) => ({
        ...current,
        error: requestErrorMessage(
          error,
          "Custom-domain checkout took too long. No charge or domain change was made.",
        ),
      }));
      setIsLoading(false);
    }
  }

  async function refreshStatus(showLoading = true) {
    if (showLoading) {
      setIsChecking(true);
    }

    try {
      const response = await fetchWithTimeout(
        `/api/projects/${projectId}/custom-domain`,
        { cache: "no-store" },
        15_000,
      );
      const payload = (await response.json().catch(() => ({}))) as Partial<DomainState> & { message?: string };

      if (!response.ok) {
        throw new Error(payload.message ?? payload.error ?? "Domain status could not be checked.");
      }

      const nextState: DomainState = {
        domain: typeof payload.domain === "string" ? payload.domain : state.domain,
        error: typeof payload.error === "string" ? payload.error : null,
        purchased: Boolean(payload.purchased),
        status: isCustomDomainStatus(payload.status) ? payload.status : state.status,
        validation: isPlainObject(payload.validation) ? payload.validation : {},
      };
      setState(nextState);
      if (nextState.domain) {
        setDomain(nextState.domain);
      }
      if (nextState.status === "active") {
        router.refresh();
      }
    } catch (error) {
      setState((current) => ({
        ...current,
        error: requestErrorMessage(
          error,
          "Domain status could not be checked. The current domain setup was left unchanged.",
        ),
      }));
    } finally {
      if (showLoading) {
        setIsChecking(false);
      }
    }
  }

  async function copyValue(label: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      window.setTimeout(() => setCopied((current) => (current === label ? null : current)), 1_200);
    } catch {
      setState((current) => ({ ...current, error: "Copy failed. Select the value and copy it manually." }));
    }
  }

  const cnameTarget = stringValue(state.validation.cname_target);
  const txtName = stringValue(state.validation.txt_name);
  const txtValue = stringValue(state.validation.txt_value);

  return (
    <section className={`custom-domain-control custom-domain-${state.status}`}>
      <div className="custom-domain-summary">
        <div className="custom-domain-heading">
          <Globe2 aria-hidden="true" size={15} />
          <div>
            <span className="mono">Custom domain</span>
            <strong>{domainSummary(state)}</strong>
          </div>
        </div>
        <div className="custom-domain-summary-actions">
          <span className="custom-domain-price">{state.purchased ? statusLabel(state.status) : "$5 one-time"}</span>
          <button
            className="btn btn-soft btn-sm"
            onClick={() => setExpanded((current) => !current)}
            type="button"
          >
            {expanded ? "Close" : state.status === "not_configured" ? "Connect" : "Manage"}
          </button>
        </div>
      </div>

      {expanded ? (
        <div className="custom-domain-body">
          {!state.purchased ? (
            <form className="custom-domain-form" onSubmit={startCheckout}>
              <label htmlFor={`custom-domain-${projectId}`}>Domain you own</label>
              <div className="custom-domain-form-row">
                <input
                  autoComplete="url"
                  id={`custom-domain-${projectId}`}
                  onChange={(event) => setDomain(event.target.value)}
                  placeholder="www.yourbusiness.com"
                  required
                  type="text"
                  value={domain}
                />
                <button className="btn btn-accent btn-sm" disabled={isLoading} type="submit">
                  {isLoading ? "Opening Stripe..." : "Continue to $5 checkout"}
                </button>
              </div>
              <p>The $5 fee covers connecting this site. Domain registration is purchased separately from a registrar.</p>
            </form>
          ) : null}

          {state.purchased && state.domain ? (
            <div className="custom-domain-instructions">
              <div className="custom-domain-domain-row">
                <div>
                  <span className="mono">Requested domain</span>
                  <strong>{state.domain}</strong>
                </div>
                {state.status === "active" ? (
                  <a className="btn btn-accent btn-sm" href={`https://${state.domain}`} rel="noreferrer" target="_blank">
                    Open domain
                  </a>
                ) : (
                  <button
                    className="btn btn-soft btn-sm"
                    disabled={isChecking}
                    onClick={() => void refreshStatus()}
                    type="button"
                  >
                    <RefreshCw aria-hidden="true" size={13} />
                    {isChecking ? "Checking..." : "Check status"}
                  </button>
                )}
              </div>

              {state.status !== "active" && cnameTarget ? (
                <div className="custom-domain-dns-grid">
                  <DomainRecord
                    copied={copied === "cname"}
                    label="CNAME target for www or another subdomain"
                    onCopy={() => void copyValue("cname", cnameTarget)}
                    value={cnameTarget}
                  />
                  {txtName && txtValue ? (
                    <DomainRecord
                      copied={copied === "txt"}
                      label={`TXT verification record (${txtName})`}
                      onCopy={() => void copyValue("txt", txtValue)}
                      value={txtValue}
                    />
                  ) : null}
                </div>
              ) : null}

              {state.status !== "active" ? (
                <p className="custom-domain-note">
                  Using a root domain like <strong>yourbusiness.com</strong>? Cloudflare nameservers are required.
                  Using <strong>www</strong> or another subdomain? Add the CNAME above at your registrar.
                </p>
              ) : (
                <p className="custom-domain-success">
                  <Check aria-hidden="true" size={14} />
                  Cloudflare verified the domain and HTTPS is active.
                </p>
              )}
            </div>
          ) : null}

          {state.error ? <p className="custom-domain-error">{state.error}</p> : null}
        </div>
      ) : null}
    </section>
  );
}

function DomainRecord({
  copied,
  label,
  onCopy,
  value,
}: {
  copied: boolean;
  label: string;
  onCopy: () => void;
  value: string;
}) {
  return (
    <div className="custom-domain-record">
      <span className="mono">{label}</span>
      <div>
        <code>{value}</code>
        <button aria-label={`Copy ${label}`} onClick={onCopy} type="button">
          {copied ? <Check aria-hidden="true" size={13} /> : <Copy aria-hidden="true" size={13} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}

function domainSummary(state: DomainState) {
  if (state.status === "active" && state.domain) {
    return state.domain;
  }
  if (state.purchased && state.domain) {
    return `${state.domain} · ${statusLabel(state.status)}`;
  }
  if (state.status === "checkout_pending" && state.domain) {
    return `${state.domain} · checkout not finished`;
  }
  return "Use a domain you already own";
}

function statusLabel(status: CustomDomainStatus) {
  const labels: Record<CustomDomainStatus, string> = {
    active: "Live",
    checkout_pending: "Checkout pending",
    error: "Needs attention",
    not_configured: "Not connected",
    pending_dns: "Waiting for DNS",
    provisioning: "Connecting",
  };
  return labels[status];
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isCustomDomainStatus(value: unknown): value is CustomDomainStatus {
  return [
    "not_configured",
    "checkout_pending",
    "provisioning",
    "pending_dns",
    "active",
    "error",
  ].includes(String(value));
}
