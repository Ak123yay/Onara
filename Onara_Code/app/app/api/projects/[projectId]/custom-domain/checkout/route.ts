import { NextResponse } from "next/server";
import Stripe from "stripe";
import { customDomainFeatureEnabled, normalizeCustomDomain } from "@/lib/custom-domain";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type ProjectForCheckout = {
  cloudflare_project_name: string | null;
  custom_domain: string | null;
  custom_domain_checkout_session_id: string | null;
  custom_domain_purchased_at: string | null;
  custom_domain_status: string;
  id: string;
  status: string;
};

type BillingProfile = {
  email: string | null;
  stripe_customer_id: string | null;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
let stripeClient: Stripe | null = null;

export async function POST(
  request: Request,
  context: { params: Promise<{ projectId: string }> },
) {
  if (!customDomainFeatureEnabled()) {
    return NextResponse.json({ error: "feature_disabled", message: "Custom domains are not enabled." }, { status: 404 });
  }

  const { projectId } = await context.params;
  if (!UUID_RE.test(projectId)) {
    return NextResponse.json({ error: "invalid_project_id", message: "Project id is invalid." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let domain: string;
  try {
    const body = (await request.json()) as { domain?: unknown };
    domain = normalizeCustomDomain(body.domain);
  } catch (error) {
    return NextResponse.json(
      { error: "validation_error", message: error instanceof Error ? error.message : "Domain is invalid." },
      { status: 422 },
    );
  }

  const db = createAdminClient();
  const [{ data: project, error: projectError }, { data: profile, error: profileError }] = await Promise.all([
    db
      .from("projects")
      .select(
        "id, status, cloudflare_project_name, custom_domain, custom_domain_status, custom_domain_checkout_session_id, custom_domain_purchased_at",
      )
      .eq("id", projectId)
      .eq("user_id", user.id)
      .maybeSingle<ProjectForCheckout>(),
    db
      .from("users")
      .select("email, stripe_customer_id")
      .eq("id", user.id)
      .maybeSingle<BillingProfile>(),
  ]);

  if (projectError || profileError) {
    return NextResponse.json(
      { error: "lookup_failed", message: projectError?.message ?? profileError?.message },
      { status: 500 },
    );
  }

  if (!project || !profile) {
    return NextResponse.json({ error: "not_found", message: "Site was not found." }, { status: 404 });
  }

  if (project.status !== "live" || !project.cloudflare_project_name) {
    return NextResponse.json(
      { error: "site_not_ready", message: "The site must finish deploying before a domain can be connected." },
      { status: 409 },
    );
  }

  if (project.custom_domain_purchased_at) {
    return NextResponse.json(
      {
        error: "domain_setup_already_purchased",
        message: `Domain setup was already purchased for ${project.custom_domain ?? "this site"}.`,
      },
      { status: 409 },
    );
  }

  const priceId = process.env.STRIPE_CUSTOM_DOMAIN_PRICE_ID?.trim();
  if (!priceId) {
    return NextResponse.json(
      { error: "billing_not_configured", message: "STRIPE_CUSTOM_DOMAIN_PRICE_ID is not configured." },
      { status: 500 },
    );
  }

  let stripe: Stripe;
  try {
    stripe = getStripeClient();
  } catch (error) {
    return NextResponse.json(
      { error: "billing_not_configured", message: error instanceof Error ? error.message : "Stripe is not configured." },
      { status: 500 },
    );
  }

  if (project.custom_domain_checkout_session_id && project.custom_domain === domain) {
    const existingSession = await stripe.checkout.sessions
      .retrieve(project.custom_domain_checkout_session_id)
      .catch(() => null);

    if (existingSession?.status === "open" && existingSession.url) {
      return NextResponse.json({ reused: true, sessionId: existingSession.id, url: existingSession.url });
    }

    if (existingSession?.payment_status === "paid") {
      return NextResponse.json(
        { error: "payment_processing", message: "Payment is complete. Domain setup is being processed." },
        { status: 409 },
      );
    }
  }

  const baseUrl = appBaseUrl(request);
  const metadata = {
    custom_domain: domain,
    price_id: priceId,
    project_id: project.id,
    purchase_type: "custom_domain",
    user_id: user.id,
  };

  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.create({
      cancel_url: `${baseUrl}/dashboard?domain_checkout=cancelled&project_id=${encodeURIComponent(project.id)}`,
      client_reference_id: user.id,
      customer: profile.stripe_customer_id ?? undefined,
      customer_creation: profile.stripe_customer_id ? undefined : "always",
      customer_email: profile.stripe_customer_id ? undefined : (user.email ?? profile.email ?? undefined),
      line_items: [{ price: priceId, quantity: 1 }],
      metadata,
      mode: "payment",
      payment_intent_data: { metadata },
      success_url: `${baseUrl}/dashboard?domain_checkout=success&project_id=${encodeURIComponent(project.id)}&session_id={CHECKOUT_SESSION_ID}`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "checkout_session_failed", message: stripeErrorMessage(error) },
      { status: 502 },
    );
  }

  if (!session.url) {
    return NextResponse.json(
      { error: "checkout_session_missing_url", message: "Stripe did not return a checkout URL." },
      { status: 502 },
    );
  }

  const { error: updateError } = await db
    .from("projects")
    .update({
      custom_domain: domain,
      custom_domain_checkout_session_id: session.id,
      custom_domain_error: null,
      custom_domain_status: "checkout_pending",
      custom_domain_validation: {},
      updated_at: new Date().toISOString(),
    })
    .eq("id", project.id)
    .eq("user_id", user.id);

  if (updateError) {
    await stripe.checkout.sessions.expire(session.id).catch(() => undefined);
    return NextResponse.json(
      { error: "project_update_failed", message: updateError.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ sessionId: session.id, url: session.url });
}

function getStripeClient() {
  if (stripeClient) {
    return stripeClient;
  }

  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured.");
  }

  stripeClient = new Stripe(secretKey, {
    apiVersion: "2026-05-27.dahlia",
    appInfo: { name: "Onara", version: "0.1.0" },
    maxNetworkRetries: 2,
  });
  return stripeClient;
}

function appBaseUrl(request: Request) {
  const requestOrigin = new URL(request.url).origin;
  const requestHostname = new URL(requestOrigin).hostname;
  if (["localhost", "127.0.0.1", "::1", "[::1]"].includes(requestHostname)) {
    return requestOrigin;
  }

  const configured = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL;
  return new URL(configured?.trim() || requestOrigin).origin;
}

function stripeErrorMessage(error: unknown) {
  return error instanceof Stripe.errors.StripeError
    ? error.message || "Stripe rejected the custom-domain checkout."
    : "Custom-domain checkout could not be created.";
}
