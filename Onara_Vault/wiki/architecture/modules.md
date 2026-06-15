# Modules — Onara

_Maps every system module to its responsibility and interaction pattern._

---

## Module Interaction Map

```
[Browser]
   │
   ▼
[Next.js Frontend]
   ├── /app/page.tsx              → Landing page
   ├── /app/dashboard/**          → Dashboard UI
   ├── /app/auth/**               → Auth pages
   ├── /app/account/**            → Billing / plan
   └── /app/api/**                → API routes (server-side only)
        │
        ├── places/search         → Google Places API proxy
        ├── pipeline/generate     → validates → POST /pipeline/start
        ├── pipeline/stream       → SSE proxy
        ├── pipeline/status       → polling fallback
        ├── billing/checkout      → Stripe session
        ├── billing/webhook       → Stripe events → Supabase update
        └── deploy (internal)     → receive result from FastAPI → CF Pages + GH

[FastAPI Pipeline Server]
   ├── main.py                    → routes + app init
   ├── queue.py                   → in-memory queue, dedup by project_id
   ├── blackboard.py              → shared state dict passed between agents
   ├── ai_client/
   │    ├── nim.py                → NVIDIA NIM (OpenAI-compatible)
   │    ├── ollama.py             → local Ollama
   │    ├── copilot.py            → GitHub Copilot SDK (Agent 6 Starter)
   │    └── model_picker.py       → plan-gated model selection for Agent 6
   ├── agents/ (01–10 + supervisor)
   ├── rag/
   │    ├── chroma_client.py      → ChromaDB queries
   │    ├── bm25.py               → BM25 text search layer
   │    └── ingest.py             → seed ChromaDB from raw/10_rag_seed_content.md
   └── deployment/
        ├── parser.py             → extract HTML between FILE_MARKER tags
        ├── github.py             → GitHub App token + commit to onara-sites
        ├── cloudflare.py         → Cloudflare Pages Direct Upload
        └── supabase.py           → update project record, write storage
```

---

## Key Module Contracts

### Next.js → FastAPI

All requests require `X-Pipeline-Secret` header.

```
POST /pipeline/start      → { job_id, project_id, user_id, user_plan, business_data, style_preferences }
GET  /pipeline/status/:id → { status, current_agent, agents_completed, ... }
POST /pipeline/retry/:id  → { retry_from_agent }
```

### FastAPI → Next.js (on completion)

```
POST /api/deploy → { job_id, project_id, user_id, final_html, seo_metadata, duration_ms }
```

### Supabase Client

- Browser: `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` + `NEXT_PUBLIC_SUPABASE_URL`
- Server: `SUPABASE_SECRET_KEY` (full service access, bypasses RLS)

### GitHub App Auth Pattern

GitHub App tokens expire hourly. `github.py` generates a fresh installation token per call.

```python
jwt_token = generate_jwt(GITHUB_APP_ID, GITHUB_APP_PRIVATE_KEY)
installation_token = exchange_for_installation_token(jwt_token, GITHUB_APP_INSTALLATION_ID)
```

---

## Feature Flags

| Flag | Default | Meaning |
|------|---------|---------|
| `FEATURE_CODE_DOWNLOAD` | `true` | Pro plan HTML download |
| `FEATURE_ANNUAL_PLAN` | `true` | Show annual billing option |
| `FEATURE_GBP_SYNC` | `false` | Google Business Profile polling (v2.5) |

---

## Cloudflare Pages Naming

```
Project: onara-site-{projectId[:20]}
URL:     https://onara-site-{projectId[:20]}.pages.dev
```

Max 28 chars for project name. `onara-site-` = 11 chars, leaving 17 for the ID.

---

## Agent 6 Model Picker Logic

```
Free / Starter:
    → NVIDIA NIM: z-ai/glm-5.1
    → Cloud fallback: meta/llama-4-maverick-17b-128e-instruct
    → Starter bonus: GitHub Copilot SDK (gemini-3.1-pro, gpt-5.4-mini)

Pro:
    → All above +
    → Claude API: claude-sonnet-4-20250514 or claude-opus-4 (user provides key)
    → OpenAI API: gpt-5.4 (user provides key)
```
