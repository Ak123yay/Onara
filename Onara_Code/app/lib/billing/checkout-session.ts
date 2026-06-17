import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type CheckoutSessionBody = {
  billingInterval?: unknown;
  cancelUrl?: unknown;
  cancel_url?: unknown;
  interval?: unknown;
  plan?: unknown;
  priceId?: unknown;
  price_id?: unknown;
  successUrl?: unknown;
  success_url?: unknown;
};

type BillingProfile = {
  email: string | null;
  is_trial: boolean | null;
  plan: string | null;
  stripe_customer_id: string | null;
  subscription_status: string | null;
};

type BillingPlan = "starter" | "pro";
type BillingInterval = "month" | "year";

type CheckoutPrice = {
  envName: string;
  interval: BillingInterval;
  plan: BillingPlan;
  priceId: string;
};

class BillingConfigError extends Error {}

const PLAN_PRICE_CONFIG: Array<Omit<CheckoutPrice, "priceId">> = [
  {
    envName: "STRIPE_STARTER_PRICE_ID",
    interval: "month",
    plan: "starter",
  },
  {
    envName: "STRIPE_STARTER_ANNUAL_PRICE_ID",
    interval: "year",
    plan: "starter",
  },
  {
    envName: "STRIPE_PRO_PRICE_ID",
    interval: "month",
    plan: "pro",
  },
];

let stripeClient: Stripe | null = null;

export async function createCheckoutSession(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: CheckoutSessionBody;
  try {
    body = (await request.json()) as CheckoutSessionBody;
  } catch {
    return NextResponse.json({ error: "invalid_request", message: "Request body must be JSON." }, { status: 400 });
  }

  let checkoutPrice: CheckoutPrice;
  try {
    checkoutPrice = checkoutPriceFromBody(body);
  } catch (error) {
    if (error instanceof BillingConfigError) {
      return NextResponse.json({ error: "billing_not_configured", message: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: "validation_error", message: error instanceof Error ? error.message : "Invalid checkout request." },
      { status: 422 },
    );
  }

  const db = createAdminClient();
  const { data: profile, error: profileError } = await db
    .from("users")
    .select("email, stripe_customer_id, plan, is_trial, subscription_status")
    .eq("id", user.id)
    .maybeSingle<BillingProfile>();

  if (profileError) {
    return NextResponse.json(
      { error: "profile_lookup_failed", message: profileError.message },
      { status: 500 },
    );
  }

  if (!profile) {
    return NextResponse.json({ error: "profile_not_found", message: "User profile was not found." }, { status: 404 });
  }

  const baseUrl = appBaseUrl(request);
  let successUrl: string;
  let cancelUrl: string;
  try {
    successUrl = safeRedirectUrl(
      body.successUrl ?? body.success_url,
      baseUrl,
      "/dashboard?upgraded=true",
      { includeCheckoutSession: true },
    );
    cancelUrl = safeRedirectUrl(
      body.cancelUrl ?? body.cancel_url,
      baseUrl,
      "/dashboard?checkout=cancelled",
    );
  } catch (error) {
    return NextResponse.json(
      { error: "validation_error", message: error instanceof Error ? error.message : "Invalid checkout redirect URL." },
      { status: 422 },
    );
  }

  let stripe: Stripe;
  try {
    stripe = getStripeClient();
  } catch (error) {
    return NextResponse.json(
      {
        error: "billing_not_configured",
        message: error instanceof Error ? error.message : "Stripe is not configured.",
      },
      { status: 500 },
    );
  }

  try {
    const session = await stripe.checkout.sessions.create({
      allow_promotion_codes: true,
      client_reference_id: user.id,
      customer: profile.stripe_customer_id ?? undefined,
      customer_email: profile.stripe_customer_id ? undefined : (user.email ?? profile.email ?? undefined),
      line_items: [
        {
          price: checkoutPrice.priceId,
          quantity: 1,
        },
      ],
      metadata: checkoutMetadata(user.id, checkoutPrice),
      mode: "subscription",
      subscription_data: {
        metadata: checkoutMetadata(user.id, checkoutPrice),
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "checkout_session_missing_url", message: "Stripe did not return a checkout URL." },
        { status: 502 },
      );
    }

    return NextResponse.json({
      checkout_url: session.url,
      interval: checkoutPrice.interval,
      plan: checkoutPrice.plan,
      priceId: checkoutPrice.priceId,
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "checkout_session_failed",
        message: stripeErrorMessage(error),
      },
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

function checkoutPriceFromBody(body: CheckoutSessionBody): CheckoutPrice {
  const prices = configuredCheckoutPrices();
  const requestedPriceId = stringValue(body.priceId ?? body.price_id);

  if (requestedPriceId) {
    const match = prices.find((price) => price.priceId === requestedPriceId);
    if (!match) {
      throw new Error("Selected price is not available for checkout.");
    }
    return match;
  }

  const plan = planFromBody(body.plan);
  const interval = intervalFromBody(body.billingInterval ?? body.interval, plan);
  const match = prices.find((price) => price.plan === plan && price.interval === interval);

  if (!match) {
    const envName = PLAN_PRICE_CONFIG.find((price) => price.plan === plan && price.interval === interval)?.envName;
    throw new BillingConfigError(`${envName ?? "Stripe price"} is not configured.`);
  }

  return match;
}

function configuredCheckoutPrices(): CheckoutPrice[] {
  return PLAN_PRICE_CONFIG.flatMap((priceConfig) => {
    const priceId = process.env[priceConfig.envName]?.trim();
    return priceId ? [{ ...priceConfig, priceId }] : [];
  });
}

function planFromBody(value: unknown): BillingPlan {
  const plan = stringValue(value)?.toLowerCase();
  if (plan === "starter" || plan === "pro") {
    return plan;
  }

  throw new Error("Choose Starter or Pro for checkout.");
}

function intervalFromBody(value: unknown, plan: BillingPlan): BillingInterval {
  const interval = stringValue(value)?.toLowerCase();

  if (!interval) {
    return "month";
  }

  if (interval === "monthly" || interval === "month") {
    return "month";
  }

  if (interval === "annual" || interval === "year" || interval === "yearly") {
    if (plan === "pro") {
      throw new Error("Annual checkout is only available for Starter.");
    }
    return "year";
  }

  throw new Error("Billing interval must be monthly or annual.");
}

function appBaseUrl(request: Request) {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL;
  const rawUrl = configuredUrl?.trim() || new URL(request.url).origin;
  return new URL(rawUrl).origin;
}

function safeRedirectUrl(
  value: unknown,
  baseUrl: string,
  fallbackPath: string,
  options: { includeCheckoutSession?: boolean } = {},
) {
  const rawValue = stringValue(value);
  const url = new URL(rawValue || fallbackPath, baseUrl);

  if (url.origin !== baseUrl) {
    throw new Error("Checkout redirect URL must stay on Onara.");
  }

  if (options.includeCheckoutSession && !url.search.includes("{CHECKOUT_SESSION_ID}")) {
    url.searchParams.set("session_id", "{CHECKOUT_SESSION_ID}");
  }

  return url.toString().replaceAll("%7B", "{").replaceAll("%7D", "}");
}

function checkoutMetadata(userId: string, checkoutPrice: CheckoutPrice) {
  return {
    billing_interval: checkoutPrice.interval,
    price_id: checkoutPrice.priceId,
    requested_plan: checkoutPrice.plan,
    user_id: userId,
  };
}

function stripeErrorMessage(error: unknown) {
  if (error instanceof Stripe.errors.StripeError) {
    return error.message || "Stripe rejected the checkout session request.";
  }

  return "Checkout session could not be created.";
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}
