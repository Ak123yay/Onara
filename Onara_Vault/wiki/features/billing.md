# Billing — Onara

_Stripe integration, plan tiers, trial flow, upgrade/downgrade logic, and webhook events._

---

## Plan Tiers

| Plan | Price | Sites | Revisions/month | Code Download | Agent 6 Model |
|------|-------|-------|-----------------|---------------|---------------|
| Free (trial) | $0 | 3 | 3 | No | kimi-k2.6 |
| Starter | $12/month or $99/year | 3 | 3 | No | kimi-k2.6 |
| Pro | $29/month | Unlimited | Unlimited | Yes | Claude Sonnet |

**Trial**: 14-day full Pro access, no credit card required. See `wiki/business/pricing.md` for reverse trial rationale.

---

## Stripe Setup

**Products and Price IDs**:

| Env Variable | Description |
|-------------|-------------|
| `STRIPE_PRICE_STARTER_MONTHLY` | Starter $12/month price ID |
| `STRIPE_PRICE_PRO_MONTHLY` | Pro $29/month price ID |
| `STRIPE_PRICE_STARTER_ANNUAL` | Starter $99/year price ID |

All price IDs created in Stripe dashboard and stored in env — never hardcoded.

---

## Trial Flow

### Day 0 (Signup)

1. User signs up (Google OAuth or email/password)
2. Supabase Auth creates user
3. Next.js creates `subscriptions` row: `plan = 'trial'`, `trial_ends_at = now() + 14 days`
4. Welcome email sent (Resend — see `wiki/content/email-copy.md`)
5. User gets full Pro access immediately — no credit card prompt

### Day 11

- pg_cron job fires: finds trials with `trial_ends_at` in 3 days
- Resend "Trial Ending Soon" email sent: "3 days left — choose a plan"

### Day 13

- pg_cron job fires: 1 day warning email sent

### Day 14 (Trial End)

- pg_cron job fires: downgrade `plan = 'free'`
- Resend "Trial Ended" email sent: explains free limits, includes upgrade CTA
- User sites remain live but generation blocked until paid plan or within free limits

---

## Stripe Checkout Flow (Upgrade)

### Initiate Checkout

User clicks "Upgrade" in dashboard → POST `/api/billing/create-checkout-session`

```typescript
// Request
{ priceId: 'price_starter_monthly' | 'price_pro_monthly' | 'price_starter_annual' }

// Response
{ url: 'https://checkout.stripe.com/...' }
```

Browser redirects to Stripe-hosted checkout page.

**Success redirect**: `/dashboard?upgraded=true`
**Cancel redirect**: `/dashboard/billing`

### Checkout Complete (Webhook)

Stripe POSTs to `/api/billing/webhook`:

```
event: checkout.session.completed
```

Handler:
1. Verify webhook signature (`STRIPE_WEBHOOK_SECRET`)
2. Extract `customer_id`, `subscription_id`, `price_id`
3. Update `subscriptions` table:
   - `plan` = plan derived from `price_id`
   - `stripe_customer_id` = Stripe customer ID
   - `stripe_subscription_id` = subscription ID
   - `current_period_end` = subscription period end timestamp

---

## Webhook Events Handled

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Activate subscription, update plan |
| `customer.subscription.updated` | Handle plan change, update `current_period_end` |
| `customer.subscription.deleted` | Downgrade to free plan |
| `invoice.payment_failed` | Send "Payment Failed" email (Resend); mark `payment_status = 'past_due'` |
| `invoice.payment_succeeded` | Update `current_period_end`; clear past_due status |

All webhook handlers:
1. Verify signature first (hard reject on failure)
2. Find user by `stripe_customer_id`
3. Update `subscriptions` table
4. Send Resend email if applicable

---

## Customer Portal (Manage Subscription)

User clicks "Manage Billing" → POST `/api/billing/create-portal-session`

```typescript
// Response
{ url: 'https://billing.stripe.com/...' }
```

Stripe Customer Portal handles: plan upgrades/downgrades, payment method updates, cancellation, invoice downloads. No custom UI needed.

---

## Plan Limit Enforcement

**Site generation limit** (enforced in `/api/generate`):

```typescript
const jobCount = await supabase
  .from('generation_jobs')
  .select('id', { count: 'exact' })
  .eq('user_id', userId)
  .eq('status', 'completed')

if (plan === 'free' || plan === 'starter') {
  if (jobCount >= 3) return 429
}
```

**Revision limit** (enforced in `/api/revisions/create`):

```typescript
// Count revisions this calendar month
const revisionCount = await supabase
  .from('revisions')
  .select('id', { count: 'exact' })
  .eq('user_id', userId)
  .gte('created_at', startOfMonth)

if (plan !== 'pro') {
  if (revisionCount >= 3) return 429
}
```

**Code download** (enforced in `/api/sites/:id/download`):

```typescript
if (plan !== 'pro') return 403
```

---

## Annual Plan

- `FEATURE_ANNUAL_PLAN=true` (default) — shows annual Starter option in pricing
- Set to `false` to hide annual option without code changes
- Annual plan: `STRIPE_PRICE_STARTER_ANNUAL` ($99/year = $8.25/month effective)

---

## Refunds and Manual Operations

See `wiki/operations/billing-ops.md` for:
- How to issue Stripe refunds
- How to manually change plans
- How to extend trials
- How to reset revision limits

---

## Related Files

- `wiki/integrations/stripe.md` — Stripe API configuration details
- `wiki/content/email-copy.md` — All billing-related email templates
- `wiki/operations/billing-ops.md` — Ops runbook for billing issues
- `wiki/data/models.md` — `subscriptions` table schema
