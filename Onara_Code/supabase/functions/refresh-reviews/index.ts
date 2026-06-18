import { jsonResponse, requireBearerSecret, requireMethod } from "../_shared/http.ts";
import { createServiceClient } from "../_shared/supabase.ts";

type RefreshPayload = {
  dry_run?: unknown;
  limit?: unknown;
  project_id?: unknown;
};

type ProjectRecord = {
  business_name: string;
  cloudflare_project_name: string | null;
  google_place_id: string | null;
  google_rating: number | string | null;
  google_review_count: number | null;
  id: string;
  public_url: string | null;
};

type GooglePlaceDetails = {
  googleMapsUri?: unknown;
  id?: unknown;
  rating?: unknown;
  userRatingCount?: unknown;
};

type ReviewDetails = {
  googleMapsUri: string | null;
  rating: number;
  reviewCount: number;
};

type RefreshResult = {
  changed: boolean;
  deployed: boolean;
  project_id: string;
  rating: number;
  review_count: number;
};

const GOOGLE_PLACE_DETAILS_URL = "https://places.googleapis.com/v1";
const GOOGLE_PLACE_FIELD_MASK = "id,rating,userRatingCount,googleMapsUri";
const MIN_BADGE_REVIEWS = 3;

Deno.serve(async (request) => {
  const methodError = requireMethod(request, "POST");
  if (methodError) return methodError;

  const cronSecret = Deno.env.get("CRON_SECRET") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const authError = requireBearerSecret(request, cronSecret);
  if (authError) return authError;

  if ((Deno.env.get("FEATURE_REVIEWS_BADGE") ?? "").toLowerCase() !== "true") {
    return jsonResponse({ ok: true, disabled: true, reason: "FEATURE_REVIEWS_BADGE is not true" });
  }

  const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY")?.trim();
  if (!apiKey) {
    return jsonResponse({ error: "missing_google_places_api_key" }, 500);
  }

  const payload = await readPayload(request);
  const projectId = stringValue(payload.project_id);
  if (projectId && !isUuid(projectId)) {
    return jsonResponse({ error: "invalid_project_id" }, 400);
  }

  const limit = clampInt(payload.limit, 1, 100, 50);
  const dryRun = payload.dry_run === true;
  const supabase = createServiceClient();
  let query = supabase
    .from("projects")
    .select("id, business_name, google_place_id, google_rating, google_review_count, public_url, cloudflare_project_name")
    .eq("status", "live")
    .not("google_place_id", "is", null)
    .order("updated_at", { ascending: true })
    .limit(limit);

  if (projectId) {
    query = query.eq("id", projectId);
  }

  const { data, error } = await query;
  if (error) {
    return jsonResponse({ error: "project_lookup_failed", detail: error.message }, 500);
  }

  const projects = (data ?? []) as ProjectRecord[];
  const results: RefreshResult[] = [];
  const failures: Array<{ error: string; project_id: string }> = [];

  for (const project of projects) {
    try {
      results.push(await refreshProject({ apiKey, dryRun, project, supabase }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown_refresh_error";
      failures.push({ error: message, project_id: project.id });
      await supabase
        .from("projects")
        .update({
          google_reviews_refresh_error: message.slice(0, 500),
          updated_at: new Date().toISOString(),
        })
        .eq("id", project.id);
    }
  }

  return jsonResponse({
    dry_run: dryRun,
    failures,
    ok: failures.length === 0,
    projects_checked: projects.length,
    projects_deployed: results.filter((result) => result.deployed).length,
    projects_updated: results.length,
    results,
  });
});

async function refreshProject({
  apiKey,
  dryRun,
  project,
  supabase,
}: {
  apiKey: string;
  dryRun: boolean;
  project: ProjectRecord;
  supabase: ReturnType<typeof createServiceClient>;
}): Promise<RefreshResult> {
  const placeId = stringValue(project.google_place_id);
  if (!placeId) {
    throw new Error("project_missing_google_place_id");
  }

  const reviews = await fetchReviewDetails(placeId, apiKey);
  const patch = await patchAndDeployLiveHtml({ dryRun, project, reviews });
  const now = new Date().toISOString();

  if (!dryRun) {
    const updatePayload: Record<string, unknown> = {
      google_rating: reviews.rating,
      google_review_count: reviews.reviewCount,
      google_reviews_refresh_error: null,
      google_reviews_refreshed_at: now,
      updated_at: now,
    };

    if (patch.deployed) {
      updatePayload.last_deployed_at = now;
    }

    const { error } = await supabase
      .from("projects")
      .update(updatePayload)
      .eq("id", project.id);

    if (error) {
      throw new Error(`project_update_failed:${error.message}`);
    }
  }

  return {
    changed: patch.changed,
    deployed: patch.deployed,
    project_id: project.id,
    rating: reviews.rating,
    review_count: reviews.reviewCount,
  };
}

async function fetchReviewDetails(placeId: string, apiKey: string): Promise<ReviewDetails> {
  const response = await fetch(`${GOOGLE_PLACE_DETAILS_URL}/${placeResourceName(placeId)}`, {
    headers: {
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": GOOGLE_PLACE_FIELD_MASK,
    },
  });
  const responseText = await response.text();
  const rawPayload = parseJsonObject(responseText);
  const payload = rawPayload as GooglePlaceDetails | null;

  if (!response.ok) {
    const message = googleErrorMessage(rawPayload) ?? responseText;
    throw new Error(`google_places_failed:${response.status}:${message.slice(0, 180)}`);
  }

  const rating = ratingValue(payload?.rating);
  const reviewCount = intValue(payload?.userRatingCount);
  if (rating === null || reviewCount === null) {
    throw new Error("google_places_missing_reviews");
  }

  return {
    googleMapsUri: typeof payload?.googleMapsUri === "string" ? payload.googleMapsUri : null,
    rating,
    reviewCount,
  };
}

async function patchAndDeployLiveHtml({
  dryRun,
  project,
  reviews,
}: {
  dryRun: boolean;
  project: ProjectRecord;
  reviews: ReviewDetails;
}): Promise<{ changed: boolean; deployed: boolean }> {
  const publicUrl = stringValue(project.public_url);
  if (!publicUrl) {
    return { changed: false, deployed: false };
  }

  const response = await fetch(publicUrl, { headers: { accept: "text/html" } });
  if (!response.ok) {
    throw new Error(`live_html_fetch_failed:${response.status}`);
  }

  const currentHtml = await response.text();
  const nextHtml = patchReviewsHtml(currentHtml, project, reviews);
  const changed = nextHtml !== currentHtml;
  if (!changed || dryRun) {
    return { changed, deployed: false };
  }

  const projectName = cloudflareProjectName(project);
  if (!projectName) {
    throw new Error("cloudflare_project_name_unavailable");
  }

  await deployIndexHtml(projectName, nextHtml);
  return { changed: true, deployed: true };
}

function patchReviewsHtml(html: string, project: ProjectRecord, reviews: ReviewDetails): string {
  let nextHtml = reviews.reviewCount >= MIN_BADGE_REVIEWS
    ? upsertReviewsBadge(html, project, reviews)
    : removeReviewsBadge(html);

  nextHtml = updateAggregateRatingJsonLd(nextHtml, reviews);
  return nextHtml;
}

function upsertReviewsBadge(html: string, project: ProjectRecord, reviews: ReviewDetails): string {
  const badge = reviewsBadgeMarkup(project, reviews);
  const pattern = /<a\b[^>]*data-onara-review-badge[^>]*>[\s\S]*?<\/a>|<div\b[^>]*data-onara-review-badge[^>]*>[\s\S]*?<\/div>/i;

  if (pattern.test(html)) {
    return ensureReviewsBadgeStyle(html.replace(pattern, badge));
  }

  const h1Match = html.match(/<h1\b/i);
  if (h1Match?.index !== undefined) {
    const updated = `${html.slice(0, h1Match.index)}${badge}\n${html.slice(h1Match.index)}`;
    return ensureReviewsBadgeStyle(updated);
  }

  const bodyMatch = html.match(/<body\b[^>]*>/i);
  if (bodyMatch?.index !== undefined) {
    const insertAt = bodyMatch.index + bodyMatch[0].length;
    const updated = `${html.slice(0, insertAt)}\n${badge}${html.slice(insertAt)}`;
    return ensureReviewsBadgeStyle(updated);
  }

  return html;
}

function removeReviewsBadge(html: string): string {
  return html.replace(
    /\s*(?:<a\b[^>]*data-onara-review-badge[^>]*>[\s\S]*?<\/a>|<div\b[^>]*data-onara-review-badge[^>]*>[\s\S]*?<\/div>)/i,
    "",
  );
}

function reviewsBadgeMarkup(project: ProjectRecord, reviews: ReviewDetails): string {
  const ratingText = reviews.rating.toFixed(1).replace(/\.0$/, "");
  const countText = reviews.reviewCount.toLocaleString("en-US");
  const href = reviews.googleMapsUri ?? googleMapsUrl(project);

  return [
    `<a class="onara-review-badge" data-onara-review-badge data-onara-rating="${escapeHtml(ratingText)}" data-onara-review-count="${reviews.reviewCount}" href="${escapeHtml(href)}" target="_blank" rel="noopener">`,
    `<span class="onara-review-badge-star" aria-hidden="true">&#9733;</span>`,
    `<strong>${escapeHtml(ratingText)}</strong>`,
    `<span>${escapeHtml(countText)} Google reviews</span>`,
    `</a>`,
  ].join("");
}

function ensureReviewsBadgeStyle(html: string): string {
  if (html.includes("onara-review-badge-style")) {
    return html;
  }

  const style = `<style id="onara-review-badge-style">
  .onara-review-badge{display:inline-flex;align-items:center;gap:.42rem;width:fit-content;margin:0 0 .85rem;border:1px solid rgba(194,84,31,.24);border-radius:2px;background:rgba(255,248,239,.88);color:#1a1a1a;font:600 .9rem/1 Inter,ui-sans-serif,system-ui,sans-serif;padding:.48rem .65rem;text-decoration:none}
  .onara-review-badge-star{color:#c2541f;font-size:.95rem;line-height:1}
  .onara-review-badge strong{font-weight:800}
  .onara-review-badge span:last-child{color:#5f5a52;font-weight:600}
</style>`;

  return html.replace(/<\/head>/i, `${style}\n</head>`);
}

function updateAggregateRatingJsonLd(html: string, reviews: ReviewDetails): string {
  return html.replace(
    /<script\b(?=[^>]*type=["']application\/ld\+json["'][^>]*)[^>]*>([\s\S]*?)<\/script>/gi,
    (script, rawJson) => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(String(rawJson).trim());
      } catch {
        return script;
      }

      const changed = updateAggregateRatingNode(parsed, reviews);
      if (!changed) {
        return script;
      }

      const json = JSON.stringify(parsed, null, 2).replace(/<\/script/gi, "<\\/script");
      return `<script type="application/ld+json">\n${json}\n</script>`;
    },
  );
}

function updateAggregateRatingNode(value: unknown, reviews: ReviewDetails): boolean {
  if (Array.isArray(value)) {
    return value.map((item) => updateAggregateRatingNode(item, reviews)).some(Boolean);
  }

  if (!isRecord(value)) {
    return false;
  }

  let changed = false;
  if (isRecord(value.aggregateRating)) {
    value.aggregateRating.ratingValue = reviews.rating;
    value.aggregateRating.reviewCount = reviews.reviewCount;
    changed = true;
  }

  for (const child of Object.values(value)) {
    if (child !== value.aggregateRating && updateAggregateRatingNode(child, reviews)) {
      changed = true;
    }
  }

  return changed;
}

async function deployIndexHtml(projectName: string, html: string): Promise<void> {
  await ensureCloudflareProject(projectName);

  const body = new FormData();
  body.append("file", new Blob([html], { type: "text/html;charset=utf-8" }), "index.html");

  await cloudflareRequest(`/pages/projects/${encodeURIComponent(projectName)}/deployments`, {
    body,
    method: "POST",
  });
}

async function ensureCloudflareProject(projectName: string): Promise<void> {
  const existing = await cloudflareRequest(
    `/pages/projects/${encodeURIComponent(projectName)}`,
    { method: "GET" },
    { allowNotFound: true },
  );

  if (existing !== null) {
    return;
  }

  await cloudflareRequest("/pages/projects", {
    body: JSON.stringify({
      name: projectName,
      production_branch: Deno.env.get("CLOUDFLARE_PAGES_BRANCH") || "main",
    }),
    headers: { "content-type": "application/json" },
    method: "POST",
  });
}

async function cloudflareRequest(
  path: string,
  init: RequestInit,
  options: { allowNotFound?: boolean } = {},
): Promise<Record<string, unknown> | null> {
  const accountId = Deno.env.get("CLOUDFLARE_ACCOUNT_ID")?.trim();
  const apiToken = Deno.env.get("CLOUDFLARE_API_TOKEN")?.trim();
  if (!accountId || !apiToken) {
    throw new Error("missing_cloudflare_reviews_refresh_env");
  }

  const apiUrl = (Deno.env.get("CLOUDFLARE_API_URL") || "https://api.cloudflare.com/client/v4").replace(/\/+$/, "");
  const headers = new Headers(init.headers);
  headers.set("authorization", `Bearer ${apiToken}`);

  const response = await fetch(`${apiUrl}/accounts/${encodeURIComponent(accountId)}${path}`, {
    ...init,
    headers,
  });

  if (options.allowNotFound && response.status === 404) {
    return null;
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok || !cloudflareSucceeded(payload)) {
    throw new Error(cloudflareErrorMessage(payload) ?? `cloudflare_request_failed:${response.status}`);
  }

  return isRecord(payload) && isRecord(payload.result) ? payload.result : {};
}

function placeResourceName(placeId: string): string {
  const normalized = placeId.trim().replace(/^\/+|\/+$/g, "");
  if (normalized.startsWith("places/")) {
    return normalized.split("/").map(encodeURIComponent).join("/");
  }

  return `places/${encodeURIComponent(normalized)}`;
}

function googleMapsUrl(project: ProjectRecord): string {
  const query = encodeURIComponent(project.business_name || "Google Business Profile");
  const placeId = encodeURIComponent(stringValue(project.google_place_id));
  return placeId
    ? `https://www.google.com/maps/search/?api=1&query=${query}&query_place_id=${placeId}`
    : `https://www.google.com/maps/search/?api=1&query=${query}`;
}

function cloudflareProjectName(project: ProjectRecord): string | null {
  return normalizedProjectName(project.cloudflare_project_name)
    ?? projectNameFromPagesUrl(project.public_url)
    ?? cloudflareProjectNameFromId(project.id);
}

function cloudflareProjectNameFromId(projectId: string): string | null {
  const prefix = safeSlug(Deno.env.get("CLOUDFLARE_PAGES_PROJECT_PREFIX") || "onara-site", "onara-site");
  const cleanId = safeSlug(projectId, "site");
  const maxLength = 28;
  const suffixLength = Math.max(1, maxLength - prefix.length - 1);
  return `${prefix}-${cleanId.slice(0, suffixLength)}`.replace(/-+$/g, "") || null;
}

function projectNameFromPagesUrl(value: string | null): string | null {
  if (!value) {
    return null;
  }

  let hostname: string;
  try {
    hostname = new URL(value).hostname;
  } catch {
    return null;
  }

  if (!hostname.endsWith(".pages.dev")) {
    return null;
  }

  const parts = hostname.split(".");
  const projectName = parts.length >= 4 ? parts[parts.length - 3] : parts[0];
  return normalizedProjectName(projectName);
}

function normalizedProjectName(value: string | null): string | null {
  const text = value?.trim();
  if (!text || !/^[a-z0-9][a-z0-9-]{0,62}$/i.test(text)) {
    return null;
  }

  return text;
}

function cloudflareSucceeded(payload: unknown): boolean {
  return isRecord(payload) && payload.success !== false;
}

function cloudflareErrorMessage(payload: unknown): string | null {
  if (!isRecord(payload) || !Array.isArray(payload.errors) || payload.errors.length === 0) {
    return null;
  }

  return payload.errors
    .map((error) => (isRecord(error) && typeof error.message === "string" ? error.message : null))
    .filter(Boolean)
    .join("; ");
}

async function readPayload(request: Request): Promise<RefreshPayload> {
  try {
    const payload: unknown = await request.json();
    return isRecord(payload) ? payload : {};
  } catch {
    return {};
  }
}

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const parsed = intValue(value);
  if (parsed === null) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function ratingValue(value: unknown): number | null {
  const rating = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(rating) || rating < 0 || rating > 5) {
    return null;
  }

  return Math.round(rating * 10) / 10;
}

function intValue(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function safeSlug(value: string, fallback: string): string {
  return value.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "").replace(/-{2,}/g, "-") || fallback;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i.test(value);
}

function parseJsonObject(value: string): Record<string, unknown> | null {
  try {
    const parsed: unknown = JSON.parse(value);
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function googleErrorMessage(payload: Record<string, unknown> | null): string | null {
  const error = isRecord(payload?.error) ? payload.error : null;
  return typeof error?.message === "string" ? error.message : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
