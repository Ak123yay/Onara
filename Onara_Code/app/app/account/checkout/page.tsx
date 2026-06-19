import { ArrowLeft, Check } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EmbeddedCheckoutForm } from "@/components/billing/EmbeddedCheckoutForm";

type BillingPlan = "starter" | "pro";
type BillingInterval = "month" | "year";

type CheckoutPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

type CheckoutPlan = {
  features: string[];
  interval: BillingInterval;
  name: string;
  plan: BillingPlan;
  price: string;
  priceDetail: string;
  summary: string;
};

export const metadata: Metadata = {
  robots: {
    follow: false,
    index: false,
  },
  title: "Checkout",
};

const checkoutPlans: Record<string, CheckoutPlan> = {
  "starter:month": {
    features: ["1 live site", "10 revisions/month", "Public URL stays visible"],
    interval: "month",
    name: "Starter",
    plan: "starter",
    price: "$12",
    priceDetail: "/ month",
    summary: "Keep one live site online with enough revisions for normal updates.",
  },
  "starter:year": {
    features: ["1 live site", "10 revisions/month", "Save $45/year versus monthly"],
    interval: "year",
    name: "Starter annual",
    plan: "starter",
    price: "$99",
    priceDetail: "/ year",
    summary: "Same Starter limits with annual pricing.",
  },
  "pro:month": {
    features: ["3 live sites", "Unlimited revisions", "Code download included"],
    interval: "month",
    name: "Pro",
    plan: "pro",
    price: "$29",
    priceDetail: "/ month",
    summary: "More sites, unlimited revisions, and export access for active operators.",
  },
};

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const plan = firstValue(resolvedSearchParams.plan);
  const interval = firstValue(resolvedSearchParams.interval) ?? "month";
  const selectedPlan = checkoutPlans[`${plan}:${interval}`];

  if (!selectedPlan) {
    redirect("/account/billing");
  }

  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim();

  return (
    <div className="account-checkout-page">
      <div className="account-checkout-header">
        <Link className="account-checkout-back" href="/account/billing">
          <ArrowLeft aria-hidden="true" size={14} />
          Billing
        </Link>
        <div>
          <p className="eyebrow">Onara checkout</p>
          <h1 className="serif">Finish your upgrade</h1>
          <p>Pay through Stripe without leaving the Onara account workspace.</p>
        </div>
      </div>

      <div className="account-checkout-grid">
        <aside className="account-checkout-summary card">
          <p className="eyebrow">Selected plan</p>
          <h2 className="serif">{selectedPlan.name}</h2>
          <div className="account-checkout-price">
            <strong>{selectedPlan.price}</strong>
            <span>{selectedPlan.priceDetail}</span>
          </div>
          <p>{selectedPlan.summary}</p>
          <ul>
            {selectedPlan.features.map((feature) => (
              <li key={feature}>
                <Check aria-hidden="true" size={14} />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
          <div className="account-checkout-note">
            <p className="eyebrow">Billing sync</p>
            <span>Stripe confirms the subscription, then the webhook updates your account plan.</span>
          </div>
        </aside>

        {publishableKey ? (
          <EmbeddedCheckoutForm
            interval={selectedPlan.interval}
            plan={selectedPlan.plan}
            publishableKey={publishableKey}
          />
        ) : (
          <div className="embedded-checkout-state embedded-checkout-state-error card">
            <p className="eyebrow">Stripe not configured</p>
            <h2 className="serif">Missing publishable key</h2>
            <p>Set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY before using embedded checkout.</p>
            <Link className="btn btn-soft" href="/account/billing">
              <ArrowLeft aria-hidden="true" size={14} />
              Back to billing
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
