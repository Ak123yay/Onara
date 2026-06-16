import {
  AlertTriangle,
  ArrowRight,
  Brain,
  ExternalLink,
  Eye,
  Globe2,
  Hammer,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CopyLinkButton } from "@/components/dashboard/CopyLinkButton";
import { DeleteSiteButton } from "@/components/dashboard/DeleteSiteButton";
import { createClient } from "@/lib/supabase/server";

type ProjectStatus = "queued" | "generating" | "deploying" | "live" | "failed" | "suspended";
type PlanType = "free" | "starter" | "pro";

type Project = {
  business_address: string | null;
  business_category: string | null;
  business_name: string;
  created_at: string;
  custom_domain: string | null;
  error_message: string | null;
  generation_ms: number | null;
  google_rating: number | string | null;
  google_review_count: number | null;
  id: string;
  last_deployed_at: string | null;
  pipeline_job_id: string | null;
  public_url: string | null;
  status: ProjectStatus;
  updated_at: string;
};

type Profile = {
  full_name: string | null;
  is_trial: boolean;
  plan: PlanType;
  revisions_limit: number;
  revisions_used: number;
  show_url: boolean;
};

type DashboardBrief = {
  generated_on: string;
  headline: string;
  model?: string | null;
  provider?: string | null;
  recommendations: string[];
  source: "ai" | "cached" | "fallback";
  summary: string;
};

type DashboardBriefCacheRow = {
  dashboard_brief: unknown;
  dashboard_brief_generated_on: string | null;
};

type DashboardAuthUser = {
  email?: string | null;
  user_metadata?: {
    full_name?: unknown;
    name?: unknown;
  };
};

const statusMeta: Record<
  ProjectStatus,
  {
    label: string;
    tone: "neutral" | "success" | "warning" | "danger";
  }
> = {
  queued: { label: "Queued", tone: "neutral" },
  generating: { label: "Building", tone: "warning" },
  deploying: { label: "Deploying", tone: "warning" },
  live: { label: "Live", tone: "success" },
  failed: { label: "Failed", tone: "danger" },
  suspended: { label: "Paused", tone: "neutral" },
};

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "Not deployed yet";
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatDuration(value: number | null | undefined) {
  if (!value) {
    return "Not built yet";
  }

  const seconds = Math.max(1, Math.round(value / 1000));

  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
}

function formatUrl(url: string | null, showUrl: boolean) {
  if (!showUrl) {
    return "Public URL hidden on free plan";
  }

  if (!url) {
    return "URL reserved after deploy";
  }

  return url.replace(/^https?:\/\//, "");
}

function externalHref(url: string | null) {
  if (!url) {
    return null;
  }

  return url.startsWith("http") ? url : `https://${url}`;
}

function statusDetail(status: ProjectStatus) {
  if (status === "live") {
    return "Public";
  }

  if (status === "failed") {
    return "Needs retry";
  }

  if (status === "queued" || status === "generating" || status === "deploying") {
    return "In progress";
  }

  return "Hidden";
}

function formatRating(value: number | string | null) {
  if (value === null) {
    return null;
  }

  const rating = Number(value);

  if (!Number.isFinite(rating)) {
    return null;
  }

  return rating.toFixed(1);
}

function revisionLabel(profile: Profile | null) {
  if (!profile) {
    return "0/3";
  }

  if (profile.revisions_limit === -1) {
    return `${profile.revisions_used}/unlimited`;
  }

  return `${profile.revisions_used}/${profile.revisions_limit}`;
}

function revisionMetric(profile: Profile | null) {
  if (!profile) {
    return { caption: "this month", value: "0/3" };
  }

  if (profile.revisions_limit === -1) {
    return {
      caption: "unlimited revisions",
      value: String(profile.revisions_used),
    };
  }

  return {
    caption: "this month",
    value: `${profile.revisions_used}/${profile.revisions_limit}`,
  };
}

function displayNameFor(profile: Profile | null, user: DashboardAuthUser) {
  const metadataName =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : typeof user.user_metadata?.name === "string"
        ? user.user_metadata.name
        : "";

  return profile?.full_name ?? metadataName ?? user.email?.split("@")[0] ?? "there";
}

function todayKey() {
  return new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "America/New_York",
    year: "numeric",
  }).format(new Date());
}

function normalizeDashboardBrief(
  value: unknown,
  generatedOn: string | null,
  defaultSource: DashboardBrief["source"] = "cached",
): DashboardBrief | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const record = value as Record<string, unknown>;
  const headline = typeof record.headline === "string" ? record.headline.trim() : "";
  const summary = typeof record.summary === "string" ? record.summary.trim() : "";
  const recommendations = Array.isArray(record.recommendations)
    ? record.recommendations.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean)
    : [];

  if (!headline || !summary) {
    return null;
  }

  const source = record.source === "ai" || record.source === "fallback" || record.source === "cached"
    ? record.source
    : defaultSource;

  return {
    generated_on:
      typeof record.generated_on === "string" && record.generated_on.trim()
        ? record.generated_on.trim()
        : generatedOn ?? todayKey(),
    headline,
    model: typeof record.model === "string" ? record.model : null,
    provider: typeof record.provider === "string" ? record.provider : null,
    recommendations: recommendations.slice(0, 3),
    source,
    summary,
  };
}

async function loadDashboardBriefCache(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<DashboardBriefCacheRow | null> {
  const { data, error } = await supabase
    .from("users")
    .select("dashboard_brief, dashboard_brief_generated_on")
    .eq("id", userId)
    .maybeSingle<DashboardBriefCacheRow>();

  if (error) {
    return null;
  }

  return data;
}

async function cacheDashboardBrief(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  brief: DashboardBrief,
) {
  await supabase
    .from("users")
    .update({
      dashboard_brief: {
        generated_on: brief.generated_on,
        headline: brief.headline,
        model: brief.model ?? null,
        provider: brief.provider ?? null,
        recommendations: brief.recommendations,
        source: brief.source,
        summary: brief.summary,
      },
      dashboard_brief_generated_on: brief.generated_on,
    })
    .eq("id", userId);
}

async function getDashboardBrief({
  activeBuilds,
  failedCount,
  liveCount,
  profile,
  projectList,
  supabase,
  userId,
}: {
  activeBuilds: number;
  failedCount: number;
  liveCount: number;
  profile: Profile | null;
  projectList: Project[];
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
}): Promise<DashboardBrief> {
  const today = todayKey();
  const cachedRow = await loadDashboardBriefCache(supabase, userId);
  const cachedBrief = normalizeDashboardBrief(
    cachedRow?.dashboard_brief,
    cachedRow?.dashboard_brief_generated_on ?? null,
  );

  if (cachedBrief && cachedRow?.dashboard_brief_generated_on === today) {
    return cachedBrief;
  }

  const generatedBrief = await requestDashboardBrief({
    activeBuilds,
    failedCount,
    liveCount,
    profile,
    projectList,
    today,
  });

  await cacheDashboardBrief(supabase, userId, generatedBrief);

  return generatedBrief;
}

async function requestDashboardBrief({
  activeBuilds,
  failedCount,
  liveCount,
  profile,
  projectList,
  today,
}: {
  activeBuilds: number;
  failedCount: number;
  liveCount: number;
  profile: Profile | null;
  projectList: Project[];
  today: string;
}): Promise<DashboardBrief> {
  const pipelineServerUrl = process.env.PIPELINE_SERVER_URL?.replace(/\/+$/, "");
  const pipelineSecret = process.env.PIPELINE_API_SECRET;

  if (!pipelineServerUrl || !pipelineSecret) {
    return fallbackDashboardBrief({ activeBuilds, failedCount, liveCount, projectList, today, profile });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);

  try {
    const response = await fetch(`${pipelineServerUrl}/dashboard/brief`, {
      body: JSON.stringify({
        active_build_count: activeBuilds,
        failed_count: failedCount,
        is_trial: profile?.is_trial ?? false,
        live_count: liveCount,
        projects: projectList.slice(0, 25).map((project) => ({
          business_category: project.business_category,
          business_name: project.business_name,
          custom_domain: project.custom_domain,
          error_message: project.error_message,
          google_rating: project.google_rating,
          google_review_count: project.google_review_count,
          last_deployed_at: project.last_deployed_at,
          public_url: project.public_url,
          status: project.status,
          updated_at: project.updated_at,
        })),
        revisions_label: revisionLabel(profile),
        today,
        total_count: projectList.length,
        user_plan: profile?.plan ?? "free",
      }),
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        "X-Pipeline-Secret": pipelineSecret,
      },
      method: "POST",
      signal: controller.signal,
    });

    if (!response.ok) {
      return fallbackDashboardBrief({ activeBuilds, failedCount, liveCount, projectList, today, profile });
    }

    const payload = (await response.json()) as unknown;
    const brief = normalizeDashboardBrief(payload, today, "ai");

    if (!brief) {
      return fallbackDashboardBrief({ activeBuilds, failedCount, liveCount, projectList, today, profile });
    }

    return {
      ...brief,
      generated_on: today,
    };
  } catch {
    return fallbackDashboardBrief({ activeBuilds, failedCount, liveCount, projectList, today, profile });
  } finally {
    clearTimeout(timeout);
  }
}

function fallbackDashboardBrief({
  activeBuilds,
  failedCount,
  liveCount,
  profile,
  projectList,
  today,
}: {
  activeBuilds: number;
  failedCount: number;
  liveCount: number;
  profile: Profile | null;
  projectList: Project[];
  today: string;
}): DashboardBrief {
  const liveSites = projectList.filter((project) => project.status === "live" && project.public_url);
  const liveNames = liveSites.map((project) => project.business_name).slice(0, 3).join(", ");
  const headline = liveCount > 0
    ? `${liveCount} site${liveCount === 1 ? " is" : "s are"} deployed`
    : activeBuilds > 0
      ? "Builds are still running"
      : failedCount > 0
        ? "A build needs attention"
        : "No deployed sites yet";
  const summary = liveSites.length > 0
    ? `Live today: ${liveNames}. Keep checking public links, phone CTAs, and business details before sharing.`
    : activeBuilds > 0
      ? "At least one site is still moving through generation. Come back from the dashboard to resume live status."
      : failedCount > 0
        ? "No site is deployed yet because a build needs attention. Open the failed draft and retry after the blocker is fixed."
        : "Start by searching a Google Business Profile, confirming the imported details, and generating the first draft.";

  return {
    generated_on: today,
    headline,
    recommendations: fallbackRecommendations({ activeBuilds, failedCount, liveSites, profile }),
    source: "fallback",
    summary,
  };
}

function fallbackRecommendations({
  activeBuilds,
  failedCount,
  liveSites,
  profile,
}: {
  activeBuilds: number;
  failedCount: number;
  liveSites: Project[];
  profile: Profile | null;
}) {
  const recommendations: string[] = [];

  if (activeBuilds > 0) {
    recommendations.push("Let the active build finish before starting another draft.");
  }

  if (failedCount > 0) {
    recommendations.push("Open the failed build, review the error, and retry once the blocker is fixed.");
  }

  if (liveSites.length > 0) {
    recommendations.push("Open each deployed site and verify the public link, phone CTA, and business details.");
  }

  recommendations.push(`Track revisions before requesting changes; current usage is ${revisionLabel(profile)}.`);

  return recommendations.slice(0, 3);
}

function SiteStatusBadge({ status }: { status: ProjectStatus }) {
  const meta = statusMeta[status];

  return (
    <span className={`site-status site-status-${meta.tone}`}>
      <span className="site-status-dot" aria-hidden="true" />
      {meta.label}
    </span>
  );
}

function SiteThumb({ project }: { project: Project }) {
  const initial = project.business_name.trim().charAt(0).toUpperCase();

  return (
    <div className={`site-thumb site-thumb-${project.status}`}>
      <span>{initial}</span>
      <Globe2 aria-hidden="true" size={16} />
    </div>
  );
}

function SiteCard({ project, showUrl }: { project: Project; showUrl: boolean }) {
  const activeBuild = ["queued", "generating", "deploying"].includes(project.status);
  const resumeHref = activeBuild && project.pipeline_job_id
    ? `/dashboard/build/progress?jobId=${encodeURIComponent(project.pipeline_job_id)}&projectId=${encodeURIComponent(project.id)}`
    : null;
  const copyHref = showUrl ? externalHref(project.public_url) : null;
  const siteHref = project.status === "live" ? copyHref : null;
  const rating = formatRating(project.google_rating);

  return (
    <article className="site-card dashboard-site-row dashboard-site-row-managed hover-lift">
      <SiteThumb project={project} />
      <div className="site-card-main">
        <div className="site-card-title-row">
          <h2>{project.business_name}</h2>
          <SiteStatusBadge status={project.status} />
          {project.custom_domain ? <span className="site-status site-status-neutral">Custom domain</span> : null}
        </div>

        <div className="site-link-panel" aria-label={`Public link for ${project.business_name}`}>
          <Globe2 aria-hidden="true" className="site-link-icon" size={15} />
          <div>
            <span className="mono">Public link</span>
            <p className="site-card-url">{formatUrl(project.public_url, showUrl)}</p>
          </div>
          {copyHref ? <CopyLinkButton label="Copy" value={copyHref} /> : null}
        </div>

        <dl className="site-card-detail-strip">
          <div>
            <dt>Type</dt>
            <dd>{project.business_category ?? "Local contractor"}</dd>
          </div>
          <div>
            <dt>Proof</dt>
            <dd>{rating ? `${rating} / ${project.google_review_count ?? 0} reviews` : "No rating yet"}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>{statusDetail(project.status)}</dd>
          </div>
          <div>
            <dt>Build</dt>
            <dd>{formatDuration(project.generation_ms)}</dd>
          </div>
          <div>
            <dt>Updated</dt>
            <dd>{formatDate(project.updated_at)}</dd>
          </div>
          <div>
            <dt>Deployed</dt>
            <dd>{formatDate(project.last_deployed_at)}</dd>
          </div>
        </dl>

        {project.error_message ? (
          <p className="site-card-error">
            <AlertTriangle aria-hidden="true" size={14} />
            {project.error_message}
          </p>
        ) : null}
      </div>

      <div className="site-card-actions">
        {resumeHref ? (
          <Link className="btn btn-accent btn-sm" href={resumeHref}>
            <Eye aria-hidden="true" size={14} />
            View live build
          </Link>
        ) : (
          <Link className="btn btn-soft btn-sm" href={`/api/preview/${project.id}`} target="_blank">
            <Eye aria-hidden="true" size={14} />
            Preview
          </Link>
        )}
        {siteHref ? (
          <Link className="btn btn-soft btn-sm" href={siteHref} target="_blank">
            <ExternalLink aria-hidden="true" size={14} />
            Visit
          </Link>
        ) : null}
        {project.status === "failed" ? (
          <Link className="btn btn-accent btn-sm" href={`/dashboard/build?retry=${project.id}`}>
            <RefreshCw aria-hidden="true" size={14} />
            Retry
          </Link>
        ) : (
          <button className="btn btn-soft btn-sm" disabled type="button">
            Revise
          </button>
        )}
        <DeleteSiteButton
          businessName={project.business_name}
          disabled={activeBuild}
          disabledReason="This site is still building. Wait until it finishes or fails before deleting it."
          projectId={project.id}
        />
      </div>
    </article>
  );
}

function DashboardBriefCard({ brief }: { brief: DashboardBrief }) {
  return (
    <section className="dashboard-ai-brief">
      <div className="dashboard-quick-icon" aria-hidden="true">
        <Brain size={22} />
      </div>
      <div className="dashboard-ai-brief-copy">
        <div className="dashboard-ai-brief-kicker">
          <p className="mono">Daily AI brief</p>
          <span>{brief.generated_on}</span>
        </div>
        <h2 className="serif">{brief.headline}</h2>
        <p>{brief.summary}</p>
      </div>
      <ul className="dashboard-ai-brief-recs" aria-label="Recommendations">
        {brief.recommendations.map((recommendation) => (
          <li key={recommendation}>{recommendation}</li>
        ))}
      </ul>
    </section>
  );
}

function EmptySites() {
  return (
    <section className="empty-sites-card dashboard-empty-redesign">
      <div className="empty-sites-icon" aria-hidden="true">
        <Hammer size={26} />
      </div>
      <p className="eyebrow">No sites yet</p>
      <h2 className="serif">
        A Google profile is not enough. <span className="serif-italic">Build the site.</span>
      </h2>
      <p>Search your business, confirm the details, and generate your first draft.</p>
      <Link className="btn btn-accent btn-lg" href="/dashboard/build">
        Build your first site
        <ArrowRight aria-hidden="true" size={16} />
      </Link>
    </section>
  );
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?next=/dashboard");
  }

  const [{ data: profile }, { data: projects, error: projectsError }] = await Promise.all([
    supabase
      .from("users")
      .select("full_name, is_trial, plan, revisions_used, revisions_limit, show_url")
      .eq("id", user.id)
      .maybeSingle<Profile>(),
    supabase
      .from("projects")
      .select(
        "id, business_name, business_address, business_category, status, pipeline_job_id, public_url, custom_domain, google_rating, google_review_count, generation_ms, error_message, created_at, updated_at, last_deployed_at",
      )
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .returns<Project[]>(),
  ]);

  const projectList = projects ?? [];
  const liveCount = projectList.filter((project) => project.status === "live").length;
  const activeBuilds = projectList.filter((project) =>
    ["queued", "generating", "deploying"].includes(project.status),
  ).length;
  const failedCount = projectList.filter((project) => project.status === "failed").length;
  const latestDeployDate = projectList
    .map((project) => project.last_deployed_at)
    .filter((value): value is string => Boolean(value))
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];
  const showUrl = profile?.show_url ?? true;
  const displayName = displayNameFor(profile, user);
  const firstName = displayName.split(" ")[0] || "there";
  const hasSites = projectList.length > 0;
  const revisions = revisionMetric(profile);
  const headline = hasSites
    ? `${liveCount} site${liveCount === 1 ? " is" : "s are"} live.`
    : "Your first site is ready to build.";
  const workspaceTitle = liveCount > 0
    ? `${liveCount} public site${liveCount === 1 ? "" : "s"} online`
    : hasSites
      ? "Builds are moving through the pipeline"
      : "No public sites yet";
  const workspaceStatus = activeBuilds > 0
    ? `${activeBuilds} build${activeBuilds === 1 ? " is" : "s are"} still running.`
    : failedCount > 0
      ? `${failedCount} site${failedCount === 1 ? " needs" : "s need"} attention before publishing.`
      : hasSites
        ? "Everything is clear. Copy a link, preview a draft, or start another site."
        : "Search a Google Business Profile to create the first draft.";
  const dashboardBrief = await getDashboardBrief({
    activeBuilds,
    failedCount,
    liveCount,
    profile,
    projectList,
    supabase,
    userId: user.id,
  });

  return (
    <div className="dashboard-main-inner dashboard-main-redesign">
      <section className="dashboard-hero-row dashboard-hero-redesign">
        <div>
          <p className="eyebrow">Welcome back</p>
          <h1 className="serif">
            Hi {firstName}. <span className="serif-italic">{headline}</span>
          </h1>
        </div>
        {hasSites ? (
          <Link className="btn btn-accent dashboard-new-site" href="/dashboard/build">
            <Sparkles aria-hidden="true" size={15} />
            New site
          </Link>
        ) : null}
      </section>

      <section className="dashboard-command-panel" aria-label="Dashboard summary">
        <div className="dashboard-command-main">
          <p className="mono">Workspace status</p>
          <h2 className="serif">{workspaceTitle}</h2>
          <p>{workspaceStatus}</p>
        </div>
        <dl className="dashboard-command-metrics">
          <div>
            <dt>Total</dt>
            <dd>{projectList.length}</dd>
            <span>sites</span>
          </div>
          <div>
            <dt>Live</dt>
            <dd>{liveCount}</dd>
            <span>public</span>
          </div>
          <div>
            <dt>Building</dt>
            <dd>{activeBuilds}</dd>
            <span>{failedCount > 0 ? `${failedCount} retry` : "queue clear"}</span>
          </div>
          <div>
            <dt>Latest deploy</dt>
            <dd className={latestDeployDate ? "dashboard-command-date" : "dashboard-command-empty"}>
              {latestDeployDate ? formatDate(latestDeployDate) : "Waiting"}
            </dd>
            <span>{latestDeployDate ? "last launch" : activeBuilds > 0 ? "build in progress" : "publish your first site"}</span>
          </div>
          <div>
            <dt>Revisions</dt>
            <dd>{revisions.value}</dd>
            <span>{revisions.caption}</span>
          </div>
        </dl>
      </section>

      <DashboardBriefCard brief={dashboardBrief} />

      {projectsError ? (
        <section className="dashboard-alert" role="alert">
          <AlertTriangle aria-hidden="true" size={18} />
          <div>
            <strong>Could not load sites.</strong>
            <p>{projectsError.message}</p>
          </div>
        </section>
      ) : null}

      {projectList.length === 0 ? (
        <EmptySites />
      ) : (
        <section className="sites-list" aria-label="Your sites">
          <div className="sites-list-header">
            <div>
              <p className="eyebrow">Generated sites</p>
              <h2 className="serif">Sites</h2>
            </div>
            <p>{projectList.length} total / copy links from each row</p>
          </div>
          <div className="sites-list-stack">
            {projectList.map((project) => (
              <SiteCard key={project.id} project={project} showUrl={showUrl} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
