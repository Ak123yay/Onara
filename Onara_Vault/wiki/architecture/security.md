# Security Architecture — Onara

_All security mechanisms in the system: authentication, authorization, transport, secrets, and webhooks._

---

## Authentication

### User Authentication (Supabase Auth)

- **Provider**: Supabase Auth (Google OAuth + email/password)
- **Session token**: JWT issued by Supabase, stored in `HttpOnly` cookie by Next.js
- **Token validation**: Every Next.js API route calls `supabase.auth.getSession()` — rejects if null or expired
- **Session lifetime**: 1 hour access token; refresh token stored in `HttpOnly` cookie (7-day rolling)
- **Google OAuth flow**: `GOOGLE_OAUTH_CLIENT_ID` + `GOOGLE_OAUTH_CLIENT_SECRET` — redirect handled by Supabase

### Pipeline Authentication (Next.js → FastAPI)

- **Mechanism**: Shared secret in `Authorization` header
- **Header**: `Authorization: Bearer {PIPELINE_API_SECRET}`
- **Secret**: 32-char hex string (`openssl rand -hex 32`), stored in env on both sides
- **FastAPI validates**: Every incoming request checks header before processing
- **No user JWTs cross this boundary** — FastAPI trusts Next.js to have already validated the user

---

## Authorization

### Row Level Security (Supabase)

Every table in the Supabase database has RLS enabled. Users can only read/write their own rows.

| Table | RLS Policy |
|-------|-----------|
| `user_profiles` | `user_id = auth.uid()` |
| `user_sites` | `user_id = auth.uid()` |
| `generation_jobs` | `user_id = auth.uid()` |
| `revisions` | `user_id = auth.uid()` |
| `subscriptions` | `user_id = auth.uid()` |

- Service role key (`SUPABASE_SERVICE_ROLE_KEY`) bypasses RLS — used only in server-side Next.js routes and Edge Functions, never exposed to browser
- Anon key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`) is client-safe — RLS enforces all restrictions

### Plan-Based Feature Gating

- Checked in Next.js API routes before calling FastAPI
- Plan tier read from `subscriptions` table via service role
- Gates:
  - Site limit: Starter 3, Pro unlimited
  - Code download: `FEATURE_CODE_DOWNLOAD` flag + Pro check
  - Agent 6 model: Free/Starter → `kimi-k2.6`; Pro → Claude Sonnet or user-provided GPT key

---

## Stripe Webhook Security

- Stripe signs all webhook payloads with `STRIPE_WEBHOOK_SECRET` (`whsec_...`)
- Next.js `/api/billing/webhook` verifies signature before processing:

```typescript
const event = stripe.webhooks.constructEvent(
  rawBody,         // must be raw bytes, not parsed JSON
  sig,             // Stripe-Signature header
  process.env.STRIPE_WEBHOOK_SECRET
)
```

- If verification fails → `400` returned immediately, event discarded
- Raw body preserved using `bodyParser: false` in Next.js route config

---

## Transport Security

- All client ↔ Next.js traffic: HTTPS (enforced by Vercel)
- Next.js ↔ FastAPI: HTTPS via Cloudflare Tunnel (dev) or internal network (prod DigitalOcean)
- FastAPI ↔ Cloudflare Pages API: HTTPS
- FastAPI ↔ GitHub API: HTTPS
- FastAPI ↔ Supabase: HTTPS
- FastAPI ↔ NVIDIA NIM: HTTPS
- Ollama (dev): HTTP on localhost — not exposed externally

---

## Secret Management

| Secret | Where Stored | Notes |
|--------|-------------|-------|
| All API keys | Environment variables | Never in code or git |
| `SUPABASE_SERVICE_ROLE_KEY` | Next.js `.env.local` | Server-side only, never in `NEXT_PUBLIC_*` |
| `PIPELINE_API_SECRET` | `.env.local` (Next) + `.env` (FastAPI) | Rotated if compromised |
| `STRIPE_SECRET_KEY` | Next.js `.env.local` | Server-side only |
| `GITHUB_APP_PRIVATE_KEY` | FastAPI `.env` | Full PEM contents including header/footer lines |
| `NEXTAUTH_SECRET` | Next.js `.env.local` | JWT signing secret |

**Rule**: Never reference `process.env.SUPABASE_SERVICE_ROLE_KEY` in any file that also uses `NEXT_PUBLIC_*` — separation enforced by code review.

---

## CORS

- FastAPI CORS: only `PIPELINE_SERVER_URL` (the Next.js origin) is allowed
- `CORSMiddleware` configured with `allow_origins=[settings.PIPELINE_SERVER_URL]`
- Next.js API routes: no explicit CORS needed (same-origin from browser perspective)

---

## Input Validation

- **Next.js**: All API route inputs validated with Zod before forwarding to FastAPI
- **FastAPI**: Pydantic models validate all incoming request bodies
- **SQL injection**: Supabase client uses parameterized queries — no raw SQL with user input
- **File paths**: Supabase Storage paths constructed from `userId` (UUID) — no user-supplied path segments

---

## GitHub App Security

- Uses GitHub App (not PAT) for repository writes — scoped to `onara-sites` repo only
- Private key (`GITHUB_APP_PRIVATE_KEY`) stored in FastAPI env; never committed
- JWT minted from private key, exchanged for installation access token per request
- Copilot PAT (`COPILOT_GITHUB_TOKEN`) — separate, read-only Copilot scope only

---

## Rate Limiting

Rate limiting is documented separately. See `wiki/architecture/rate-limiting.md`.

**Summary of layers:**
- **FastAPI**: Redis-backed slowapi with per-plan limits (Free 3/day → Starter 10/day → Pro 500/day), keyed on `user_id`, custom JSON 429 handler
- **Next.js middleware**: Sliding window per route — `/api/places` 20/min per IP, `/api/generate` by plan per user, `/api/billing/create-checkout` 5/hour per user
- **Frontend**: `RateLimitBanner` component shows human message, retry countdown, and upgrade CTA when plan limit is hit

---

## Security Checklist (Pre-Deploy)

- [ ] No `NEXT_PUBLIC_*` variables contain secrets
- [ ] `SUPABASE_SERVICE_ROLE_KEY` not referenced in client components
- [ ] Stripe webhook signature verification active
- [ ] RLS enabled on all tables (verify in Supabase dashboard)
- [ ] `PIPELINE_API_SECRET` set and non-empty on both sides
- [ ] CORS restricted to known origin
- [ ] All env vars present (FastAPI checks at startup and refuses to start if missing)
