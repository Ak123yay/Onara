# Revision System — Onara

_How users request changes to their generated sites, revision limits, and the processing pipeline._

---

## Overview

After a site is generated, users can request changes. The revision system captures the request, enforces plan limits, and (in v1) routes it to manual handling or (in v2+) processes it through an automated revision pipeline.

---

## Revision Limits by Plan

| Plan | Revisions per Month | Reset |
|------|---------------------|-------|
| Trial | Unlimited | N/A |
| Free | 3 | 1st of each month (pg_cron) |
| Starter | 10 | Stripe billing period |
| Pro | Unlimited | N/A |

Limits enforced server-side in `/api/revisions/create` — see `wiki/features/billing.md` for enforcement code.

---

## Data Model

`revisions` table (see `wiki/data/models.md` for full schema):

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `project_id` | UUID | FK → `projects.id` |
| `user_id` | UUID | FK → `users.id` |
| `pipeline_job_id` | UUID | FK → `pipeline_jobs.id` |
| `instruction` | TEXT | User's revision request text |
| `affected_components` | TEXT[] | Regenerated atomic components |
| `status` | TEXT | `pending`, `running`, `done`, `failed` |
| `created_at` | TIMESTAMPTZ | Request timestamp |
| `completed_at` | TIMESTAMPTZ | When revision was finished |

---

## Request Flow (v1 — Manual)

1. User clicks "Request Revision" on `/dashboard/sites/:projectId`
2. Fills revision form: instructions (required), section (optional)
3. POST `/api/revisions/create`:
   - Verifies session
   - Checks `users.revisions_used` against `users.revisions_limit` (rejects if limit reached)
   - Inserts row in `revisions` with `status = 'pending'`
   - Returns `{ revisionId }`
4. User sees confirmation: "Revision requested — we'll notify you when it's ready"
5. Resend email sent to user: "We received your revision request"

**v1 processing**: Manual — team reviews pending revisions in Supabase dashboard, makes changes, updates status to `complete`, triggers Resend "Revision Complete" email.

---

## Request Flow (v2+ — Automated Pipeline)

Planned for v2.5+:

1. Revision request triggers FastAPI `/revisions/process`
2. FastAPI loads the original job's blackboard from storage
3. Applies the revision instructions via targeted agent re-run:
   - Copy change → Re-run Agent 2 (content), Agent 4 (planner), and Agent 6 (code)
   - Color/style change → Re-run Agent 3 (style), Agent 4 (planner), and Agent 6 (code)
   - Full regenerate → Re-run full pipeline
4. Agent 9 (QA Gate) re-validates
5. Agent 10 (Mobile Agent) produces final HTML
6. Deployment module updates Cloudflare Pages
7. Status updated to `done`, email sent

---

## Monthly Reset

The canonical counter is `users.revisions_used`; the `on_revision_created` trigger increments it when a revision row is inserted.

Free users reset on the 1st of each month via pg_cron:

```sql
UPDATE public.users
SET revisions_used = 0,
    revisions_reset_at = DATE_TRUNC('month', NOW()) + INTERVAL '1 month'
WHERE plan = 'free';
```

Starter users reset when Stripe confirms the next paid billing period (`invoice.payment_succeeded` or subscription period update). Trial and Pro users use `revisions_limit = -1` and do not need resets.

---

## Status Lifecycle

```
pending → running → done
                 → failed
```

- `pending`: Request submitted, not yet processed
- `running`: Being processed (v2+ only)
- `done`: Revision deployed; user notified
- `failed`: Processing failed; user notified; doesn't count against limit

---

## Email Notifications

| Trigger | Template | See |
|---------|----------|-----|
| Revision requested | "Revision Received" | `wiki/content/email-copy.md` |
| Revision complete | "Revision Complete" | `wiki/content/email-copy.md` |

---

## Related Files

- `wiki/data/models.md` — `revisions` table full schema
- `wiki/features/billing.md` — plan limit enforcement for revisions
- `wiki/features/build-flow.md` — revision request UI
- `wiki/content/email-copy.md` — revision email templates
