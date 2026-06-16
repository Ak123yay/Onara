export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type PipelineStatusResponse = {
  cloudflare_deployment_url?: string | null;
  error_message?: string | null;
  job_id: string;
  status: "queued" | "running" | "completed" | "failed";
};

type PipelineStatusError = {
  error: string;
  message: string;
  statusCode: number;
};

const JOB_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const GENERATED_SITE_CSP = [
  "sandbox allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation",
  "default-src 'self' https: data: blob:",
  "img-src https: data: blob:",
  "style-src 'unsafe-inline' https:",
  "font-src https: data:",
  "connect-src 'none'",
  "script-src 'none'",
  "base-uri 'none'",
  "form-action 'self' https:",
].join("; ");

export async function GET(
  _request: Request,
  context: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await context.params;

  if (!isValidJobId(jobId)) {
    return new Response("Site not found.", { status: 404 });
  }

  const status = await fetchPipelineStatus(jobId);

  if ("error" in status) {
    return new Response(status.message, { status: status.statusCode });
  }

  if (status.status !== "completed") {
    return Response.redirect(`${appBaseUrl()}/dashboard/build/progress?jobId=${encodeURIComponent(jobId)}`, 307);
  }

  const deploymentUrl = status.cloudflare_deployment_url;

  if (!deploymentUrl || !isSafePagesUrl(deploymentUrl)) {
    return new Response("Site is not deployed yet.", { status: 404 });
  }

  const deployment = await fetch(deploymentUrl, {
    cache: "no-store",
  });

  if (!deployment.ok) {
    return new Response("Generated site is temporarily unavailable.", { status: 502 });
  }

  const html = await deployment.text();

  return new Response(html, {
    headers: {
      "Cache-Control": "public, max-age=60, s-maxage=300",
      "Content-Security-Policy": GENERATED_SITE_CSP,
      "Content-Type": "text/html; charset=utf-8",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

async function fetchPipelineStatus(jobId: string): Promise<PipelineStatusResponse | PipelineStatusError> {
  const pipelineServerUrl = process.env.PIPELINE_SERVER_URL?.replace(/\/+$/, "");
  const pipelineSecret = process.env.PIPELINE_API_SECRET;

  if (!pipelineServerUrl || !pipelineSecret) {
    return {
      error: "pipeline_not_configured",
      message: "Public site lookup is not configured.",
      statusCode: 500,
    };
  }

  try {
    const response = await fetch(`${pipelineServerUrl}/pipeline/status/${encodeURIComponent(jobId)}`, {
      cache: "no-store",
      headers: {
        "X-Pipeline-Secret": pipelineSecret,
      },
    });
    const body = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        error: "pipeline_status_failed",
        message: errorMessageFromBody(body) || "Site not found.",
        statusCode: response.status === 404 ? 404 : 502,
      };
    }

    return body as PipelineStatusResponse;
  } catch {
    return {
      error: "pipeline_unavailable",
      message: "Public site lookup is unavailable.",
      statusCode: 503,
    };
  }
}

function appBaseUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "https://onara.tech").replace(/\/+$/, "");
}

function errorMessageFromBody(body: unknown) {
  if (typeof body === "object" && body !== null) {
    const record = body as Record<string, unknown>;

    if (typeof record.message === "string") {
      return record.message;
    }

    if (typeof record.detail === "string") {
      return record.detail;
    }
  }

  return null;
}

function isSafePagesUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname.endsWith(".pages.dev");
  } catch {
    return false;
  }
}

function isValidJobId(value: string) {
  return JOB_ID_RE.test(value);
}
