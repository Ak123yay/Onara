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
  business_email: string | null;
  business_name: string;
  id: string;
  status: string;
  user_id: string;
};

type UserRecord = {
  email: string | null;
  full_name: string | null;
};

type Lead = {
  email: string | null;
  message: string | null;
  name: string | null;
  phone: string | null;
  sourceUrl: string | null;
  userAgent: string | null;
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

  const lead: Lead = {
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
    .select("id, user_id, business_name, business_email, status")
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

  const emailEnabled = (Deno.env.get("FEATURE_LEAD_EMAIL") ?? "").toLowerCase() === "true";
  const initialEmailStatus = emailEnabled ? "pending" : "disabled";

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
      email_status: initialEmailStatus,
    })
    .select("id")
    .single<{ id: string }>();

  if (insertError || !insertedLead) {
    return jsonResponse({ error: "lead_log_failed" }, 500);
  }

  if (!emailEnabled) {
    return jsonResponse({ ok: true, lead_id: insertedLead.id, email_status: "disabled" });
  }

  const { data: owner } = await supabase
    .from("users")
    .select("email, full_name")
    .eq("id", project.user_id)
    .maybeSingle<UserRecord>();

  const recipients = uniqueEmails(project.business_email, owner?.email);
  if (recipients.length === 0) {
    await updateLeadEmailStatus(supabase, insertedLead.id, "failed", "recipient_email_missing");
    return jsonResponse({ ok: true, lead_id: insertedLead.id, email_status: "failed" });
  }

  const emailResult = await sendLeadEmail({
    businessName: project.business_name,
    lead,
    ownerName: owner?.full_name ?? null,
    to: recipients,
  });

  if (!emailResult.ok) {
    await updateLeadEmailStatus(supabase, insertedLead.id, "failed", emailResult.error);
    return jsonResponse({ ok: true, lead_id: insertedLead.id, email_status: "failed" });
  }

  await supabase
    .from("leads")
    .update({
      email_error: null,
      email_sent_at: new Date().toISOString(),
      email_status: "sent",
    })
    .eq("id", insertedLead.id);

  return jsonResponse({ ok: true, lead_id: insertedLead.id, email_status: "sent" });
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

function uniqueEmails(...values: unknown[]): string[] {
  const output: string[] = [];
  const seen = new Set<string>();
  for (const value of values) {
    const email = sanitizeEmail(value);
    if (!email || seen.has(email)) continue;
    seen.add(email);
    output.push(email);
  }
  return output;
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i.test(value);
}

async function sendLeadEmail({
  businessName,
  lead,
  ownerName,
  to,
}: {
  businessName: string;
  lead: Lead;
  ownerName: string | null;
  to: string[];
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const resendApiKey = Deno.env.get("RESEND_API_KEY")?.trim();
  if (!resendApiKey) {
    return { ok: false, error: "resend_not_configured" };
  }

  const from = Deno.env.get("RESEND_FROM_EMAIL") || "hello@onara.tech";
  const fallbackReplyTo = Deno.env.get("RESEND_REPLY_TO") || "support@onara.tech";
  const replyTo = lead.email ?? fallbackReplyTo;
  const subject = `New lead for ${businessName}`;
  const text = leadEmailText({ businessName, lead, ownerName });

  const response = await fetch("https://api.resend.com/emails", {
    body: JSON.stringify({
      from,
      html: leadEmailHtml({ businessName, lead, ownerName }),
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
    const detail = await response.text();
    return { ok: false, error: `resend_${response.status}:${detail.slice(0, 240)}` };
  }

  return { ok: true };
}

function leadEmailText({
  businessName,
  lead,
  ownerName,
}: {
  businessName: string;
  lead: Lead;
  ownerName: string | null;
}): string {
  return [
    `New lead for ${businessName}`,
    ownerName ? `Account: ${ownerName}` : null,
    "",
    lead.name ? `Name: ${lead.name}` : null,
    lead.phone ? `Phone: ${lead.phone}` : null,
    lead.email ? `Email: ${lead.email}` : null,
    lead.message ? `Message: ${lead.message}` : null,
    lead.sourceUrl ? `Source: ${lead.sourceUrl}` : null,
    "",
    lead.email ? "Reply to this email to respond directly to the lead." : "Use the contact details above to follow up.",
  ].filter((line) => line !== null).join("\n");
}

function leadEmailHtml({
  businessName,
  lead,
  ownerName,
}: {
  businessName: string;
  lead: Lead;
  ownerName: string | null;
}): string {
  const safeBusinessName = escapeHtml(businessName);
  const safeOwnerName = ownerName ? escapeHtml(ownerName) : null;
  const sourceHref = safeHttpHref(lead.sourceUrl);
  const phoneHref = phoneTelHref(lead.phone);
  const rows = [
    lead.name ? leadEmailRow("Name", escapeHtml(lead.name)) : null,
    lead.phone ? leadEmailRow("Phone", linkOrText(escapeHtml(lead.phone), phoneHref)) : null,
    lead.email ? leadEmailRow("Email", linkOrText(escapeHtml(lead.email), `mailto:${lead.email}`)) : null,
    lead.sourceUrl ? leadEmailRow("Source", linkOrText(escapeHtml(trimMiddle(lead.sourceUrl, 78)), sourceHref)) : null,
  ].filter(Boolean).join("");
  const messageBlock = lead.message
    ? `
      <tr>
        <td style="padding:0 28px 26px 28px">
          <p style="margin:0 0 9px 0;color:#6a6a6a;font-family:'JetBrains Mono','SFMono-Regular',Consolas,monospace;font-size:11px;letter-spacing:.14em;text-transform:uppercase">Message</p>
          <div style="border-left:3px solid #c2541f;background:#faf8f3;padding:14px 16px;color:#1a1a1a;font-size:16px;line-height:1.58">${escapeHtml(lead.message).replaceAll("\n", "<br>")}</div>
        </td>
      </tr>
    `
    : "";
  const primaryAction = lead.email
    ? `<a href="mailto:${lead.email}" style="display:inline-block;background:#c2541f;color:#fff;text-decoration:none;border-radius:2px;padding:12px 16px;font-weight:700;font-size:14px">Reply to lead</a>`
    : phoneHref
      ? `<a href="${phoneHref}" style="display:inline-block;background:#c2541f;color:#fff;text-decoration:none;border-radius:2px;padding:12px 16px;font-weight:700;font-size:14px">Call lead</a>`
      : "";

  return `
    <div style="margin:0;padding:0;background:#faf8f3;color:#1a1a1a;font-family:Inter,Arial,sans-serif">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;background:#faf8f3">
        <tr>
          <td align="center" style="padding:32px 16px">
            <table role="presentation" width="640" cellpadding="0" cellspacing="0" style="width:100%;max-width:640px;border-collapse:collapse">
              <tr>
                <td style="padding:0 0 14px 0">
                  <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
                    <tr>
                      <td style="width:24px;height:24px;border:1px solid #6a6a6a;border-radius:50%;text-align:center;vertical-align:middle">
                        <span style="display:inline-block;width:11px;height:11px;border-radius:50%;background:#c2541f;vertical-align:middle"></span>
                      </td>
                      <td style="padding-left:9px;color:#1a1a1a;font-family:Georgia,'Times New Roman',serif;font-size:17px;font-weight:700;letter-spacing:-.03em">Onara</td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="border:1px solid #d8d6cf;border-radius:4px;background:#fffdf7;overflow:hidden">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse">
                    <tr>
                      <td style="padding:28px 28px 18px 28px">
                        <p style="margin:0 0 12px 0;color:#a8451e;font-family:'JetBrains Mono','SFMono-Regular',Consolas,monospace;font-size:11px;letter-spacing:.16em;text-transform:uppercase">Generated site lead</p>
                        <h1 style="margin:0;color:#1a1a1a;font-family:Georgia,'Times New Roman',serif;font-size:34px;font-weight:500;line-height:1;letter-spacing:-.045em">New lead for ${safeBusinessName}</h1>
                        <p style="margin:14px 0 0 0;color:#6a6a6a;font-size:15px;line-height:1.55">A visitor submitted the contact form on the generated site. Follow up while the request is fresh.</p>
                      </td>
                    </tr>
                    ${safeOwnerName ? `
                      <tr>
                        <td style="padding:0 28px 20px 28px">
                          <div style="display:inline-block;border:1px solid #e8e2d8;border-radius:2px;background:#f4f1ea;color:#6a6a6a;padding:7px 9px;font-size:12px">Account: <strong style="color:#1a1a1a;font-weight:650">${safeOwnerName}</strong></div>
                        </td>
                      </tr>
                    ` : ""}
                    ${messageBlock}
                    <tr>
                      <td style="padding:0 28px 24px 28px">
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;border-top:1px solid #e8e2d8">
                          ${rows}
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:0 28px 28px 28px">
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;background:#f3e0cf;border:1px solid #ecc9ab;border-radius:4px">
                          <tr>
                            <td style="padding:16px;color:#1a1a1a;font-size:14px;line-height:1.5">
                              <strong style="display:block;margin-bottom:4px">Recommended next step</strong>
                              ${lead.email ? "Reply directly to this email. Onara set the reply-to address to the lead's email." : "Use the phone number above to follow up. The visitor did not provide an email address."}
                            </td>
                            ${primaryAction ? `<td align="right" style="padding:16px;white-space:nowrap">${primaryAction}</td>` : ""}
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding:14px 2px 0 2px;color:#6a6a6a;font-size:12px;line-height:1.45">
                  Sent by Onara after a generated-site contact form submission.
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
  `;
}

function leadEmailRow(label: string, valueHtml: string): string {
  return `
          <tr>
            <td style="width:112px;padding:13px 12px 13px 0;border-bottom:1px solid #e8e2d8;color:#6a6a6a;font-family:'JetBrains Mono','SFMono-Regular',Consolas,monospace;font-size:11px;letter-spacing:.12em;text-transform:uppercase;vertical-align:top">${escapeHtml(label)}</td>
            <td style="padding:13px 0;border-bottom:1px solid #e8e2d8;color:#1a1a1a;font-size:15px;line-height:1.45;vertical-align:top">${valueHtml}</td>
          </tr>
  `;
}

function linkOrText(label: string, href: string | null): string {
  if (!href) return label;
  return `<a href="${escapeHtml(href)}" style="color:#a8451e;text-decoration:none;font-weight:650">${label}</a>`;
}

function phoneTelHref(value: string | null): string | null {
  const text = value?.trim();
  if (!text) return null;
  const plus = text.startsWith("+") ? "+" : "";
  const digits = text.replace(/\D/g, "");
  if (digits.length < 7) return null;
  return `tel:${plus}${digits}`;
}

function safeHttpHref(value: string | null): string | null {
  const text = value?.trim();
  if (!text || !/^https?:\/\//i.test(text)) return null;
  return text;
}

function trimMiddle(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  const sideLength = Math.max(8, Math.floor((maxLength - 3) / 2));
  return `${value.slice(0, sideLength)}...${value.slice(-sideLength)}`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function updateLeadEmailStatus(
  supabase: ReturnType<typeof createServiceClient>,
  leadId: string,
  status: "failed",
  error: string,
): Promise<void> {
  await supabase
    .from("leads")
    .update({
      email_error: error,
      email_status: status,
    })
    .eq("id", leadId);
}
