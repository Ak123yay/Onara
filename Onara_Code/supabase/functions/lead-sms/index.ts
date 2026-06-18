import { createServiceClient } from "../_shared/supabase.ts";

type LeadPayload = {
  email?: unknown;
  message?: unknown;
  name?: unknown;
  phone?: unknown;
  project_id?: unknown;
  source_url?: unknown;
  website?: unknown;
};

type ProjectRecord = {
  business_name: string;
  business_phone: string | null;
  id: string;
  status: string;
  user_id: string;
};

const corsHeaders = {
  "access-control-allow-headers": "authorization, content-type",
  "access-control-allow-methods": "POST, OPTIONS",
  "access-control-allow-origin": "*",
  "content-type": "application/json",
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "method_not_allowed" }, 405);
  }

  let payload: LeadPayload;
  try {
    payload = (await request.json()) as LeadPayload;
  } catch {
    return jsonResponse({ error: "invalid_json" }, 400);
  }

  if (stringValue(payload.website)) {
    return jsonResponse({ ok: true, ignored: true });
  }

  const projectId = stringValue(payload.project_id);
  if (!projectId || !isUuid(projectId)) {
    return jsonResponse({ error: "invalid_project_id" }, 400);
  }

  const lead = {
    email: sanitizeEmail(payload.email),
    message: truncate(stringValue(payload.message), 1200),
    name: truncate(stringValue(payload.name), 120),
    phone: truncate(stringValue(payload.phone), 80),
    sourceUrl: truncate(stringValue(payload.source_url), 500),
    userAgent: truncate(request.headers.get("user-agent") ?? "", 500),
  };

  if (!lead.message && !lead.phone && !lead.email) {
    return jsonResponse({ error: "empty_lead" }, 400);
  }

  const supabase = createServiceClient();
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, user_id, business_name, business_phone, status")
    .eq("id", projectId)
    .maybeSingle<ProjectRecord>();

  if (projectError) {
    return jsonResponse({ error: "project_lookup_failed" }, 500);
  }

  if (!project) {
    return jsonResponse({ error: "project_not_found" }, 404);
  }

  if (project.status !== "live") {
    return jsonResponse({ error: "project_not_live" }, 403);
  }

  const smsEnabled = (Deno.env.get("FEATURE_LEAD_SMS") ?? "").toLowerCase() === "true";
  const initialSmsStatus = smsEnabled ? "pending" : "disabled";

  const { data: insertedLead, error: insertError } = await supabase
    .from("leads")
    .insert({
      project_id: project.id,
      user_id: project.user_id,
      visitor_name: lead.name,
      visitor_email: lead.email,
      visitor_phone: lead.phone,
      message: lead.message,
      source_url: lead.sourceUrl,
      user_agent: lead.userAgent,
      sms_status: initialSmsStatus,
    })
    .select("id")
    .single<{ id: string }>();

  if (insertError || !insertedLead) {
    return jsonResponse({ error: "lead_log_failed" }, 500);
  }

  if (!smsEnabled) {
    return jsonResponse({ ok: true, lead_id: insertedLead.id, sms_status: "disabled" });
  }

  const toPhone = normalizeSmsPhone(project.business_phone);
  if (!toPhone) {
    await updateLeadSmsStatus(supabase, insertedLead.id, "skipped", "business_phone_missing");
    return jsonResponse({ ok: true, lead_id: insertedLead.id, sms_status: "skipped" });
  }

  const smsResult = await sendLeadSms({
    body: leadSmsBody(project.business_name, lead),
    to: toPhone,
  });

  if (!smsResult.ok) {
    await updateLeadSmsStatus(supabase, insertedLead.id, "failed", smsResult.error);
    return jsonResponse({ ok: true, lead_id: insertedLead.id, sms_status: "failed" });
  }

  await supabase
    .from("leads")
    .update({
      sms_status: "sent",
      sms_error: null,
      sms_sent_at: new Date().toISOString(),
    })
    .eq("id", insertedLead.id);

  return jsonResponse({ ok: true, lead_id: insertedLead.id, sms_status: "sent" });
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    headers: corsHeaders,
    status,
  });
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function truncate(value: string, maxLength: number): string | null {
  const text = value.trim();
  if (!text) return null;
  return text.length > maxLength ? text.slice(0, maxLength) : text;
}

function sanitizeEmail(value: unknown): string | null {
  const email = stringValue(value).toLowerCase();
  if (!email) return null;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email.slice(0, 254) : null;
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function normalizeSmsPhone(value: string | null | undefined): string | null {
  const raw = stringValue(value);
  if (!raw) return null;
  const plus = raw.trim().startsWith("+");
  const digits = raw.replace(/\D/g, "");
  if (plus && digits.length >= 8) return `+${digits}`;
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return null;
}

function leadSmsBody(
  businessName: string,
  lead: { email: string | null; message: string | null; name: string | null; phone: string | null },
): string {
  const lines = [
    `New Onara lead for ${businessName}`,
    lead.name ? `Name: ${lead.name}` : null,
    lead.phone ? `Phone: ${lead.phone}` : null,
    lead.email ? `Email: ${lead.email}` : null,
    lead.message ? `Message: ${lead.message}` : null,
  ].filter(Boolean);

  return truncate(lines.join("\n"), 1400) ?? `New Onara lead for ${businessName}`;
}

async function sendLeadSms({ body, to }: { body: string; to: string }): Promise<{ ok: true } | { ok: false; error: string }> {
  const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID")?.trim();
  const authToken = Deno.env.get("TWILIO_AUTH_TOKEN")?.trim();
  const fromPhone = Deno.env.get("TWILIO_FROM_PHONE")?.trim();
  const messagingServiceSid = Deno.env.get("TWILIO_MESSAGING_SERVICE_SID")?.trim();

  if (!accountSid || !authToken || (!fromPhone && !messagingServiceSid)) {
    return { ok: false, error: "twilio_not_configured" };
  }

  const params = new URLSearchParams();
  params.set("To", to);
  params.set("Body", body);
  if (messagingServiceSid) {
    params.set("MessagingServiceSid", messagingServiceSid);
  } else if (fromPhone) {
    params.set("From", fromPhone);
  }

  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    body: params,
    headers: {
      authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
      "content-type": "application/x-www-form-urlencoded",
    },
    method: "POST",
  });

  if (!response.ok) {
    const detail = await response.text();
    return { ok: false, error: `twilio_${response.status}:${detail.slice(0, 240)}` };
  }

  return { ok: true };
}

async function updateLeadSmsStatus(
  supabase: ReturnType<typeof createServiceClient>,
  leadId: string,
  status: "failed" | "skipped",
  error: string,
): Promise<void> {
  await supabase
    .from("leads")
    .update({
      sms_error: error,
      sms_status: status,
    })
    .eq("id", leadId);
}
