import { ArrowRight, Brain, CreditCard, Database, Globe2, KeyRound, LayoutDashboard, Mail, ShieldCheck, Trash2 } from "lucide-react";
import type { Metadata } from "next";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type AccountProfile = {
  created_at: string;
  email: string | null;
  full_name: string | null;
  id: string;
  is_trial: boolean;
  plan: "free" | "starter" | "pro";
  show_url: boolean;
  subscription_status: string | null;
  training_data_consent: boolean;
  training_data_consent_at: string | null;
  training_data_consent_version: string | null;
  training_data_opted_out_at: string | null;
  training_examples_count: number;
  trial_ends_at: string | null;
};

const TRAINING_DATA_CONSENT_VERSION = "2026-06-19-v1";

export const metadata: Metadata = {
  robots: {
    follow: false,
    index: false,
  },
  title: "Account",
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

async function setTrainingDataConsent(formData: FormData) {
  "use server";

  const enabled = formData.get("enabled") === "true";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?next=/account");
  }

  const { error } = await supabase.rpc("set_training_data_consent", {
    p_consent_version: TRAINING_DATA_CONSENT_VERSION,
    p_enabled: enabled,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/account");
}

async function deleteTrainingExamples() {
  "use server";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?next=/account");
  }

  const { error: consentError } = await supabase.rpc("set_training_data_consent", {
    p_consent_version: TRAINING_DATA_CONSENT_VERSION,
    p_enabled: false,
  });

  if (consentError) {
    throw new Error(consentError.message);
  }

  const db = createAdminClient();
  const { error: deleteError } = await db
    .from("training_examples")
    .delete()
    .eq("user_id", user.id);

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  revalidatePath("/account");
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
    .select("id, created_at, email, full_name, is_trial, plan, show_url, subscription_status, training_data_consent, training_data_consent_at, training_data_consent_version, training_data_opted_out_at, trial_ends_at")
    .eq("id", user.id)
    .maybeSingle<AccountProfile>();

  if (error) {
    throw new Error(error.message);
  }

  if (!profile) {
    redirect("/dashboard");
  }

  const { count: trainingExamplesCount, error: countError } = await db
    .from("training_examples")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  if (countError) {
    throw new Error(countError.message);
  }

  return {
    ...profile,
    email: profile.email ?? user.email ?? null,
    training_examples_count: trainingExamplesCount ?? 0,
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

      <section className="account-training-card card" aria-labelledby="training-data-title">
        <div className="account-training-main">
          <span className="account-training-icon" aria-hidden="true">
            <Brain size={19} />
          </span>
          <div>
            <p className="eyebrow">Model improvement</p>
            <h2 className="serif" id="training-data-title">Training data controls</h2>
            <p>
              Onara only stores QA-approved, redacted generation examples when you opt in. We do not save failed builds,
              raw private notes, payment data, support emails, or unredacted business contact details for training.
            </p>
          </div>
        </div>

        <div className="account-training-status">
          <div>
            <span>Consent</span>
            <strong>{profile.training_data_consent ? "Enabled" : "Off"}</strong>
            <small>
              {profile.training_data_consent
                ? `Enabled ${formatDate(profile.training_data_consent_at)}`
                : profile.training_data_opted_out_at
                  ? `Opted out ${formatDate(profile.training_data_opted_out_at)}`
                  : "No optional training use"}
            </small>
          </div>
          <div>
            <span>Saved examples</span>
            <strong>{profile.training_examples_count}</strong>
            <small>Approved and redacted only</small>
          </div>
        </div>

        <div className="account-training-actions">
          <form action={setTrainingDataConsent}>
            <input name="enabled" type="hidden" value={profile.training_data_consent ? "false" : "true"} />
            <button className={profile.training_data_consent ? "btn btn-soft" : "btn btn-accent"} type="submit">
              <Database aria-hidden="true" size={14} />
              {profile.training_data_consent ? "Stop future use" : "Allow approved examples"}
            </button>
          </form>
          <form action={deleteTrainingExamples}>
            <button
              className="btn btn-soft account-training-delete"
              disabled={profile.training_examples_count === 0}
              type="submit"
            >
              <Trash2 aria-hidden="true" size={14} />
              Delete saved examples
            </button>
          </form>
        </div>

        <p className="account-training-note">
          Deleting saved examples also turns off future optional training use. You can still use Onara normally either
          way. See the <Link href="/privacy">Privacy Policy</Link> for the full disclosure.
        </p>
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
            description="Get help with billing, login, or a generated site at support@onara.tech."
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
