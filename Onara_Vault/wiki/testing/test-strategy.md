# Test Strategy — Onara

_Step verification checklists, Agent 9 QA gate, and pre-launch manual QA. Source: raw/Onara_Business_Plan_v12.md + raw/03_agent_prompts.md._

---

## Testing Layers

1. **Step checklists** — manual verification after each development phase
2. **Agent 9 QA gate** — automated quality check on every generated site
3. **Pre-launch manual QA** — full human review before first real customer

---

## Step Verification Checklists

### Phase 1–2 — Accounts & Services
- [ ] GitHub App: commit to `onara-sites` via App credentials works
- [ ] Supabase: connect via anon key and service role key
- [ ] Google Places API: curl Text Search returns a business
- [ ] Stripe: Free placeholder, Starter monthly ($12), Starter annual ($99), and Pro monthly ($29) prices created
- [ ] Resend: test email delivered from `hello@onara.tech`

### Phase 3–4 — Dev Environment
- [ ] Node 18+, Python 3.11+, pnpm installed
- [ ] `ollama run qwen3.5:9b "Say hello"` → responds
- [ ] `ollama run gemma4:e4b "Say hello"` → responds
- [ ] Cloudflare Tunnel: `curl {TUNNEL_URL}/health` → 200

### Phase 5–6 — Database
- [ ] All 7 tables created in Supabase
- [ ] RLS enabled on all tables
- [ ] `on_auth_user_created` trigger: sign up test user → row in `public.users`
- [ ] `check_project_limit` trigger: blocks second project for free user
- [ ] pg_cron: `SELECT * FROM cron.job` → 4 jobs visible

### Phase 7 — Auth
- [ ] Google OAuth sign-in end-to-end
- [ ] `/dashboard` redirects to `/login` when unauthenticated

### Phase 8 — Places Route
- [ ] `POST /api/places/search` returns results
- [ ] Missing phone shows amber highlight in confirmation card

### Phase 15 — FastAPI
- [ ] `GET /health` → `{"status": "ok", "ollama": true}`
- [ ] Duplicate project_id → `429 duplicate_job`

### Phase 16–20 — Agents 1–6
- [ ] Agent 1 returns valid JSON with all 10 required fields
- [ ] Agents 2 and 3 run concurrently (both finish before Agent 4)
- [ ] Agent 6 output contains `{FILE_MARKER_START}` and `{FILE_MARKER_END}`
- [ ] Parser regex extracts valid HTML

### Phase 21–22 — Agents 7–10 + Deployment
- [ ] Agent 7 returns PASS or complete corrected HTML (never partial)
- [ ] Agent 8 injects `<title>`, meta description, JSON-LD
- [ ] Agent 9 returns FAIL for known bad HTML
- [ ] Agent 10 HTML: 44px touch targets, 16px form inputs
- [ ] Cloudflare Pages deployment creates live URL
- [ ] GitHub commit appears in `onara-sites`
- [ ] Supabase project: `status='live'`, `public_url` set

### Pipeline V2
- [ ] Migration `022_pipeline_v2_durable_jobs.sql` applies successfully
- [ ] Browser dependencies install with `npm install` and `npm run install-browser`
- [ ] Two distinct candidates generate concurrently
- [ ] Desktop, mobile, 320px reflow, Axe, and Lighthouse reports complete
- [ ] Candidate with any hard blocker cannot deploy
- [ ] One valid candidate can succeed when the alternate model route fails
- [ ] PM2 restart recovers a queued/running durable job after its lease is available
- [ ] Duplicate active request returns the existing job instead of creating another
- [ ] `PIPELINE_V2_ENABLED=false` returns new builds to Pipeline V1
- [ ] Browser audit infrastructure failure runs the strict static gate when `PIPELINE_V2_STATIC_AUDIT_FALLBACK=true`
- [ ] Static mode blocks unsafe scripts, incomplete documents, missing CTA/contact form, and invalid image sources
- [ ] Static mode never displays desktop-tested or mobile-tested badges

### Pipeline V3
- [ ] Migration `023_pipeline_v3_components.sql` applies successfully
- [ ] Three distinct directions are created and two are selected
- [ ] Both candidates build components concurrently
- [ ] Completed component rows are reused after a simulated worker restart
- [ ] Invalid component HTML/CSS retries, then falls back only for that component
- [ ] Desktop, tablet, mobile, and 320px reports complete
- [ ] Serious Axe, unsafe output, broken assets, missing structure, and overflow block release
- [ ] Performance/SEO/preferred-score guidance does not discard a safe candidate
- [ ] `PIPELINE_V3_CANARY_PERCENT` routes deterministically
- [ ] `PIPELINE_V3_ENABLED=false` returns new builds to V2

### Graceful Degradation
- [ ] `GET /api/health` exposes readiness booleans without secret values
- [ ] Places outage opens manual business entry and preserves typed details
- [ ] Places photo outage renders the Onara SVG placeholder
- [ ] Pipeline start timeout releases the reserved project and allows retry
- [ ] Dashboard/account route errors render the shared recovery surface
- [ ] Checkout timeout leaves plan and payment state unchanged
- [ ] Cloudflare/GitHub timeouts preserve the Supabase project record
- [ ] Delete, cancellation, revision, and rollback actions fail closed when confirmation is unavailable

### Phase 24 — Stripe
- [ ] Checkout creates subscription (Stripe test mode)
- [ ] `customer.subscription.deleted` → `plan='free'`, `show_url=FALSE`
- [ ] `invoice.payment_failed` → payment failure email via Resend

---

## Agent 9 QA Gate (In-Pipeline)

10 checks on every generated site before it reaches the Mobile Agent.

| Check | Pass Condition |
|-------|---------------|
| Business name in H1 | `business_name` in H1 or hero headline |
| Phone as `tel:` link | At least one `href="tel:..."` (if CTA type = phone_call) |
| Contact section | Section with form or phone exists |
| Reviews section | Present if `google_rating` provided |
| Image alt text | All `<img>` have non-empty `alt` |
| No placeholder text | No "Lorem ipsum" or "[INSERT TEXT HERE]" |
| CSS variables defined | All `var(--...)` have `:root` declarations |
| No broken CTAs | No important `href="#"` |
| Footer | Contains business name and year |
| Meta description | Present, under 160 chars |

**On FAIL**: retry from Agent 6 (max 2 retries). Third fail → job marked `failed`. No revision deducted on pipeline failures.

---

## Pre-Launch Manual QA

### Site Quality
- [ ] Generated site for real contractor looks professional
- [ ] Mobile layout works on iPhone + Android
- [ ] Load time < 2s (no external resources except Google Fonts)
- [ ] Lighthouse accessibility ≥ 90
- [ ] Phone CTA clickable on mobile

### Billing
- [ ] 14-day trial starts with no credit card
- [ ] Day 11 and Day 13 trial emails deliver
- [ ] Day 14 downgrade: `show_url=FALSE`, public URL → suspension page
- [ ] Stripe Checkout upgrade end-to-end
- [ ] Cancellation: real site → suspension placeholder

### Security
- [ ] RLS: User A cannot read User B's projects
- [ ] API keys absent from browser network requests
- [ ] `/api/billing/webhook` rejects invalid Stripe signatures
- [ ] `/api/generate` rejects missing JWT

### Operations
- [ ] UptimeRobot alert fires when pipeline server stops
- [ ] PM2 auto-restarts after `kill {pid}`
- [ ] `pipeline_errors` table captures agent failures

---

## Test Environment

Separate Supabase project + Stripe test mode for development. Never run destructive tests against production.
