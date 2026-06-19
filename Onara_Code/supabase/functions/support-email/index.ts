import { jsonResponse, requireMethod } from "../_shared/http.ts";
import { createServiceClient } from "../_shared/supabase.ts";

type InboundEvent = {
  id?: unknown;
  type?: unknown;
  created_at?: unknown;
  data?: Record<string, unknown>;
};

type ParsedAddress = {
  email: string | null;
  name: string | null;
};

type TriageResult = {
  classification: SupportClassification;
  escalationRequired: boolean;
  escalationReason: string | null;
  reply: string;
};

type SupportClassification =
  | "general"
  | "billing"
  | "account"
  | "security"
  | "technical"
  | "sales"
  | "legal"
  | "spam";

const SUPPORT_ADDRESS = "support@onara.tech";
const DEFAULT_SUPPORT_MODEL = "z-ai/glm-5.1";
const textEncoder = new TextEncoder();

Deno.serve(async (request) => {
  const methodError = requireMethod(request, "POST");
  if (methodError) return methodError;

  const payload = await request.text();
  const authError = await verifyRequest(request, payload);
  if (authError) return authError;

  let event: InboundEvent;
  try {
    event = JSON.parse(payload) as InboundEvent;
  } catch {
    return jsonResponse({ error: "invalid_json" }, 400);
  }

  const eventType = stringValue(event.type);
  if (eventType && eventType !== "email.received") {
    return jsonResponse({ ok: true, ignored: true, type: eventType });
  }

  const data = objectValue(event.data) ?? {};
  const resendEmailId = stringValue(data.email_id ?? data.id);
  const emailContent = resendEmailId ? await fetchReceivedEmail(resendEmailId) : null;
  const email = { ...data, ...(emailContent ?? {}) };
  const from = parseAddress(stringValue(email.from));
  const toEmails = addressList(email.to);
  const ccEmails = addressList(email.cc);
  const subject = truncate(stringValue(email.subject) || "(no subject)", 320) ?? "(no subject)";
  const inboundText = truncate(bestText(email), 8000);
  const inboundHtml = truncate(stringValue(email.html), 20000);
  const resendMessageId = stringValue(email.message_id);
  const inboundEventId = stringValue(
    event.id ??
      request.headers.get("svix-id") ??
      resendEmailId ??
      resendMessageId,
  ) || crypto.randomUUID();

  const deterministicTriage = classifySupportMessage(subject, inboundText ?? "");
  const supabase = createServiceClient();
  const inserted = await supabase
    .from("support_threads")
    .insert({
      inbound_event_id: inboundEventId,
      resend_email_id: resendEmailId || null,
      resend_message_id: resendMessageId || null,
      from_email: from.email,
      from_name: from.name,
      to_emails: toEmails,
      cc_emails: ccEmails,
      subject,
      inbound_text: inboundText,
      inbound_html: inboundHtml,
      inbound_headers: objectValue(email.headers) ?? {},
      raw_payload: event,
      classification: deterministicTriage.classification,
      escalation_required: deterministicTriage.escalationRequired,
      escalation_reason: deterministicTriage.escalationReason,
      ai_status: "pending",
      forward_status: "pending",
    })
    .select("id")
    .single<{ id: string }>();

  if (inserted.error) {
    if (inserted.error.code === "23505") {
      return jsonResponse({ ok: true, duplicate: true });
    }

    return jsonResponse({ error: "support_thread_log_failed", detail: inserted.error.message }, 500);
  }

  const threadId = inserted.data.id;
  const triage = await runTriage({
    deterministicTriage,
    from,
    inboundText,
    subject,
  });
  const replyResult = await sendFirstReply({ from, subject, triage });
  const forwardResult = await forwardToHuman({
    ccEmails,
    from,
    inboundText,
    subject,
    threadId,
    toEmails,
    triage,
  });

  const aiStatus = "skipped" in replyResult
    ? replyResult.reason === "disabled"
      ? "disabled"
      : "skipped"
    : replyResult.ok
      ? "sent"
      : "failed";

  await supabase
    .from("support_threads")
    .update({
      ai_error: triage.aiError ?? resultError(replyResult),
      ai_model: triage.aiModel,
      ai_response: triage.reply,
      ai_status: aiStatus,
      classification: triage.classification,
      escalation_reason: triage.escalationReason,
      escalation_required: triage.escalationRequired,
      first_reply_sent_at: resultOk(replyResult) ? new Date().toISOString() : null,
      forward_error: resultError(forwardResult),
      forward_status: "skipped" in forwardResult ? "skipped" : forwardResult.ok ? "sent" : "failed",
      forwarded_at: resultOk(forwardResult) ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", threadId);

  return jsonResponse({
    ok: true,
    ai_status: aiStatus,
    classification: triage.classification,
    escalation_required: triage.escalationRequired,
    forward_status: "skipped" in forwardResult ? "skipped" : forwardResult.ok ? "sent" : "failed",
    thread_id: threadId,
  });
});

function resultOk(result: { ok: true } | { ok: false; error: string } | { skipped: true; reason: string }): boolean {
  return "ok" in result && result.ok;
}

function resultError(result: { ok: true } | { ok: false; error: string } | { skipped: true; reason: string }): string | null {
  return "ok" in result && !result.ok ? result.error : null;
}

async function verifyRequest(request: Request, payload: string): Promise<Response | null> {
  const webhookSecret = Deno.env.get("RESEND_WEBHOOK_SECRET")?.trim();

  if (webhookSecret) {
    const valid = await verifySvixSignature({
      id: request.headers.get("svix-id"),
      payload,
      secret: webhookSecret,
      signature: request.headers.get("svix-signature"),
      timestamp: request.headers.get("svix-timestamp"),
    });

    return valid ? null : jsonResponse({ error: "invalid_signature" }, 400);
  }

  const fallbackSecret = Deno.env.get("SUPPORT_EMAIL_WEBHOOK_SECRET")?.trim();
  const expected = fallbackSecret ? `Bearer ${fallbackSecret}` : "";

  if (expected && request.headers.get("authorization") === expected) {
    return null;
  }

  return jsonResponse({ error: "missing_webhook_secret" }, 500);
}

async function verifySvixSignature({
  id,
  payload,
  secret,
  signature,
  timestamp,
}: {
  id: string | null;
  payload: string;
  secret: string;
  signature: string | null;
  timestamp: string | null;
}): Promise<boolean> {
  if (!id || !signature || !timestamp) return false;

  const timestampSeconds = Number(timestamp);
  if (!Number.isFinite(timestampSeconds)) return false;

  const toleranceSeconds = Number(Deno.env.get("SUPPORT_WEBHOOK_TOLERANCE_SECONDS") ?? "300");
  if (Math.abs(Date.now() / 1000 - timestampSeconds) > toleranceSeconds) return false;

  const secretBytes = decodeSvixSecret(secret);
  const key = await crypto.subtle.importKey(
    "raw",
    secretBytes,
    { hash: "SHA-256", name: "HMAC" },
    false,
    ["sign"],
  );
  const signedContent = `${id}.${timestamp}.${payload}`;
  const expectedBytes = new Uint8Array(await crypto.subtle.sign("HMAC", key, textEncoder.encode(signedContent)));

  return signature
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean)
    .some((part) => {
      const [version, value] = part.split(",", 2);
      if (version !== "v1" || !value) return false;
      return timingSafeEqual(expectedBytes, base64Bytes(value));
    });
}

function decodeSvixSecret(secret: string): Uint8Array {
  const value = secret.startsWith("whsec_") ? secret.slice("whsec_".length) : secret;
  try {
    return base64Bytes(value);
  } catch {
    return textEncoder.encode(secret);
  }
}

function base64Bytes(value: string): Uint8Array {
  return Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let index = 0; index < a.length; index += 1) {
    result |= a[index] ^ b[index];
  }
  return result === 0;
}

async function fetchReceivedEmail(emailId: string): Promise<Record<string, unknown> | null> {
  const resendApiKey = Deno.env.get("RESEND_API_KEY")?.trim();
  if (!resendApiKey) return null;

  const response = await fetch(`https://api.resend.com/emails/receiving/${encodeURIComponent(emailId)}`, {
    headers: {
      authorization: `Bearer ${resendApiKey}`,
      "content-type": "application/json",
    },
  });

  if (!response.ok) return null;

  const body = await response.json().catch(() => null);
  if (!body) return null;

  return objectValue((body as Record<string, unknown>).data) ?? objectValue(body);
}

async function runTriage({
  deterministicTriage,
  from,
  inboundText,
  subject,
}: {
  deterministicTriage: TriageResult;
  from: ParsedAddress;
  inboundText: string | null;
  subject: string;
}): Promise<TriageResult & { aiError: string | null; aiModel: string }> {
  const aiEnabled = (Deno.env.get("FEATURE_SUPPORT_AI_RESPONDER") ?? "").toLowerCase() === "true";
  const model = Deno.env.get("SUPPORT_AI_MODEL")?.trim() || DEFAULT_SUPPORT_MODEL;

  if (!aiEnabled) {
    return { ...deterministicTriage, aiError: null, aiModel: "disabled" };
  }

  const apiKey = Deno.env.get("NVIDIA_NIM_API_KEY")?.trim();
  if (!apiKey) {
    return {
      ...deterministicTriage,
      aiError: "nvidia_nim_not_configured",
      aiModel: "fallback",
    };
  }

  const baseUrl = (Deno.env.get("NVIDIA_NIM_BASE_URL") ?? "https://integrate.api.nvidia.com/v1").replace(/\/$/, "");
  const body = inboundText || "(No readable email body was available from the webhook.)";

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      body: JSON.stringify({
        max_tokens: 520,
        messages: [
          {
            role: "system",
            content: [
              "You are Onara's first-line support email responder.",
              "Return JSON only with keys: classification, escalation_required, escalation_reason, reply.",
              "classification must be one of general, billing, account, security, technical, sales, legal, spam.",
              "Escalate billing, payments, refunds, cancellation, account access, login, password, security, privacy, legal, abuse, or deletion requests.",
              "For escalated topics, send only a brief acknowledgement saying a human will review it. Do not make account, billing, legal, refund, or security promises.",
              "Never ask for passwords, API keys, card numbers, or secret keys.",
              "For ordinary product questions, be concise and helpful in Onara's direct tone.",
            ].join(" "),
          },
          {
            role: "user",
            content: [
              `From: ${from.email ?? "unknown"}`,
              `Subject: ${subject}`,
              "Email:",
              body.slice(0, 6000),
            ].join("\n"),
          },
        ],
        model,
        temperature: 0.2,
      }),
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      method: "POST",
    });

    if (!response.ok) {
      return {
        ...deterministicTriage,
        aiError: `nim_${response.status}:${(await response.text()).slice(0, 200)}`,
        aiModel: model,
      };
    }

    const data = await response.json();
    const content = stringValue(data?.choices?.[0]?.message?.content);
    const parsed = parseTriageJson(content);
    if (!parsed) {
      return { ...deterministicTriage, aiError: "nim_invalid_json", aiModel: model };
    }

    return mergeTriage(deterministicTriage, parsed, model);
  } catch (error) {
    return {
      ...deterministicTriage,
      aiError: error instanceof Error ? error.message : "nim_request_failed",
      aiModel: model,
    };
  }
}

function parseTriageJson(content: string): TriageResult | null {
  const trimmed = content.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
  const jsonStart = trimmed.indexOf("{");
  const jsonEnd = trimmed.lastIndexOf("}");
  if (jsonStart === -1 || jsonEnd === -1) return null;

  try {
    const parsed = JSON.parse(trimmed.slice(jsonStart, jsonEnd + 1)) as Record<string, unknown>;
    const classification = normalizeClassification(stringValue(parsed.classification));
    const reply = truncate(stringValue(parsed.reply), 1400);
    if (!reply) return null;

    return {
      classification,
      escalationReason: truncate(stringValue(parsed.escalation_reason), 500),
      escalationRequired: Boolean(parsed.escalation_required),
      reply,
    };
  } catch {
    return null;
  }
}

function mergeTriage(base: TriageResult, ai: TriageResult, model: string): TriageResult & { aiError: null; aiModel: string } {
  const escalationRequired = base.escalationRequired || ai.escalationRequired;
  const classification = base.escalationRequired ? base.classification : ai.classification;
  const escalationReason = escalationRequired
    ? base.escalationReason ?? ai.escalationReason ?? "Human review required"
    : null;

  return {
    aiError: null,
    aiModel: model,
    classification,
    escalationReason,
    escalationRequired,
    reply: escalationRequired ? safeEscalationReply() : ai.reply,
  };
}

function classifySupportMessage(subject: string, body: string): TriageResult {
  const text = `${subject}\n${body}`.toLowerCase();
  const checks: Array<{ classification: SupportClassification; keywords: string[]; reason: string }> = [
    {
      classification: "billing",
      keywords: ["billing", "payment", "invoice", "refund", "charge", "card", "stripe", "subscription", "cancel", "downgrade", "upgrade", "price", "plan"],
      reason: "Billing or subscription request needs human review",
    },
    {
      classification: "security",
      keywords: ["security", "hacked", "compromised", "breach", "api key", "secret key", "token", "unauthorized", "phishing"],
      reason: "Security request needs human review",
    },
    {
      classification: "account",
      keywords: ["login", "log in", "sign in", "password", "account", "oauth", "google sign", "delete my account", "email change"],
      reason: "Account access request needs human review",
    },
    {
      classification: "legal",
      keywords: ["legal", "privacy", "terms", "gdpr", "delete data", "data request", "lawsuit", "copyright"],
      reason: "Legal or privacy request needs human review",
    },
  ];

  for (const check of checks) {
    if (check.keywords.some((keyword) => text.includes(keyword))) {
      return {
        classification: check.classification,
        escalationReason: check.reason,
        escalationRequired: true,
        reply: safeEscalationReply(),
      };
    }
  }

  return {
    classification: text.includes("domain") || text.includes("dns") || text.includes("deploy") ? "technical" : "general",
    escalationReason: null,
    escalationRequired: false,
    reply: [
      "Thanks for reaching out to Onara. I received your message and will help route it.",
      "If this is about a generated site, reply with the site URL and what happened so we can look at the right project.",
    ].join(" "),
  };
}

function safeEscalationReply(): string {
  return [
    "Thanks for reaching out to Onara. I received your message and routed it to Aarush for human review because it may involve billing, account access, security, privacy, or another sensitive issue.",
    "We will follow up from support@onara.tech. Please do not send passwords, card numbers, API keys, or secret keys by email.",
  ].join(" ");
}

async function sendFirstReply({
  from,
  subject,
  triage,
}: {
  from: ParsedAddress;
  subject: string;
  triage: TriageResult;
}): Promise<{ ok: true } | { ok: false; error: string } | { skipped: true; reason: string }> {
  if ((Deno.env.get("FEATURE_SUPPORT_AI_RESPONDER") ?? "").toLowerCase() !== "true") {
    return { skipped: true, reason: "disabled" };
  }

  if (!from.email) return { skipped: true, reason: "missing_sender" };
  if (from.email.endsWith("@onara.tech")) return { skipped: true, reason: "internal_sender" };

  return sendResendEmail({
    html: supportReplyHtml(triage.reply),
    replyTo: SUPPORT_ADDRESS,
    subject: `Re: ${subject}`,
    text: triage.reply,
    to: from.email,
  });
}

async function forwardToHuman({
  ccEmails,
  from,
  inboundText,
  subject,
  threadId,
  toEmails,
  triage,
}: {
  ccEmails: string[];
  from: ParsedAddress;
  inboundText: string | null;
  subject: string;
  threadId: string;
  toEmails: string[];
  triage: TriageResult;
}): Promise<{ ok: true } | { ok: false; error: string } | { skipped: true; reason: string }> {
  const forwardTo = Deno.env.get("SUPPORT_FORWARD_TO")?.trim();
  if (!forwardTo) return { skipped: true, reason: "support_forward_to_missing" };

  const text = [
    `Support thread: ${threadId}`,
    `Classification: ${triage.classification}`,
    `Escalation required: ${triage.escalationRequired ? "yes" : "no"}`,
    triage.escalationReason ? `Escalation reason: ${triage.escalationReason}` : null,
    "",
    `From: ${from.name ? `${from.name} <${from.email ?? "unknown"}>` : from.email ?? "unknown"}`,
    `To: ${toEmails.join(", ") || SUPPORT_ADDRESS}`,
    ccEmails.length ? `Cc: ${ccEmails.join(", ")}` : null,
    `Subject: ${subject}`,
    "",
    "Inbound message:",
    inboundText || "(No readable body)",
    "",
    "First reply:",
    triage.reply,
  ].filter((line) => line !== null).join("\n");

  return sendResendEmail({
    html: forwardHtml(text),
    replyTo: from.email ?? SUPPORT_ADDRESS,
    subject: `[Onara support] ${triage.escalationRequired ? "ESCALATE: " : ""}${subject}`,
    text,
    to: forwardTo,
  });
}

async function sendResendEmail({
  html,
  replyTo,
  subject,
  text,
  to,
}: {
  html: string;
  replyTo: string;
  subject: string;
  text: string;
  to: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const resendApiKey = Deno.env.get("RESEND_API_KEY")?.trim();
  if (!resendApiKey) return { ok: false, error: "resend_not_configured" };

  const from = Deno.env.get("SUPPORT_FROM_EMAIL") || Deno.env.get("RESEND_FROM_EMAIL") || `Onara Support <${SUPPORT_ADDRESS}>`;
  const response = await fetch("https://api.resend.com/emails", {
    body: JSON.stringify({
      from,
      html,
      reply_to: replyTo,
      subject,
      text,
      to,
    }),
    headers: {
      authorization: `Bearer ${resendApiKey}`,
      "content-type": "application/json",
    },
    method: "POST",
  });

  if (!response.ok) {
    return { ok: false, error: `resend_${response.status}:${(await response.text()).slice(0, 240)}` };
  }

  return { ok: true };
}

function supportReplyHtml(reply: string): string {
  return `
    <div style="margin:0; padding:0; background:#f7f3ee; color:#1d1b18; font-family:Inter, Arial, sans-serif;">
      <div style="max-width:620px; margin:0 auto; padding:28px 20px;">
        <div style="border:1px solid #ded7ce; background:#fffaf4; padding:22px;">
          <p style="margin:0 0 14px; color:#9a4f22; font:700 11px/1.2 monospace; letter-spacing:.14em; text-transform:uppercase;">Onara support</p>
          <p style="margin:0; color:#2a2620; font-size:15px; line-height:1.65;">${escapeHtml(reply).replaceAll("\n", "<br>")}</p>
          <p style="margin:18px 0 0; color:#7c746b; font-size:12px; line-height:1.5;">Reply to this email to add more details.</p>
        </div>
      </div>
    </div>
  `;
}

function forwardHtml(text: string): string {
  return `<pre style="white-space:pre-wrap; font:13px/1.5 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;">${escapeHtml(text)}</pre>`;
}

function bestText(email: Record<string, unknown>): string {
  const text = stringValue(email.text);
  if (text) return text;
  return htmlToText(stringValue(email.html));
}

function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function parseAddress(value: string): ParsedAddress {
  const match = value.match(/^\s*(?:"?([^"<]*)"?)?\s*<([^>]+)>\s*$/);
  const email = sanitizeEmail(match?.[2] ?? value);
  const name = truncate((match?.[1] ?? "").trim(), 160);
  return { email, name };
}

function addressList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => sanitizeEmail(stringValue(item)))
      .filter((item): item is string => Boolean(item));
  }

  return stringValue(value)
    .split(",")
    .map((item) => sanitizeEmail(item))
    .filter((item): item is string => Boolean(item));
}

function sanitizeEmail(value: unknown): string | null {
  const email = stringValue(value).toLowerCase();
  if (!email) return null;
  const match = email.match(/[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9.-]+\.[a-z]{2,}/i);
  return match ? match[0].slice(0, 254) : null;
}

function normalizeClassification(value: string): SupportClassification {
  const normalized = value.toLowerCase();
  return ["general", "billing", "account", "security", "technical", "sales", "legal", "spam"].includes(normalized)
    ? normalized as SupportClassification
    : "general";
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function objectValue(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function truncate(value: string, maxLength: number): string | null {
  const text = value.trim();
  if (!text) return null;
  return text.length > maxLength ? text.slice(0, maxLength) : text;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
