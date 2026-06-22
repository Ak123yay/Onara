# Build Flow - Onara

_The customer experience from business search to a tested live website._

## Build Studio

Route: `/dashboard/build`

The generator uses a three-column desktop workspace:

- Left: persistent four-step rail.
- Center: the current task only.
- Right: sticky live business brief with facts, photo/review counts, direction, and supported sections.

It stacks into one column on mobile.

## Step 1 - Find

The user searches Google Places using the business name and location. Results show name,
category, address, phone, rating, review count, and hours.

If no listing exists, manual entry remains available. Manual generation requires name,
category, and either address or service area. Phone, email, website, services, hours, and one
photo can also be supplied.

## Step 2 - Confirm

The confirmation card shows every fact and asset Onara can safely use. Missing address, phone,
hours, or manual photo fields are editable. The user confirms the corrected business object
before style decisions begin.

## Step 3 - Style

`Smart Direction` is the default. It selects an Onara contractor recipe and only enables
sections supported by verified data:

- Reviews require a real rating and review count.
- Gallery requires at least one Google or manually uploaded photo.
- Service area requires a service area or address.
- FAQ is always available.
- License and financing remain disabled unless those facts are explicitly added to the data model.

Advanced settings expose palette, layout, tone, conversion goal, supported sections, and notes.

## Step 4 - Generate

The user confirms the package and plan-gated Agent 6 route. Next.js:

1. Verifies the session and active-site limit.
2. Creates/reuses the project record.
3. Calls FastAPI `/generate`.
4. Routes to `/dashboard/build/progress?jobId=...&projectId=...`.

## Progress Experience

The progress page shows:

- Seven customer-facing build stages.
- Durable queue/reconnect status.
- Server-provided ETA rather than a client guess.
- An intentional loading canvas until valid generated HTML exists.
- Candidate A/B thumbnail and score cards.
- Selected-concept state.
- Release-readiness badges.
- A collapsible technical build detail.
- Plain-language failure copy and a new-build action.

The page uses SSE first and polling as fallback. It can reconstruct the build from Supabase after
a FastAPI restart. Preview HTML is cached in session storage so a transient disconnect does not
replace a valid preview. Whitespace, partial documents, empty markup, and stale cache entries are
rejected; the native "Building your website" canvas remains visible until a complete document
with visible content is available.

## Progress Events

| Event | UI behavior |
| --- | --- |
| `queued` | Show saved queue state and position |
| `step` | Activate the mapped customer stage and apply backend ETA |
| `candidate_ready` | Add a concept card |
| `candidate_scored` | Add thumbnail, quality score, warnings, and eligibility state |
| `agent_complete` | Complete the customer stage |
| `preview` | Replace the native loading canvas only with complete, visibly renderable HTML |
| `notice` | Add a collapsible build detail |
| `reconnecting` | Keep last preview and explain that the job is saved |
| `complete` | Show selected concept, release badges, and live-site action |
| `error` | Preserve preview, show plain-language issue, and offer another build |

## Release Conditions

A site cannot publish unless one candidate:

- Has no structural, security, asset, form, responsive, or critical accessibility blocker.
- Reaches the configured combined quality score.
- Passes the final deterministic Debugger/SEO/Mobile/QA path.
- Passes the final browser audit.

Failed generation does not consume a revision.

## Related Files

- `Onara_Code/app/components/places/BusinessSearchFlow.tsx`
- `Onara_Code/app/components/build/AgentProgressExperience.tsx`
- `Onara_Code/app/app/api/build/progress/`
- `Onara_Code/pipeline/onara_pipeline/v2/`
- `wiki/architecture/deployment-pipeline.md`
