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
  id: string;
  customer: string;
  status: string;
  priceId?: string;
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

  const event = JSON.parse(payload) as StripeEvent;
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
      return jsonResponse({ ok: true, duplicate: true });
    }

    return jsonResponse({ error: "event_store_failed", detail: insertError.message }, 500);
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
  const plan = planFromPriceId(subscription.priceId);

  const { error } = await supabase
    .from("users")
    .update({
      plan,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      subscription_status: subscription.status,
      is_trial: false,
      revisions_limit: revisionsLimitForPlan(plan),
      show_url: true,
    })
    .eq("id", userId);

  return error ? { ok: false, error: error.message } : { ok: true };
}

async function handleSubscriptionChanged(
  subscriptionObject: Record<string, unknown>,
  supabase: ReturnType<typeof createServiceClient>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const subscription = subscriptionFromObject(subscriptionObject);
  if (!subscription.customer) {
    return { ok: false, error: "subscription_missing_customer" };
  }

  const plan = planFromPriceId(subscription.priceId);
  const { error } = await supabase
    .from("users")
    .update({
      plan,
      stripe_subscription_id: subscription.id,
      subscription_status: subscription.status,
      is_trial: false,
      revisions_limit: revisionsLimitForPlan(plan),
      show_url: true,
    })
    .eq("stripe_customer_id", subscription.customer);

  return error ? { ok: false, error: error.message } : { ok: true };
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
      is_trial: false,
      revisions_limit: 3,
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

  const { error } = await supabase
    .from("users")
    .update({ subscription_status: "past_due" })
    .eq("stripe_customer_id", customerId);

  return error ? { ok: false, error: error.message } : { ok: true };
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
    id: asString(subscription.id) ?? "",
    customer: asString(subscription.customer) ?? "",
    status: asString(subscription.status) ?? "active",
    priceId: asString(price?.id),
  };
}

function readMetadata(object: Record<string, unknown>): Record<string, unknown> {
  return (object.metadata as Record<string, unknown> | undefined) ?? {};
}

function planFromPriceId(priceId?: string): "starter" | "pro" {
  if (priceId && priceId === Deno.env.get("STRIPE_PRO_PRICE_ID")) {
    return "pro";
  }

  return "starter";
}

function revisionsLimitForPlan(plan: "starter" | "pro"): number {
  return plan === "pro" ? -1 : 10;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
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
