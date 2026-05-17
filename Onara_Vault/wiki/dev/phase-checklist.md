# 30-Phase Implementation Checklist

Each phase maps to a section of TASKS.md. Phases are ordered by dependency — do not skip ahead.

---

## Phase 0 — Strategy
- [ ] Fill out ICP document (business type, geography, size, pain point, WTP)
- [ ] Identify 50+ GBP listings without websites in target metro area
- [ ] Join 5–10 contractor Facebook groups; read for 30 min minimum
- [ ] Write niche-specific features list (emergency banner, service area, license number, reviews badge)
- [ ] Decide which 2–3 retention mechanisms go into v1
- [ ] Commit to target metro area for launch

## Phase 1 — GitHub Accounts
- [ ] Create GitHub App (Onara Deployer): Contents R/W + Metadata R-only
- [ ] Create `onara-sites` repo (private)
- [ ] Generate Copilot fine-grained PAT (Copilot Requests: R/W)

## Phase 2 — Service Accounts
- [ ] Create Supabase project
- [ ] Create Google Cloud project (onara-prod): enable Places API (New), create restricted key
- [ ] Configure Google OAuth consent screen + create OAuth 2.0 client ID
- [ ] Create Cloudflare account + configure Pages
- [ ] Create Stripe account + create products (Free, Starter $12, Pro $29)
- [ ] Create Resend account + verify sending domain
- [ ] Install Ollama on PC: pull qwen3:8b and llama3.3:8b

## Phase 3 — Dev Environment (PC)
- [ ] Install Node.js 20+, Python 3.11+, pnpm
- [ ] Set up Cloudflare Tunnel (`cloudflared`)
- [ ] Create `.env` files with all keys from Phases 1–2

## Phase 4 — Server Environment
- [ ] Set up identical environment on mini PC or DigitalOcean Droplet ($24/month 4 GB)
- [ ] Configure PM2 for FastAPI auto-restart on crash

## Phase 5 — Database Schema
- [ ] Run migration: custom types → tables → indexes (see `wiki/data/migrations.md`)

## Phase 6 — Database Security
- [ ] Apply RLS policies for all 7 tables (see `wiki/data/rls-policies.md`)
- [ ] Set up `handle_new_user` trigger (auto-create user profile on signup)
- [ ] Set up project limit + revision tracking triggers (see `wiki/data/triggers.md`)
- [ ] Configure pg_cron jobs (see `wiki/data/pg-cron-jobs.md`)

## Phase 7 — Google OAuth
- [ ] Configure Google OAuth in Supabase (client ID + secret)
- [ ] Add test users to OAuth consent screen (required until app is published)
- [ ] Build and test Google OAuth sign-in flow end-to-end

## Phase 8 — Google Places Route
- [ ] Build `/api/places/search` Next.js route (Text Search API)
- [ ] Build `/api/places/confirm` route (save confirmed business)
- [ ] Build business confirmation card UI (name, address, phone, hours, photo)
- [ ] Handle missing fields (amber highlight + manual input fallback)

## Phase 9 — Design System
- [ ] Define Tailwind tokens (contractor vertical palette)
- [ ] Build base components: Button, Card, Input, Badge
- [ ] Migrate `raw/styles.jsx` to `onara-app/src/components/`

## Phase 10 — Landing Page
- [ ] Build niche-specific landing page (contractors copy from `wiki/content/landing-page.md`)
- [ ] Add pricing section (Free / Starter / Pro with reverse trial messaging)
- [ ] Add social proof section (placeholder until real testimonials)
- [ ] Add 60-second demo video placeholder

## Phase 11 — Auth Pages
- [ ] Build sign-up page
- [ ] Build login page
- [ ] Implement Next.js middleware for route protection (`matcher` on `/dashboard/**`)

## Phase 12 — Dashboard Shell
- [ ] Build layout + sidebar navigation
- [ ] Build My Sites list view (pulls from `/api/account`)

## Phase 13 — Build Flow
- [ ] 4-step flow: Search → Confirm → Style → Generate
- [ ] Style preference UI (color palette chips, layout/tone options)

## Phase 14 — Agent Progress UI
- [ ] SSE connection to `/api/stream/:job_id`
- [ ] Agent progress component (10 steps, live status per step)
- [ ] Preview iframe (render HTML as it streams)
- [ ] Status fallback route for non-SSE browsers (poll `/api/status` every 5s)

## Phase 15 — FastAPI Server
- [ ] Scaffold FastAPI project with project structure
- [ ] Implement in-memory job queue with deduplication (reject duplicate `project_id`)
- [ ] Expose `/pipeline/start`, `/pipeline/status/:job_id`, `/health` endpoints
- [ ] Test Cloudflare Tunnel connection with Next.js

## Phase 16 — AI Client Library
- [ ] Build unified AI client (NIM, Ollama, Kimi, DeepSeek endpoints)
- [ ] Implement Agent 6 model picker (plan-gated — see `wiki/ai_agents/models.md`)
- [ ] Implement 429 retry logic with exponential backoff
- [ ] Implement local model fallback when NIM fails

## Phase 17 — RAG System
- [ ] Set up ChromaDB at `./chroma_db`
- [ ] Seed collection from `raw/10_rag_seed_content.md` (~60 patterns)
- [ ] Implement metadata-filtered query (by business category + section type)
- [ ] Wire RAG into Agent 7 (Debugger) and Agent 9 (QA)

## Phase 18 — Agents 1–3
- [ ] Agent 1: Business Analyst (deepseek-v4-flash → JSON spec)
- [ ] Agent 2: Content Writer (qwen3:8b → copy JSON) — parallel
- [ ] Agent 3: Style Agent (qwen3:8b → design tokens) — parallel with Agent 2
- [ ] Supervisor validation between each step

## Phase 19 — Agents 4–5
- [ ] Agent 4: Planner (deepseek-v4-pro → component blueprint JSON)
- [ ] Agent 5: Prompt Engineer (kimi-k2.6 → optimized code-gen prompt string)

## Phase 20 — Agent 6
- [ ] Agent 6: Code Generator with plan-gated model picker
- [ ] Atomic component generation per Planner blueprint
- [ ] FILE_MARKER extraction with regex parser
- [ ] Stream partial output to preview iframe

## Phase 21 — Agents 7–10
- [ ] Agent 7: Debugger (kimi-k2.6 → fixed HTML or PASS)
- [ ] Agent 8: SEO Agent (qwen3:8b → SEO-injected HTML)
- [ ] Agent 9: QA (deepseek-v4-pro → PASS or blocking issues JSON)
- [ ] Agent 10: Mobile (qwen3:8b → mobile-optimized HTML)
- [ ] Full pipeline integration test end-to-end

## Phase 22 — Deployment Pipeline
- [ ] HTML parser: extract final HTML from FILE_MARKER wrapper
- [ ] Cloudflare Pages Direct Upload (create project if new, then deploy)
- [ ] GitHub commit: push to `onara-sites/sites/{projectId}/index.html`
- [ ] Supabase storage: save to `site-html` bucket
- [ ] Update `projects` record with `public_url`, `status = 'live'`, `last_deployed_at`

## Phase 23 — Revision System
- [ ] Incremental component update logic (re-run from Agent 5 with revision instruction)
- [ ] Revision counter decrement on submit (trigger handles Supabase write)
- [ ] Retry button for failed jobs (no revision deducted)
- [ ] Monthly reset verification

## Phase 24 — Stripe Billing
- [ ] Checkout session creation endpoint
- [ ] Webhook handler: subscription lifecycle (created, updated, deleted, payment_failed)
- [ ] Trial downgrade: verify pg_cron job runs daily + test downgrade manually

## Phase 25 — Account Page
- [ ] Plan display + usage meter (revisions used/remaining)
- [ ] Upgrade CTA → triggers Stripe Checkout
- [ ] Customer Portal link → Stripe-hosted portal
- [ ] Plan gating: verify Agent 6 model picker reads user plan correctly

## Phase 26 — Retention Features
- [ ] GBP polling: cron job to check Google for hours/phone changes every 24h
- [ ] Google Reviews badge: weekly pull + embed on generated sites
- [ ] Lead SMS notification on contact form submit (Twilio or similar)

## Phase 27 — Architecture Hardening
- [ ] PM2 config: auto-restart FastAPI on crash, log to file
- [ ] UptimeRobot: monitor `/health`, alert at 5-min downtime
- [ ] PostHog analytics: instrument key events (see `wiki/operations/monitoring.md`)
- [ ] Rate limiting on Next.js API routes (Upstash Redis or Vercel middleware)
- [ ] Structured error logging to `pipeline_errors` table

## Phase 28 — Pre-Launch
- [ ] Deploy privacy policy + terms of service pages
- [ ] Publish Google OAuth app (remove testing mode)
- [ ] Security audit: RLS policy test, API key rotation, CORS headers
- [ ] Lighthouse audit all key pages (target 90+ performance, 100 accessibility)

## Phase 29 — Distribution
- [ ] Cold outbound sequence: 50+ GBP no-website leads identified in target metro
- [ ] Facebook group outreach plan (see `wiki/content/outbound-scripts.md`)
- [ ] Accountant referral program configured (20% MRR for 12 months)
- [ ] Trade association partnership email sent

## Phase 30 — Launch
- [ ] Soft launch to 20-person warm list
- [ ] Day 11 and Day 13 trial expiry emails live in Resend
- [ ] Metrics dashboard: signups, trials, conversions, MRR
- [ ] Product Hunt launch assets prepared (tagline, screenshots, video)
