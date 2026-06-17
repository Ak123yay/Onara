import { jsonResponse, requireMethod } from "../_shared/http.ts";
import { createServiceClient } from "../_shared/supabase.ts";

type StripeEvent = {
  id: string;
  type: string;
  data: {
    object: Record<string, unknown>;
  };
};

type SubscriptionDetails = {
  currentPeriodEnd?: string;
  id: string;
  customer: string;
  metadata: Record<string, unknown>;
  status: string;
  priceId?: string;
};

type BillingEmailUser = {
  email?: string | null;
  full_name?: string | null;
};

const textEncoder = new TextEncoder();

Deno.serve(async (request) => {
  const methodError = requireMethod(request, "POST");
  if (methodError) return methodError;

  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!webhookSecret) {
    return jsonResponse({ error: "missing_webhook_secret" }, 500);
  }

  const signature = request.headers.get("stripe-signature");
  const payload = await request.text();

  if (!signature || !(await verifyStripeSignature(payload, signature, webhookSecret))) {
    return jsonResponse({ error: "invalid_signature" }, 400);
  }

  let event: StripeEvent;
  try {
    event = JSON.parse(payload) as StripeEvent;
  } catch {
    return jsonResponse({ error: "invalid_payload" }, 400);
  }

  const supabase = createServiceClient();

  const { error: insertError } = await supabase
    .from("stripe_events")
    .insert({
      id: event.id,
      type: event.type,
      data: event,
      processed: false,
    });

  if (insertError) {
    if (insertError.code === "23505") {
      const { data: existingEvent, error: lookupError } = await supabase
        .from("stripe_events")
        .select("processed")
        .eq("id", event.id)
        .maybeSingle();

      if (lookupError) {
        return jsonResponse({ error: "event_lookup_failed", detail: lookupError.message }, 500);
      }

      if (existingEvent?.processed) {
        return jsonResponse({ ok: true, duplicate: true });
      }
    } else {
      return jsonResponse({ error: "event_store_failed", detail: insertError.message }, 500);
    }
  }

  let processResult: { ok: true } | { ok: false; error: string };
  try {
    processResult = await processStripeEvent(event, supabase);
  } catch (error) {
    processResult = {
      ok: false,
      error: error instanceof Error ? error.message : "unknown_processing_error",
    };
  }

  if (!processResult.ok) {
    return jsonResponse({ error: processResult.error }, 500);
  }

  const { error: updateError } = await supabase
    .from("stripe_events")
    .update({ processed: true, processed_at: new Date().toISOString() })
    .eq("id", event.id);

  if (updateError) {
    return jsonResponse({ error: "event_mark_processed_failed", detail: updateError.message }, 500);
  }

  return jsonResponse({ ok: true });
});

async function processStripeEvent(
  event: StripeEvent,
  supabase: ReturnType<typeof createServiceClient>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  switch (event.type) {
    case "checkout.session.completed":
      return handleCheckoutCompleted(event, supabase);
    case "customer.subscription.created":
    case "customer.subscription.updated":
      return handleSubscriptionChanged(event.data.object, supabase);
    case "customer.subscription.deleted":
      return handleSubscriptionDeleted(event.data.object, supabase);
    case "invoice.payment_failed":
      return handleInvoicePaymentFailed(event.data.object, supabase);
    case "invoice.payment_succeeded":
      return handleInvoicePaymentSucceeded(event.data.object, supabase);
    default:
      return { ok: true };
  }
}

async function handleCheckoutCompleted(
  event: StripeEvent,
  supabase: ReturnType<typeof createServiceClient>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = event.data.object;
  const customerId = asString(session.customer);
  const subscriptionId = asString(session.subscription);
  const userId = asString(session.client_reference_id) ?? asString(readMetadata(session).user_id);

  if (!customerId || !subscriptionId || !userId) {
    return { ok: false, error: "checkout_session_missing_required_fields" };
  }

  const subscription = await retrieveSubscription(subscriptionId);
  subscription.customer = customerId;

  return upsertUserSubscription(subscription, supabase, userId);
}

async function handleSubscriptionChanged(
  subscriptionObject: Record<string, unknown>,
  supabase: ReturnType<typeof createServiceClient>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const subscription = subscriptionFromObject(subscriptionObject);
  if (!subscription.customer) {
    return { ok: false, error: "subscription_missing_customer" };
  }

  return upsertUserSubscription(subscription, supabase, asString(subscription.metadata.user_id));
}

async function handleSubscriptionDeleted(
  subscriptionObject: Record<string, unknown>,
  supabase: ReturnType<typeof createServiceClient>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const customerId = asString(subscriptionObject.customer);
  if (!customerId) {
    return { ok: false, error: "subscription_deleted_missing_customer" };
  }

  const { error } = await supabase
    .from("users")
    .update({
      plan: "free",
      subscription_status: "canceled",
      stripe_subscription_id: null,
      subscription_current_period_end: null,
      is_trial: false,
      revisions_limit: 3,
      revisions_used: 0,
      show_url: false,
    })
    .eq("stripe_customer_id", customerId);

  return error ? { ok: false, error: error.message } : { ok: true };
}

async function handleInvoicePaymentFailed(
  invoice: Record<string, unknown>,
  supabase: ReturnType<typeof createServiceClient>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const customerId = asString(invoice.customer);
  if (!customerId) {
    return { ok: false, error: "invoice_failed_missing_customer" };
  }

  const { data: user, error } = await supabase
    .from("users")
    .update({ subscription_status: "past_due" })
    .eq("stripe_customer_id", customerId)
    .select("email, full_name")
    .maybeSingle();

  if (error) {
    return { ok: false, error: error.message };
  }

  await sendPaymentFailedEmail(user as BillingEmailUser | null);
  return { ok: true };
}

async function handleInvoicePaymentSucceeded(
  invoice: Record<string, unknown>,
  supabase: ReturnType<typeof createServiceClient>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const customerId = asString(invoice.customer);
  if (!customerId) {
    return { ok: false, error: "invoice_succeeded_missing_customer" };
  }

  const now = new Date().toISOString();
  const { error: userError } = await supabase
    .from("users")
    .update({
      subscription_status: "active",
      revisions_used: 0,
      revisions_reset_at: now,
      show_url: true,
    })
    .eq("stripe_customer_id", customerId);

  if (userError) {
    return { ok: false, error: userError.message };
  }

  const { data: users, error: selectError } = await supabase
    .from("users")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .limit(1);

  if (selectError) {
    return { ok: false, error: selectError.message };
  }

  const userId = users?.[0]?.id;
  if (userId) {
    const { error: projectError } = await supabase
      .from("projects")
      .update({ status: "live" })
      .eq("user_id", userId)
      .eq("status", "suspended");

    if (projectError) {
      return { ok: false, error: projectError.message };
    }
  }

  return { ok: true };
}

async function retrieveSubscription(subscriptionId: string): Promise<SubscriptionDetails> {
  const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
  if (!stripeSecretKey) {
    throw new Error("Missing STRIPE_SECRET_KEY");
  }

  const response = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
    headers: {
      authorization: `Bearer ${stripeSecretKey}`,
    },
  });

  if (!response.ok) {
    throw new Error("Stripe subscription lookup failed");
  }

  return subscriptionFromObject(await response.json() as Record<string, unknown>);
}

function subscriptionFromObject(subscription: Record<string, unknown>): SubscriptionDetails {
  const items = subscription.items as { data?: Array<Record<string, unknown>> } | undefined;
  const firstItem = items?.data?.[0];
  const price = firstItem?.price as Record<string, unknown> | undefined;

  return {
    currentPeriodEnd: stripeTimestampToIso(subscription.current_period_end),
    id: asString(subscription.id) ?? "",
    customer: asString(subscription.customer) ?? "",
    metadata: readMetadata(subscription),
    status: asString(subscription.status) ?? "active",
    priceId: asString(price?.id),
  };
}

async function upsertUserSubscription(
  subscription: SubscriptionDetails,
  supabase: ReturnType<typeof createServiceClient>,
  userId?: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const plan = planFromPriceId(subscription.priceId);
  const updateValues: Record<string, unknown> = {
    plan,
    stripe_customer_id: subscription.customer,
    stripe_subscription_id: subscription.id,
    subscription_status: subscription.status,
    is_trial: false,
    revisions_limit: revisionsLimitForPlan(plan),
    show_url: true,
  };

  if (subscription.currentPeriodEnd) {
    updateValues.subscription_current_period_end = subscription.currentPeriodEnd;
    if (plan === "starter") {
      updateValues.revisions_reset_at = subscription.currentPeriodEnd;
    }
  }

  let query = supabase.from("users").update(updateValues);
  query = userId ? query.eq("id", userId) : query.eq("stripe_customer_id", subscription.customer);

  const { error } = await query;
  return error ? { ok: false, error: error.message } : { ok: true };
}

function readMetadata(object: Record<string, unknown>): Record<string, unknown> {
  return (object.metadata as Record<string, unknown> | undefined) ?? {};
}

function planFromPriceId(priceId?: string): "starter" | "pro" {
  if (!priceId) {
    throw new Error("Stripe subscription is missing a price id");
  }

  if (priceId === Deno.env.get("STRIPE_PRO_PRICE_ID")) {
    return "pro";
  }

  const starterPriceIds = [
    Deno.env.get("STRIPE_STARTER_PRICE_ID"),
    Deno.env.get("STRIPE_STARTER_ANNUAL_PRICE_ID"),
  ].filter(Boolean);

  if (starterPriceIds.includes(priceId)) {
    return "starter";
  }

  throw new Error("Stripe subscription price id is not configured for an Onara plan");
}

function revisionsLimitForPlan(plan: "starter" | "pro"): number {
  return plan === "pro" ? -1 : 10;
}

async function sendPaymentFailedEmail(user: BillingEmailUser | null): Promise<void> {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const to = asString(user?.email);

  if (!resendApiKey || !to) {
    return;
  }

  const from = Deno.env.get("RESEND_FROM_EMAIL") || "hello@onara.tech";
  const replyTo = Deno.env.get("RESEND_REPLY_TO") || "support@onara.tech";
  const name = displayName(user);

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${resendApiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      reply_to: replyTo,
      subject: "Action required: payment failed for Onara",
      text: [
        `Hi ${name},`,
        "",
        "We could not process your Onara subscription payment.",
        "Please update your billing details to keep your live site and plan features active.",
        "",
        "Manage billing: https://onara.tech/account/billing",
        "",
        "If you have questions, reply to this email and we will help.",
      ].join("\n"),
      html: paymentFailedHtml(name),
    }),
  }).catch(() => {
    // Billing state is the source of truth; email delivery should not block Stripe event processing.
  });
}

function paymentFailedHtml(name: string): string {
  return `
    <p>Hi ${escapeHtml(name)},</p>
    <p>We could not process your Onara subscription payment.</p>
    <p>Please update your billing details to keep your live site and plan features active.</p>
    <p><a href="https://onara.tech/account/billing">Manage billing</a></p>
    <p>If you have questions, reply to this email and we will help.</p>
  `;
}

function displayName(user: BillingEmailUser | null): string {
  return asString(user?.full_name)?.split(" ")[0] ?? "there";
}

function stripeTimestampToIso(value: unknown): string | undefined {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return undefined;
  }

  return new Date(value * 1000).toISOString();
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

async function verifyStripeSignature(
  payload: string,
  signatureHeader: string,
  secret: string,
): Promise<boolean> {
  const parts = Object.fromEntries(
    signatureHeader.split(",").map((part) => {
      const [key, value] = part.split("=", 2);
      return [key, value];
    }),
  );
  const timestamp = parts.t;
  const signature = parts.v1;

  if (!timestamp || !signature) {
    return false;
  }

  const ageSeconds = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(ageSeconds) || ageSeconds > 300) {
    return false;
  }

  const key = await crypto.subtle.importKey(
    "raw",
    textEncoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signedPayload = `${timestamp}.${payload}`;
  const digest = await crypto.subtle.sign("HMAC", key, textEncoder.encode(signedPayload));
  const expected = Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

  return timingSafeEqual(expected, signature);
}

function timingSafeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) {
    return false;
  }

  let diff = 0;
  for (let index = 0; index < left.length; index += 1) {
    diff |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }

  return diff === 0;
}
