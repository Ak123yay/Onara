# Local Development Setup

Complete setup from zero to a running local environment. Follow phases in order — each phase depends on the previous.

---

## Phase 1 — GitHub Accounts

1. **Personal GitHub account** — your existing account
   - Generate a fine-grained PAT: Settings → Developer Settings → Personal Access Tokens → Fine-grained
   - Name: `Onara Copilot`
   - Expiration: 90 days
   - Repository access: Public repositories only
   - Permissions: GitHub Copilot → Read-only (not read/write)
   - Save as `COPILOT_GITHUB_TOKEN` in `.env`

2. **GitHub App (Onara Deployer)** — for code pushing to `onara-sites`
   - Settings → Developer Settings → GitHub Apps → New GitHub App
   - Name: `Onara Deployer`
   - Permissions: Contents → Read & Write, Metadata → Read-only
   - No webhook needed (uncheck active)
   - Install app → restrict to `onara-sites` repo only
   - Generate private key (.pem file) → save as `GITHUB_APP_PRIVATE_KEY` in `.env`
   - Note the App ID → save as `GITHUB_APP_ID`
   - Note the Installation ID (shown after install) → save as `GITHUB_APP_INSTALLATION_ID`

3. **Create `onara-sites` repo** — private, no README
   - GitHub App generates tokens to push here — never use personal PAT for deployment

---

## Phase 2 — Service Accounts

| Service | Action | Key to save |
|---------|--------|-------------|
| **Google Cloud** | Create project `onara-prod` → Enable Places API (New) → Create restricted API key | `GOOGLE_PLACES_API_KEY` |
| **Google OAuth** | Configure OAuth consent screen → Create OAuth 2.0 client ID → add Supabase callback URL | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |
| **Supabase** | Create project → copy URL + anon key + service role key | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |
| **Cloudflare** | Create account → note Account ID | `CLOUDFLARE_ACCOUNT_ID` |
| **Cloudflare API token** | Create token → Pages: Edit only | `CLOUDFLARE_API_TOKEN` |
| **Stripe** | Create account → create products → copy secret key + webhook secret | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` |
| **Resend** | Create account → verify domain → create API key | `RESEND_API_KEY` |
| **NVIDIA NIM** | Go to build.nvidia.com → create API key | `NVIDIA_NIM_API_KEY` |

See `wiki/architecture/env-vars.md` for the complete list of all 45 env vars.

---

## Phase 3 — PC Dev Environment

```bash
# Required tools
node --version     # 20+ required
python --version   # 3.11+ required
pnpm --version     # install: npm install -g pnpm

# Install Ollama (macOS)
brew install ollama
ollama serve &
ollama pull qwen3:8b       # primary model — takes ~5 min, ~6 GB
ollama pull llama3.3:8b    # fallback model — takes ~5 min, ~6 GB

# Install Cloudflare Tunnel
brew install cloudflared
# Linux: see wiki/integrations/cloudflare.md
```

**RAM requirement**: At minimum 16 GB to run both Ollama models simultaneously. Both models stay loaded in RAM while FastAPI is running. If you have 8 GB, run only `qwen3:8b` and use NIM fallback for `llama3.3:8b` tasks.

---

## Phase 4 — Environment File

Create `.env` in the Next.js project root and a separate `.env` in the FastAPI project root.

**Next.js `.env.local`** (see `wiki/architecture/env-vars.md` for all values)
```bash
# Required for local dev
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
GOOGLE_PLACES_API_KEY=AIza...
PIPELINE_API_SECRET=your-shared-secret-min-32-chars
PIPELINE_SERVER_URL=https://your-tunnel.trycloudflare.com
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=hello@onara.tech
APP_URL=http://localhost:3000
```

**FastAPI `.env`**
```bash
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
PIPELINE_API_SECRET=your-shared-secret-min-32-chars
APP_URL=http://localhost:3000
NVIDIA_NIM_API_KEY=nvapi-...
CLOUDFLARE_ACCOUNT_ID=xxx
CLOUDFLARE_API_TOKEN=xxx
GITHUB_APP_ID=xxx
GITHUB_APP_INSTALLATION_ID=xxx
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n..."
COPILOT_GITHUB_TOKEN=github_pat_...
```

---

## Starting the Development Environment

```bash
# Terminal 1 — Ollama (if not already running as a service)
ollama serve

# Terminal 2 — Cloudflare Tunnel (exposes FastAPI to internet)
cloudflared tunnel --url http://localhost:8000
# Copy the generated URL → set as PIPELINE_SERVER_URL in Next.js .env

# Terminal 3 — FastAPI
cd onara-pipeline
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Terminal 4 — Next.js
cd onara-app
pnpm install
pnpm dev
# Open http://localhost:3000
```

---

## Supabase Setup (One-Time)

After creating the Supabase project:

1. Run schema migrations — see `wiki/data/migrations.md`
2. Configure Google OAuth — see `wiki/integrations/google.md`
3. Set Site URL: `https://localhost:3000` (dev), `https://onara.tech` (prod)
4. Create `site-html` storage bucket (private) — see `wiki/integrations/supabase.md`
5. Enable pg_cron — requires Pro plan; see `wiki/data/pg-cron-jobs.md` for free-tier alternative

---

## Verifying the Stack

```bash
# Ollama models loaded
curl http://localhost:11434/api/tags

# FastAPI health
curl http://localhost:8000/health

# Test pipeline secret
curl -H "X-Pipeline-Secret: your-secret" http://localhost:8000/health

# Cloudflare Tunnel (use the generated URL)
curl https://xxx.trycloudflare.com/health
```
