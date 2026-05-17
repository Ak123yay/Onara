# pg_cron Jobs — Scheduled Database Tasks

All 4 scheduled jobs. Requires `pg_cron` extension and Supabase Pro plan. Source: `raw/02_database_schema.md` Section 6.

---

## Enable pg_cron

```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
GRANT USAGE ON SCHEMA cron TO postgres;
```

Verify it's enabled: `SELECT * FROM pg_extension WHERE extname = 'pg_cron';`

---

## Job 1 — Reset Free Tier Revisions

**Schedule**: `0 0 1 * *` — 1st of every month at midnight UTC

**Purpose**: Free plan users get 3 revisions/month. This resets the counter on the 1st and updates the next reset timestamp.

```sql
SELECT cron.schedule(
  'reset-free-revisions',
  '0 0 1 * *',
  $$
    UPDATE public.users
    SET revisions_used = 0,
        revisions_reset_at = DATE_TRUNC('month', NOW()) + INTERVAL '1 month'
    WHERE plan = 'free';
  $$
);
```

**Affects**: All `plan = 'free'` users.

---

## Job 2 — Downgrade Expired Trials

**Schedule**: `0 2 * * *` — daily at 2:00 AM UTC

**Purpose**: Users get 14 days of full Pro access. On Day 14, this job downgrades them to the free tier.

```sql
SELECT cron.schedule(
  'downgrade-expired-trials',
  '0 2 * * *',
  $$
    UPDATE public.users
    SET plan = 'free',
        is_trial = FALSE,
        show_url = FALSE,
        revisions_limit = 3
    WHERE is_trial = TRUE
      AND trial_ends_at < NOW();
  $$
);
```

**Affects**: All users where `is_trial = TRUE` and `trial_ends_at` is in the past.

**Note**: `show_url = FALSE` means their site URL won't be shown on the free dashboard. The site stays live on Cloudflare Pages but is de-emphasized. The Day 11, Day 13, and Day 14 trial expiry emails are sent via Resend using a separate schedule or Supabase Edge Function (see `wiki/content/email-copy.md`).

---

## Job 3 — Suspend Failed-Payment Sites

**Schedule**: `0 3 * * *` — daily at 3:00 AM UTC

**Purpose**: When a Stripe payment fails, the webhook sets `subscription_status = 'past_due'`. This job suspends the user's live sites until payment is resolved.

```sql
SELECT cron.schedule(
  'suspend-failed-payment-sites',
  '0 3 * * *',
  $$
    UPDATE public.projects p
    SET status = 'suspended'
    FROM public.users u
    WHERE p.user_id = u.id
      AND u.subscription_status = 'past_due'
      AND p.status = 'live';
  $$
);
```

**Affects**: `live` projects belonging to users with `subscription_status = 'past_due'`.

**Recovery**: When Stripe marks the invoice paid, the `invoice.payment_succeeded` webhook sets `subscription_status = 'active'`. A separate step must restore `status = 'live'` on suspended projects — this is handled in the webhook handler, not by pg_cron.

---

## Job 4 — Clean Up Old Pipeline Errors

**Schedule**: `0 4 * * 0` — every Sunday at 4:00 AM UTC

**Purpose**: The `pipeline_errors` table accumulates debug snapshots. Keep only 30 days to control storage.

```sql
SELECT cron.schedule(
  'cleanup-pipeline-errors',
  '0 4 * * 0',
  $$
    DELETE FROM public.pipeline_errors
    WHERE created_at < NOW() - INTERVAL '30 days';
  $$
);
```

**Affects**: `pipeline_errors` rows older than 30 days.

---

## Job Summary Table

| Job name | Schedule | Purpose |
|----------|----------|---------|
| `reset-free-revisions` | `0 0 1 * *` | Reset revision counters for free users on 1st of month |
| `downgrade-expired-trials` | `0 2 * * *` | Downgrade users whose 14-day trial has ended |
| `suspend-failed-payment-sites` | `0 3 * * *` | Suspend live sites for past-due accounts |
| `cleanup-pipeline-errors` | `0 4 * * 0` | Delete error logs older than 30 days |

---

## Managing Jobs

```sql
-- List all jobs
SELECT * FROM cron.job;

-- View job run history
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 20;

-- Disable a job
SELECT cron.unschedule('job-name-here');

-- Run a job immediately (for testing)
-- pg_cron doesn't support on-demand execution — run the SQL directly instead
```

---

## Alternative: No pg_cron (Free Supabase Tier)

If on Supabase free tier:
- **Option A**: GitHub Actions cron workflow calling a Supabase Edge Function via HTTP
- **Option B**: Vercel cron jobs (Next.js `vercel.json` cron) calling the same Edge Function
- **Option C**: External service (cron-job.org free tier) pinging a protected Next.js API route

The SQL logic is identical — only the trigger mechanism changes.
