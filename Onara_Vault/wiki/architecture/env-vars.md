# Environment Variables — Onara

_Environment variable reference. `[NEXT]` = Next.js `.env.local` | `[FAST]` = FastAPI `.env` | `[EDGE]` = Supabase Edge Function secrets | `[BOTH]` = Next.js + FastAPI._

---

## GitHub

| Variable | Target | Description |
|----------|--------|-------------|
| `GITHUB_API_URL` | BOTH | GitHub API base URL; default `https://api.github.com` |
| `GITHUB_APP_ID` | BOTH | GitHub App numeric ID |
| `GITHUB_APP_PRIVATE_KEY` | BOTH | Full `.pem` contents including BEGIN/END lines |
| `GITHUB_APP_INSTALLATION_ID` | BOTH | From `/settings/installations/{number}` |
| `GITHUB_REPO_BRANCH` | BOTH | Backup repo branch; default `main` |
| `GITHUB_REPO_OWNER` | BOTH | Username owning `onara-sites` repo |
| `GITHUB_REPO_NAME` | BOTH | Always `onara-sites` |
| `COPILOT_GITHUB_TOKEN` | FAST | Fine-grained PAT for Copilot SDK — Copilot read-only scope only |
| `COPILOT_BASE_DIRECTORY` | FAST | Local Copilot SDK runtime/session state path; default `./.copilot_runtime` |

---

## Google (3 vars)

| Variable | Target | Description |
|----------|--------|-------------|
| `GOOGLE_PLACES_API_KEY` | NEXT + FAST + EDGE | Places API (New) key - server-side only; used by Next.js search/photo preview, FastAPI photo resolution, and weekly reviews refresh; never `NEXT_PUBLIC_*` |
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

## Cloudflare

| Variable | Target | Description |
|----------|--------|-------------|
| `CLOUDFLARE_API_URL` | FAST + EDGE | Cloudflare API base URL; default `https://api.cloudflare.com/client/v4` |
| `CLOUDFLARE_ACCOUNT_ID` | FAST + EDGE | 32-char hex string from Workers & Pages |
| `CLOUDFLARE_API_TOKEN` | FAST + EDGE | API token with `Cloudflare Pages:Edit` permission |
| `CLOUDFLARE_PAGES_BRANCH` | FAST + EDGE | Pages deployment branch; default `main` |
| `CLOUDFLARE_PAGES_PROJECT_PREFIX` | FAST + EDGE | Prefix for generated Pages project names; default `onara-site` |

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

## Resend + Support Email

| Variable | Target | Description |
|----------|--------|-------------|
| `RESEND_API_KEY` | NEXT + EDGE | API key (`re_...`); Edge needs full access for inbound support content lookup |
| `RESEND_FROM_EMAIL` | NEXT + EDGE | `hello@onara.tech` — must match verified domain |
| `RESEND_REPLY_TO` | NEXT + EDGE | `support@onara.tech` |
| `RESEND_WEBHOOK_SECRET` | EDGE | Resend inbound webhook signing secret (`whsec_...`) |
| `SUPPORT_EMAIL_WEBHOOK_SECRET` | EDGE | Optional local fallback bearer secret if Resend signature verification is unavailable |
| `SUPPORT_FROM_EMAIL` | EDGE | `Onara Support <support@onara.tech>` |
| `SUPPORT_FORWARD_TO` | EDGE | Aarush's real inbox for human review/forwarding |
| `SUPPORT_AI_MODEL` | EDGE | Default `z-ai/glm-5.1` |

---

## NVIDIA NIM

| Variable | Target | Description |
|----------|--------|-------------|
| `NVIDIA_NIM_API_KEY` | FAST + EDGE | Free NIM key from build.nvidia.com (`nvapi-...`) |
| `NVIDIA_NIM_BASE_URL` | FAST + EDGE | `https://integrate.api.nvidia.com/v1` — do not change |

---

## Ollama (3 vars)

| Variable | Target | Description |
|----------|--------|-------------|
| `OLLAMA_BASE_URL` | FAST | `http://localhost:11434` when FastAPI and Ollama run on the same host |
| `OLLAMA_PRIMARY_MODEL` | FAST | `qwen3.5:9b` — Agents 2, 3, 8, 10 |
| `OLLAMA_FALLBACK_MODEL` | FAST | `gemma4:e4b` — Supervisor + most NIM cloud fallbacks |

---

## Pipeline

| Variable | Target | Description |
|----------|--------|-------------|
| `PIPELINE_SERVER_URL` | NEXT | Cloudflare Tunnel URL (dev) or DO Droplet IP (prod) |
| `PIPELINE_PORT` | FAST | `8000` |
| `PIPELINE_API_SECRET` | BOTH | 32-char shared secret: `openssl rand -hex 32` |
| `PIPELINE_MAX_CONCURRENCY` | FAST | `1` for local Ollama dev; raise after load testing on server |
| `PIPELINE_JOB_TIMEOUT` | FAST | `600` — hard timeout per job in seconds |
| `PIPELINE_V2_ENABLED` | FAST | `false` by default; enables durable dual-candidate V2 after migration/browser install |
| `PIPELINE_V2_BROWSER_AUDIT_TIMEOUT` | FAST | Per-candidate Playwright/Axe/Lighthouse timeout; default `75` seconds |
| `PIPELINE_V2_CANDIDATE_TIMEOUT` | FAST | Per-model candidate generation timeout; default `150` seconds |
| `PIPELINE_V2_LEASE_SECONDS` | FAST | Durable worker lease duration; default `60` seconds |
| `PIPELINE_V2_MAX_ATTEMPTS` | FAST | Maximum durable recovery claims; default `3` |
| `PIPELINE_V2_MIN_SCORE` | FAST | Minimum blocker-free combined release score; default `80` |
| `PIPELINE_V2_WORKER_ID` | FAST | Optional stable worker identifier; generated automatically when empty |
| `AI_NIM_CONCURRENCY` | FAST | Shared per-job NIM request cap; recommended `3` |
| `AI_OLLAMA_CONCURRENCY` | FAST | Shared per-job Ollama request cap; keep `1` on the mini PC |
| `AI_COPILOT_CONCURRENCY` | FAST | Shared per-job Copilot request cap; default `1` |

---

## Redis (legacy future option)

| Variable | Target | Description |
|----------|--------|-------------|
| `REDIS_URL` | FAST | Not used by Pipeline V2; Supabase leases provide the current durable queue |

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
| `FEATURE_REVIEWS_BADGE` | EDGE | `true` | Enable weekly Google reviews badge refresh |
| `FEATURE_SUPPORT_AI_RESPONDER` | EDGE | `true` | Enable NIM first replies for inbound support email |
| `FEATURE_GBP_SYNC` | FAST | `false` | Enable GBP polling (v2.5) |

---

## Monitoring (3 vars)

| Variable | Target | Description |
|----------|--------|-------------|
| `UPTIME_ROBOT_WEBHOOK` | FAST | UptimeRobot alert webhook URL |
| `NEXT_PUBLIC_POSTHOG_KEY` | NEXT | PostHog key for analytics |
| `NEXT_PUBLIC_POSTHOG_HOST` | NEXT | `https://app.posthog.com` |
