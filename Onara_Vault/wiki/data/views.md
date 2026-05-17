# Database Views — Helper Queries

Two read-only views for common queries. Source: `raw/02_database_schema.md` Section 7.

---

## View 1 — `user_dashboard`

Pre-joined summary of user plan, trial status, revision usage, and project counts. Used by the dashboard API to populate the account page in a single query.

```sql
CREATE OR REPLACE VIEW public.user_dashboard AS
SELECT
  u.id,
  u.email,
  u.plan,
  u.is_trial,
  u.trial_ends_at,
  u.revisions_used,
  u.revisions_limit,
  u.revisions_reset_at,
  COUNT(p.id) AS total_projects,
  COUNT(p.id) FILTER (WHERE p.status = 'live') AS live_projects
FROM public.users u
LEFT JOIN public.projects p ON p.user_id = u.id
GROUP BY u.id;
```

**Sample query** (from Next.js API with Supabase JS client):
```typescript
const { data } = await supabase
  .from('user_dashboard')
  .select('*')
  .eq('id', userId)
  .single();
```

**RLS note**: This view respects RLS policies from the underlying `users` and `projects` tables — each user only sees their own row.

---

## View 2 — `active_jobs`

Joins pipeline jobs with project and user info, filtered to only in-progress jobs. Used for queue monitoring (runbook daily check, admin debugging).

```sql
CREATE OR REPLACE VIEW public.active_jobs AS
SELECT
  j.*,
  p.business_name,
  u.email AS user_email,
  u.plan  AS user_plan
FROM public.pipeline_jobs j
JOIN public.projects p ON p.id = j.project_id
JOIN public.users    u ON u.id = j.user_id
WHERE j.status IN ('queued', 'running')
ORDER BY j.queued_at ASC;
```

**Sample query** (monitoring check — run with service role):
```sql
SELECT job_id, business_name, user_email, user_plan, status,
       NOW() - queued_at AS wait_time
FROM public.active_jobs
WHERE queued_at < NOW() - INTERVAL '10 minutes';
-- Returns stuck jobs (running more than 10 min) for investigation
```

**RLS note**: `active_jobs` reads from `pipeline_jobs` which has a user-scoped SELECT policy. Regular users can only see their own active jobs. Use service role key for the full queue view (runbook monitoring).

---

## Usage Pattern

Both views are read-only — no INSERT, UPDATE, or DELETE through views. Modifications go directly to the underlying tables.

Views are re-created with `CREATE OR REPLACE` — no need to drop first if updating the definition.

To list all views:
```sql
SELECT viewname, definition FROM pg_views WHERE schemaname = 'public';
```
