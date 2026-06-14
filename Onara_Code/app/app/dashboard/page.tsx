import {
  AlertTriangle,
  ArrowRight,
  ChevronRight,
  Clock3,
  ExternalLink,
  Eye,
  Globe2,
  Hammer,
  MousePointer2,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type ProjectStatus = "queued" | "generating" | "deploying" | "live" | "failed" | "suspended";

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
  public_url: string | null;
  status: ProjectStatus;
  updated_at: string;
};

type Profile = {
  full_name: string | null;
  is_trial: boolean;
  onboarding_complete: boolean;
  plan: string;
  revisions_limit: number;
  revisions_used: number;
  show_url: boolean;
  trial_ends_at: string | null;
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
    detail: string;
    label: string;
    tone: "neutral" | "success" | "warning" | "danger";
  }
> = {
  queued: { detail: "Waiting for the build agent", label: "Queued", tone: "neutral" },
  generating: { detail: "Drafting copy and layout", label: "Building", tone: "warning" },
  deploying: { detail: "Publishing public URL", label: "Deploying", tone: "warning" },
  live: { detail: "Ready for customers", label: "Live", tone: "success" },
  failed: { detail: "Needs a retry", label: "Failed", tone: "danger" },
  suspended: { detail: "Paused by plan state", label: "Paused", tone: "neutral" },
};

function daysUntil(value: string | null | undefined) {
  if (!value) {
    return 0;
  }

  const delta = new Date(value).getTime() - Date.now();
  return Math.max(0, Math.ceil(delta / 86_400_000));
}

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

function displayNameFor(profile: Profile | null, user: DashboardAuthUser) {
  const metadataName =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : typeof user.user_metadata?.name === "string"
        ? user.user_metadata.name
        : "";

  return profile?.full_name ?? metadataName ?? user.email?.split("@")[0] ?? "there";
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

function SiteSparkline({ status }: { status: ProjectStatus }) {
  const liveTrend = [12, 18, 15, 24, 21, 32, 38];
  const buildingTrend = [3, 7, 10, 14, 18, 21, 25];
  const flatTrend = [8, 8, 8, 8, 8, 8, 8];
  const data = status === "live" ? liveTrend : status === "failed" ? flatTrend : buildingTrend;
  const max = Math.max(...data, 1);
  const width = 78;
  const height = 26;
  const step = width / (data.length - 1);
  const path = data
    .map((value, index) => {
      const command = index === 0 ? "M" : "L";
      const x = index * step;
      const y = height - (value / max) * (height - 3) - 1;

      return `${command} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg
      aria-hidden="true"
      className="site-card-sparkline"
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      width={width}
    >
      <path d={path} fill="none" pathLength={1} />
    </svg>
  );
}

function SiteCard({ project, showUrl }: { project: Project; showUrl: boolean }) {
  const siteHref = showUrl ? externalHref(project.public_url) : null;
  const rating = formatRating(project.google_rating);
  const meta = statusMeta[project.status];

  return (
    <article className="site-card dashboard-site-row hover-lift">
      <SiteThumb project={project} />
      <div className="site-card-main">
        <div className="site-card-title-row">
          <h2>{project.business_name}</h2>
          <SiteStatusBadge status={project.status} />
          {project.custom_domain ? <span className="site-status site-status-neutral">Custom domain</span> : null}
        </div>

        <p className="site-card-url">{formatUrl(project.public_url, showUrl)}</p>

        <div className="site-card-meta">
          <span>{project.business_category ?? "Local contractor"}</span>
          <span>{project.business_address ?? "Service area pending"}</span>
          {rating ? (
            <span>
              {rating} from {project.google_review_count ?? 0} reviews
            </span>
          ) : null}
          <span>Updated {formatDate(project.updated_at)}</span>
        </div>

        {project.error_message ? (
          <p className="site-card-error">
            <AlertTriangle aria-hidden="true" size={14} />
            {project.error_message}
          </p>
        ) : null}
      </div>

      <div className="site-card-right">
        <div className="site-card-kpi">
          <SiteSparkline status={project.status} />
          <div>
            <strong>{project.status === "live" ? "Live" : meta.label}</strong>
            <span>{project.status === "live" ? `Published ${formatDate(project.last_deployed_at)}` : meta.detail}</span>
          </div>
        </div>

        <div className="site-card-actions">
          <Link className="btn btn-soft btn-sm" href={`/api/preview/${project.id}`} target="_blank">
            <Eye aria-hidden="true" size={14} />
            Preview
          </Link>
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
          <ChevronRight aria-hidden="true" className="site-card-chevron" size={15} />
        </div>
      </div>
    </article>
  );
}

function QuickBuildCard({ hasSites }: { hasSites: boolean }) {
  return (
    <section className="dashboard-quick-build">
      <div className="dashboard-quick-icon" aria-hidden="true">
        <Sparkles size={22} />
      </div>
      <div>
        <h2 className="serif">{hasSites ? "Build another site" : "Start your first build"}</h2>
        <p>
          About 90 seconds from Google Business Profile search to first contractor-site draft.
        </p>
      </div>
      <Link className="btn btn-accent" href="/dashboard/build">
        {hasSites ? "New site" : "Build free"}
        <ArrowRight aria-hidden="true" size={14} />
      </Link>
    </section>
  );
}

function StatusSummary({
  activeBuilds,
  failedCount,
  liveCount,
  total,
}: {
  activeBuilds: number;
  failedCount: number;
  liveCount: number;
  total: number;
}) {
  const filters = [
    { active: true, count: total, label: "All" },
    { count: liveCount, label: "Live" },
    { count: activeBuilds, label: "Building" },
    { count: failedCount, label: "Needs retry" },
  ];

  return (
    <div aria-label="Site status summary" className="dashboard-chip-row">
      {filters.map((filter) => (
        <span
          className={`dashboard-chip ${filter.active ? "dashboard-chip-active" : ""}`}
          key={filter.label}
        >
          {filter.label}
          <strong>{filter.count}</strong>
        </span>
      ))}
    </div>
  );
}

function OnboardingCard() {
  const steps = [
    "Search your Google Business Profile",
    "Confirm photos, hours, services, and phone",
    "Generate the first draft and preview it",
  ];

  return (
    <section className="dashboard-onboarding-card">
      <div>
        <p className="eyebrow">First value moment</p>
        <h2 className="serif">Finish onboarding by building one real site.</h2>
        <p>
          Onara waits to push billing until you have a useful draft. Start with the business
          profile and review the generated page before publishing.
        </p>
      </div>
      <ol>
        {steps.map((step, index) => (
          <li key={step}>
            <span>{index + 1}</span>
            {step}
          </li>
        ))}
      </ol>
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
      <p>
        Search your business, confirm the details, choose the style, and send it into the
        generation queue. Your first draft starts from real Google Business Profile data.
      </p>
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
      .select("full_name, plan, is_trial, trial_ends_at, revisions_used, revisions_limit, show_url, onboarding_complete")
      .eq("id", user.id)
      .maybeSingle<Profile>(),
    supabase
      .from("projects")
      .select(
        "id, business_name, business_address, business_category, status, public_url, custom_domain, google_rating, google_review_count, generation_ms, error_message, created_at, updated_at, last_deployed_at",
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
  const showUrl = profile?.show_url ?? true;
  const displayName = displayNameFor(profile, user);
  const firstName = displayName.split(" ")[0] || "there";
  const hasSites = projectList.length > 0;
  const headline = hasSites
    ? `${liveCount} site${liveCount === 1 ? " is" : "s are"} live.`
    : "Your first site is ready to build.";

  return (
    <div className="dashboard-main-inner dashboard-main-redesign">
      <section className="dashboard-hero-row dashboard-hero-redesign">
        <div>
          <p className="eyebrow">Welcome back</p>
          <h1 className="serif">
            Hi {firstName}. <span className="serif-italic">{headline}</span>
          </h1>
          <p className="dashboard-hero-copy">
            Manage generated contractor sites, retry failed builds, preview drafts, and start the
            next Google-profile-to-website run.
          </p>
        </div>
        <Link className="btn btn-accent dashboard-new-site" href="/dashboard/build">
          <Sparkles aria-hidden="true" size={15} />
          New site
        </Link>
      </section>

      <section className="dashboard-stats-grid" aria-label="Dashboard summary">
        <div className="dashboard-stat-card">
          <p className="mono">Live sites</p>
          <strong className="serif">{liveCount}</strong>
          <span>{projectList.length} total</span>
        </div>
        <div className="dashboard-stat-card">
          <p className="mono">Building</p>
          <strong className="serif">{activeBuilds}</strong>
          <span>{failedCount > 0 ? `${failedCount} needs retry` : "Queue clear"}</span>
        </div>
        <div className="dashboard-stat-card">
          <p className="mono">Revisions</p>
          <strong className="serif">{revisionLabel(profile)}</strong>
          <span>This month</span>
        </div>
        <div className="dashboard-stat-card dashboard-stat-card-dark">
          <p className="mono">{profile?.is_trial ?? true ? "Trial" : "Plan"}</p>
          <strong className="serif">
            {profile?.is_trial ?? true ? `${daysUntil(profile?.trial_ends_at)}d` : profile?.plan ?? "Free"}
          </strong>
          <span>{profile?.is_trial ?? true ? "remaining" : "active plan"}</span>
        </div>
      </section>

      <QuickBuildCard hasSites={hasSites} />

      {profile?.onboarding_complete === false ? <OnboardingCard /> : null}

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
              <h2 className="serif">Recent sites</h2>
            </div>
            <p>{showUrl ? "Public URLs are visible." : "Free-plan public URLs are hidden."}</p>
          </div>
          <StatusSummary
            activeBuilds={activeBuilds}
            failedCount={failedCount}
            liveCount={liveCount}
            total={projectList.length}
          />
          <div className="sites-list-stack">
            {projectList.map((project) => (
              <SiteCard key={project.id} project={project} showUrl={showUrl} />
            ))}
          </div>
        </section>
      )}

      <section className="dashboard-footnote-card">
        <Clock3 aria-hidden="true" size={16} />
        <span>Most first drafts finish in about 90 seconds after the pipeline starts.</span>
        <MousePointer2 aria-hidden="true" size={16} />
        <span>Preview is always available, even before a public URL is shown.</span>
      </section>
    </div>
  );
}
