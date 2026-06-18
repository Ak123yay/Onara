# Billing — Onara

_Stripe integration, plan tiers, trial flow, upgrade/downgrade logic, and webhook events._

---

## Plan Tiers

| Plan | Price | Sites | Revisions/month | Code Download | Agent 6 Model |
|------|-------|-------|-----------------|---------------|---------------|
| Trial | $0 for 14 days | 3 during trial | Unlimited during trial | Yes during trial | Same Agent 6 access as Pro |
| Free | $0 after trial | 1 preview site | 3 | No | Onara default: z-ai/glm-5.1 -> Llama 4 Maverick -> Gemma 4 |
| Starter | $12/month or $99/year | 1 live site | 10 | No | Copilot options when implemented; Onara default fallback |
| Pro | $29/month | 3 live sites | Unlimited | Yes | OpenAI/Claude user-key options when implemented; Onara default fallback |

**Trial**: 14-day full Pro access, no credit card required. See `wiki/business/pricing.md` for reverse trial rationale.

---

## Stripe Setup

**Products and Price IDs**:

| Env Variable | Description |
|-------------|-------------|
| `STRIPE_STARTER_PRICE_ID` | Starter $12/month price ID |
| `STRIPE_STARTER_ANNUAL_PRICE_ID` | Starter $99/year price ID |
| `STRIPE_PRO_PRICE_ID` | Pro $29/month price ID |
| `STRIPE_FREE_PRICE_ID` | Free product/price ID if Stripe needs a dashboard placeholder |

All price IDs created in Stripe dashboard and stored in env — never hardcoded.

---

## Trial Flow

### Day 0 (Signup)

1. User signs up (Google OAuth or email/password)
2. Supabase Auth creates user
3. Supabase trigger creates `public.users` row with `plan = 'pro'`, `is_trial = true`, `trial_ends_at = now() + 14 days`, and Pro-level limits during trial
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
- Public URLs are hidden (`show_url=false`); dashboard preview remains available. Generation is blocked unless within free limits or the user upgrades.

---

## Stripe Checkout Flow (Upgrade)

### Initiate Checkout

User clicks "Upgrade" in dashboard → POST `/api/billing/create-checkout-session`

```typescript
// Request
{ priceId: 'price_starter_monthly' | 'price_starter_annual' | 'price_pro_monthly' }

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
3. Update `public.users`:
   - `plan` = plan derived from `price_id`
   - `stripe_customer_id` = Stripe customer ID
   - `stripe_subscription_id` = subscription ID
   - `subscription_status` = Stripe subscription status
   - `is_trial = false`
   - `revisions_limit` = 10 for Starter, -1 for Pro

---

## Webhook Events Handled

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Activate subscription, update plan |
| `customer.subscription.updated` | Handle plan change, update `current_period_end` |
| `customer.subscription.deleted` | Downgrade to free plan |
| `invoice.payment_failed` | Send "Payment Failed" email (Resend); mark `payment_status = 'past_due'` |
| `invoice.payment_succeeded` | Update `current_period_end`; reset Starter revision counter for the new billing period; clear past_due status |

All webhook handlers:
1. Verify signature first (hard reject on failure)
2. Find user by `stripe_customer_id`
3. Update `public.users`
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
  .from('projects')
  .select('id', { count: 'exact' })
  .eq('user_id', userId)
  .neq('status', 'failed')

if (isTrial) return 200 // trial has Pro-level access
if (plan === 'free' && jobCount >= 1) return 429
if (plan === 'starter' && jobCount >= 1) return 429
if (plan === 'pro' && jobCount >= 3) return 429
```

**Revision limit** (enforced in `/api/revisions/create`):

```typescript
const { data: user } = await supabase
  .from('users')
  .select('plan,is_trial,revisions_used,revisions_limit')
  .eq('id', userId)
  .single()

if (user.is_trial || user.plan === 'pro') return 200
if (user.revisions_limit !== -1 && user.revisions_used >= user.revisions_limit) return 429
```

**Code download** (enforced in `/api/sites/:id/download`):

```typescript
if (!isTrial && plan !== 'pro') return 403
```

Eligible users download a `.zip` folder of the generated site files from the GitHub-backed project artifact path.

---

## Annual Plan

- `FEATURE_ANNUAL_PLAN=true` by default
- Annual Starter price: $99/year
- Use Stripe Checkout Sessions with `mode: 'subscription'`; do not pass `payment_method_types`

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
- `wiki/data/models.md` — `public.users` billing fields and plan limits
