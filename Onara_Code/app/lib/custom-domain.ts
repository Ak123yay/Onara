export type CustomDomainStatus =
  | "not_configured"
  | "checkout_pending"
  | "provisioning"
  | "pending_dns"
  | "active"
  | "error";

const HOSTNAME_RE = /^(?=.{4,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;

export function normalizeCustomDomain(value: unknown): string {
  if (typeof value !== "string") {
    throw new Error("Enter a domain name.");
  }

  const input = value.trim().toLowerCase();
  if (!input) {
    throw new Error("Enter a domain name.");
  }

  let url: URL;
  try {
    url = new URL(input.includes("://") ? input : `https://${input}`);
  } catch {
    throw new Error("Enter a valid domain such as www.yourbusiness.com.");
  }

  if ((url.pathname && url.pathname !== "/") || url.search || url.hash || url.port) {
    throw new Error("Enter only the domain name, without a path, port, query, or fragment.");
  }

  const hostname = url.hostname.replace(/\.$/, "");
  if (!HOSTNAME_RE.test(hostname) || hostname.includes("..")) {
    throw new Error("Enter a valid public domain such as www.yourbusiness.com.");
  }

  if (
    hostname === "onara.tech"
    || hostname.endsWith(".onara.tech")
    || hostname.endsWith(".pages.dev")
  ) {
    throw new Error("Use a domain you own, not an Onara or Cloudflare Pages address.");
  }

  return hostname;
}

export function customDomainFeatureEnabled() {
  const value = process.env.FEATURE_CUSTOM_DOMAIN?.trim().toLowerCase();
  return value !== "false" && value !== "0" && value !== "off";
}
