# TASKS.md — Onara Work State

_This file is the single source of truth for all work. Claude updates this after every session._

---

## ✅ Done

- [x] Fill out ICP document (business type, geography, size, pain point, WTP)
- [x] Identify 50+ GBP listings without websites in target metro area _(tracker: output/gbp-leads-tracker.csv | 73 leads seeded from Craigslist DC/NoVA)_
- [x] Join 5–10 contractor Facebook groups; read for 30 min minimum _(10 groups documented: wiki/research/facebook-groups.md)_
- [x] Write niche-specific features list (emergency banner, service area, license number, reviews badge)
- [x] Decide which retention mechanisms go into v1 — Lead SMS + Reviews Badge Refresh; GBP change detection stays post-v1 unless explicitly unlocked
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

Current actionable phase: **Phase 3 — Dev Environment (PC)**.

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
- [ ] Configure PM2 for FastAPI auto-restart

### Phase 5 — Database

- [ ] Design and implement Supabase schema (users, projects, revisions tables)
- [ ] Define all column types and indexes
- [ ] Write and run migration scripts

### Phase 6 — Database (Security)

- [ ] Implement RLS policies for all tables
- [ ] Set up auth trigger (on new user signup)
- [ ] Write Supabase edge functions: revision reset, trial downgrade, Stripe webhook handler
- [ ] Configure pg_cron for daily trial check

### Phase 7 — Auth & Google Places

- [ ] Configure Google OAuth in Supabase
- [ ] Add test users to OAuth consent screen
- [ ] Build and test Google OAuth sign-in flow

### Phase 8 — Google Places Route

- [ ] Build /api/places/search Next.js route (Text Search)
- [ ] Build business confirmation card UI (name, address, phone, hours, photo)
- [ ] Handle missing fields (amber highlight + manual input fallback)

### Phase 9 — Design System

- [ ] Define Tailwind tokens (contractor vertical palette)
- [ ] Build base components (Button, Card, Input, Badge)

### Phase 10 — Landing Page

- [ ] Build niche-specific landing page (contractors copy)
- [ ] Add pricing section (Free / Starter / Pro)
- [ ] Add social proof section (placeholder until real testimonials)
- [ ] Add 60-second demo video placeholder

### Phase 11 — Auth Pages

- [ ] Build sign-up page
- [ ] Build login page
- [ ] Implement Next.js middleware for route protection

### Phase 12 — Dashboard Shell

- [ ] Build layout + sidebar
- [ ] Build My Sites list view

### Phase 13 — Build Flow

- [ ] Search → Confirm → Style → Generate 4-step flow
- [ ] Style preference UI (color palette, layout style)

### Phase 14 — Agent Progress UI

- [ ] SSE connection to stream agent status updates
- [ ] Agent progress component (10 steps, live status)
- [ ] Preview iframe (stream HTML chunks as they arrive)
- [ ] Status fallback route for non-SSE browsers

### Phase 15 — FastAPI Server

- [ ] Scaffold FastAPI project
- [ ] Implement in-memory queue with deduplication
- [ ] Expose /generate and /health endpoints
- [ ] Test Cloudflare Tunnel connection

### Phase 16 — AI Client Library

- [ ] Build unified AI client (NIM, Kimi, DeepSeek, Ollama)
- [ ] Implement Agent 6 model picker (plan-gated)
- [ ] Implement 429 retry logic + local model fallback

### Phase 17 — RAG System

- [ ] Set up ChromaDB
- [ ] Build BM25 hybrid search layer
- [ ] Populate knowledge base with HTML/CSS/JS patterns

### Phase 18 — Agents 1–3

- [ ] Agent 1: Analyst (deepseek-v4-flash)
- [ ] Agent 2: Content Writer (qwen3.5:9b) — parallel
- [ ] Agent 3: Style Agent (qwen3.5:9b) — parallel with Agent 2

### Phase 19 — Agents 4–5

- [ ] Agent 4: Planner (deepseek-v4-pro)
- [ ] Agent 5: Prompt Engineer (kimi-k2.6)

### Phase 20 — Agent 6

- [ ] Agent 6: Code Generator with model picker
- [ ] Atomic component generation per Planner blueprint
- [ ] Stream output to preview iframe

### Phase 21 — Agents 7–10

- [ ] Agent 7: Debugger (kimi-k2.6)
- [ ] Agent 8: SEO Agent (qwen3.5:9b)
- [ ] Agent 9: QA (deepseek-v4-pro)
- [ ] Agent 10: Mobile / responsive check (qwen3.5:9b)

### Phase 22 — Deployment Pipeline

- [ ] HTML parser: split output into atomic component files
- [ ] GitHub commit: push to onara-sites/sites/{projectId}/
- [ ] Cloudflare Pages Direct Upload deployment
- [ ] Store project record in Supabase

### Phase 23 — Revision System

- [ ] Incremental component update logic
- [ ] Revision counter decrement + monthly reset
- [ ] Retry button on agent failure (no revision deducted)

### Phase 24 — Stripe Billing

- [ ] Checkout session creation
- [ ] Starter annual checkout price support (`STRIPE_STARTER_ANNUAL_PRICE_ID`, $99/year)
- [ ] Webhook handler: subscription created, updated, deleted, payment failed
- [ ] Reverse trial: set trial_ends_at on signup, daily Supabase edge function to downgrade

### Phase 25 — Account Page

- [ ] Plan display + upgrade CTA
- [ ] Plan gating for Agent 6 model picker
- [ ] Cancellation flow (deploy placeholder page to Cloudflare)

### Phase 26 — Retention Features

- [ ] Lead SMS notification on contact form submit
- [ ] Google Reviews badge refresh (weekly pull)
- [ ] Keep GBP polling/change detection disabled for v1 (`FEATURE_GBP_SYNC=false`)

### Phase 27 — Architecture Hardening

- [ ] 11 production fixes (document each in wiki as identified)
- [ ] PM2 setup on pipeline server
- [ ] UptimeRobot monitoring on /health endpoint

### Phase 28 — Pre-Launch

- [ ] Privacy policy + terms of service
- [ ] Error monitoring (Sentry or equivalent)
- [ ] Security review: RLS audit, API key rotation
- [ ] Publish Google OAuth app (remove testing mode)

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
