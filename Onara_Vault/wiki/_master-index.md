# _master-index.md — Onara Wiki Master Index

_Claude keeps this file updated after every compile. You review it; you do not edit it manually._ _Last compiled: 2026-05-16 (fourth compile)_

---

## Meta Files

| File | Status | Description |
| ---- | ------ | ----------- |
| `wiki/_master-index.md` | ✅ initialized | This file — complete map of all wiki articles |
| `wiki/_code-map.md` | ✅ initialized | Maps every feature/concept to code folder paths and env vars |
| `wiki/_coding-rules.md` | ✅ initialized | Coding constraints, architecture rules, security rules |
| `wiki/_decision-log.md` | ✅ initialized | Running log of decisions made during development |
| `wiki/onara_credentials.md` | ✅ initialized | No-secret credentials checklist and env placement guide |

---

## Architecture

| File | Status | Description |
|------|--------|-------------|
| `wiki/architecture/_index.md` | ✅ initialized | Section index for architecture articles |
| `wiki/architecture/system-design.md` | ✅ initialized | 3-layer stack, request flow, infrastructure overview |
| `wiki/architecture/modules.md` | ✅ initialized | Module interaction map: frontend ↔ API ↔ pipeline ↔ Supabase |
| `wiki/architecture/deployment-pipeline.md` | ✅ initialized | 10-step deploy flow, concurrency config, error handling, CI/CD |
| `wiki/architecture/security.md` | ✅ initialized | Auth JWT, pipeline secret, RLS per table, Stripe HMAC, CORS |
| `wiki/architecture/env-vars.md` | ✅ initialized | Environment variables by service with usage context |
| `wiki/architecture/api-reference.md` | ✅ initialized | Full API contract: all endpoints, request/response shapes, error codes, SSE |
| `wiki/architecture/rate-limiting.md` | ✅ initialized | Three-layer rate limiting: FastAPI slowapi, Next.js middleware, frontend 429 handling |

---

## Features

| File | Status | Description |
|------|--------|-------------|
| `wiki/features/_index.md` | ✅ initialized | Section index for feature articles |
| `wiki/features/auth.md` | ✅ initialized | Google OAuth, email/password, session handling, middleware |
| `wiki/features/api.md` | ✅ initialized | All Next.js API routes: places, pipeline proxy, Stripe, preview |
| `wiki/features/ui.md` | ✅ initialized | Design system, build flow UX, dashboard UX |
| `wiki/features/build-flow.md` | ✅ initialized | Places search, SSE progress timeline, revision UI, error states |
| `wiki/features/billing.md` | ✅ initialized | Plan tiers, 14-day trial lifecycle, Stripe Checkout/Portal, limits |
| `wiki/features/google-places.md` | ✅ initialized | Places API (New) endpoints, Blackboard mapping, GBP Sync flag |
| `wiki/features/revision-system.md` | ✅ initialized | Revision schema, monthly limits, status lifecycle, v2 design |
| `wiki/features/dashboard.md` | ✅ initialized | Dashboard layout, My Sites, preview, revision UI, plan enforcement table |
| `wiki/features/retention.md` | ✅ initialized | GBP sync, reviews badge, lead SMS, seasonal pages, custom domain |

---

## AI Agents

| File | Status | Description |
|------|--------|-------------|
| `wiki/ai_agents/_index.md` | ✅ initialized | Section index for agent articles |
| `wiki/ai_agents/agents.md` | ✅ initialized | All 10 agents: model, job, input, output, retry logic |
| `wiki/ai_agents/workflows.md` | ✅ initialized | Blackboard pattern, sequencing, parallel agents 2+3, SSE |
| `wiki/ai_agents/models.md` | ✅ initialized | Model assignment per agent, NIM specs, Ollama specs, plan-gated routing |
| `wiki/ai_agents/rag.md` | ✅ initialized | ChromaDB schema, 60 seed patterns, Agent 7/9 query flow, adding patterns |
| `wiki/ai_agents/prompts.md` | ✅ initialized | All 10 agent system prompts + user prompt templates + Supervisor |
| `wiki/ai_agents/blackboard.md` | ✅ initialized | Blackboard schema, field lifetimes, parallel execution, memory management |

---

## Data

| File | Status | Description |
|------|--------|-------------|
| `wiki/data/_index.md` | ✅ initialized | Section index for data articles |
| `wiki/data/models.md` | ✅ initialized | Supabase schema, RLS policies, triggers, pg_cron jobs |
| `wiki/data/migrations.md` | ✅ initialized | Migration execution order, section-by-section guide, checklist |
| `wiki/data/rls-policies.md` | ✅ initialized | All 7-table RLS policies verbatim with explanation |
| `wiki/data/pg-cron-jobs.md` | ✅ initialized | All 4 pg_cron jobs with full SQL, schedules, free-tier alternative |
| `wiki/data/triggers.md` | ✅ initialized | All trigger functions with explanation and summary table |
| `wiki/data/views.md` | ✅ initialized | user_dashboard and active_jobs helper views |

---

## Decisions (ADRs)

| File | Status | Description |
|------|--------|-------------|
| `wiki/decisions/_index.md` | ✅ initialized | Section index for all ADRs |
| `wiki/decisions/adr-001.md` | ✅ initialized | Why FastAPI over serverless for the pipeline |
| `wiki/decisions/adr-002.md` | ✅ initialized | Why Cloudflare Pages over Vercel for user sites |
| `wiki/decisions/adr-003.md` | ✅ initialized | Why Supabase (vs PlanetScale, Firebase, self-hosted Postgres) |
| `wiki/decisions/adr-004.md` | ✅ initialized | Why Stripe (vs Paddle, LemonSqueezy, Braintree) |
| `wiki/decisions/adr-005.md` | ✅ initialized | Why ChromaDB for RAG (vs Pinecone, pgvector, FAISS) |
| `wiki/decisions/adr-006.md` | ✅ initialized | Why reverse trial over freemium pricing |

---

## Research

| File | Status | Description |
|------|--------|-------------|
| `wiki/research/_index.md` | ✅ initialized | Section index for research notes |
| `wiki/research/notes.md` | ✅ initialized | Compiled research: market, competitors, GBP API, v2 moats |
| `wiki/research/competitors.md` | ✅ initialized | Direct vs indirect competitors, feature comparison table, moat analysis |

---

## Testing

| File | Status | Description |
|------|--------|-------------|
| `wiki/testing/_index.md` | ✅ initialized | Section index for testing articles |
| `wiki/testing/test-strategy.md` | ✅ initialized | Step verification checklists, QA approach, Agent 9 logic |
| `wiki/testing/unit-tests.md` | ✅ initialized | Key unit test cases: AI client, blackboard, queue, parser, Next.js routes |
| `wiki/testing/e2e-tests.md` | ✅ initialized | Playwright E2E: golden path, trial expiry, revision limit, Stripe, SSE |

---

## Operations

| File | Status | Description |
|------|--------|-------------|
| `wiki/operations/_index.md` | ✅ initialized | Section index for operations articles |
| `wiki/operations/runbook.md` | ✅ initialized | Daily checks, 5 incident playbooks, manual email templates |
| `wiki/operations/monitoring.md` | ✅ initialized | UptimeRobot config, PostHog events, Supabase health SQL, alert targets |
| `wiki/operations/billing-ops.md` | ✅ initialized | Refunds, manual plan changes, trial extensions, GDPR deletion |
| `wiki/operations/scaling.md` | ✅ initialized | Scaling triggers, BullMQ, second server, GPU, DigitalOcean migration |

---

## Business

| File | Status | Description |
|------|--------|-------------|
| `wiki/business/_index.md` | ✅ initialized | Section index for business articles |
| `wiki/business/pricing.md` | ✅ initialized | Plan tiers, reverse trial rationale, revenue projections, infra costs |
| `wiki/business/icp.md` | ✅ initialized | Primary ICP profile, 10 business types, pain points, decision triggers |
| `wiki/business/distribution.md` | ✅ initialized | 6 channels with CAC/cadence, message templates, accountant referral |
| `wiki/business/roadmap.md` | ✅ initialized | v1.0–v3.0 with feature lists, release criteria, feature flags, moats |
| `wiki/business/metrics.md` | ✅ initialized | KPIs, PostHog funnel, revenue tracking, pipeline health SQL, launch targets |
| `wiki/business/gtm.md` | ✅ initialized | Launch sequence, cold outbound process, channel breakdown, conversion math |

---

## Integrations

| File | Status | Description |
|------|--------|-------------|
| `wiki/integrations/_index.md` | ✅ initialized | Section index for integration guides |
| `wiki/integrations/stripe.md` | ✅ initialized | Dashboard setup, product creation, webhook config, Portal, test→live |
| `wiki/integrations/github.md` | ✅ initialized | App creation, permissions, private key, install, repo structure, JWT flow |
| `wiki/integrations/cloudflare.md` | ✅ initialized | Account ID, API token, Direct Upload API, project naming, Tunnel dev setup |
| `wiki/integrations/google.md` | ✅ initialized | Places API (New) enable, key restriction, OAuth setup, Supabase callback |
| `wiki/integrations/resend.md` | ✅ initialized | Domain verification, API key, 8-email routing table, free tier limits |
| `wiki/integrations/supabase.md` | ✅ initialized | Project creation, migrations, OAuth setup, storage bucket, pg_cron, RLS |
| `wiki/integrations/nvidia-nim.md` | ✅ initialized | Key acquisition, model, rate limits (40 RPM/1000 RPD), 429 fallback |
| `wiki/integrations/ollama.md` | ✅ initialized | Install (macOS/Linux), model pull, RAM requirements, production config |

---

## Content

| File | Status | Description |
|------|--------|-------------|
| `wiki/content/_index.md` | ✅ initialized | Section index for content articles |
| `wiki/content/email-copy.md` | ✅ initialized | Variable reference, all 8 email templates, Resend API pattern |
| `wiki/content/landing-page.md` | ✅ initialized | SEO meta, hero, how-it-works, features, pricing, FAQs, microcopy |
| `wiki/content/outbound-scripts.md` | ✅ initialized | Facebook/LinkedIn/Instagram/cold email/accountant/Reddit templates |

---

## Legal

| File | Status | Description |
|------|--------|-------------|
| `wiki/legal/_index.md` | ✅ initialized | Section index for legal articles |
| `wiki/legal/terms-of-service.md` | ✅ initialized | Service limits, content ownership, refund policy, engineering implications |
| `wiki/legal/privacy-policy.md` | ✅ initialized | Data collected, third-party sharing, GDPR/CCPA rights, engineering notes |

---

## Developer Guide

| File | Status | Description |
|------|--------|-------------|
| `wiki/dev/_index.md` | ✅ initialized | Section index for developer guide |
| `wiki/dev/setup.md` | ✅ initialized | Local env setup: accounts, tools, .env, Cloudflare Tunnel, Supabase |
| `wiki/dev/phase-checklist.md` | ✅ initialized | 30-phase implementation checklist from TASKS.md |
| `wiki/dev/troubleshooting.md` | ✅ initialized | Common dev issues: Ollama, NIM, Cloudflare, Supabase, FastAPI, Stripe |
| `wiki/dev/commands.md` | ✅ initialized | Daily CLI commands: Ollama, Supabase CLI, Stripe CLI, FastAPI, Next.js |

---

## Status Key

| Symbol | Meaning |
|--------|---------|
| ✅ initialized | File exists and has real content |
| 📝 draft | File exists, content is partial or unreviewed |
| 🔲 stub | File listed here but not yet created — Claude will build on next compile |
| ⚠️ needs update | File exists but is out of date with current code/decisions |

---

## Compile Instructions for Claude

When running a compile:

1. Read all files in `raw/`
2. For each stub above, create the file and populate it from PROJECT_CONTEXT.md, raw/, and TASKS.md
3. Update the Status column in this index after creating each file
4. Update `_last compiled` date at the top
5. Write a compile summary to `logs/compile-log.md`
6. Do NOT change any ✅ initialized file unless explicitly instructed
