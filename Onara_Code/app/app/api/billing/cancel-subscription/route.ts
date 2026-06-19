import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type BillingProfile = {
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_status: string | null;
};

type CancelSubscriptionResponse = {
  message?: string;
  ok: boolean;
  warning?: string;
};

class BillingConfigError extends Error {}

let stripeClient: Stripe | null = null;

export const runtime = "nodejs";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json<CancelSubscriptionResponse>(
      { ok: false, message: "Sign in before changing billing." },
      { status: 401 },
    );
  }

  const db = createAdminClient();
  const { data: profile, error: profileError } = await db
    .from("users")
    .select("stripe_customer_id, stripe_subscription_id, subscription_status")
    .eq("id", user.id)
    .maybeSingle<BillingProfile>();

  if (profileError) {
    return NextResponse.json<CancelSubscriptionResponse>(
      { ok: false, message: profileError.message },
      { status: 500 },
    );
  }

  if (!profile) {
    return NextResponse.json<CancelSubscriptionResponse>(
      { ok: false, message: "User profile was not found." },
      { status: 404 },
    );
  }

  if (profile.subscription_status === "canceled") {
    return NextResponse.json<CancelSubscriptionResponse>({
      ok: true,
      message: "Your subscription is already canceled.",
    });
  }

  if (!profile.stripe_subscription_id) {
    return NextResponse.json<CancelSubscriptionResponse>(
      { ok: false, message: "No active Stripe subscription was found for this account." },
      { status: 409 },
    );
  }

  let stripe: Stripe;
  try {
    stripe = getStripeClient();
  } catch (error) {
    return NextResponse.json<CancelSubscriptionResponse>(
      { ok: false, message: error instanceof Error ? error.message : "Stripe is not configured." },
      { status: 500 },
    );
  }

  try {
    const subscription = await stripe.subscriptions.retrieve(profile.stripe_subscription_id);
    const subscriptionCustomerId = customerIdFromSubscription(subscription);

    if (profile.stripe_customer_id && subscriptionCustomerId !== profile.stripe_customer_id) {
      return NextResponse.json<CancelSubscriptionResponse>(
        { ok: false, message: "Subscription/customer mismatch. Contact support@onara.tech." },
        { status: 409 },
      );
    }

    if (subscription.status !== "canceled") {
      await stripe.subscriptions.cancel(profile.stripe_subscription_id);
    }

    const syncResult = await markSubscriptionCanceled(db, user.id);
    if (!syncResult.ok) {
      return NextResponse.json<CancelSubscriptionResponse>(
        {
          ok: true,
          message: "Stripe canceled the subscription. The webhook will finish syncing your account.",
          warning: syncResult.message,
        },
        { status: 202 },
      );
    }

    return NextResponse.json<CancelSubscriptionResponse>({
      ok: true,
      message: "Subscription canceled. Public URL access is being turned off.",
    });
  } catch (error) {
    return NextResponse.json<CancelSubscriptionResponse>(
      { ok: false, message: stripeErrorMessage(error) },
      { status: 502 },
    );
  }
}

function getStripeClient() {
  if (stripeClient) {
    return stripeClient;
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    throw new BillingConfigError("STRIPE_SECRET_KEY is not configured.");
  }

  stripeClient = new Stripe(stripeSecretKey, {
    appInfo: {
      name: "Onara",
      version: "0.1.0",
    },
    maxNetworkRetries: 2,
  });

  return stripeClient;
}

function customerIdFromSubscription(subscription: Stripe.Subscription) {
  const customer = subscription.customer;
  return typeof customer === "string" ? customer : customer.id;
}

async function markSubscriptionCanceled(db: ReturnType<typeof createAdminClient>, userId: string) {
  const { error } = await db
    .from("users")
    .update({
      is_trial: false,
      plan: "free",
      revisions_limit: 3,
      revisions_used: 0,
      show_url: false,
      stripe_subscription_id: null,
      subscription_current_period_end: null,
      subscription_status: "canceled",
    })
    .eq("id", userId);

  return error ? { ok: false as const, message: error.message } : { ok: true as const };
}

function stripeErrorMessage(error: unknown) {
  if (error instanceof Stripe.errors.StripeError) {
    return error.message || "Stripe could not cancel the subscription.";
  }

  return "Subscription could not be canceled.";
}
