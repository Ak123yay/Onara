# Build Flow — Onara

_The complete user-facing experience of generating a website, from form submission to live site._

---

## Overview

The build flow is the core product experience. A user enters a business name or Google Place ID, clicks Generate, watches real-time progress for 60–120 seconds, and lands on a live preview. The UI must be fast, reassuring, and handle failure gracefully.

---

## Entry Points

| Entry Point | Route | Trigger |
|-------------|-------|---------|
| Dashboard CTA | `/dashboard` | "Generate New Site" button |
| Onboarding wizard | `/onboarding` | Shown after first login |
| Empty state | `/dashboard` | Shown when user has zero sites |

---

## Step 1: Business Search Form

**Route**: `/dashboard/new` (or inline modal)

**Form fields**:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Business name / Place search | Text input | Yes | Calls `/api/places/search` on change |
| Select from results | Dropdown | Yes | Lists matching Google Places results |
| Confirm business details | Preview card | Display only | Shows name, address, category, rating |

**Places search flow**:
- User types ≥ 3 characters → debounced 300ms → POST `/api/places/search`
- Results: business name, address, category shown as dropdown options
- On select: `placeId` stored; preview card renders name/address/category/rating/hours

**Validation before submission**:
- `placeId` must be non-null (user must select from results, not freetext)
- Plan limit check (client-side): warn if at Starter site limit (3 sites), block if exceeded

---

## Step 2: Confirmation + Generate

**UI**: "Generate Site" button (primary CTA) below the preview card

**On click**:
1. Button disabled + spinner shown
2. POST `/api/generate` → returns `{ jobId }`
3. Route transitions to `/dashboard/build/:jobId` (progress screen)

---

## Step 3: Progress Screen

**Route**: `/dashboard/build/:jobId`

**SSE connection**: Opens immediately on mount → `GET /api/stream/:jobId`

**Progress UI**:

| SSE Event | UI Action |
|-----------|-----------|
| `event: queued` | "Your site is in the queue (position N)" |
| `event: step` | Step name highlighted in timeline; progress bar advances |
| `event: agent_complete` | Step marked green with checkmark |
| `event: agent_retry` | Step shows yellow "Retrying..." indicator |
| `event: complete` | Confetti animation; redirect to `/dashboard/sites/:siteId` |
| `event: error` | Red error banner; retry button shown |
| `event: timeout` | "Generation timed out" message; contact support link |

**Timeline display** (left rail):

```
✅ Fetch Business Data
✅ Write Copy + Style (parallel)
✅ Brand Voice
✅ SEO Tags
✅ Choose Layout
⏳ Generate HTML
   Asset Optimization
   Quality Check
   Deploy
```

**Auto-retry on SSE disconnect**: Reconnects up to 3× with exponential backoff before showing "Connection lost" warning.

---

## Step 4: Site Preview

**Route**: `/dashboard/sites/:siteId`

**Layout**:
- Left panel: site metadata (business name, URL, generated date, plan)
- Center: iframe showing the live Cloudflare Pages URL
- Right panel: action buttons

**Action buttons**:

| Button | Plan | Action |
|--------|------|--------|
| Visit Site | All | Opens `site_url` in new tab |
| Regenerate | All | Triggers new build job (counts against limit) |
| Request Revision | All | Opens revision form (3/month Starter, unlimited Pro) |
| Download Code | Pro | Downloads `index.html` |
| Copy Site URL | All | Copies URL to clipboard |

---

## Step 5: Revision Flow

Triggered by "Request Revision" button.

**Revision form fields**:

| Field | Type | Required |
|-------|------|----------|
| What to change | Textarea | Yes |
| Priority section | Select (Hero / Services / Colors / Footer / Other) | No |

**On submit**:
- POST `/api/revisions/create` → inserts row in `revisions` table
- Status: `pending` → processed by revision pipeline (future; v2)
- User sees "Revision requested — we'll notify you when it's ready"
- Resend email sent when revision complete

**Revision limits**:
- Starter: 3/month (enforced via `revisions` table count + pg_cron reset)
- Pro: unlimited

---

## Error States

| Error | Display |
|-------|---------|
| Places API unavailable | "Search unavailable — enter your Google Place ID manually" with link to instructions |
| Pipeline offline | "Our generation service is temporarily offline. Try again in a few minutes." |
| Job failed (agent error) | "Generation failed at [step name]. Your credits are not affected. Try again." |
| Plan limit reached | "You've reached your 3-site limit. Upgrade to Pro for unlimited sites." with upgrade CTA |
| Revision limit reached | "You've used your 3 revisions this month. Resets on [date]. Upgrade for unlimited." |

---

## Related Files

- `wiki/architecture/deployment-pipeline.md` — technical pipeline steps
- `wiki/features/google-places.md` — Places API integration details
- `wiki/features/auth.md` — session verification during build flow
- `wiki/features/billing.md` — plan limits and upgrade gates
- `wiki/ai_agents/workflows.md` — agent sequence the progress screen reflects
