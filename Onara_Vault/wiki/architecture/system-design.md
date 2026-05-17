# System Design — Onara

_Source of truth for the 3-layer architecture and infrastructure overview._

---

## Overview

Onara is a three-layer system: a Next.js frontend/API layer, a Python FastAPI pipeline server, and a set of managed cloud services.

```
[User Browser]
     │
     ▼
[Next.js — Vercel]          ← App frontend + API proxy
     │  (REST + SSE)
     ▼
[FastAPI — Mini PC / DigitalOcean + Cloudflare Tunnel]
     │  (10-agent pipeline)
     ├── NVIDIA NIM API     ← Cloud AI (Agents 1, 4, 5, 6, 7, 9)
     ├── Ollama (local PC)  ← Local AI fallback + Agents 2, 3, 8, 10, Supervisor
     └── ChromaDB (local)   ← RAG vector store
     │
     ▼
[Deployment Layer]
     ├── Cloudflare Pages   ← User website hosting (free .pages.dev subdomain)
     ├── GitHub App         ← onara-sites monorepo backup (private)
     └── Supabase Storage   ← Generated HTML backup + preview
```

---

## Layer 1 — Next.js Frontend (Vercel)

**Domain**: `onara.tech`

**Responsibilities**:
- Marketing landing page, pricing, auth pages
- Dashboard: My Sites list, build flow, site detail, revision submission
- Account management, plan display, Stripe checkout
- API proxy routes: validate auth, enforce plan limits, forward to FastAPI
- Supabase client (auth, data reads)
- SSE stream client for live agent progress

**Key routes**:
- `GET /` → landing page
- `GET /dashboard` → My Sites
- `GET /dashboard/build` → 4-step build flow
- `GET /account` → plan + billing
- `POST /api/generate` → validate + forward to FastAPI
- `GET /api/stream/:jobId` → SSE pipeline progress
- `POST /api/billing/webhook` → Stripe events

---

## Layer 2 — FastAPI Pipeline Server (Mini PC → DigitalOcean)

**Exposed via**: Cloudflare Tunnel (dev) or DigitalOcean Droplet (prod)

**Responsibilities**:
- Receive generation requests from Next.js
- Manage job queue (in-memory, deduplication by project_id)
- Run the 10-agent pipeline sequentially with a shared blackboard
- Handle model fallbacks (NIM → local Ollama)
- Push completed HTML to Next.js deploy endpoint
- Expose `/health` for UptimeRobot monitoring

**Process manager**: PM2 (`pm2 start main.py --name onara-pipeline`)

---

## Layer 3 — Cloud Services

| Service | Purpose |
|---------|---------|
| Supabase | Database (PostgreSQL), Auth (Google OAuth + email), Storage (site HTML backups) |
| Cloudflare Pages | Hosts every user's generated website at `{id}.pages.dev` |
| GitHub (onara-sites) | Private monorepo backup of all generated site code |
| Stripe | Subscription billing, webhook events, customer portal |
| Resend | Transactional email (welcome, trial warning, payment failed) |
| NVIDIA NIM | Cloud AI inference (free tier, 40 req/min limit) |
| Google Places API | Business data import (name, address, phone, hours, reviews) |

---

## Dev Environment Split

| Machine | Runs |
|---------|------|
| PC (Windows) | Ollama local models (`qwen3:8b`, `llama3.3:8b`), accessible at `http://localhost:11434` |
| Mini PC | FastAPI pipeline server, ChromaDB, Cloudflare Tunnel (`cloudflared`), PM2 |
| Vercel (cloud) | Next.js app |

---

## AI Model Stack

| Agent | Model | Provider |
|-------|-------|---------|
| Agent 1 — Analyst | `deepseek-ai/deepseek-v4-flash` | NVIDIA NIM |
| Agent 2 — Content Writer | `qwen3:8b` | Local Ollama |
| Agent 3 — Style Agent | `qwen3:8b` | Local Ollama |
| Agent 4 — Planner | `deepseek-ai/deepseek-v4-pro` | NVIDIA NIM |
| Agent 5 — Prompt Engineer | `moonshotai/kimi-k2.6` | NVIDIA NIM |
| Agent 6 — Code Generator | `moonshotai/kimi-k2.6` (Free/Starter) or Claude/GPT (Pro) | NVIDIA NIM / Direct APIs |
| Agent 7 — Debugger | `moonshotai/kimi-k2.6` | NVIDIA NIM |
| Agent 8 — SEO Agent | `qwen3:8b` | Local Ollama |
| Agent 9 — QA Agent | `deepseek-ai/deepseek-v4-pro` | NVIDIA NIM |
| Agent 10 — Mobile Agent | `qwen3:8b` | Local Ollama |
| Supervisor | `llama3.3:8b` | Local Ollama |
| Cloud fallback (all agents) | `llama3.3:8b` | Local Ollama |

---

## Request Flow — Site Generation

```
1. User submits business data in dashboard
2. POST /api/generate (Next.js)
   → validate JWT, check revision/project limits
   → POST /pipeline/start (FastAPI)
3. FastAPI enqueues job, returns job_id + queue position
4. Client opens SSE: GET /api/stream/:jobId
5. Pipeline runs agents 1–10 sequentially
   → each agent writes output to blackboard
   → supervisor validates + routes retries (max 2 per agent)
   → SSE events pushed for each completed agent
6. Agent 10 output = final_html
7. FastAPI POSTs to /api/deploy (Next.js)
   → upload to Cloudflare Pages Direct Upload
   → commit to GitHub onara-sites/{projectId}/
   → save to Supabase storage
   → update project.status = 'live', project.public_url
8. Resend email: "Your site is live"
9. SSE terminal event: pipeline_done
10. Dashboard shows live URL
```

---

## Deployment URLs

- **Onara app**: `https://onara.tech`
- **User generated sites**: `https://onara-site-{projectId[:20]}.pages.dev`
- **Pipeline health**: `{PIPELINE_SERVER_URL}/health`

---

## Scaling Path

| Trigger | Action |
|---------|--------|
| Avg queue wait > 5 min | Add BullMQ + Redis queue |
| Mini PC reliability issues | Migrate FastAPI to DigitalOcean Droplet |
| Need second pipeline worker | Add second Droplet + load balance |
| Agent 6 quality issues | Upgrade to GPT-5.4 or Claude Opus (Pro plan users) |
