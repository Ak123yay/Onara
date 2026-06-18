# PROJECT_CONTEXT.md — Onara

## What We're Building

Onara is an AI-powered website builder for small business owners. The owner searches their Google Business name → within 60 seconds a complete professional website is generated and deployed. No code, no design decisions, no technical knowledge required.

**Core value proposition:** "A professional website in 60 seconds — just search your Google listing, we do the rest."

**Primary vertical at launch:** Local service contractors (plumbers, electricians, HVAC, landscapers). Solo operators or 1–5 employees. $80K–$400K annual revenue. No website or a broken one from 2015.

## Current Stage

Pre-launch. Architecture fully defined. Development not yet begun. This repo + wiki is the single source of truth for all product, business, and technical decisions.

---

## Tech Stack

### Frontend

- **Next.js** (React) — deployed to Vercel free hobby tier
- **Tailwind CSS** — design system with niche-specific tokens
- Handles: auth pages, dashboard, build flow, preview iframe, account/billing

### Backend API Layer

- **Next.js API routes** (serverless, Vercel) — stateless only
- Handles: auth, site status polling, Stripe webhooks, preview serving
- Hard limit: 60-second timeout. No long-running tasks here.

### AI Pipeline Server

- **FastAPI** (Python) — runs on personal PC at launch, migrates to DigitalOcean
- **Ollama** — local under-10B models (`qwen3.5:9b` primary for agents 2, 3, 8, 10; `gemma4:e4b` fallback/supervisor)
- **NVIDIA NIM** — cloud models via one free nvapi- key
- Exposed via Cloudflare Tunnel at launch (command: `cloudflared tunnel --url http://localhost:8000`)
- No timeout pressure — handles the full 10-agent pipeline

### Database / Auth / Storage

- **Supabase** — PostgreSQL + Google OAuth + RLS + storage buckets + edge functions
- Edge functions: billing events (Stripe webhooks), monthly revision resets, trial downgrades

### Deployment (User Sites)

- **Cloudflare Pages** — hosts all generated user sites. Free, unlimited sites/bandwidth.
- Each site gets a `{projectId}.pages.dev` subdomain
- **GitHub (onara-sites repo)** — code backup for every generated site under `sites/{projectId}/`

### Billing

- **Stripe** — subscription billing. 2.9% + $0.30 per transaction, no monthly fee.
- **Resend** — transactional email (free tier, 3K/month)

---

## The 10-Agent Pipeline (Blackboard Pattern)

|Agent|Name|Model|Job|
|---|---|---|---|
|1|Analyst|z-ai/glm-5.1 (NIM)|Parse GBP data, extract business facts|
|2|Content Writer|qwen3.5:9b (local)|Write all copy for the site|
|3|Style Agent|z-ai/glm-5.1 (NIM)|Choose colors, fonts, layout|
|4|Planner|z-ai/glm-5.1 (NIM)|Break site into atomic components|
|5|Prompt Engineer|z-ai/glm-5.1 (NIM)|Write code-gen prompts per component|
|6|Code Generator|z-ai/glm-5.1 / plan-gated model picker|Generate HTML/CSS/JS per component|
|7|Debugger|z-ai/glm-5.1 (NIM)|Fix errors in generated code|
|8|SEO Agent|qwen3.5:9b (local)|Write meta tags, structured data|
|9|QA|z-ai/glm-5.1 (NIM)|Validate output quality|
|10|Mobile|qwen3.5:9b (local)|Ensure responsive layout|

Agents 2 and 3 run in **parallel** — this is non-negotiable for hitting 60s. Cloud fallback: meta/llama-4-maverick-17b-128e-instruct. Supervisor + final local fallback: gemma4:e4b (local)

### Agent 6 Model Picker (Plan-Gated)

- Free: NIM z-ai/glm-5.1 with meta/llama-4-maverick-17b-128e-instruct fallback (default, no user key needed)
- Starter: + GitHub Copilot SDK (gemini-3.1-pro, gpt-5.4-mini)
- Pro: + Claude API (sonnet/opus) + OpenAI API (gpt-5.4)

---

## Pricing Tiers

- **Free:** 1 site, 3 revisions/month, dashboard preview only, Onara branding
- **Starter — $12/mo:** 1 site, 10 revisions/month, live public URL
- **Pro — $29/mo:** 3 sites, unlimited revisions, code download, priority queue
- **Reverse Trial:** Every new signup gets 14 days full Pro free (no CC required)

## Performance Target

**60 seconds end-to-end: search → confirm → generate → live preview.** This is the core product story. Every pipeline decision is benchmarked against it.

---

## What Onara Is NOT

- Not B2B — sells directly to individual small business owners
- Not LangChain/LangGraph — custom Python pipeline only
- Not Vercel-hosted user sites — Cloudflare Pages only (no DDoS billing risk)
- Not built for restaurants at launch — contractors first

## Goals

1. Launch to local service contractors in one metro area
2. Hit first 50 paying users via cold outbound (Google Maps no-website leads)
3. Prove 60-second generation and live URL flow end-to-end
4. Build launch retention hooks: lead email and review badge refresh; keep Google sync and seasonal SEO for post-v1
