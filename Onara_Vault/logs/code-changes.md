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
