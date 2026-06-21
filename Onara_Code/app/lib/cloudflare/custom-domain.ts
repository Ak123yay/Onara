import type { CustomDomainStatus } from "@/lib/custom-domain";

type CloudflareDomainRecord = {
  name: string;
  status: string;
  validation_data?: {
    error_message?: string;
    method?: string;
    status?: string;
    txt_name?: string;
    txt_value?: string;
  };
  verification_data?: {
    error_message?: string;
    status?: string;
  };
};

type CloudflarePayload = {
  errors?: Array<{ message?: string }>;
  result?: unknown;
  success?: boolean;
};

export type CustomDomainProvisioningResult = {
  error: string | null;
  status: CustomDomainStatus;
  validation: Record<string, unknown>;
};

export async function ensureCloudflareCustomDomain(
  projectName: string,
  domain: string,
): Promise<CustomDomainProvisioningResult> {
  const path = domainPath(projectName, domain);
  let record = await cloudflareRequest(path, { method: "GET" }, true);

  if (!record) {
    record = await cloudflareRequest(
      `/pages/projects/${encodeURIComponent(projectName)}/domains`,
      {
        body: JSON.stringify({ name: domain }),
        headers: { "content-type": "application/json" },
        method: "POST",
      },
    );
  }

  if (!record) {
    throw new Error("Cloudflare did not return a domain record.");
  }

  return provisioningResult(record, projectName);
}

function provisioningResult(
  payload: Record<string, unknown>,
  projectName: string,
): CustomDomainProvisioningResult {
  const record = payload as CloudflareDomainRecord;
  const cloudflareStatus = stringValue(record.status) ?? "pending";
  const validationStatus = stringValue(record.validation_data?.status);
  const verificationStatus = stringValue(record.verification_data?.status);
  const error = stringValue(record.validation_data?.error_message)
    ?? stringValue(record.verification_data?.error_message);

  return {
    error,
    status: mapCloudflareStatus(cloudflareStatus, error),
    validation: {
      checked_at: new Date().toISOString(),
      cloudflare_status: cloudflareStatus,
      cname_target: `${projectName}.pages.dev`,
      validation_method: stringValue(record.validation_data?.method),
      validation_status: validationStatus,
      verification_status: verificationStatus,
      txt_name: stringValue(record.validation_data?.txt_name),
      txt_value: stringValue(record.validation_data?.txt_value),
    },
  };
}

function mapCloudflareStatus(status: string, error: string | null): CustomDomainStatus {
  if (status === "active") {
    return "active";
  }

  if (error || ["blocked", "deactivated", "error"].includes(status)) {
    return "error";
  }

  return "pending_dns";
}

async function cloudflareRequest(
  path: string,
  init: RequestInit,
  allowNotFound = false,
): Promise<Record<string, unknown> | null> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
  const apiToken = process.env.CLOUDFLARE_API_TOKEN?.trim();
  if (!accountId || !apiToken) {
    throw new Error("Cloudflare custom-domain setup is not configured.");
  }

  const apiUrl = (process.env.CLOUDFLARE_API_URL || "https://api.cloudflare.com/client/v4").replace(/\/+$/, "");
  const headers = new Headers(init.headers);
  headers.set("authorization", `Bearer ${apiToken}`);

  const response = await fetch(
    `${apiUrl}/accounts/${encodeURIComponent(accountId)}${path}`,
    { ...init, cache: "no-store", headers },
  );

  if (allowNotFound && response.status === 404) {
    return null;
  }

  const payload = (await response.json().catch(() => null)) as CloudflarePayload | null;
  if (!response.ok || payload?.success === false || !isPlainObject(payload?.result)) {
    throw new Error(cloudflareError(payload) ?? `Cloudflare domain request failed with ${response.status}.`);
  }

  return payload.result;
}

function domainPath(projectName: string, domain: string) {
  return `/pages/projects/${encodeURIComponent(projectName)}/domains/${encodeURIComponent(domain)}`;
}

function cloudflareError(payload: CloudflarePayload | null) {
  if (!payload?.errors?.length) {
    return null;
  }

  return payload.errors.map((error) => error.message).filter(Boolean).join("; ");
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
