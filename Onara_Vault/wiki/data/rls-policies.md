# Row Level Security — All Policies

RLS is Onara's primary data isolation mechanism. Even if application code has a bug, the database enforces user isolation. Source: `raw/02_database_schema.md` Section 4.

---

## Enable RLS

Must be run before creating policies:

```sql
ALTER TABLE public.users           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_jobs   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revisions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gbp_sync_log    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_events   ENABLE ROW LEVEL SECURITY;
```

---

## Users Table

```sql
-- Users can only read their own row
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Users can only update their own row
CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (auth.uid() = id);
```

No INSERT policy for users — the `handle_new_user` trigger inserts the row automatically via `SECURITY DEFINER`. No DELETE policy — deletion is handled by cascading from `auth.users` deletion (Supabase admin operation only).

---

## Projects Table

```sql
-- Full CRUD — users own their projects
CREATE POLICY "projects_select_own" ON public.projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "projects_insert_own" ON public.projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "projects_update_own" ON public.projects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "projects_delete_own" ON public.projects
  FOR DELETE USING (auth.uid() = user_id);
```

---

## Pipeline Jobs Table

```sql
-- Read-only for users — the pipeline server writes via service role key
CREATE POLICY "jobs_select_own" ON public.pipeline_jobs
  FOR SELECT USING (auth.uid() = user_id);
```

The FastAPI pipeline server uses `SUPABASE_SERVICE_ROLE_KEY` which bypasses RLS entirely. This is why pipeline jobs can be written from the server without a user policy.

---

## Revisions Table

```sql
-- Users can read and create their own revisions
CREATE POLICY "revisions_select_own" ON public.revisions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "revisions_insert_own" ON public.revisions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

No UPDATE or DELETE — revision records are immutable audit entries.

---

## Pipeline Errors Table

```sql
-- Users can see errors for their own jobs (for support/debugging)
CREATE POLICY "errors_select_own" ON public.pipeline_errors
  FOR SELECT USING (auth.uid() = user_id);
```

The pipeline server writes errors via service role key — no INSERT policy needed for users.

---

## GBP Sync Log Table

```sql
-- Users can read sync history for their own projects
CREATE POLICY "gbp_select_own" ON public.gbp_sync_log
  FOR SELECT USING (
    auth.uid() = (SELECT user_id FROM public.projects WHERE id = project_id)
  );
```

This policy uses a subquery to verify project ownership. It's slightly slower than direct column comparison but necessary since `gbp_sync_log` doesn't have a `user_id` column.

---

## Stripe Events Table

```sql
-- No user access whatsoever — service role only
CREATE POLICY "stripe_events_deny_all" ON public.stripe_events
  FOR ALL USING (FALSE);
```

Stripe event data is sensitive financial information. Only the webhook handler (running with service role) can read or write this table.

---

## Service Role Key Usage

The `SUPABASE_SERVICE_ROLE_KEY` bypasses all RLS policies. It is used by:
- FastAPI pipeline server (writing `pipeline_jobs`, `pipeline_errors`, `projects`)
- Next.js webhook handler for Stripe events (`/api/billing/webhook`)
- pg_cron jobs (run as `postgres` superuser)

**Never expose `SUPABASE_SERVICE_ROLE_KEY` to the browser. Never put it in `NEXT_PUBLIC_*` env vars.**

---

## Testing RLS

To verify policies work, run queries as specific users in Supabase SQL Editor:

```sql
-- Test as a specific user (replace with actual user UUID)
SET LOCAL role TO 'authenticated';
SET LOCAL request.jwt.claims TO '{"sub": "user-uuid-here"}';

-- This should return only that user's rows
SELECT * FROM public.projects;

-- This should return 0 rows (different user's data)
SELECT * FROM public.projects WHERE user_id = 'different-user-uuid';
```
