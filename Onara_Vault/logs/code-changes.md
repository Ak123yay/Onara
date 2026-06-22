
## 2026-06-22

### Agent 6 format enforcement + animation validator fix

**Files affected**: `Onara_Code/pipeline/onara_pipeline/agents/agent_06_codegen.py`, `Onara_Code/pipeline/onara_pipeline/agents/supervisor.py`, `Onara_Code/pipeline/README.md`, `README.md`

**What changed**:
- `agent_06_codegen.py`: Restored an exact FILE_MARKER document example and repairs otherwise valid model HTML with a safe motion contract before validation.
- `v2/codegen.py`: Added one bounded, low-temperature format retry when a model returns an incomplete or unparseable document.
- `supervisor.py`: Removes layout-shifting keyframe declarations, injects lightweight opacity/transform motion when omitted, and still rejects unsafe unrepaired animation.
- `tests/test_codegen_recovery.py`: Added parser, missing-motion, unsafe-width, and validator regression coverage.
- `Onara_Code/pipeline/README.md`: Added "Code Generation Validation" section documenting Agent 6 output format and animation safety rules. Updated Agent 6 description to mention "explicit format examples" and "animation safety validation".
- `README.md`: Updated AI usage section to mention enforcement of "FILE_MARKER wrapping with explicit examples" and "animation safety (opacity/transform only, blocking layout-shifting properties)".

**Why**: Pipeline V2 builds were failing with both candidates rejected:
- Candidate A: "Agent 6 output did not contain a marked index.html document" — LLM wasn't wrapping output in FILE_MARKER tags
- Candidate B: "Codegen animation must use opacity and transform" — validator incorrectly required both keywords to exist instead of validating actual keyframe property usage

**Impact**: A good model-generated page is no longer discarded because it omitted keyframes. Incomplete output gets one model retry, while unsafe width/height-style keyframes are repaired locally without replacing the design with the deterministic fallback template.

**Testing**: Python compilation passed. All 25 pipeline unit tests passed.

---

### Pipeline V2 candidate and accessibility gate separation

**What changed**:
- Initial V2 generation now validates document structure, component integrity, safe motion, and
  output safety without rejecting a candidate based on string-based visual heuristics.
- Real composition quality remains enforced by browser rendering, deterministic scoring, and
  the two visual reviewers.
- Serious and critical Axe violations remain hard blockers.
- Axe rule names and selectors are passed into the targeted repair prompt.
- Lighthouse accessibility below 90 is now a warning instead of a duplicate blocker when Axe
  does not report a serious violation.
- The compiled prompt now explicitly requires marked output, WCAG contrast, sequential
  headings, one main landmark, and labels for every visible form field.

**Why**: A structurally valid concept was being rejected before it could be rendered because
its class names did not match an older visual heuristic. Separately, aggregate Lighthouse
scores could block release without enough detail for the repair pass.

**Testing**: Python compilation passed. All 27 pipeline unit tests passed.

---

# Code Changes Log

## 2026-05-15

### Phase 1 marked complete + hooks paths fixed

**Files affected**: `TASKS.md`, `.claude/settings.json`

**What changed**:
- `TASKS.md`: All 7 Phase 1 tasks moved to Done. Phase 0 strategy tasks also consolidated into Done. Active section cleared. Confirmed from `raw/onara-credentials.md`: GitHub account (ak123yay), Copilot PAT, GitHub App (ID: 3581680, Install: 129030249, RSA key), Google Places API key, Google OAuth client ID + secret, Supabase project, Cloudflare account + API token, Stripe secret key (test), Resend API key, NVIDIA NIM key, pipeline secret, Vercel token — all present.
- `.claude/settings.json`: Fixed SessionStart hook path from `obsidian-vault/TASKS.md` → `Onara_Vault/TASKS.md` and `obsidian-vault/wiki/_code-map.md` → `Onara_Vault/wiki/_code-map.md`. Paths were pointing to old folder name.

**Notes from credentials scan**:
- Supabase new key format: `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` + `SUPABASE_SECRET_KEY` (old JWT format not used)
- `OLLAMA_API_KEY` holds the NIM `nvapi-` key (naming mismatch)
- `VERCEL_TOKEN` present — user likely using Vercel for Next.js hosting
- Stripe partial: secret key done, webhook + price IDs still empty
- `PIPELINE_SERVER_URL` empty — needs Phase 3 Cloudflare Tunnel

**Why**: User confirmed Phase 1 complete via `raw/onara-credentials.md`. Hook paths referenced non-existent `obsidian-vault/` — corrected to `Onara_Vault/`.

---

### Seeded GBP leads tracker + created Facebook groups research file

**Files affected**: `output/gbp-leads-tracker.csv`, `wiki/research/facebook-groups.md`, `wiki/research/gbp-search-process.md`, `wiki/research/_index.md`

**What changed**:
- `gbp-leads-tracker.csv`: Populated with 73 contractor lead rows from DC/NoVA Craigslist skilled trade services (plumbers 25, electricians 11, HVAC 9, handymen 8, roofers 9, landscapers 2, other 9). Each row has business name, trade category, service city, phone (where available), `has_website: false`, and notes indicating source + GBP verification needed. 3 additional leads from Yelp search snippets (DC plumbers with addresses).
- `facebook-groups.md`: New file documenting 10 DC/NoVA contractor Facebook groups across 3 tiers: Tier 1 (contractor-facing trade groups), Tier 2 (neighborhood homeowner groups with contractor activity), Tier 3 (national trade group). Includes join order, 30-minute lurk protocol (what pain points/digital signals to observe), and outreach guidance (post only after 1–2 weeks observation).
- `gbp-search-process.md`: Added "Supplementary Source: Craigslist" section explaining how to verify pre-seeded leads on Google Maps (search phone number → confirm GBP listing → copy URL into tracker). Expected hit rate ~60–70%, projecting 44–51 confirmed GBP listings from current 73 seeds. Updated Related Files section.
- `wiki/research/_index.md`: Added `facebook-groups.md` entry.

**Why**: Phase 0 tasks "Identify 50+ GBP listings" and "Join 5–10 contractor Facebook groups" were flagged as incomplete by user. Browser extension not available for Google Maps scraping; Yelp/YellowPages/Porch.com return 403. Used Craigslist DC skilled trades section (accessible via WebFetch) as primary lead source — Craigslist operators are the strongest proxy for no-website contractors. Facebook groups file documents the 10 groups found via web search for the user to join manually.

**Remaining manual steps**:
- GBP task: User opens each lead in tracker → searches phone on Google Maps → pastes GBP URL → deletes non-GBP leads → target is 50 confirmed GBP+no-website leads
- Facebook task: User joins groups 1–6 from facebook-groups.md → reads each for 30 min → records observations in `output/facebook-lurk-notes.md`

---

### Added WTP section to ICP document

**Files affected**: `wiki/business/icp.md`, `TASKS.md`

**What changed**: Added a "Willingness to Pay (WTP)" section to the ICP document between the Pain Points section and the Secondary ICP section. The new section covers:
- Current spend benchmarks (what the ICP already pays web designers, Wix, etc.)
- Observed WTP for Onara pricing tiers ($12/month, $29/month, $99/year)
- Price sensitivity triggers and framing notes
- Per-segment WTP table (5 segments with current spend, WTP, and notes)

**Why**: Phase 0 Task 1 required the ICP document to include business type, geography, size, pain point, AND WTP. The WTP field was the only missing component.

**TASKS.md**: Moved "Fill out ICP document" from Active → Done.

---

### Committed launch metro area + created GBP leads infrastructure

**Files affected**: `wiki/business/gtm.md`, `wiki/research/gbp-search-process.md`, `wiki/research/_index.md`, `output/gbp-leads-tracker.csv`, `TASKS.md`

**What changed**:
- `gtm.md`: Replaced TBD metro area with "Washington DC / Northern Virginia" (committed 2026-05-15)
- `gbp-search-process.md`: New file — step-by-step Google Maps search process for DC/NoVA, covering 3 rounds of search terms across DC proper + 5 NoVA suburbs, tips for spotting no-website listings, field-by-field recording guide, and volume targets
- `gbp-leads-tracker.csv`: New file — blank CSV tracker with 19 columns (id, business_name, category, address, city, state, phone, has_website, website_url, gbp_url, facebook_url, email, rating, review_count, contacted, contact_method, contact_date, response, notes)
- `TASKS.md`: Marked "Commit to target metro area" done; annotated "Identify 50+ GBP listings" with tracker/process file references

**Why**: "Identify 50+ GBP listings" requires a committed metro area. Browser extension was not connected so listings could not be pulled automatically — tracker and process created for manual execution (60–90 min).

---

### Created contractor-specific features list

**Files affected**: `wiki/features/contractor-features.md`, `wiki/features/_index.md`, `TASKS.md`

**What changed**: New file `contractor-features.md` documents 8 contractor-specific UI features for generated sites:
1. Emergency banner (sticky, above nav, with emergency hook copy + 24/7 phone)
2. Service area section (city tag list, SEO-optimized, Agent 1 inference)
3. License & insurance badge (user-input number or generic claim, never fabricated)
4. Google reviews badge (★ rating + count from GBP, omitted if < 3 reviews)
5. Prominent phone CTA (large hero placement + mobile sticky button)
6. Services list (Agent 2 generated, 5–8 items from category)
7. Free estimate CTA + contact form (Supabase Edge Function, lead SMS hook)
8. Years in business chip (extracted from GBP description or user input)

Also documents 5 new Blackboard fields, a v1/later priority table, and design references back to PlumberMock.

**Why**: Phase 0 task required a niche-specific features list covering the 4 mentioned features. Expanded to a complete 8-feature spec since all 8 are needed for a credible contractor site.

---

### Decided v1 retention mechanisms

**Files affected**: `wiki/_decision-log.md`, `wiki/features/retention.md`, `TASKS.md`

**What changed**:
- `_decision-log.md`: Added 2026-05-15 retention entry — decision rationale and build-time estimates for all 3 chosen mechanisms
- `retention.md`: Updated target versions — Feature 2 (Reviews Badge) and Feature 3 (Lead SMS) changed from v1.5 → v1; Feature 1 (GBP Sync) amended to note v1 covers change-detection email only, auto-deploy remains v2.5
- `TASKS.md`: Marked "Decide which 2–3 retention mechanisms" as done

**Decision**: Lead SMS Notification + Reviews Badge Weekly Refresh + GBP Change Detection Email (email only, no auto-deploy)

**Why**: Selected on direct churn-reduction impact vs. build complexity. All three are buildable in 2–2.5 days total. Lead SMS provides the strongest "site is working" signal; reviews refresh keeps the site feeling alive; GBP change detection email seeds the v2.5 moat at minimal cost.

---

### Phase 1 Tasks 1–2: GitHub setup guide + .env.template scaffolded

**Files affected**:
- `wiki/dev/phase1-github-setup.md` (new)
- `Onara_Code/config/.env.template` (new)
- `wiki/dev/setup.md` (fix)
- `wiki/dev/_index.md` (updated)
- `TASKS.md` (updated)

**What changed**:
- `phase1-github-setup.md`: New step-by-step guide for Task 1 (GitHub account creation + Education verification at education.github.com, with proof-of-enrollment options) and Task 2 (fine-grained PAT creation with exact field values: name "Onara Copilot", 90 days, no repositories, GitHub Copilot read-only only)
- `.env.template`: All 45 env vars scaffolded with `[PENDING]` / `[AUTO]` status labels, grouped by service (GitHub, Google, Supabase, Cloudflare, Stripe, Resend, NIM, Ollama, Pipeline, ChromaDB, Next.js, Monitoring, Feature Flags). Created in `Onara_Code/config/` — the first file in the code directory.
- `setup.md`: Fixed Copilot PAT permission from "Read/Write" → "Read-only" (discrepancy vs. integrations/github.md and TASKS.md)
- `TASKS.md`: Annotated Phase 1 Tasks 1–2 with guide + template file references

**Why**: Both tasks require manual browser interaction (account creation, token generation). Deliverable is the exact-click guide + `.env.template` so the user can execute both tasks in under 10 minutes each and immediately paste values into the right file.

---

## 2026-06-09

### Wiki execution cleanup and secret redaction

**Files affected**: `TASKS.md`, `wiki/_code-map.md`, `wiki/_coding-rules.md`, `wiki/_decision-log.md`, `wiki/_master-index.md`, `wiki/architecture/*`, `wiki/ai_agents/*`, `wiki/dev/*`, `wiki/features/*`, `wiki/integrations/*`, `wiki/data/*`, `wiki/operations/*`, `wiki/business/pricing.md`, `wiki/content/*`, `wiki/legal/privacy-policy.md`, `wiki/onara_credentials.md`, `Onara_Code/config/.env.template`

**What changed**:
- Clarified that Phase 3 is the next actionable phase and Stripe live payouts are deferred.
- Standardized implementation paths around `Onara_Code/`, design source around `Onara_Design/`, and schema names around `users`, `projects`, `pipeline_jobs`, `revisions`, and `pipeline_errors`.
- Made the recommended dev topology explicit: FastAPI and Ollama run on the same host; `cloudflared` runs where FastAPI runs.
- Aligned model docs with the active 10-agent pipeline and the pulled Ollama models `qwen3:8b` and `llama3.3:8b`.
- Aligned Stripe price ID names, plan limits, reverse-trial behavior, annual-plan flag, and local concurrency defaults.
- Replaced `wiki/onara_credentials.md` with a no-secret checklist/template.

**Why**: The wiki had conflicting execution guidance, stale schema and agent names, old env var names, and live credentials stored in a wiki file. These conflicts would cause wrong implementation choices during Phase 3 and later phases.

---

### Raw-supported pricing, subscription, and model audit

**Files affected**: `TASKS.md`, `Onara_Code/config/.env.template`, `wiki/architecture/env-vars.md`, `wiki/business/pricing.md`, `wiki/business/roadmap.md`, `wiki/content/email-copy.md`, `wiki/content/landing-page.md`, `wiki/dev/phase-checklist.md`, `wiki/features/billing.md`, `wiki/features/build-flow.md`, `wiki/features/dashboard.md`, `wiki/features/revision-system.md`, `wiki/integrations/nvidia-nim.md`, `wiki/integrations/stripe.md`, `wiki/legal/terms-of-service.md`, `wiki/operations/billing-ops.md`, `wiki/testing/test-strategy.md`, `wiki/onara_credentials.md`

**What changed**:
- Confirmed raw sources use local Ollama models `qwen3:8b` and `llama3.3:8b`; no raw plan source supports `qwen3.5:9b`.
- Standardized paid plans as Stripe subscriptions: Starter at `$12/month or $99/year`, Pro at `$29/month`.
- Restored annual Starter support through `STRIPE_STARTER_ANNUAL_PRICE_ID` and `FEATURE_ANNUAL_PLAN=true`.
- Standardized plan limits: Trial 3 sites/unlimited revisions during trial, Free 1 preview site/3 revisions, Starter 1 live site/10 revisions, Pro 3 live sites/unlimited revisions.
- Updated revision reset guidance: Free resets via pg_cron on the 1st; Starter resets on Stripe billing period; Trial/Pro use unlimited revision limits.
- Updated trial expiry copy so Free keeps dashboard preview but hides the public URL after Day 14.
- Added a Phase 24 task for Starter annual checkout price support without marking the annual price ID as completed.

**Why**: The wiki still contained old Starter/Pro limits, disabled annual-plan guidance, stale customer emails, and inconsistent Agent 6 routing. The raw 30-step plan and business plan were used as the support source for the corrected wiki behavior.

---

### June 2026 model refresh + v1 business scope alignment

**Files affected**: `TASKS.md`, `PROJECT_CONTEXT.md`, `Onara_Code/config/.env.template`, `wiki/_decision-log.md`, `wiki/ai_agents/*`, `wiki/integrations/ollama.md`, `wiki/dev/*`, `wiki/business/*`, `wiki/content/landing-page.md`, `wiki/features/retention.md`, `wiki/operations/scaling.md`, `wiki/testing/unit-tests.md`

**What changed**:
- Standardized current Ollama local models to `qwen3.5:9b` primary and `gemma4:e4b` fallback/supervisor.
- Moved the model pull/verification task to the top of Phase 3, before Node/Python/pnpm and `cloudflared`.
- Confirmed Starter and Pro subscriptions remain in scope, with Starter monthly + annual pricing documented.
- Re-centered launch strategy on Washington DC / Northern Virginia contractors and home-service businesses.
- Removed fake landing-page social proof and replaced it with honest early-access positioning.
- Kept v1 retention focused on lead SMS and weekly reviews badge refresh; moved GBP polling/change detection, seasonal SEO, and custom domains to post-v1.
- Corrected MRR tracking so active trials are not counted as recurring revenue.
- Updated infrastructure guidance to treat 16 GB RAM as minimum and 24 GB as recommended for reliable local fallback with both Ollama models.

**Why**: The user selected newer local models and asked for one more full wiki/business audit. The wiki now treats raw files as historical source material, while `TASKS.md`, `PROJECT_CONTEXT.md`, and the decision log carry the current operating truth.

---

### Phase 3 Ollama models verified

**Files affected**: `TASKS.md`, `wiki/dev/phase-checklist.md`

**What changed**:
- Marked the Phase 3 Ollama model pull/verification task complete.
- Confirmed the active local model pair is `qwen3.5:9b` primary and `gemma4:e4b` fallback.
- Reordered the phase checklist so the completed model verification appears before the remaining toolchain install task.

**Why**: User confirmed both Ollama models were pulled and responded successfully.

---

## 2026-06-21

### Pipeline V1/V2 documentation

- Updated the root README and pipeline README to explain that Pipeline V1 remains available
  as the default rollback path.
- Documented migration `022`, Playwright Chromium installation, the V2 feature flag, PM2
  restart, verification, and rollback commands.
- Updated broad documentation, developer setup/commands, operations runbook, and testing
  strategy so activation instructions are consistent.
- Made the `chrome-launcher` ESM import compatible with its named exports and prevented a
  Windows temporary-profile cleanup `EPERM` from discarding a finished browser audit.
- Replaced raw pipeline stack traces in the Build Studio with concise user-facing errors and
  added safe wrapping for long status content.

---

## 2026-06-21

### Pipeline V2 + Build Studio

**Files affected**:
- `Onara_Code/pipeline/onara_pipeline/v2/*`
- `Onara_Code/pipeline/onara_pipeline/durable_jobs.py`
- `Onara_Code/pipeline/onara_pipeline/job_queue.py`
- `Onara_Code/pipeline/onara_pipeline/ai_client/*`
- `Onara_Code/pipeline/browser_audit.mjs`
- `Onara_Code/pipeline/package.json`
- `Onara_Code/supabase/migrations/022_pipeline_v2_durable_jobs.sql`
- `Onara_Code/app/components/places/BusinessSearchFlow.tsx`
- `Onara_Code/app/components/build/AgentProgressExperience.tsx`
- `Onara_Code/app/app/api/build/progress/*`
- `Onara_Code/app/app/globals.css`
- `Onara_Vault/TASKS.md`
- `Onara_Vault/wiki/architecture/deployment-pipeline.md`
- `Onara_Vault/wiki/architecture/env-vars.md`
- `Onara_Vault/wiki/ai_agents/workflows.md`
- `Onara_Vault/wiki/features/build-flow.md`

**What changed**:
- Added a disabled-by-default durable Pipeline V2 backed by Supabase job leases, ordered
  events, checkpoints, candidate storage, heartbeats, and restart recovery.
- Replaced the V2 Prompt Engineer model call with deterministic typed prompt compilation.
- Added two parallel Agent 6 website candidates with separate routes and visual recipes.
- Added real browser release checks through Playwright, Axe, Lighthouse, desktop/mobile/reflow
  screenshots, deterministic scoring, and two independent visual reviews.
- Replaced full-document repair loops with one document/component-hash-checked patch.
- Kept deterministic SEO, responsive, contact, QA, deployment, and emergency fallback safeguards.
- Reworked the generator into a Build Studio with a step rail, live brief, Smart Direction,
  optional advanced settings, and verified-data section gating.
- Reworked progress into seven customer stages with server ETA, real concept cards, selected
  concept state, readiness badges, preserved previews, and plain-language failure behavior.
- Added Pipeline V2 regression tests and mini-PC rollout/rollback documentation.

**Verification**:
- `pnpm.cmd type-check` passed.
- `python -m compileall onara_pipeline main.py` passed.
- `python -m unittest discover -s tests -p "test_*.py"` passed (15 tests).
- `node --check browser_audit.mjs` passed.
- `git diff --check` passed.
- `pnpm.cmd build` remains blocked on this Windows machine by the existing `spawn EPERM`.

**Why**: The serial one-candidate pipeline was slow and unreliable because it used another
model to compile prompts, rewrote whole documents during repair, kept queue state in memory,
and did not render/test competing concepts before deployment.

---

### Phase 3 toolchain check

**Files affected**: `TASKS.md`, `wiki/dev/phase-checklist.md`

**What changed**:
- Confirmed Node.js is installed at `v22.22.1`.
- Confirmed Python is installed at `Python 3.14.4`, satisfying the Python 3.11+ requirement.
- Split the remaining toolchain task so `pnpm` is the only unchecked install item.

**Why**: The original task bundled three tools together, but only `pnpm` is still missing.

---

### App-wide graceful degradation

**Files affected**:
- `Onara_Code/app/lib/resilience.ts`
- `Onara_Code/app/app/error.tsx`
- `Onara_Code/app/app/global-error.tsx`
- `Onara_Code/app/app/dashboard/error.tsx`
- `Onara_Code/app/app/account/error.tsx`
- `Onara_Code/app/app/api/health/route.ts`
- Places, pipeline, revision, billing, Cloudflare, GitHub, and dashboard request paths
- `Onara_Code/pipeline/onara_pipeline/v2/browser_quality.py`
- `Onara_Code/pipeline/onara_pipeline/v2/evaluator.py`
- `Onara_Vault/wiki/architecture/graceful-degradation.md`

**What changed**:
- Added shared bounded fetches and safe public service errors across the Next.js app.
- Added recoverable route, dashboard, account, root, and not-found UI boundaries.
- Added manual Places entry and a stable photo placeholder when Google is unavailable.
- Kept billing, authorization, destructive actions, and deployment approval fail-closed.
- Added `/api/health` capability reporting without returning secret values.
- Added a strict Pipeline V2 static release gate for browser-tooling outages.
- Persisted degraded quality mode in pipeline checkpoints and exposed honest quality badges.

**Verification**:
- `pnpm.cmd type-check` passed.
- `python -m unittest discover -s tests -p "test_*.py"` passed (17 tests).
- `python -m compileall onara_pipeline main.py` passed.
- `node --check browser_audit.mjs` passed.
- `git diff --check` passed.
- `pnpm.cmd build` remains blocked on this Windows machine by the existing `spawn EPERM`.

**Why**: A temporary outage in one provider should reduce only the affected capability. It
must not freeze the whole app, expose internal errors, lose user input, or bypass a safety gate.

---

### Pipeline V2 candidate and Lighthouse reliability

**What changed**:
- Removed `chrome-launcher` and launch Playwright Chromium directly for Lighthouse.
- Made Windows profile cleanup best-effort so an `EPERM` cannot discard a completed audit.
- Persist detailed serious/critical Axe findings instead of one generic accessibility error.
- Generate two distinct deterministic concepts when one or both AI candidate routes fail.
- Add deterministic tap-target, focus, and dark-panel contrast hardening before browser audit.
- Keep Lighthouse performance and LCP as optimization warnings instead of release blockers.
- Show a safe explanation of the actual release-gate category in Build Studio.

**Verification**:
- `python -m unittest discover -s tests -p "test_*.py"` passed (19 tests).
- `python -m compileall onara_pipeline main.py` passed.
- `node --check browser_audit.mjs` passed.
- `pnpm.cmd type-check` passed.
- `git diff --check` passed.

**Why**: A strong concept could score above 85 but still be rejected by small controls, a
generic Axe message, or Windows cleanup after Lighthouse had already finished. Both failed AI
routes also incorrectly collapsed the UI to one concept.

---

### Immediate route navigation

**What changed**:
- Added an app-wide top navigation progress indicator for internal links.
- Added root, dashboard, and account loading boundaries.
- Added Onara loading shells so destination routes render while Supabase/server data streams.
- Preserved normal browser behavior for external links, downloads, new tabs, modifiers, and
  same-page anchors.

**Verification**:
- `pnpm.cmd type-check` passed.
- `git diff --check` passed.

**Why**: Slow server-rendered pages previously left the old page visible with no response,
which made clicks feel broken even when navigation was still running.

---

### Route-shaped workspace loading

**What changed**:
- Replaced the generic workspace loading cards with skeletons shaped like the destination page.
- Added distinct dashboard, Build Studio, build progress, account, billing, checkout, and help loaders.
- Moved Dashboard, Account, and Help under one shared route-group layout without changing URLs.
- Kept the real dashboard sidebar mounted and interactive while workspace pages load.
- Kept Help protected by the auth middleware after moving it into the shared workspace.
- Made navigation feedback finish correctly when only URL search parameters change.
- Used a quiet opacity pulse instead of a large generic shimmer layout.

**Verification**:
- `pnpm.cmd type-check` passed.
- `git diff --check` passed.
- `pnpm.cmd build` reached Next.js compilation and remains blocked locally by the existing
  Windows `spawn EPERM` environment error.

**Why**: Loading UI should preserve page position and structure. The previous generic shell
caused a noticeable layout swap and could remove the sidebar between workspace sections.

---

### Reliable generation preview placeholder

**What changed**:
- Restored the original iframe-based Onara loading preview from Git history.
- Reject whitespace, partial documents, empty markup, and invalid cached previews.
- Remove stale preview cache entries instead of loading them into a blank iframe.
- Replace the loading document only after a complete document with visible content arrives.

**Verification**:
- `pnpm.cmd type-check` passed.
- `git diff --check` passed.

**Why**: Previously any truthy preview string could replace the loading state. Partial or stale
HTML then produced a large blank iframe even though the build was still running.

---

### Pipeline V2 release-gate recovery

**What changed**:
- Added deterministic repair for control width/height, 44px primary CTAs, mobile overflow,
  flexible media, wrapping, and empty icon-control accessible names.
- Re-audit the strongest candidate after deterministic repair before spending another model call.
- Use the bounded model patch only when deterministic repair does not clear the blockers.
- Added one final deterministic repair and browser re-audit after SEO/mobile/QA transforms.
- Kept structural and security failures fail-closed.

**Verification**:
- `python -m unittest discover -s tests -p "test_*.py"` passed (21 tests).
- `python -m compileall onara_pipeline main.py` passed.
- `git diff --check` passed.

**Why**: Strong concepts were being discarded for measurable browser issues that Onara could
repair safely, and the final transformed HTML had no repair opportunity before failure.

---

### Removed generic root loader

**What changed**:
- Removed the full-page "Loading your workspace" experience.
- Removed its unused generic card and heading styles.
- Kept route-shaped workspace skeletons, the thin navigation indicator, and the generation
  preview's "Building your website" state.

**Why**: The root loader added an unnecessary intermediate screen and did not match the page
that was actually opening.

---

### More accurate workspace skeletons

**What changed**:
- Rebuilt every workspace loading state with the same production classes used by its loaded page.
- Dashboard, Build, Progress, Account, Billing, Checkout, and Help now inherit the real grids,
  card dimensions, spacing, and responsive breakpoints instead of duplicating that geometry.
- Limited skeleton-only CSS to placeholder bars, icons, controls, and the quiet loading pulse.
- Neutralized the old Build and Progress wrapper geometry that could override the real layouts.

**Why**: The previous loaders had roughly correct cards but still shifted visibly when the real
content arrived because their dimensions were maintained separately from the finished pages.
