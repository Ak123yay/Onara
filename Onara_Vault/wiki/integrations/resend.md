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

All Resend calls go through Next.js API routes — FastAPI does not call Resend directly (except Agent 10 triggers a Next.js endpoint which calls Resend).

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
