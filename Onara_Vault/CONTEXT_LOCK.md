# CONTEXT_LOCK.md — Onara Structural Rules

_These rules are permanent. Claude must obey them in every session without exception._

---

## Architecture Boundaries

- **No LangChain. No LangGraph.** The pipeline is custom Python + FastAPI + Blackboard pattern. This is final.
- **No new agents** beyond the defined 10 without explicit approval and a new TASKS.md entry.
- **No long-running tasks in Next.js API routes.** Vercel has a 60-second timeout. All pipeline work goes through FastAPI.
- **User sites deploy to Cloudflare Pages only.** Never Vercel, never Netlify. Cloudflare is free, has no DDoS billing risk, and supports unlimited sites.
- **Onara app (dashboard, frontend) deploys to Vercel only.** Never Cloudflare Pages.

## Data & Security Boundaries

- **All user site code lives in onara-sites repo** under `sites/{projectId}/`. Never mixed with app source code.
- **onara-sites repo must remain Private.** User business data is never public before launch.
- **RLS must be active on all Supabase tables before any user-facing route is built.** No exceptions.
- **GitHub App (Onara Deployer) has Contents R/W and Metadata R/O only.** Never expand its permissions.

## Code Structure Rules

- **TASKS.md controls all work state.** If a task isn't in TASKS.md, it doesn't exist.
- **_code-map.md controls all code locations.** No file is created outside the mapped structure without updating _code-map.md first.
- **No new wiki top-level categories** without approval. Add to existing categories.
- **All agents retry up to 2 times on failure** before surfacing an error to the user. No silent failures.

## Pipeline Performance Rules

- **60-second generation is the non-negotiable benchmark.** Every pipeline change is evaluated against it.
- **Agents 2 and 3 always run in parallel.** Never serialize them.
- **Agent 6 model picker is plan-gated.** Free tier gets NIM `z-ai/glm-5.1` with `meta/llama-4-maverick-17b-128e-instruct` fallback only. Do not expose paid models to free users.

## Billing Rules

- **Reverse trial is 14 days.** Do not shorten or extend without updating Stripe + edge function + email sequence together.
- **On cancellation or payment failure:** deploy placeholder page to Cloudflare, set show_url = false. Do not delete the Supabase project record or GitHub files — needed for reactivation.
- **Revision limits reset monthly** — billing anniversary for paid, 1st of month for free. Reset is via Supabase edge function only. Never reset manually in the database.

## Scope Lock (v1)

These features are explicitly **OUT OF SCOPE** for v1. Do not build, prototype, or plan them until v1 is launched:

- BullMQ / Redis queue (v1.5)
- Google Sync polling (v2.5)
- Visual Style DNA vision model (v2.5)
- Custom domain via Cloudflare API (v3)
- White-label / agency tier (v3)
- Terraform / IaC for Cloudflare Pages (v1.5 — use Direct Upload API at launch)
