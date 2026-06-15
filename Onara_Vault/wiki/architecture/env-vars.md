# Environment Variables — Onara

_Environment variable reference. `[NEXT]` = Next.js `.env.local` | `[FAST]` = FastAPI `.env` | `[BOTH]` = both._

---

## GitHub (6 vars)

| Variable | Target | Description |
|----------|--------|-------------|
| `GITHUB_APP_ID` | FAST | GitHub App numeric ID |
| `GITHUB_APP_PRIVATE_KEY` | FAST | Full `.pem` contents including BEGIN/END lines |
| `GITHUB_APP_INSTALLATION_ID` | FAST | From `/settings/installations/{number}` |
| `GITHUB_REPO_OWNER` | FAST | Username owning `onara-sites` repo |
| `GITHUB_REPO_NAME` | FAST | Always `onara-sites` |
| `COPILOT_GITHUB_TOKEN` | FAST | Fine-grained PAT for Copilot SDK — Copilot read-only scope only |
| `COPILOT_BASE_DIRECTORY` | FAST | Local Copilot SDK runtime/session state path; default `./.copilot_runtime` |

---

## Google (3 vars)

| Variable | Target | Description |
|----------|--------|-------------|
| `GOOGLE_PLACES_API_KEY` | NEXT + PIPELINE | Places API (New) key — server-side only; used by Next.js search/photo preview and FastAPI photo resolution; never `NEXT_PUBLIC_*` |
| `GOOGLE_OAUTH_CLIENT_ID` | NEXT | OAuth Client ID from Google Cloud Console |
| `GOOGLE_OAUTH_CLIENT_SECRET` | NEXT | OAuth Client Secret |

---

## Supabase (4 vars)

| Variable | Target | Description |
|----------|--------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | NEXT | Project URL — safe to expose |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | NEXT | Anon key — safe to expose in browser |
| `SUPABASE_SERVICE_ROLE_KEY` | NEXT | Service role key — server-side only, never expose to browser |
| `DATABASE_URL` | NEXT | Direct Postgres string for migrations |

---

## Cloudflare (2 vars)

| Variable | Target | Description |
|----------|--------|-------------|
| `CLOUDFLARE_ACCOUNT_ID` | FAST | 32-char hex string from Workers & Pages |
| `CLOUDFLARE_API_TOKEN` | FAST | API token with `Cloudflare Pages:Edit` permission |

---

## Stripe (7 vars)

| Variable | Target | Description |
|----------|--------|-------------|
| `STRIPE_SECRET_KEY` | NEXT | Secret key — server-side only |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | NEXT | Publishable key — safe for browser |
| `STRIPE_WEBHOOK_SECRET` | NEXT | Webhook signing secret (`whsec_...`) |
| `STRIPE_FREE_PRICE_ID` | NEXT | Free product/price ID placeholder if used by Stripe logic |
| `STRIPE_STARTER_PRICE_ID` | NEXT | Price ID for Starter $12/month |
| `STRIPE_STARTER_ANNUAL_PRICE_ID` | NEXT | Price ID for Starter $99/year |
| `STRIPE_PRO_PRICE_ID` | NEXT | Price ID for Pro $29/month |

---

## Resend (3 vars)

| Variable | Target | Description |
|----------|--------|-------------|
| `RESEND_API_KEY` | NEXT | API key (`re_...`) |
| `RESEND_FROM_EMAIL` | NEXT | `hello@onara.tech` — must match verified domain |
| `RESEND_REPLY_TO` | NEXT | `support@onara.tech` |

---

## NVIDIA NIM (2 vars)

| Variable | Target | Description |
|----------|--------|-------------|
| `NVIDIA_NIM_API_KEY` | FAST | Free NIM key from build.nvidia.com (`nvapi-...`) |
| `NVIDIA_NIM_BASE_URL` | FAST | `https://integrate.api.nvidia.com/v1` — do not change |

---

## Ollama (3 vars)

| Variable | Target | Description |
|----------|--------|-------------|
| `OLLAMA_BASE_URL` | FAST | `http://localhost:11434` when FastAPI and Ollama run on the same host |
| `OLLAMA_PRIMARY_MODEL` | FAST | `qwen3.5:9b` — Agents 2, 3, 8, 10 |
| `OLLAMA_FALLBACK_MODEL` | FAST | `gemma4:e4b` — Supervisor + most NIM cloud fallbacks |

---

## Pipeline (5 vars)

| Variable | Target | Description |
|----------|--------|-------------|
| `PIPELINE_SERVER_URL` | NEXT | Cloudflare Tunnel URL (dev) or DO Droplet IP (prod) |
| `PIPELINE_PORT` | FAST | `8000` |
| `PIPELINE_API_SECRET` | BOTH | 32-char shared secret: `openssl rand -hex 32` |
| `PIPELINE_MAX_CONCURRENCY` | FAST | `1` for local Ollama dev; raise after load testing on server |
| `PIPELINE_JOB_TIMEOUT` | FAST | `300` — hard timeout per job in seconds |

---

## Redis (1 var)

| Variable | Target | Description |
|----------|--------|-------------|
| `REDIS_URL` | FAST | `redis://localhost:6379` (v1.5+ only) |

---

## ChromaDB (2 vars)

| Variable | Target | Description |
|----------|--------|-------------|
| `CHROMA_PERSIST_PATH` | FAST | `./chroma_db` — filesystem path |
| `CHROMA_COLLECTION_NAME` | FAST | `onara_patterns` |

---

## Next.js App (3 vars)

| Variable | Target | Description |
|----------|--------|-------------|
| `NEXT_PUBLIC_APP_URL` | NEXT | `https://onara.tech` |
| `APP_URL` | NEXT | `https://onara.tech` — for Stripe redirects, email links |
| `NEXTAUTH_SECRET` | NEXT | JWT secret: `openssl rand -hex 32` |

---

## Feature Flags (3 vars)

| Variable | Target | Default | Description |
|----------|--------|---------|-------------|
| `FEATURE_CODE_DOWNLOAD` | NEXT | `true` | Enable Pro code download |
| `FEATURE_ANNUAL_PLAN` | NEXT | `true` | Show Starter annual billing option |
| `FEATURE_GBP_SYNC` | FAST | `false` | Enable GBP polling (v2.5) |

---

## Monitoring (3 vars)

| Variable | Target | Description |
|----------|--------|-------------|
| `UPTIME_ROBOT_WEBHOOK` | FAST | UptimeRobot alert webhook URL |
| `NEXT_PUBLIC_POSTHOG_KEY` | NEXT | PostHog key for analytics |
| `NEXT_PUBLIC_POSTHOG_HOST` | NEXT | `https://app.posthog.com` |
