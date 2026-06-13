# Stripe Integration — Onara

_Setup guide, product configuration, webhook endpoint, and test→live migration._

---

## What Onara Uses Stripe For

- Subscription billing (Starter $12/month, Starter $99/year, Pro $29/month)
- Stripe Checkout (hosted payment page — no custom payment form needed)
- Stripe Customer Portal (self-serve plan management, cancellation)
- Webhook events → subscription lifecycle management

---

## Required Env Vars

| Variable | Where | Value |
|----------|-------|-------|
| `STRIPE_SECRET_KEY` | Next.js `.env.local` | `sk_live_...` or `sk_test_...` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Next.js `.env.local` | `pk_live_...` or `pk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | Next.js `.env.local` | `whsec_...` |
| `STRIPE_FREE_PRICE_ID` | Next.js `.env.local` | `price_...` placeholder if used |
| `STRIPE_STARTER_PRICE_ID` | Next.js `.env.local` | `price_...` |
| `STRIPE_STARTER_ANNUAL_PRICE_ID` | Next.js `.env.local` | `price_...` |
| `STRIPE_PRO_PRICE_ID` | Next.js `.env.local` | `price_...` |

---

## Initial Setup

### 1. Create Products and Prices

In Stripe dashboard → Products → Add product:

**Product 1: Onara Starter**
- Name: `Onara Starter`
- Price: $12.00 / month → recurring → copy Price ID → `STRIPE_STARTER_PRICE_ID`
- Price: $99.00 / year → recurring → copy Price ID → `STRIPE_STARTER_ANNUAL_PRICE_ID`

**Product 2: Onara Pro**
- Name: `Onara Pro`
- Price: $29.00 / month → recurring → copy Price ID → `STRIPE_PRO_PRICE_ID`

**Optional Product 3: Onara Free**
- Name: `Onara Free`
- Price: $0.00 placeholder if Stripe logic needs a free dashboard product → `STRIPE_FREE_PRICE_ID`

Checkout Sessions must use `mode: 'subscription'` for Starter monthly, Starter annual, and Pro monthly. Do not pass `payment_method_types`; let Stripe choose enabled payment methods from the dashboard.

### 2. Configure Webhook Endpoint

Stripe dashboard → Developers → Webhooks → Add endpoint:

- **URL**: `https://onara.tech/api/billing/webhook`
- **Events to listen for**:
  - `checkout.session.completed`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_failed`
  - `invoice.payment_succeeded`
- Copy **Signing secret** → `STRIPE_WEBHOOK_SECRET`

### 3. Enable Customer Portal

Stripe dashboard → Settings → Customer portal:
- Enable: Cancel subscriptions, Update payment method, View invoices
- Return URL: `https://onara.tech/dashboard/billing`

### 4. API Keys

Stripe dashboard → Developers → API keys:
- Copy **Secret key** → `STRIPE_SECRET_KEY`
- Copy **Publishable key** → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

---

## Test Mode → Live Mode Migration

1. Complete all testing in test mode (`sk_test_...` keys)
2. Create products and prices again in **live mode** (test prices don't transfer)
3. Update all Stripe env vars with live mode values
4. Register webhook endpoint for live mode separately
5. Verify with a real card transaction (refund immediately after)
6. Monitor Stripe dashboard for 24h post-launch

**Never mix test and live keys in the same environment.**

---

## Common Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| Webhook returns 400 | Secret mismatch | Regenerate `STRIPE_WEBHOOK_SECRET`, update env |
| Webhook returns 400 | Raw body not preserved | Ensure `bodyParser: false` on webhook route |
| Checkout session fails | Price ID not found | Verify price IDs are from correct mode (test vs live) |
| Customer Portal blank | Portal not configured | Enable in Stripe dashboard → Settings → Customer portal |

---

## Related Files

- `wiki/features/billing.md` — billing feature logic and webhook handlers
- `wiki/architecture/env-vars.md` — all Stripe env vars
- `wiki/operations/billing-ops.md` — manual billing operations
