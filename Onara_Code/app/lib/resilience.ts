export type DegradedService =
  | "cloudflare"
  | "github"
  | "google_places"
  | "pipeline"
  | "resend"
  | "stripe"
  | "supabase";

export type ServiceDegradation = {
  degraded: true;
  message: string;
  retryable: boolean;
  service: DegradedService;
};

export function serviceDegradation(
  service: DegradedService,
  message: string,
  retryable = true,
): ServiceDegradation {
  return {
    degraded: true,
    message,
    retryable,
    service,
  };
}

export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs = 8_000,
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const upstreamSignal = init.signal;
  const abortFromUpstream = () => controller.abort();

  if (upstreamSignal) {
    if (upstreamSignal.aborted) {
      controller.abort();
    } else {
      upstreamSignal.addEventListener("abort", abortFromUpstream, { once: true });
    }
  }

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
    upstreamSignal?.removeEventListener("abort", abortFromUpstream);
  }
}

export function publicServiceError(service: DegradedService) {
  switch (service) {
    case "google_places":
      return "Google business search is temporarily unavailable. Enter the business manually to continue.";
    case "pipeline":
      return "Website generation is temporarily unavailable. Your details are still here, so try again shortly.";
    case "stripe":
      return "Secure checkout is temporarily unavailable. No payment or plan change was made.";
    case "supabase":
      return "Your saved workspace could not be loaded. Refresh shortly; no account data was changed.";
    case "cloudflare":
      return "The site host is temporarily unavailable. The project remains saved and can be retried.";
    case "github":
      return "The code backup is temporarily unavailable. The live project remains unchanged.";
    case "resend":
      return "Email delivery is delayed. The submitted information remains saved.";
  }
}

export function requestErrorMessage(error: unknown, fallback: string) {
  if (isAbortError(error)) {
    return fallback;
  }

  return error instanceof Error && error.message.trim() ? error.message : fallback;
}

function isAbortError(error: unknown) {
  return typeof error === "object"
    && error !== null
    && "name" in error
    && error.name === "AbortError";
}
