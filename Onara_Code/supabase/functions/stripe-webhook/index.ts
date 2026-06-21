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

type ProjectForSuspension = {
  business_name?: string | null;
  cloudflare_project_name?: string | null;
  id: string;
  public_url?: string | null;
};

type ProjectForCustomDomain = {
  cloudflare_project_name?: string | null;
  id: string;
  public_url?: string | null;
};

type SuspensionReason = "canceled" | "payment_failed";

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
    case "checkout.session.async_payment_succeeded":
      return handleCheckoutCompleted(event, supabase);
    case "checkout.session.async_payment_failed":
      return handleCustomDomainPaymentFailed(event.data.object, supabase);
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
  const metadata = readMetadata(session);
  if (asString(metadata.purchase_type) === "custom_domain") {
    if (asString(session.payment_status) !== "paid") {
      return { ok: true };
    }

    return handleCustomDomainCheckoutCompleted(session, supabase);
  }

  const customerId = asString(session.customer);
  const subscriptionId = asString(session.subscription);
  const userId = asString(session.client_reference_id) ?? asString(metadata.user_id);

  if (!customerId || !subscriptionId || !userId) {
    return { ok: false, error: "checkout_session_missing_required_fields" };
  }

  const subscription = await retrieveSubscription(subscriptionId);
  subscription.customer = customerId;

  return upsertUserSubscription(subscription, supabase, userId);
}

async function handleCustomDomainCheckoutCompleted(
  session: Record<string, unknown>,
  supabase: ReturnType<typeof createServiceClient>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const metadata = readMetadata(session);
  const sessionId = asString(session.id);
  const userId = asString(metadata.user_id) ?? asString(session.client_reference_id);
  const projectId = asString(metadata.project_id);
  const domain = normalizedDomain(asString(metadata.custom_domain));
  const priceId = asString(metadata.price_id);
  const configuredPriceId = Deno.env.get("STRIPE_CUSTOM_DOMAIN_PRICE_ID")?.trim();

  if (!sessionId || !userId || !projectId || !domain) {
    return { ok: false, error: "custom_domain_checkout_missing_metadata" };
  }

  if (!configuredPriceId || priceId !== configuredPriceId) {
    return { ok: false, error: "custom_domain_checkout_price_mismatch" };
  }

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, cloudflare_project_name, public_url")
    .eq("id", projectId)
    .eq("user_id", userId)
    .eq("custom_domain", domain)
    .eq("custom_domain_checkout_session_id", sessionId)
    .maybeSingle();

  if (projectError) {
    return { ok: false, error: projectError.message };
  }

  if (!project) {
    return { ok: false, error: "custom_domain_project_not_found" };
  }

  const now = new Date().toISOString();
  const { error: provisioningError } = await supabase
    .from("projects")
    .update({
      custom_domain_error: null,
      custom_domain_purchased_at: now,
      custom_domain_status: "provisioning",
      updated_at: now,
    })
    .eq("id", projectId)
    .eq("user_id", userId);

  if (provisioningError) {
    return { ok: false, error: provisioningError.message };
  }

  await linkStripeCustomerIfMissing(asString(session.customer), userId, supabase);

  const projectRecord = project as ProjectForCustomDomain;
  const projectName = cloudflareProjectName(projectRecord);
  if (!projectName) {
    await markCustomDomainError(projectId, userId, "Cloudflare project is unavailable.", supabase);
    return { ok: true };
  }

  try {
    const result = await ensureCloudflareCustomDomain(projectName, domain);
    const status = customDomainStatus(result);
    const updateValues: Record<string, unknown> = {
      custom_domain_error: customDomainError(result),
      custom_domain_status: status,
      custom_domain_validation: customDomainValidation(result, projectName),
      updated_at: new Date().toISOString(),
    };

    if (status === "active") {
      updateValues.public_url = `https://${domain}`;
    }

    const { error: updateError } = await supabase
      .from("projects")
      .update(updateValues)
      .eq("id", projectId)
      .eq("user_id", userId);

    return updateError ? { ok: false, error: updateError.message } : { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Cloudflare domain setup failed.";
    await markCustomDomainError(projectId, userId, message, supabase);
    return { ok: true };
  }
}

async function handleCustomDomainPaymentFailed(
  session: Record<string, unknown>,
  supabase: ReturnType<typeof createServiceClient>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const metadata = readMetadata(session);
  if (asString(metadata.purchase_type) !== "custom_domain") {
    return { ok: true };
  }

  const sessionId = asString(session.id);
  const userId = asString(metadata.user_id) ?? asString(session.client_reference_id);
  const projectId = asString(metadata.project_id);
  if (!sessionId || !userId || !projectId) {
    return { ok: false, error: "custom_domain_failed_payment_missing_metadata" };
  }

  const { error } = await supabase
    .from("projects")
    .update({
      custom_domain_error: "Payment did not complete. Reopen checkout to try again.",
      custom_domain_status: "checkout_pending",
      updated_at: new Date().toISOString(),
    })
    .eq("id", projectId)
    .eq("user_id", userId)
    .eq("custom_domain_checkout_session_id", sessionId);

  return error ? { ok: false, error: error.message } : { ok: true };
}

async function linkStripeCustomerIfMissing(
  customerId: string | undefined,
  userId: string,
  supabase: ReturnType<typeof createServiceClient>,
): Promise<void> {
  if (!customerId) {
    return;
  }

  await supabase
    .from("users")
    .update({ stripe_customer_id: customerId })
    .eq("id", userId)
    .is("stripe_customer_id", null);
}

async function markCustomDomainError(
  projectId: string,
  userId: string,
  message: string,
  supabase: ReturnType<typeof createServiceClient>,
): Promise<void> {
  await supabase
    .from("projects")
    .update({
      custom_domain_error: message,
      custom_domain_status: "error",
      updated_at: new Date().toISOString(),
    })
    .eq("id", projectId)
    .eq("user_id", userId);
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

  const { data: user, error } = await supabase
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
    .eq("stripe_customer_id", customerId)
    .select("id")
    .maybeSingle();

  if (error) {
    return { ok: false, error: error.message };
  }

  const userId = asString((user as Record<string, unknown> | null)?.id);
  return userId ? suspendUserSites(userId, "canceled", supabase) : { ok: true };
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
    .update({ show_url: false, subscription_status: "past_due" })
    .eq("stripe_customer_id", customerId)
    .select("id, email, full_name")
    .maybeSingle();

  if (error) {
    return { ok: false, error: error.message };
  }

  const userId = asString((user as Record<string, unknown> | null)?.id);
  if (userId) {
    const suspendResult = await suspendUserSites(userId, "payment_failed", supabase);
    if (!suspendResult.ok) {
      return suspendResult;
    }
  }

  await sendPaymentFailedEmail(user as BillingEmailUser | null);
  return { ok: true };
}

async function suspendUserSites(
  userId: string,
  reason: SuspensionReason,
  supabase: ReturnType<typeof createServiceClient>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data: projects, error } = await supabase
    .from("projects")
    .select("id, business_name, cloudflare_project_name, public_url")
    .eq("user_id", userId)
    .eq("status", "live");

  if (error) {
    return { ok: false, error: error.message };
  }

  const liveProjects = (projects ?? []) as ProjectForSuspension[];
  for (const project of liveProjects) {
    const projectName = cloudflareProjectName(project);
    if (projectName) {
      await deploySuspensionPlaceholder(projectName, project, reason);
    }
  }

  const projectIds = liveProjects.map((project) => project.id);
  if (projectIds.length === 0) {
    return { ok: true };
  }

  const { error: updateError } = await supabase
    .from("projects")
    .update({
      current_agent: "done",
      error_message: suspensionMessage(reason),
      status: "suspended",
      updated_at: new Date().toISOString(),
    })
    .in("id", projectIds);

  return updateError ? { ok: false, error: updateError.message } : { ok: true };
}

async function deploySuspensionPlaceholder(
  projectName: string,
  project: ProjectForSuspension,
  reason: SuspensionReason,
): Promise<void> {
  await ensureCloudflareProject(projectName);

  const body = new FormData();
  body.append(
    "file",
    new Blob([suspensionHtml(project, reason)], { type: "text/html;charset=utf-8" }),
    "index.html",
  );

  await cloudflareRequest(`/pages/projects/${encodeURIComponent(projectName)}/deployments`, {
    body,
    method: "POST",
  });
}

async function ensureCloudflareProject(projectName: string): Promise<void> {
  const existing = await cloudflareRequest(
    `/pages/projects/${encodeURIComponent(projectName)}`,
    { method: "GET" },
    { allowNotFound: true },
  );

  if (existing !== null) {
    return;
  }

  await cloudflareRequest("/pages/projects", {
    body: JSON.stringify({
      name: projectName,
      production_branch: Deno.env.get("CLOUDFLARE_PAGES_BRANCH") || "main",
    }),
    headers: { "content-type": "application/json" },
    method: "POST",
  });
}

async function ensureCloudflareCustomDomain(
  projectName: string,
  domain: string,
): Promise<Record<string, unknown>> {
  const domainPath = `/pages/projects/${encodeURIComponent(projectName)}/domains/${encodeURIComponent(domain)}`;
  const existing = await cloudflareRequest(
    domainPath,
    { method: "GET" },
    { allowNotFound: true },
  );

  if (existing) {
    return existing;
  }

  return await cloudflareRequest(
    `/pages/projects/${encodeURIComponent(projectName)}/domains`,
    {
      body: JSON.stringify({ name: domain }),
      headers: { "content-type": "application/json" },
      method: "POST",
    },
  ) ?? {};
}

async function cloudflareRequest(
  path: string,
  init: RequestInit,
  options: { allowNotFound?: boolean } = {},
): Promise<Record<string, unknown> | null> {
  const accountId = Deno.env.get("CLOUDFLARE_ACCOUNT_ID")?.trim();
  const apiToken = Deno.env.get("CLOUDFLARE_API_TOKEN")?.trim();
  if (!accountId || !apiToken) {
    throw new Error("Missing Cloudflare suspension deployment environment variables");
  }

  const apiUrl = (Deno.env.get("CLOUDFLARE_API_URL") || "https://api.cloudflare.com/client/v4").replace(/\/+$/, "");
  const headers = new Headers(init.headers);
  headers.set("authorization", `Bearer ${apiToken}`);

  const response = await fetch(`${apiUrl}/accounts/${encodeURIComponent(accountId)}${path}`, {
    ...init,
    headers,
  });

  if (options.allowNotFound && response.status === 404) {
    return null;
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok || !cloudflareSucceeded(payload)) {
    throw new Error(cloudflareErrorMessage(payload) ?? `Cloudflare request failed with ${response.status}`);
  }

  return isPlainObject(payload) && isPlainObject(payload.result) ? payload.result : {};
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
        "Questions? Reply to this email or contact support@onara.tech.",
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
    <p>Questions? Reply to this email or contact <a href="mailto:support@onara.tech">support@onara.tech</a>.</p>
  `;
}

function suspensionHtml(project: ProjectForSuspension, reason: SuspensionReason): string {
  const businessName = asString(project.business_name) ?? "This website";
  const title = reason === "canceled" ? "Website unavailable" : "Website temporarily unavailable";
  const detail = reason === "canceled"
    ? "This Onara-hosted site is no longer active because the subscription ended."
    : "This Onara-hosted site is temporarily unavailable while billing is updated.";

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex, nofollow">
    <title>${escapeHtml(title)} | Onara</title>
    <style>
      :root {
        color-scheme: light;
        --paper: #f8f4ee;
        --ink: #1f1c19;
        --muted: #72675d;
        --rule: #ded4c8;
        --accent: #c96a32;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        background: var(--paper);
        color: var(--ink);
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      main {
        width: min(620px, calc(100vw - 32px));
        border: 1px solid var(--rule);
        background: #fffaf4;
        padding: 38px;
      }
      .eyebrow {
        margin: 0 0 14px;
        color: var(--accent);
        font: 700 11px/1.2 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
        letter-spacing: 0.22em;
        text-transform: uppercase;
      }
      h1 {
        margin: 0;
        font-family: Georgia, "Times New Roman", serif;
        font-size: clamp(36px, 8vw, 68px);
        font-weight: 500;
        letter-spacing: -0.06em;
        line-height: 0.92;
      }
      p {
        margin: 22px 0 0;
        max-width: 460px;
        color: var(--muted);
        font-size: 17px;
        line-height: 1.55;
      }
      strong { color: var(--ink); }
    </style>
  </head>
  <body>
    <main>
      <p class="eyebrow">Onara site status</p>
      <h1>${escapeHtml(title)}</h1>
      <p><strong>${escapeHtml(businessName)}</strong> is not available right now. ${escapeHtml(detail)}</p>
    </main>
  </body>
</html>`;
}

function suspensionMessage(reason: SuspensionReason): string {
  return reason === "canceled"
    ? "Subscription canceled. Placeholder page deployed to Cloudflare."
    : "Payment failed. Placeholder page deployed to Cloudflare.";
}

function cloudflareProjectName(project: ProjectForSuspension): string | null {
  return normalizedProjectName(project.cloudflare_project_name)
    ?? projectNameFromPagesUrl(project.public_url)
    ?? cloudflareProjectNameFromId(project.id);
}

function customDomainStatus(result: Record<string, unknown>): "pending_dns" | "active" | "error" {
  const status = asString(result.status) ?? "pending";
  if (status === "active") {
    return "active";
  }

  if (customDomainError(result) || ["blocked", "deactivated", "error"].includes(status)) {
    return "error";
  }

  return "pending_dns";
}

function customDomainError(result: Record<string, unknown>): string | null {
  const validation = isPlainObject(result.validation_data) ? result.validation_data : {};
  const verification = isPlainObject(result.verification_data) ? result.verification_data : {};
  return asString(validation.error_message) ?? asString(verification.error_message) ?? null;
}

function customDomainValidation(result: Record<string, unknown>, projectName: string) {
  const validation = isPlainObject(result.validation_data) ? result.validation_data : {};
  const verification = isPlainObject(result.verification_data) ? result.verification_data : {};

  return {
    checked_at: new Date().toISOString(),
    cloudflare_status: asString(result.status) ?? "pending",
    cname_target: `${projectName}.pages.dev`,
    validation_method: asString(validation.method),
    validation_status: asString(validation.status),
    verification_status: asString(verification.status),
    txt_name: asString(validation.txt_name),
    txt_value: asString(validation.txt_value),
  };
}

function normalizedDomain(value: string | undefined): string | null {
  const domain = value?.trim().toLowerCase().replace(/\.$/, "");
  if (!domain || !/^(?=.{4,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(domain)) {
    return null;
  }

  return domain;
}

function cloudflareProjectNameFromId(projectId: string): string | null {
  const prefix = safeSlug(Deno.env.get("CLOUDFLARE_PAGES_PROJECT_PREFIX") || "onara-site", "onara-site");
  const cleanId = safeSlug(projectId, "site");
  const maxLength = 28;
  const suffixLength = Math.max(1, maxLength - prefix.length - 1);
  return normalizedProjectName(`${prefix}-${cleanId.slice(0, suffixLength)}`);
}

function normalizedProjectName(value: string | null | undefined): string | null {
  const text = value?.trim();
  if (!text || !/^[a-z0-9][a-z0-9-]{0,62}$/i.test(text)) {
    return null;
  }

  return text.toLowerCase();
}

function projectNameFromPagesUrl(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  let hostname: string;
  try {
    hostname = new URL(value).hostname;
  } catch {
    return null;
  }

  if (!hostname.endsWith(".pages.dev")) {
    return null;
  }

  const parts = hostname.split(".");
  const projectName = parts.length >= 4 ? parts[parts.length - 3] : parts[0];
  return normalizedProjectName(projectName);
}

function safeSlug(value: string, fallback: string): string {
  const slug = value.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/-{2,}/g, "-").replace(/^-|-$/g, "");
  return slug || fallback;
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

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function cloudflareSucceeded(payload: unknown): boolean {
  return isPlainObject(payload) && payload.success !== false;
}

function cloudflareErrorMessage(payload: unknown): string | null {
  if (!isPlainObject(payload) || !Array.isArray(payload.errors) || payload.errors.length === 0) {
    return null;
  }

  return payload.errors
    .map((error) => isPlainObject(error) ? asString(error.message) ?? JSON.stringify(error) : String(error))
    .join("; ");
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
