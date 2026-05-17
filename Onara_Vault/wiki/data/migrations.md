# Database Migrations — Execution Guide

Full schema lives in `raw/02_database_schema.md`. Run sections in this exact order: types fail if tables exist first; RLS fails if tables don't exist; triggers fail if tables don't exist.

---

## Execution Order

```
1. Enable extensions
2. Custom types (ENUMs)
3. Core tables
4. Indexes
5. Row Level Security (RLS)
6. Trigger functions + triggers
7. Helper views
8. pg_cron jobs
```

Run in Supabase SQL Editor (Dashboard → SQL Editor → New Query).

---

## Step 1 — Extensions

```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
GRANT USAGE ON SCHEMA cron TO postgres;
```

pg_cron requires the Supabase Pro plan. On free tier, skip pg_cron and run email jobs via external cron (GitHub Actions cron or Vercel cron).

---

## Step 2 — Custom Types

```sql
CREATE TYPE plan_type AS ENUM ('free', 'starter', 'pro');

CREATE TYPE site_status AS ENUM (
  'queued', 'generating', 'deploying', 'live', 'failed', 'suspended'
);

CREATE TYPE agent_phase AS ENUM (
  'analyst', 'content_writer', 'style_agent', 'planner', 'prompt_engineer',
  'code_generator', 'debugger', 'seo_agent', 'qa_agent', 'mobile_agent',
  'deploying', 'done', 'error'
);

CREATE TYPE revision_type AS ENUM (
  'initial_generation', 'user_revision', 'system_refresh'
);
```

---

## Step 3 — Tables

Run in this order (foreign key dependencies):

1. `public.users` — depends on `auth.users` (Supabase built-in)
2. `public.projects` — depends on `public.users`
3. `public.pipeline_jobs` — depends on `public.projects`, `public.users`
4. `public.revisions` — depends on `public.projects`, `public.users`, `public.pipeline_jobs`
5. `public.pipeline_errors` — depends on `public.pipeline_jobs`, `public.users`, `public.projects`
6. `public.gbp_sync_log` — depends on `public.projects`
7. `public.stripe_events` — no dependencies

Full `CREATE TABLE` statements are in `raw/02_database_schema.md` Section 2.

---

## Step 4 — Indexes

```sql
-- Users
CREATE INDEX idx_users_stripe_customer  ON public.users(stripe_customer_id);
CREATE INDEX idx_users_plan             ON public.users(plan);
CREATE INDEX idx_users_trial_ends       ON public.users(trial_ends_at) WHERE is_trial = TRUE;
CREATE INDEX idx_users_revisions_reset  ON public.users(revisions_reset_at);

-- Projects
CREATE INDEX idx_projects_user_id       ON public.projects(user_id);
CREATE INDEX idx_projects_status        ON public.projects(status);
CREATE INDEX idx_projects_place_id      ON public.projects(google_place_id);
CREATE INDEX idx_projects_cloudflare    ON public.projects(cloudflare_project_name);

-- Pipeline jobs
CREATE INDEX idx_jobs_project_id        ON public.pipeline_jobs(project_id);
CREATE INDEX idx_jobs_user_id           ON public.pipeline_jobs(user_id);
CREATE INDEX idx_jobs_status            ON public.pipeline_jobs(status)
  WHERE status IN ('queued', 'running');           -- partial index — only active jobs

-- Revisions
CREATE INDEX idx_revisions_project_id   ON public.revisions(project_id);
CREATE INDEX idx_revisions_user_id      ON public.revisions(user_id);

-- Errors
CREATE INDEX idx_errors_job_id          ON public.pipeline_errors(job_id);
CREATE INDEX idx_errors_created         ON public.pipeline_errors(created_at DESC);

-- Stripe events
CREATE INDEX idx_stripe_events_processed ON public.stripe_events(processed)
  WHERE processed = FALSE;                         -- partial index — only unprocessed
```

---

## Step 5 — RLS

Enable + add policies. See `wiki/data/rls-policies.md` for full policy SQL.

---

## Step 6 — Triggers

See `wiki/data/triggers.md` for full trigger SQL.

---

## Step 7 — Views

See `wiki/data/views.md` for full view SQL.

---

## Step 8 — pg_cron Jobs

See `wiki/data/pg-cron-jobs.md` for full schedule SQL.

---

## Re-Running Migrations

If you need to re-run after a partial failure:

```sql
-- Drop types (only if no tables reference them yet)
DROP TYPE IF EXISTS plan_type CASCADE;
DROP TYPE IF EXISTS site_status CASCADE;
DROP TYPE IF EXISTS agent_phase CASCADE;
DROP TYPE IF EXISTS revision_type CASCADE;

-- Drop tables (order matters — children first)
DROP TABLE IF EXISTS public.stripe_events CASCADE;
DROP TABLE IF EXISTS public.gbp_sync_log CASCADE;
DROP TABLE IF EXISTS public.pipeline_errors CASCADE;
DROP TABLE IF EXISTS public.revisions CASCADE;
DROP TABLE IF EXISTS public.pipeline_jobs CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
```

Then re-run from Step 2.

---

## Migration Checklist

After running all steps, verify:

```sql
-- All 7 tables exist
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- RLS enabled on all tables
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- pg_cron jobs scheduled
SELECT jobname, schedule FROM cron.job;

-- Trigger exists for new user creation
SELECT trigger_name FROM information_schema.triggers
WHERE event_object_schema = 'auth' AND event_object_table = 'users';
```
