# _coding-rules.md — Onara Coding Constraints

_These rules apply to every line of code written for Onara. Claude follows them without exception._

---

## Architecture Rules

### Layer Separation (Non-Negotiable)

- **Next.js API routes** handle only stateless operations. No loops, no agent calls, no file I/O.
- **FastAPI** handles everything that takes more than 1 second. All AI pipeline work lives here.
- **Supabase edge functions** handle only: Stripe webhook processing, revision resets, trial downgrades.
- Never put pipeline logic in Next.js. Never put frontend logic in FastAPI.

### No New Frameworks

- Frontend: Next.js + Tailwind only. No new UI libraries without explicit approval.
- Pipeline: FastAPI + standard Python libraries only. No LangChain, LangGraph, Celery, or Prefect.
- Database: Supabase client only. No raw SQL queries in application code — use the Supabase SDK.

### Agent Rules

- Every agent is a single Python file in `Onara_Code/pipeline/agents/`
- Every agent has exactly one job. If you find yourself adding a second responsibility, split it.
- Every agent retries up to 2 times on failure, then surfaces a structured error to the supervisor
- No agent writes directly to the database. All DB writes go through `Onara_Code/pipeline/deployment/supabase.py`
- Agents 2 and 3 always run in parallel. Never await one before starting the other.

---

## Code Style

### Python (FastAPI / Pipeline)

- Python 3.11+. Use type hints on all function signatures.
- Async functions for all I/O (HTTP calls, file reads, DB writes). Never use `requests` — use `httpx`.
- All secrets via environment variables. Never hardcode keys, URLs, or model names.
- Model names are constants defined in `Onara_Code/pipeline/ai_client/model_picker.py`. Reference the constant, never the string.
- All agent output is a typed dataclass or Pydantic model. No raw dicts passed between agents.

### TypeScript (Next.js)

- TypeScript strict mode on. No `any` types.
- All API route handlers return typed response objects.
- All Supabase queries go through the server client (never the anon browser client in API routes).
- Environment variables accessed via a validated `env.ts` module, not `process.env` directly.
- No inline styles. Tailwind classes only. Custom tokens defined in `tailwind.config.ts`.

### General

- All new files get a one-line comment at the top describing what the file does.
- Functions over 40 lines should be refactored or split.
- No commented-out code committed to the repo. Delete it or add it to TASKS.md as a future idea.

---

## Security Rules

- **RLS must be active on all Supabase tables** before any user-facing feature is shipped.
- **GitHub App credentials** (App ID, Private Key, Installation ID) never leave the pipeline server. Never expose to Next.js frontend or API routes.
- **Stripe webhook handler** always verifies the `stripe-signature` header before processing. Reject unverified webhooks with 400, not 200.
- **Google Places API key** is restricted to Places API (New) only. Never use an unrestricted key in production.
- **User-generated site code** is stored in the private `onara-sites` repo. Never serve raw generated code to unauthenticated requests.
- **Plan gating** is enforced server-side in the API route AND in the pipeline's model picker. Frontend gating alone is not sufficient.

---

## File & Module Rules

- **No new module** (agent, route, component) without a corresponding wiki entry in the relevant `wiki/` section.
- **No new environment variable** without adding it to `.env.example` and `wiki/_code-map.md`'s variables table.
- **No new Supabase table or column** without a migration file in `supabase/migrations/`.
- **No new Next.js route** without updating `wiki/features/api.md`.
- **No new agent** without updating `wiki/ai-agents/agents.md`.

---

## Performance Rules

- **60-second generation benchmark** — any change to the pipeline must be tested against this. If a change adds more than 5 seconds, it needs explicit justification.
- **Agent preloading** — start Ollama warm-up as soon as user hits Confirm, before style preferences are filled.
- **Stream the preview** — never wait for the full HTML file before opening the iframe. Stream chunks as Agent 6 outputs them.
- **Deploy while user reads** — Cloudflare deployment starts while the user is viewing the preview. URL must be ready before they click "Go Live."
- **No blocking database calls** in the SSE stream route. Site status is read from an in-memory cache first, database only as fallback.

---

## What Never Goes in This Repo

- User-generated site files (those go in `onara-sites/`)
- Stripe secret keys, webhook secrets, or signing keys
- Supabase service role key (only in server-side Next.js routes, `Onara_Code/pipeline/`, and Supabase edge function env — never in browser code)
- Any `.pem` file (GitHub App private key stored as env var string only)
- Real user data or test accounts with real email addresses
