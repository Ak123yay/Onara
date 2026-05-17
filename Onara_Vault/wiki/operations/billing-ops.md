# Billing Operations — Onara

_Manual procedures for refunds, plan changes, trial extensions, and account deletion._

---

## Issuing a Refund

1. Log in to Stripe dashboard → Payments → find the charge
2. Click "Refund" → select full or partial refund amount
3. Add reason in Stripe (internal note)
4. Stripe processes refund (3–5 business days to customer)
5. **Do not** update `subscriptions` table for refunds — Stripe webhook will fire `customer.subscription.deleted` and downgrade automatically if applicable
6. Send manual email to customer confirming refund

**When to refund**:
- Customer contacts within 7 days of charge with valid complaint
- Site generation failed repeatedly (our fault)
- Duplicate charge

---

## Manual Plan Change

When a customer needs a plan change that Stripe webhook won't handle (e.g., compensatory upgrade):

```sql
-- Upgrade to Pro
UPDATE subscriptions
SET plan = 'pro',
    updated_at = now()
WHERE user_id = '{userId}';

-- Downgrade to Starter
UPDATE subscriptions
SET plan = 'starter',
    updated_at = now()
WHERE user_id = '{userId}';

-- Revert to free (after cancellation)
UPDATE subscriptions
SET plan = 'free',
    stripe_subscription_id = NULL,
    current_period_end = NULL,
    updated_at = now()
WHERE user_id = '{userId}';
```

**Note**: Manual plan changes don't affect Stripe billing — if you upgrade a customer for free, do NOT change their Stripe subscription; only update Supabase.

---

## Extending a Trial

When a customer requests more time to evaluate:

```sql
-- Extend trial by 7 days
UPDATE subscriptions
SET trial_ends_at = trial_ends_at + interval '7 days',
    updated_at = now()
WHERE user_id = '{userId}'
  AND plan = 'trial';
```

**Policy**: One extension per customer, max 7 days.

Email template:

```
Subject: We've extended your Onara trial

Hi [Name],

We've extended your trial by 7 days — you now have until [new date] to explore all Pro features.

If you have any questions, reply to this email.

The Onara Team
```

---

## Resetting Revision Count

When a customer was unable to use their revisions due to a bug or service issue:

```sql
-- Delete failed revisions from this month to reset count
DELETE FROM revisions
WHERE user_id = '{userId}'
  AND created_at >= date_trunc('month', now())
  AND status = 'failed';

-- If resetting all (compensatory): delete all this month's revisions
-- Requires manual judgment; confirm with user before deleting completed revisions
DELETE FROM revisions
WHERE user_id = '{userId}'
  AND created_at >= date_trunc('month', now());
```

---

## Account Deletion (GDPR / CCPA)

When a customer requests full account deletion:

**Step 1: Cancel Stripe subscription** (if active)
- Stripe dashboard → Customer → Cancel subscription immediately

**Step 2: Delete Supabase data** (run in order, FK constraints)

```sql
DELETE FROM revisions WHERE user_id = '{userId}';
DELETE FROM generation_jobs WHERE user_id = '{userId}';
DELETE FROM user_sites WHERE user_id = '{userId}';
DELETE FROM subscriptions WHERE user_id = '{userId}';
DELETE FROM user_profiles WHERE user_id = '{userId}';
```

**Step 3: Delete Supabase Auth user**
- Supabase dashboard → Authentication → Users → find user → Delete

**Step 4: Remove Cloudflare Pages deployments**
- Cloudflare dashboard → Pages → find projects named `onara-{userId-short}` → Delete

**Step 5: Confirm deletion to customer**

```
Subject: Your Onara account has been deleted

Hi [Name],

Your account and all associated data have been permanently deleted from our systems.

The Onara Team
```

**SLA**: Complete within 30 days of request (GDPR requirement).

---

## Checking a Customer's Account Status

Quick lookup in Supabase SQL editor:

```sql
SELECT
  up.email,
  up.full_name,
  s.plan,
  s.trial_ends_at,
  s.current_period_end,
  s.stripe_customer_id,
  count(gj.id) AS total_sites_generated
FROM user_profiles up
LEFT JOIN subscriptions s ON s.user_id = up.id
LEFT JOIN generation_jobs gj ON gj.user_id = up.id AND gj.status = 'completed'
WHERE up.email = 'customer@example.com'
GROUP BY up.email, up.full_name, s.plan, s.trial_ends_at,
         s.current_period_end, s.stripe_customer_id;
```

---

## Related Files

- `wiki/features/billing.md` — billing system architecture
- `wiki/data/models.md` — table schemas for manual SQL operations
- `wiki/operations/runbook.md` — general ops procedures
