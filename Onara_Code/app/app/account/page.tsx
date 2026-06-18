import { ArrowRight, CreditCard, Globe2, KeyRound, LayoutDashboard, Mail, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type AccountProfile = {
  created_at: string;
  email: string | null;
  full_name: string | null;
  is_trial: boolean;
  plan: "free" | "starter" | "pro";
  show_url: boolean;
  subscription_status: string | null;
  trial_ends_at: string | null;
};

export const metadata: Metadata = {
  title: "Account - Onara",
};

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function daysUntil(value: string | null | undefined) {
  if (!value) {
    return 0;
  }

  const delta = new Date(value).getTime() - Date.now();
  return Math.max(0, Math.ceil(delta / 86_400_000));
}

function trialProgress(daysLeft: number) {
  return Math.max(0, Math.min(100, (daysLeft / 14) * 100));
}

function planLabel(profile: AccountProfile) {
  if (profile.is_trial) {
    return "Pro trial";
  }

  return profile.plan.charAt(0).toUpperCase() + profile.plan.slice(1);
}

function statusLabel(profile: AccountProfile) {
  if (profile.is_trial) {
    return "Trial";
  }

  if (profile.subscription_status === "past_due") {
    return "Past due";
  }

  if (profile.subscription_status === "active") {
    return "Active";
  }

  if (profile.subscription_status === "canceled") {
    return "Canceled";
  }

  return profile.plan === "free" ? "Free" : "Pending";
}

function statusClass(profile: AccountProfile) {
  if (profile.subscription_status === "past_due") {
    return "badge badge-warn";
  }

  return "badge badge-manual";
}

function accessSummary(profile: AccountProfile) {
  if (profile.is_trial) {
    return `Trial ends ${formatDate(profile.trial_ends_at)}. Add billing to keep public URLs online.`;
  }

  if (profile.subscription_status === "past_due") {
    return "Payment needs attention. Public URL access may be limited until billing is fixed.";
  }

  if (profile.plan === "pro") {
    return "Pro access is active with expanded site capacity and paid features.";
  }

  if (profile.plan === "starter") {
    return "Starter access is active for one live site and normal revision usage.";
  }

  return "Free access is active. Upgrade when you are ready to keep a public site online.";
}

async function loadAccountProfile(): Promise<AccountProfile> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?next=/account");
  }

  const db = createAdminClient();
  const { data: profile, error } = await db
    .from("users")
    .select("created_at, email, full_name, is_trial, plan, show_url, subscription_status, trial_ends_at")
    .eq("id", user.id)
    .maybeSingle<AccountProfile>();

  if (error) {
    throw new Error(error.message);
  }

  if (!profile) {
    redirect("/dashboard");
  }

  return {
    ...profile,
    email: profile.email ?? user.email ?? null,
  };
}

export default async function AccountPage() {
  const profile = await loadAccountProfile();
  const displayName = profile.full_name || profile.email?.split("@")[0] || "Account";
  const initial = displayName.trim().charAt(0).toUpperCase() || "A";
  const daysLeft = daysUntil(profile.trial_ends_at);

  return (
    <div className="account-settings-page">
      <div className="account-settings-header">
        <div>
          <p className="eyebrow">Account</p>
          <h1 className="serif">Your workspace</h1>
          <p>Profile, access, and the controls that affect live Onara sites.</p>
        </div>
        <Link className="account-settings-header-link" href="/dashboard">
          Open dashboard
          <ArrowRight aria-hidden="true" size={13} />
        </Link>
      </div>

      <section className="account-settings-hero card">
        <div className="account-settings-profile">
          <span className="account-settings-avatar" aria-hidden="true">
            {initial}
          </span>
          <div>
            <p className="eyebrow">Signed in as</p>
            <h2 className="serif">{displayName}</h2>
            <p className="account-settings-email">{profile.email ?? "No email connected"}</p>
          </div>
        </div>

        <div className="account-settings-access">
          <div className="account-settings-access-top">
            <p className="eyebrow">Current access</p>
            <span className={statusClass(profile)}>{statusLabel(profile)}</span>
          </div>
          <h3 className="serif">{planLabel(profile)}</h3>
          <p>{accessSummary(profile)}</p>
          {profile.is_trial ? (
            <div className="account-settings-meter" aria-hidden="true">
              <span style={{ width: `${trialProgress(daysLeft)}%` }} />
            </div>
          ) : null}
          <Link className="account-settings-access-link" href="/account/billing">
            Manage billing
            <ArrowRight aria-hidden="true" size={13} />
          </Link>
        </div>
      </section>

      <section className="account-settings-facts" aria-label="Account details">
        <AccountFact label="Name" value={profile.full_name || "Not set"} />
        <AccountFact label="Email" value={profile.email ?? "Not set"} />
        <AccountFact label="Created" value={formatDate(profile.created_at)} />
        <AccountFact label="Public URL" value={profile.show_url ? "Visible" : "Hidden"} />
      </section>

      <section className="account-settings-controls">
        <div className="account-settings-section-title">
          <p className="eyebrow">Controls</p>
          <h2 className="serif">Account actions</h2>
          <p>Common account tasks without mixing them into billing details.</p>
        </div>

        <div className="account-settings-action-grid">
          <AccountActionCard
            description="Change plans, finish checkout, or review public URL visibility."
            href="/account/billing"
            icon={<CreditCard size={17} />}
            label="Billing"
            title="Plan and billing"
          />
          <AccountActionCard
            description="Update the password for email/password accounts."
            href="/auth/update-password"
            icon={<KeyRound size={17} />}
            label="Password"
            title="Password"
          />
          <AccountActionCard
            description="Return to your sites, build progress, and workspace overview."
            href="/dashboard"
            icon={<LayoutDashboard size={17} />}
            label="Dashboard"
            title="Workspace"
          />
          <AccountActionCard
            description="Get help with billing, login, or a generated site."
            href="/help"
            icon={<Mail size={17} />}
            label="Support"
            title="Support"
          />
        </div>

        <div className="account-settings-footnote card">
          <ShieldCheck aria-hidden="true" size={17} />
          <p>Billing and public URL state are managed separately on the Billing page.</p>
          <span>
            <Globe2 aria-hidden="true" size={13} />
            {profile.show_url ? "Public URLs on" : "Public URLs off"}
          </span>
        </div>
      </section>
    </div>
  );
}

function AccountFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="account-settings-fact card">
      <span>{label}</span>
      <strong title={value}>{value}</strong>
    </div>
  );
}

function AccountActionCard({
  description,
  href,
  icon,
  label,
  title,
}: {
  description: string;
  href: string;
  icon: ReactNode;
  label: string;
  title: string;
}) {
  return (
    <Link className="account-settings-action card" href={href}>
      <span className="account-settings-action-icon" aria-hidden="true">
        {icon}
      </span>
      <span className="account-settings-action-copy">
        <span className="eyebrow">{label}</span>
        <strong>{title}</strong>
        <span>{description}</span>
      </span>
      <span className="account-settings-action-open">
        Open
        <ArrowRight aria-hidden="true" size={13} />
      </span>
    </Link>
  );
}
