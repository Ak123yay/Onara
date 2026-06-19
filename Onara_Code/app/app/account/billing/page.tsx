import { ArrowRight, Check, CreditCard, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { CancelSubscriptionButton } from "@/components/billing/CancelSubscriptionButton";

type PlanType = "free" | "starter" | "pro";

type BillingProfile = {
  email: string | null;
  full_name: string | null;
  is_trial: boolean;
  plan: PlanType;
  revisions_limit: number;
  revisions_reset_at: string | null;
  revisions_used: number;
  show_url: boolean;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_current_period_end: string | null;
  subscription_status: string | null;
  trial_ends_at: string | null;
};

type BillingPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata: Metadata = {
  robots: {
    follow: false,
    index: false,
  },
  title: "Billing",
};

const planRank: Record<PlanType, number> = {
  free: 0,
  starter: 1,
  pro: 2,
};

const planCards = [
  {
    cta: "Choose Starter",
    description: "Keep one live site online with enough revisions for normal updates.",
    features: ["1 live site", "10 revisions/month", "Public URL stays visible"],
    interval: "month" as const,
    name: "Starter",
    plan: "starter" as const,
    price: "$12",
    priceDetail: "/ month",
    secondaryCta: "Annual $99/year",
  },
  {
    cta: "Choose Pro",
    description: "More sites, unlimited revisions, and full export access for active operators.",
    features: ["3 live sites", "Unlimited revisions", "Code download included"],
    interval: "month" as const,
    name: "Pro",
    plan: "pro" as const,
    price: "$29",
    priceDetail: "/ month",
    secondaryCta: null,
  },
];

function daysUntil(value: string | null | undefined) {
  if (!value) {
    return 0;
  }

  const delta = new Date(value).getTime() - Date.now();
  return Math.max(0, Math.ceil(delta / 86_400_000));
}

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

function planName(profile: BillingProfile) {
  if (profile.is_trial) {
    return "Pro trial";
  }

  if (profile.plan === "pro") {
    return "Pro";
  }

  if (profile.plan === "starter") {
    return "Starter";
  }

  return "Free";
}

function planSummary(profile: BillingProfile) {
  if (profile.is_trial) {
    return "You have Pro access until the trial ends. Upgrade to keep live URLs and paid features active.";
  }

  if (profile.plan === "pro") {
    return "Your account has Pro access with unlimited revisions.";
  }

  if (profile.plan === "starter") {
    return "Your account has Starter access for one live site.";
  }

  return "Your account is on the free plan. Upgrade when you are ready to keep a site live.";
}

function revisionLabel(profile: BillingProfile) {
  if (profile.revisions_limit === -1) {
    return `${profile.revisions_used}/unlimited`;
  }

  return `${profile.revisions_used}/${profile.revisions_limit}`;
}

function statusLabel(profile: BillingProfile) {
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

function checkoutStatus(searchParams: Record<string, string | string[] | undefined>) {
  const value = searchParams.checkout;
  return Array.isArray(value) ? value[0] : value;
}

function trialProgress(daysLeft: number) {
  return Math.max(0, Math.min(100, (daysLeft / 14) * 100));
}

async function loadBillingProfile(): Promise<BillingProfile> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?next=/account/billing");
  }

  const db = createAdminClient();
  const { data: profile, error } = await db
    .from("users")
    .select(
      [
        "email",
        "full_name",
        "is_trial",
        "plan",
        "revisions_limit",
        "revisions_reset_at",
        "revisions_used",
        "show_url",
        "stripe_customer_id",
        "stripe_subscription_id",
        "subscription_current_period_end",
        "subscription_status",
        "trial_ends_at",
      ].join(", "),
    )
    .eq("id", user.id)
    .maybeSingle<BillingProfile>();

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

export default async function BillingPage({ searchParams }: BillingPageProps) {
  const profile = await loadBillingProfile();
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const checkout = checkoutStatus(resolvedSearchParams);
  const daysLeft = daysUntil(profile.trial_ends_at);
  const currentPlanRank = planRank[profile.plan];
  const canCancelSubscription =
    !profile.is_trial && Boolean(profile.stripe_subscription_id) && profile.subscription_status !== "canceled";

  return (
    <div className="account-billing-page">
      <div className="account-billing-header">
        <div>
          <p className="eyebrow">Account billing</p>
          <h1 className="serif">Plan & billing</h1>
          <p>
            Review your current Onara access and upgrade through Stripe Checkout when you are ready.
          </p>
        </div>
      </div>

      {checkout === "success" ? (
        <div className="account-billing-notice account-billing-notice-success">
          Checkout completed. Stripe will sync your plan here after the webhook processes.
        </div>
      ) : null}

      {checkout === "cancelled" ? (
        <div className="account-billing-notice">
          Checkout was cancelled. No plan changes were made.
        </div>
      ) : null}

      <div className="account-billing-support card">
        <span>Questions about billing, checkout, or public URL visibility?</span>
        <a href="mailto:support@onara.tech">support@onara.tech</a>
      </div>

      <section className="account-current-card card">
        <div className="account-current-main">
          <span className="account-current-icon" aria-hidden="true">
            {profile.is_trial ? <Sparkles size={19} /> : <CreditCard size={19} />}
          </span>
          <div>
            <p className="eyebrow">Current plan</p>
            <h2 className="serif">{planName(profile)}</h2>
            <p>{planSummary(profile)}</p>
          </div>
        </div>
        <span
          className={[
            "badge",
            profile.subscription_status === "past_due" ? "badge-warn" : "badge-manual",
          ].join(" ")}
        >
          {statusLabel(profile)}
        </span>
      </section>

      <section className="account-billing-grid">
        <div className="account-billing-panel card">
          <p className="eyebrow">Usage</p>
          <div className="account-billing-metrics">
            <div>
              <span>Revisions</span>
              <strong>{revisionLabel(profile)}</strong>
            </div>
            <div>
              <span>Public URL</span>
              <strong>{profile.show_url ? "Visible" : "Hidden"}</strong>
            </div>
            <div>
              <span>{profile.is_trial ? "Trial ends" : "Renews / resets"}</span>
              <strong>
                {profile.is_trial
                  ? formatDate(profile.trial_ends_at)
                  : formatDate(profile.subscription_current_period_end ?? profile.revisions_reset_at)}
              </strong>
            </div>
          </div>
        </div>

        {profile.is_trial ? (
          <div className="account-billing-panel account-trial-panel card">
            <p className="eyebrow">Pro trial</p>
            <h2 className="serif">{daysLeft === 1 ? "1 day left" : `${daysLeft} days left`}</h2>
            <p>Keep your public URLs, build history, and paid features active after the trial ends.</p>
            <div className="account-trial-meter" aria-hidden="true">
              <span style={{ width: `${trialProgress(daysLeft)}%` }} />
            </div>
          </div>
        ) : (
          <div className="account-billing-panel card">
            <p className="eyebrow">Stripe</p>
            <h2 className="serif">{profile.stripe_customer_id ? "Customer linked" : "No payment method"}</h2>
            <p>
              {profile.stripe_subscription_id
                ? "Your subscription is managed by Stripe."
                : "Add billing by choosing a paid plan below."}
            </p>
            {canCancelSubscription ? <CancelSubscriptionButton /> : null}
          </div>
        )}
      </section>

      <section className="account-plan-section">
        <div className="account-section-heading">
          <p className="eyebrow">Upgrade</p>
          <h2 className="serif">Choose a paid plan</h2>
        </div>

        <div className="account-plan-grid">
          {planCards.map((plan) => {
            const isCurrent = !profile.is_trial && profile.plan === plan.plan;
            const isDowngrade = !profile.is_trial && currentPlanRank > planRank[plan.plan];
            const isDisabled = isCurrent || isDowngrade;
            const primaryHref = `/account/checkout?plan=${plan.plan}&interval=${plan.interval}`;
            const secondaryHref = `/account/checkout?plan=${plan.plan}&interval=year`;

            return (
              <article className="account-plan-card card" key={plan.plan}>
                <div className="account-plan-card-top">
                  <div>
                    <p className="eyebrow">{plan.name}</p>
                    <h3 className="serif">
                      {plan.price}
                      <span>{plan.priceDetail}</span>
                    </h3>
                  </div>
                  {isCurrent ? <span className="badge badge-manual">Current</span> : null}
                </div>
                <p>{plan.description}</p>
                <ul>
                  {plan.features.map((feature) => (
                    <li key={feature}>
                      <Check aria-hidden="true" size={14} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <div className="account-plan-actions">
                  {plan.secondaryCta ? (
                    isDisabled ? (
                      <button className="btn btn-soft" disabled type="button">
                        {plan.secondaryCta}
                      </button>
                    ) : (
                      <Link className="btn btn-soft" href={secondaryHref}>
                        {plan.secondaryCta}
                      </Link>
                    )
                  ) : null}
                  {isDisabled ? (
                    <button className="btn btn-accent" disabled type="button">
                      {isCurrent ? "Current plan" : "Already included"}
                    </button>
                  ) : (
                    <Link className="btn btn-accent" href={primaryHref}>
                      {plan.cta}
                      <ArrowRight aria-hidden="true" size={14} />
                    </Link>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
