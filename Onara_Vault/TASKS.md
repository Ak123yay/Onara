# TASKS.md — Onara Work State

_This file is the single source of truth for all work. Claude updates this after every session._

---

## ✅ Done

- [x] Fill out ICP document (business type, geography, size, pain point, WTP)
- [x] Identify 50+ GBP listings without websites in target metro area _(tracker: output/gbp-leads-tracker.csv | 73 leads seeded from Craigslist DC/NoVA)_
- [x] Join 5–10 contractor Facebook groups; read for 30 min minimum _(10 groups documented: wiki/research/facebook-groups.md)_
- [x] Write niche-specific features list (emergency banner, service area, license number, reviews badge)
- [x] Decide which retention mechanisms go into v1 — Lead email + Reviews Badge Refresh; GBP change detection stays post-v1 unless explicitly unlocked
- [x] Commit to target metro area for launch — Washington DC / Northern Virginia
- [x] Create GitHub account (username: ak123yay) + submit GitHub Education verification
- [x] Generate fine-grained PAT for Copilot SDK (name: Onara Copilot, Copilot read-only)
- [x] Create GitHub App (Onara Deployer) with Contents R/W + Metadata R/O only _(App ID: 3581680)_
- [x] Create onara-sites repo (private)
- [x] Set up Google Cloud project (onara-prod)
- [x] Enable Places API (New) + create restricted API key
- [x] Configure Google OAuth consent screen + create OAuth 2.0 client ID
- [x] Create Supabase project _(URL: ihpavpkoysplbguzbofp.supabase.co)_
- [x] Create Cloudflare account + configure Pages _(account ID confirmed; Vercel also set up)_
- [x] Create Resend account + verify sending domain
- [x] Create Stripe account _(test key confirmed)_
- [x] Create Stripe test products — Free / Starter $12/mo / Pro $29/mo _(create price IDs in Stripe Dashboard → Products, test mode, no SSN needed)_

---

## 🔥 Active

Current actionable phase: **Phase 29 - Distribution**.

Note: Mini PC FastAPI runs under PM2. The named Cloudflare Tunnel serves `https://pipeline.onara.tech`.

Execution rule:
1. Complete the first unchecked, non-deferred task in this file.
2. Do not start implementation phases until Phase 3 and Phase 4 environment setup are complete.
3. Stripe live-mode payout setup is deferred to launch and does not block development.

---

## 📋 Backlog

### Phase 2 — Remaining / Deferred

- [x] Create Stripe webhook endpoint _(placeholder URL; events: checkout.session.completed, customer.subscription.deleted, invoice.payment_failed; whsec_ saved)_
- [x] Install Ollama on PC
- [x] Pulled initial Ollama models _(superseded by June 2026 model refresh)_
- [x] Fill Stripe price IDs into credentials _(STRIPE_FREE_PRICE_ID, STRIPE_STARTER_PRICE_ID, STRIPE_PRO_PRICE_ID)_
- [ ] Stripe live mode payout setup _(deferred to launch — SSN or EIN required; alt: Lemon Squeezy; does not block Phase 3)_

### Phase 3 — Dev Environment (PC)

- [x] Pull and verify current Ollama models: `qwen3.5:9b` primary and `gemma4:e4b` fallback
- [x] Confirm Node.js installed (`v22.22.1`)
- [x] Confirm Python 3.11+ installed (`Python 3.14.4`)
- [x] Install pnpm
- [x] Set up Cloudflare Tunnel (cloudflared)
- [x] Create .env file with all keys from phases 1–2

### Phase 4 — Dev Environment (Mini PC / Server)

- [x] Set up mini PC/server environment (FastAPI + cloudflared + PM2; Ollama stays on main PC over LAN)
- [x] Configure PM2 for FastAPI auto-restart _(FastAPI managed by PM2; Cloudflare named tunnel handled separately)_

### Phase 5 — Database

- [x] Design and implement Supabase schema (users, projects, revisions tables)
- [x] Define all column types and indexes
- [x] Write and run migration scripts

### Phase 6 — Database (Security)

- [x] Implement RLS policies for all tables
- [x] Set up auth trigger (on new user signup)
- [x] Write Supabase edge functions: revision reset, trial downgrade, Stripe webhook handler
- [x] Configure pg_cron for daily trial check

### Phase 7 — Auth & Google Places

- [x] Configure Google OAuth in Supabase
- [x] Add test users to OAuth consent screen
- [x] Build and test Google OAuth sign-in flow

### Phase 8 — Google Places Route

- [x] Build /api/places/search Next.js route (Text Search)
- [x] Build business confirmation card UI (name, address, phone, hours, photo)
- [x] Handle missing fields (amber highlight + manual input fallback)

### Phase 9 — Design System

- [x] Define Tailwind tokens (contractor vertical palette)
- [x] Build base components (Button, Card, Input, Badge)

### Phase 10 — Landing Page

- [x] Build niche-specific landing page (contractors copy)
- [x] Add pricing section (Free / Starter / Pro)
- [x] Add social proof section (placeholder until real testimonials)
- [x] Add 60-second demo video placeholder

### Phase 11 — Auth Pages

- [x] Build sign-up page
- [x] Build login page
- [x] Show Google-login guidance when Google-created accounts try password login
- [x] Implement Next.js middleware for route protection

### Phase 12 — Dashboard Shell

- [x] Build layout + sidebar
- [x] Build My Sites list view

### Phase 13 — Build Flow

- [x] Search → Confirm → Style → Generate 4-step flow
- [x] Style preference UI (color palette, layout style)

### Phase 14 — Agent Progress UI

- [x] SSE connection to stream agent status updates
- [x] Agent progress component (10 steps, live status)
- [x] Preview iframe (stream HTML chunks as they arrive)
- [x] Status fallback route for non-SSE browsers

### Phase 15 — FastAPI Server

- [x] Scaffold FastAPI project
- [x] Implement in-memory queue with deduplication
- [x] Expose /generate and /health endpoints
- [x] Test Cloudflare Tunnel connection

### Phase 16 — AI Client Library

- [x] Build unified AI client (NIM, Kimi, DeepSeek, Ollama)
- [x] Implement Agent 6 model picker (plan-gated)
- [x] Implement 429 retry logic + local model fallback

### Phase 17 — RAG System

- [x] Set up ChromaDB
- [x] Build BM25 hybrid search layer
- [x] Populate knowledge base with HTML/CSS/JS patterns

### Phase 18 — Agents 1–3

- [x] Agent 1: Analyst (z-ai/glm-5.1)
- [x] Agent 2: Content Writer (qwen3.5:9b) — parallel
- [x] Agent 3: Style Agent (z-ai/glm-5.1) — parallel with Agent 2

### Phase 19 — Agents 4–5

- [x] Agent 4: Planner (z-ai/glm-5.1)
- [x] Agent 5: Prompt Engineer (z-ai/glm-5.1)

### Phase 20 — Agent 6

- [x] Agent 6: Code Generator with model picker
- [x] Atomic component generation per Planner blueprint
- [x] Stream output to preview iframe

### Phase 21 — Agents 7–10

- [x] Blackboard Supervisor: inspect blackboard outputs/errors and decide continue, rerun an agent, route to debugger, or fail with a useful message
- [x] Agent 6 animation pass: add lightweight CSS animations to generated sites, require `prefers-reduced-motion`, and have Agent 10 validate mobile/performance safety
- [x] RAG animation patterns: add accessible motion guidance to ChromaDB seed library
- [x] Agent 7: Debugger (z-ai/glm-5.1)
- [x] Agent 8: SEO Agent (qwen3.5:9b)
- [x] Agent 9: QA (z-ai/glm-5.1)
- [x] Agent 10: Mobile / responsive check (qwen3.5:9b)

### Phase 22 — Deployment Pipeline

- [x] HTML parser: split output into atomic component files
- [x] GitHub commit: push to onara-sites/sites/{projectId}/
- [x] Cloudflare Pages Direct Upload deployment
- [x] Store project record in Supabase

### Phase 23 — Revision System

- [x] Allow users to leave or close the generation page while a site is building, then return to dashboard/progress and resume live status from the saved job
- [x] Incremental component update logic
- [x] Revision counter decrement + monthly reset
- [x] Retry button on agent failure (no revision deducted)
- [x] Multi-message back-and-forth revision threads
- [x] Visual before/after diff view
- [x] Manual component selection for exact edit targeting
- [x] Rollback UI using stored before-file snapshots
- [x] Advanced agent changed-file explanation view

### Phase 24 — Stripe Billing

- [x] Checkout session creation
- [x] Starter annual checkout price support (`STRIPE_STARTER_ANNUAL_PRICE_ID`, $99/year)
- [x] Webhook handler: subscription created, updated, deleted, payment failed
- [x] Reverse trial: set trial_ends_at on signup, daily Supabase edge function to downgrade

### Phase 25 — Account Page

- [x] Plan display + upgrade CTA
- [x] Custom embedded Stripe Elements checkout
- [x] Express Checkout wallet buttons (Apple Pay / Google Pay / Link)
- [x] Custom domain integration ($5 one-time per generated site)
- [x] Daily dashboard AI brief: summarize deployed sites and recommendations once per day when the user opens the dashboard
- [x] Enforce active site limits before generation starts and in Supabase (Free/Starter 1, Pro/Trial 3)
- [x] Allow users to delete finished/failed sites from the dashboard and free the site slot
- [x] Plan gating for Agent 6 model picker
- [x] Cancellation flow (deploy placeholder page to Cloudflare)
- [x] Billing page subscription cancellation action

### Phase 26 — Retention Features

- [x] Lead email notification on contact form submit
- [x] Code download as a folder included for Pro users
- [x] Create the help page
- [x] Google Reviews badge refresh (weekly pull)
- [x] Keep GBP polling/change detection disabled for v1 (`FEATURE_GBP_SYNC=false`)

### Phase 27 — Architecture Hardening

- [x] Generated-site visual quality gate: move Style Agent to GLM, reject generic centered brochure layouts, and require professional Onara-style local-business composition before deploy
- [x] Generated-site photo resolver: convert Google Places photo references into deploy-safe image URLs and require photo usage when photos are available
- [x] Generated-site Onara theme enforcement: require paper/ink/terracotta variables, Fraunces/Inter/mono typography, low-radius panels, and Onara QA gate before deploy
- [x] Scope generated-site component-order validation to body markup so CSS selectors cannot trigger false header/hero failures
- [x] Build progress page redesign: structured live build summary, status cards, agent queue, and cleaner preview workspace
- [x]  **if not listed on google maps,you can create your own and put your own information in**
- [x] **Add onara favicon**
- [x] 11 production fixes (document each in wiki as identified)
- [x] PM2 setup on pipeline server
- [x] UptimeRobot monitoring on /health endpoint
- [x] Keep Agent 6 AI-generated HTML as the primary path by tokenizing embedded photo data during prompting and restoring it before validation/deployment
- [x] AI blackboard reviewer: optional advisory model pass over blackboard outputs that suggests warnings/reruns, while deterministic supervisor remains the final pass/fail authority
- [x] Curated RAG learning loop: save only QA-approved generated components/patterns back into ChromaDB so future builds improve without storing bad or duplicate sites
- [x] Training data pipeline: add user consent fields and `training_examples` storage for QA-approved, redacted generation examples that can feed RAG now and future model fine-tuning later
- [x] Pipeline V2: durable Supabase leases/checkpoints, parallel code candidates, browser + visual evaluation, bounded component repair, and feature-flag rollback
- [x] Build Studio UI rework: persistent step rail, live business brief, Smart Direction defaults, supported-section gating, concept cards, server ETA, and release-readiness badges
- [x] App-wide graceful degradation: recoverable error boundaries, manual Places fallback, safe photo placeholders, user-safe API errors, and Pipeline V2 static release gate when browser tooling is unavailable
- [x] Immediate app navigation: show destination loading shells while server data streams instead of leaving the previous page frozen
- [x] Route-shaped workspace skeletons: preserve the dashboard sidebar and match dashboard, build, progress, account, billing, and checkout layouts while data loads
- [x] Reliable build preview placeholder: preserve the original Onara loading preview until complete, renderable HTML is available
- [x] Pipeline V2 release-gate recovery: deterministically repair common accessibility, tap-target, and responsive blockers before abandoning a strong concept
- [x] Remove the obsolete generic root loading experience; use route-shaped workspace skeletons and the thin navigation indicator only
- [x] Match workspace skeleton geometry to real page content, including dashboard recommendations, account training controls, billing metrics, help columns, and all seven build stages

### Phase 28 — Pre-Launch

- [x] Privacy policy + terms of service
- [x] **Update .env.example** 
- [x] Launch SEO metadata, robots, sitemap, manifest, and social cards
- [x] Add `support@onara.tech` across the website and app surfaces (footer, account/help areas, auth emails, billing/contact copy)
- [x] Support email AI responder: keep forwarding `support@onara.tech` to Aarush, but add an inbound email worker/webhook that uses an NVIDIA NIM model to send the first support reply, log the thread, and escalate billing/security/account issues to human review
- [x] Training-data consent copy, opt-out/delete handling, and privacy-policy disclosure for using approved generated sites/edits/feedback to improve Onara models
- [ ] Error monitoring (Sentry or equivalent) _(deferred by user; add later)_
- [x] Security review: RLS audit, API key rotation checklist, vulnerability audit _(report: wiki/operations/security-review-2026-06-19.md; manual provider-dashboard key rotation still required before launch)_
- [x] Publish Google OAuth app (remove testing mode)

### Phase 29 — Distribution

- [ ] Cold outbound sequence drafted (Google Maps no-website leads)
- [ ] Contractor Facebook groups outreach plan
- [ ] Trade association partnership email
- [ ] Accountant referral program setup (20% MRR for 12 months per active referral)

### Phase 30 — Launch

- [ ] Soft launch to 20-person warm list
- [ ] Product Hunt launch assets prepared
- [ ] Metrics dashboard: signups, trials started, conversions, MRR
- [ ] Day 11 and Day 13 trial expiry emails live in Resend

---

## 💡 Ideas / Future

- v1.5: BullMQ + Redis queue when avg wait > 5 min
- v1.5: Second DigitalOcean Droplet + load balancing
- v2: Hands-off maintenance (email a change → site updates automatically)
- v2.5 Moat 1: Continuous Google Sync (auto-detect GBP changes)
- v2.5 Moat 2: Visual Style DNA (vision model extracts colors from business photos)
- v2.5 Moat 3: Instant SEO landing pages per location/niche
- v3: Custom domain via Cloudflare API
- v3: SEO scoring dashboard
- v3: White-label for agencies
