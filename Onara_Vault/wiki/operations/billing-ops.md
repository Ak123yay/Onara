# Billing Operations — Onara

_Manual procedures for refunds, plan changes, trial extensions, and account deletion._

---

## Issuing a Refund

1. Log in to Stripe dashboard → Payments → find the charge
2. Click "Refund" → select full or partial refund amount
3. Add reason in Stripe (internal note)
4. Stripe processes refund (3–5 business days to customer)
5. **Do not** manually change `users.plan` for ordinary refunds unless the Stripe webhook fails; let Stripe webhook events drive plan state
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
UPDATE users
SET plan = 'pro',
    is_trial = false,
    revisions_limit = -1,
    show_url = true,
    updated_at = now()
WHERE id = '{userId}';

-- Downgrade to Starter
UPDATE users
SET plan = 'starter',
    is_trial = false,
    revisions_limit = 10,
    show_url = true,
    updated_at = now()
WHERE id = '{userId}';

-- Revert to free (after cancellation)
UPDATE users
SET plan = 'free',
    is_trial = false,
    revisions_limit = 3,
    show_url = false,
    stripe_subscription_id = NULL,
    subscription_status = 'canceled',
    updated_at = now()
WHERE id = '{userId}';
```

**Note**: Manual plan changes don't affect Stripe billing — if you upgrade a customer for free, do NOT change their Stripe subscription; only update Supabase.

---

## Extending a Trial

When a customer requests more time to evaluate:

```sql
-- Extend trial by 7 days
UPDATE users
SET trial_ends_at = trial_ends_at + interval '7 days',
    updated_at = now()
WHERE id = '{userId}'
  AND is_trial = true;
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
-- Reset usage counter without deleting revision history
UPDATE users
SET revisions_used = 0,
    revisions_reset_at = date_trunc('month', now()) + interval '1 month',
    updated_at = now()
WHERE id = '{userId}';
```

---

## Account Deletion (GDPR / CCPA)

When a customer requests full account deletion:

**Step 1: Cancel Stripe subscription** (if active)
- Stripe dashboard → Customer → Cancel subscription immediately

**Step 2: Delete Supabase data** (run in order, FK constraints)

```sql
DELETE FROM revisions WHERE user_id = '{userId}';
DELETE FROM pipeline_errors WHERE user_id = '{userId}';
DELETE FROM pipeline_jobs WHERE user_id = '{userId}';
DELETE FROM projects WHERE user_id = '{userId}';
DELETE FROM users WHERE id = '{userId}';
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
  u.email,
  u.full_name,
  u.plan,
  u.is_trial,
  u.trial_ends_at,
  u.subscription_status,
  u.stripe_customer_id,
  count(p.id) FILTER (WHERE p.status = 'live') AS live_projects
FROM users u
LEFT JOIN projects p ON p.user_id = u.id
WHERE u.email = 'customer@example.com'
GROUP BY u.email, u.full_name, u.plan, u.is_trial, u.trial_ends_at,
         u.subscription_status, u.stripe_customer_id;
```

---

## Related Files

- `wiki/features/billing.md` — billing system architecture
- `wiki/data/models.md` — table schemas for manual SQL operations
- `wiki/operations/runbook.md` — general ops procedures
