# Resend Integration — Onara

_Domain verification, API key, and which emails Onara sends via Resend._

---

## What Onara Uses Resend For

All 8 transactional emails: welcome, trial warnings (×2), trial end, payment failed, cancellation, revision complete, GBP sync notification. See `wiki/content/email-copy.md` for full templates.

---

## Required Env Vars

| Variable | Where | Value |
|----------|-------|-------|
| `RESEND_API_KEY` | Next.js `.env.local` | `re_...` |
| `RESEND_FROM_EMAIL` | Next.js `.env.local` | `hello@onara.tech` |
| `RESEND_REPLY_TO` | Next.js `.env.local` | `support@onara.tech` |
| `RESEND_WEBHOOK_SECRET` | Supabase Edge secrets | Resend webhook signing secret (`whsec_...`) |
| `SUPPORT_FROM_EMAIL` | Supabase Edge secrets | `Onara Support <support@onara.tech>` |
| `SUPPORT_FORWARD_TO` | Supabase Edge secrets | Aarush's support inbox |
| `FEATURE_SUPPORT_AI_RESPONDER` | Supabase Edge secrets | `true` to send first replies |

---

## Setup

### 1. Create Resend Account

Sign up at resend.com → create a new team or use personal account.

### 2. Verify Domain

Resend dashboard → Domains → Add Domain → enter `onara.tech`:

Resend provides DNS records to add (typically):
- `TXT` record for domain ownership verification
- `MX` record (if sending from root domain)
- `DKIM` `TXT` record for email authentication
- `SPF` `TXT` record

Add these to your domain's DNS provider (wherever `onara.tech` DNS is managed). Propagation: 5 minutes to 48 hours.

Once verified, `onara.tech` shows as "Verified" in Resend dashboard.

### 3. Create API Key

Resend dashboard → API Keys → Create API Key:
- **Name**: `onara-production`
- **Permission**: Full access (or "Sending access" only)
- Copy key → `RESEND_API_KEY`

---

## Which Routes Call Resend

| Route / Trigger | Email Sent |
|-----------------|-----------|
| User signup | Welcome / Site Live (after first generation) |
| pg_cron — Day 11 | "Trial Ending in 3 Days" |
| pg_cron — Day 13 | "Trial Ending Tomorrow" |
| pg_cron — Day 14 | "Trial Ended — Choose a Plan" |
| Stripe webhook: `invoice.payment_failed` | "Payment Failed" |
| Stripe webhook: `customer.subscription.deleted` | "Subscription Cancelled" |
| Agent 10 completion | "Your Site Is Live" |
| Revision marked complete (manual) | "Revision Complete" |

Resend calls go through Next.js API routes or Supabase Edge Functions. FastAPI does not call Resend directly.

---

## Inbound Support Email

`support@onara.tech` is handled by the `support-email` Supabase Edge Function.

Production setup:

1. In Resend, create a Receiving webhook for the `email.received` event.
2. Point it to `https://<project-ref>.supabase.co/functions/v1/support-email`.
3. Copy the Resend webhook signing secret into `RESEND_WEBHOOK_SECRET`.
4. Set `SUPPORT_FORWARD_TO` to Aarush's real inbox so every support email is still forwarded for human visibility.
5. Set `FEATURE_SUPPORT_AI_RESPONDER=true` and provide `NVIDIA_NIM_API_KEY` so the function can send the first reply.

The function:

- verifies the raw Resend webhook body using the `svix-*` headers
- stores each inbound message in `public.support_threads`
- uses NVIDIA NIM for a safe first support reply
- flags billing, payment, login, password, security, privacy, legal, and account-deletion topics for human review
- forwards the original message, classification, escalation reason, and first reply to `SUPPORT_FORWARD_TO`

---

## Free Tier Limits

- 3,000 emails/month free
- 100 emails/day
- Sufficient for v1 (covers ~200 active users with standard email cadence)
- Upgrade when approaching limits: $20/month for 50K emails

---

## Common Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| Email not delivered | Domain not verified | Check Resend dashboard → domain status |
| From address rejected | Domain mismatch | `RESEND_FROM_EMAIL` must match verified domain |
| 401 on API call | Invalid API key | Regenerate key in Resend dashboard |
| Emails going to spam | Missing DKIM/SPF | Verify all DNS records are correctly added |

---

## Related Files

- `wiki/content/email-copy.md` — all 8 email templates with variables
- `wiki/architecture/env-vars.md` — Resend env vars
- `wiki/features/billing.md` — which billing events trigger emails
