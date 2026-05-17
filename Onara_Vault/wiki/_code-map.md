# _code-map.md — Onara Code Structure

_Claude checks this before writing or modifying any file. All code lives within these paths._

---

## Repository Layout

```
onara/                          ← main app repo (deploys to Vercel)
onara-sites/                    ← generated user sites repo (private, GitHub App only)
  sites/
    {projectId}/                ← one folder per user site
```

---

## Frontend (Next.js — onara/)

```
onara/
  app/
    page.tsx                    → landing page (niche-specific, pricing, social proof)
    layout.tsx                  → root layout + Tailwind config
    auth/
      login/page.tsx            → login page
      signup/page.tsx           → sign-up page
    dashboard/
      page.tsx                  → My Sites list
      layout.tsx                → dashboard shell + sidebar
      build/
        page.tsx                → build flow (Search → Confirm → Style → Generate)
      sites/
        [projectId]/
          page.tsx              → site detail + preview iframe
          revisions/page.tsx    → revision history
    account/
      page.tsx                  → plan display, upgrade CTA, model picker gating
  components/
    ui/                         → base design system components (Button, Card, Input, Badge)
    dashboard/                  → dashboard-specific components (SiteCard, SideBar, AgentProgress)
    build/                      → build flow components (BusinessConfirmCard, StylePicker)
    landing/                    → landing page sections (Hero, Pricing, SocialProof)
  lib/
    supabase/                   → Supabase client (browser + server)
    stripe/                     → Stripe client helpers
    auth/                       → session utilities, middleware helpers
  middleware.ts                  → Next.js route protection (auth guard)
  styles/
    globals.css                 → Tailwind base + custom tokens
```

---

## Backend API Routes (Next.js — onara/app/api/)

```
app/api/
  auth/
    callback/route.ts           → Google OAuth callback handler
  places/
    search/route.ts             → Google Places Text Search proxy
  pipeline/
    generate/route.ts           → forward generate request to FastAPI + return job ID
    stream/[jobId]/route.ts     → SSE stream for agent progress updates
    status/[jobId]/route.ts     → fallback polling status endpoint
  stripe/
    checkout/route.ts           → create Stripe checkout session
    webhook/route.ts            → Stripe webhook handler (subscription events)
  preview/
    [projectId]/route.ts        → serve generated site preview (plan-gated)
```

---

## FastAPI Pipeline Server (Python — pipeline/)

```
pipeline/
  main.py                       → FastAPI app, /generate endpoint, /health endpoint
  queue.py                      → in-memory job queue with deduplication
  blackboard.py                 → shared state object passed between agents
  ai_client/
    __init__.py
    nim.py                      → NVIDIA NIM API calls
    ollama.py                   → local Ollama calls
    copilot.py                  → GitHub Copilot SDK calls
    model_picker.py             → Agent 6 plan-gated model selection logic
  agents/
    agent_01_analyst.py         → parse GBP data, extract business facts
    agent_02_content.py         → write all site copy
    agent_03_style.py           → choose colors, fonts, layout
    agent_04_planner.py         → break into atomic components
    agent_05_prompt_eng.py      → write code-gen prompts per component
    agent_06_codegen.py         → generate HTML/CSS/JS (uses model_picker)
    agent_07_debugger.py        → fix errors in generated code
    agent_08_seo.py             → meta tags, structured data
    agent_09_qa.py              → output quality validation
    agent_10_mobile.py          → responsive layout check
    supervisor.py               → orchestrates agents, handles retries (max 2)
  rag/
    chroma_client.py            → ChromaDB vector store client
    bm25.py                     → BM25 hybrid search layer
    ingest.py                   → populate knowledge base with HTML/CSS/JS patterns
  deployment/
    parser.py                   → split generated HTML into atomic component files
    github.py                   → commit files to onara-sites via GitHub App
    cloudflare.py               → Cloudflare Pages Direct Upload API calls
    supabase.py                 → write project record to database
```

---

## Supabase (Edge Functions — supabase/functions/)

```
supabase/
  functions/
    stripe-webhook/             → process Stripe subscription events
    reset-revisions/            → monthly revision counter reset
    downgrade-trials/           → daily check: expired trials → drop to free tier
  migrations/
    001_initial_schema.sql      → users, projects, revisions tables
    002_rls_policies.sql        → Row Level Security for all tables
    003_auth_trigger.sql        → on new user signup trigger
```

---

## Shared / Config

```
onara/
  .env.local                    → all secrets (never committed)
  .env.example                  → template with key names, no values

pipeline/
  .env                          → pipeline server secrets (never committed)
```

---

## Environment Variables Reference

| Variable                      | Used In                           |
| ----------------------------- | --------------------------------- |
| NEXT_PUBLIC_SUPABASE_URL      | Frontend                          |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Frontend                          |
| SUPABASE_SERVICE_ROLE_KEY     | API routes                        |
| GOOGLE_PLACES_API_KEY         | /api/places/search                |
| GOOGLE_OAUTH_CLIENT_ID        | Supabase config                   |
| GOOGLE_OAUTH_CLIENT_SECRET    | Supabase config                   |
| STRIPE_SECRET_KEY             | /api/stripe/*                     |
| STRIPE_WEBHOOK_SECRET         | /api/stripe/webhook               |
| PIPELINE_SERVER_URL           | /api/pipeline/*                   |
| GITHUB_APP_ID                 | pipeline/deployment/github.py     |
| GITHUB_APP_PRIVATE_KEY        | pipeline/deployment/github.py     |
| GITHUB_APP_INSTALLATION_ID    | pipeline/deployment/github.py     |
| COPILOT_GITHUB_TOKEN          | pipeline/ai_client/copilot.py     |
| NVIDIA_NIM_API_KEY            | pipeline/ai_client/nim.py         |
| CLOUDFLARE_ACCOUNT_ID         | pipeline/deployment/cloudflare.py |
| CLOUDFLARE_API_TOKEN          | pipeline/deployment/cloudflare.py |
| RESEND_API_KEY                | Supabase edge functions           |