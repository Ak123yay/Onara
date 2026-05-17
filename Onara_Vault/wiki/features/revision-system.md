# Revision System — Onara

_How users request changes to their generated sites, revision limits, and the processing pipeline._

---

## Overview

After a site is generated, users can request changes. The revision system captures the request, enforces plan limits, and (in v1) routes it to manual handling or (in v2+) processes it through an automated revision pipeline.

---

## Revision Limits by Plan

| Plan | Revisions per Month | Reset |
|------|---------------------|-------|
| Free / Trial | 3 | 1st of each month (pg_cron) |
| Starter | 3 | 1st of each month (pg_cron) |
| Pro | Unlimited | N/A |

Limits enforced server-side in `/api/revisions/create` — see `wiki/features/billing.md` for enforcement code.

---

## Data Model

`revisions` table (see `wiki/data/models.md` for full schema):

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | FK → `user_profiles.id` |
| `site_id` | UUID | FK → `user_sites.id` |
| `job_id` | UUID | FK → `generation_jobs.id` (the original build) |
| `instructions` | TEXT | User's revision request text |
| `section` | TEXT | Target section (hero, services, colors, footer, other) |
| `status` | ENUM | `pending`, `in_progress`, `complete`, `failed` |
| `created_at` | TIMESTAMPTZ | Request timestamp |
| `completed_at` | TIMESTAMPTZ | When revision was finished |

---

## Request Flow (v1 — Manual)

1. User clicks "Request Revision" on `/dashboard/sites/:siteId`
2. Fills revision form: instructions (required), section (optional)
3. POST `/api/revisions/create`:
   - Verifies session
   - Checks revision count for current month (rejects if limit reached)
   - Inserts row with `status = 'pending'`
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
   - Copy change → Re-run Agent 2 (content) + Agent 4 (brand voice)
   - Color/style change → Re-run Agent 3 (style) + Agent 7 (HTML)
   - Full regenerate → Re-run full pipeline
4. Agent 9 (QA Gate) re-validates
5. Agent 10 re-deploys to Cloudflare Pages (overwrites existing deployment)
6. Status updated to `complete`, email sent

---

## Monthly Reset

pg_cron job runs at `00:00 UTC on the 1st of each month`. The monthly count is always a live query — no stored counter to reset:

```sql
-- Count revisions this month (dynamic query, no stored counter)
SELECT count(*) FROM revisions
WHERE user_id = $1
AND created_at >= date_trunc('month', now());
```

---

## Status Lifecycle

```
pending → in_progress → complete
                      → failed
```

- `pending`: Request submitted, not yet processed
- `in_progress`: Being processed (v2+ only)
- `complete`: Revision deployed; user notified
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
