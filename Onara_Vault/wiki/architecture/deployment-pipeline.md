# Deployment Pipeline - Onara

_How a build moves from the Next.js Build Studio to a tested Cloudflare Pages site._

## Current Architecture

Pipeline V3 is the canary generation path. The FastAPI process still runs on the mini PC,
while Supabase owns durable job, event, lease, candidate, and component checkpoint state.

```text
Build Studio
  -> Next.js generate route
  -> FastAPI durable queue
  -> business brief + content/style
  -> three design directions; select two
  -> bounded components for two candidates in parallel
  -> validate and checkpoint each component
  -> assemble two complete sites
  -> browser + visual evaluation
  -> targeted repair when needed
  -> deterministic final safeguards
  -> Cloudflare Pages
  -> Supabase project record
  -> GitHub backup
```

`PIPELINE_V3_ENABLED=true` enables V3 and `PIPELINE_V3_CANARY_PERCENT` controls deterministic
rollout. Jobs outside the canary use V2 when enabled, otherwise V1. Disabling V3 is the
immediate V2 rollback.

## V3 Component Checkpoints

Migration `023_pipeline_v3_components.sql` adds `pipeline_candidate_components`. Each row
stores one candidate/component artifact, model route, attempt count, validation state,
fingerprint, warnings, and fallback state. Completed artifacts are reused after a worker
restart; missing or invalid artifacts are regenerated.

The model never owns the document shell. Onara creates an approved, fact-safe baseline,
generates bounded component replacements, validates them, and assembles the final document.
One malformed hero therefore cannot erase the header, body, or other valid sections.

## Durable Queue

Migration `022_pipeline_v2_durable_jobs.sql` extends `pipeline_jobs` and adds:

- `pipeline_job_events` for ordered progress recovery.
- `pipeline_candidates` for both generated concepts and their scores.
- Lease owner, lease expiry, heartbeat, attempt, stage, ETA, and checkpoint columns.
- `claim_pipeline_job(...)`, which uses `FOR UPDATE SKIP LOCKED`.
- `heartbeat_pipeline_job(...)`, which renews the active worker lease.

A worker restart reloads queued/running V2 jobs from Supabase. It restores completed stage
outputs and candidate HTML, then resumes from the last safe checkpoint. A request signature
prevents duplicate active jobs for the same user and input.

## Generation Stages

| Customer stage | Internal work |
| --- | --- |
| Understanding your business | Resolve photos, normalize trusted facts, run Analyst |
| Writing your content | Run Content Writer and Style Agent in parallel |
| Designing your concepts | Create three distinct directions and select two |
| Building your websites | Generate bounded components for A and B concurrently and persist each result |
| Testing desktop and mobile | Render 1440px, 768px, 390px, and 320px; run Axe, Lighthouse, and visual reviews |
| Polishing the strongest version | Repair failed selectors/components and apply deterministic safeguards |
| Publishing your site | Build artifact, deploy to Cloudflare, persist Supabase project, back up to GitHub |

Agent 5 is not used in V2/V3. Prompt assembly is deterministic so facts, component order,
safety rules, and visual direction cannot disappear during another model call.

## V3 Release Policy

V3 blocks release only for critical failures:

- Incomplete document, missing header/hero/CTA/contact form, or unsafe executable behavior.
- Broken images, horizontal overflow, unlabeled controls, or controls below 24px.
- Serious or critical Axe findings.
- Browser audit failure when strict static fallback also cannot prove safety.
- More component fallbacks than `PIPELINE_V3_MAX_FALLBACK_COMPONENTS`.

Performance, SEO, preferred 44px targets, and a score below `PIPELINE_V3_MIN_SCORE` remain
visible warnings. This prevents a usable site from being discarded for advisory guidance.

## Candidate Evaluation

Each concept receives up to 100 points:

- 70 deterministic points: document structure, header/hero/CTA, reflow, images/forms,
  accessibility, and safe output.
- 30 visual points: hierarchy, typography, composition, trust/CTA, and fit to the brief.

Two independent visual reviews use reversed rubric order. A large disagreement uses the
lower score. Near-duplicate candidates receive a penalty. A candidate is eligible only when
it has no hard blocker and reaches `PIPELINE_V2_MIN_SCORE` (default `80`).

The browser gate also checks:

- No horizontal overflow at desktop, mobile, or 320px reflow.
- No broken images or unlabeled controls.
- No executable scripts, event handlers, iframes, unsafe URLs, or unapproved form actions.
- No serious/critical automated Axe violations.
- Lighthouse performance >= 90 and accessibility/SEO/best-practices >= 95.
- Lab LCP <= 2.5s, CLS <= 0.1, and TBT <= 200ms.

If browser tooling is unavailable and `PIPELINE_V2_STATIC_AUDIT_FALLBACK=true`, V2 runs a
strict static structure, form-label, image-source, and unsafe-output gate. Final
deterministic SEO/mobile/QA checks still run and the normal score threshold still applies.
The release is labeled `Static safety checked`, never desktop/mobile tested.

## Repair Policy

V2 never asks a model to rewrite the entire page after evaluation. It first applies a
deterministic release-gate repair for common, measurable browser findings:

- Minimum width and height for interactive controls.
- 44px primary conversion targets.
- Missing accessible names on empty icon links and buttons.
- Flexible images, media, form controls, grids, and flex children.
- Mobile overflow, wrapping, and one-column grid safeguards.

The repaired candidate is browser-tested again. If blockers remain, V2 permits one narrow
JSON model patch:

- The document hash must match.
- Every replacement targets an existing `data-component`.
- Every component source hash must match.
- CSS can only be appended to the existing style block.
- Scripts, event handlers, iframes, new claims, and unsafe URLs are rejected.

After the selected concept receives deterministic SEO, mobile, and QA processing, the final
HTML receives one more issue-driven deterministic repair and browser re-audit. Structural or
security failures such as a missing header, hero, CTA, valid HTML document, or unsafe executable
output remain unrepairable. If neither candidate passes after these bounded repairs, the build
fails with a clear diagnostic and preserves the last valid state.

## Publish Order

1. Parse the final tested HTML into the deployment artifact.
2. Deploy to Cloudflare Pages.
3. Store/update the project record in Supabase.
4. Commit the artifact to GitHub as a non-critical backup.
5. Mark the durable job completed and release its lease.

Cloudflare or final Supabase persistence failure fails V2. GitHub backup failure is logged but
does not take an otherwise live site offline.

## Mini PC Rollout

Run from `Onara_Code`:

```powershell
supabase db push --linked

cd pipeline
npm install
npm run install-browser
python -m unittest discover -s tests -p "test_*.py"
```

Set these in `pipeline/.env`:

```dotenv
PIPELINE_V2_ENABLED=true
PIPELINE_V2_BROWSER_AUDIT_TIMEOUT=75
PIPELINE_V2_STATIC_AUDIT_FALLBACK=true
PIPELINE_V2_CANDIDATE_TIMEOUT=150
PIPELINE_V2_LEASE_SECONDS=60
PIPELINE_V2_MAX_ATTEMPTS=3
PIPELINE_V2_MIN_SCORE=80
AI_NIM_CONCURRENCY=3
AI_OLLAMA_CONCURRENCY=1
AI_COPILOT_CONCURRENCY=1
PIPELINE_V3_ENABLED=true
PIPELINE_V3_CANARY_PERCENT=10
PIPELINE_V3_COMPONENT_TIMEOUT=75
PIPELINE_V3_COMPONENT_MAX_TOKENS=3200
PIPELINE_V3_JOB_TIMEOUT=420
PIPELINE_V3_LEASE_SECONDS=60
PIPELINE_V3_MAX_COMPONENT_ATTEMPTS=2
PIPELINE_V3_MAX_FALLBACK_COMPONENTS=2
PIPELINE_V3_MAX_ATTEMPTS=3
PIPELINE_V3_MIN_SCORE=84
```

Restart the PM2 pipeline process after installing the Node browser dependencies and applying
the migrations. Roll back V3 immediately by setting `PIPELINE_V3_ENABLED=false` and
restarting PM2. Keep V2 enabled for the durable fallback, or disable both flags for V1.

## Related Files

- `Onara_Code/pipeline/onara_pipeline/job_queue.py`
- `Onara_Code/pipeline/onara_pipeline/durable_jobs.py`
- `Onara_Code/pipeline/onara_pipeline/v2/`
- `Onara_Code/pipeline/onara_pipeline/v3/`
- `Onara_Code/pipeline/browser_audit.mjs`
- `Onara_Code/supabase/migrations/022_pipeline_v2_durable_jobs.sql`
- `Onara_Code/supabase/migrations/023_pipeline_v3_components.sql`
- `wiki/ai_agents/workflows.md`
- `wiki/features/build-flow.md`
