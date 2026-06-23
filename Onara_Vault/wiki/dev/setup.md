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

See `wiki/architecture/env-vars.md` for the complete environment variable reference.

---

## Phase 3 — PC Dev Environment

Recommended v1 development path: run **Next.js, FastAPI, Ollama, ChromaDB, and `cloudflared` on the same PC** until the pipeline works end to end. This avoids cross-machine `localhost` mistakes.

```bash
# Required tools
node --version     # 20+ required
python --version   # 3.11+ required
pnpm --version     # install: npm install -g pnpm

# Install Ollama, then start it
ollama serve
ollama pull qwen3.5:9b       # primary local model
ollama pull gemma4:e4b       # supervisor + local fallback model

# Install Cloudflare Tunnel on the same machine that runs FastAPI
cloudflared --version
```

**RAM requirement**: 16 GB is the practical minimum for one hot model at a time; 24 GB+ is recommended for reliable local fallback with `qwen3.5:9b` and `gemma4:e4b`. Keep concurrency at 1 until benchmarks prove the machine can handle more.

---

## Phase 4 — Mini PC / Server Environment

Only do this after Phase 3 works locally.

Recommended server path for this workspace: run **FastAPI, `cloudflared`, and PM2 on the mini PC or DigitalOcean Droplet**. Keep Ollama on the main PC and set `OLLAMA_BASE_URL` on the server to the main PC's private LAN URL.

Node.js is also required on the pipeline server when Pipeline V2 is enabled because its
release gate runs Playwright, Axe, and Lighthouse in Chromium. The Next.js app does not need
to run on the mini PC.

Do not run FastAPI on the mini PC with `OLLAMA_BASE_URL=http://localhost:11434` because Ollama is not running there. Use the model PC's private LAN URL instead, and keep firewall access restricted to the private network.

---

## Environment Files

Create `.env` in the Next.js project root and a separate `.env` in the FastAPI project root.

Do not put real `.env` files in `Onara_Vault/`.

**Next.js `.env.local`** at `Onara_Code/app/.env.local` (see `wiki/architecture/env-vars.md` for all values)
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

**FastAPI `.env`** at `Onara_Code/pipeline/.env`
```bash
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
PIPELINE_API_SECRET=your-shared-secret-min-32-chars
APP_URL=http://localhost:3000
NVIDIA_NIM_API_KEY=nvapi-...
OLLAMA_BASE_URL=http://192.168.1.89:11434
OLLAMA_PRIMARY_MODEL=qwen3.5:9b
OLLAMA_FALLBACK_MODEL=gemma4:e4b
CLOUDFLARE_ACCOUNT_ID=xxx
CLOUDFLARE_API_TOKEN=xxx
GITHUB_APP_ID=xxx
GITHUB_APP_INSTALLATION_ID=xxx
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n..."
COPILOT_GITHUB_TOKEN=github_pat_...
PIPELINE_V2_ENABLED=false
```

---

## Pipeline V2 Setup

Pipeline V1 remains active while `PIPELINE_V2_ENABLED=false`. To prepare and activate V2:

```powershell
cd "C:\Users\Aarush\Downloads\Onara\Onara_Code"
supabase db push --linked

cd ".\pipeline"
python -m pip install -r requirements.txt
npm install
npm run install-browser
python -m unittest discover -s tests -p "test_*.py"
```

Change `Onara_Code/pipeline/.env` to:

```dotenv
PIPELINE_V2_ENABLED=true
```

Restart the mini-PC process:

```powershell
pm2 restart onara-pipeline
pm2 logs onara-pipeline --lines 50
```

To return to V1, set the flag back to `false` and restart PM2. Do not revert migration `022`.

## Pipeline V3 Setup

Apply migration `023`, keep V2 enabled as rollback, and start with a small canary:

```dotenv
PIPELINE_V2_ENABLED=true
PIPELINE_V3_ENABLED=true
PIPELINE_V3_CANARY_PERCENT=10
```

Restart PM2 and inspect real builds. Increase the percentage to `100` after browser audits,
component fallback counts, build duration, and deployment success look normal. To roll back,
set `PIPELINE_V3_ENABLED=false` and restart PM2. Do not revert migrations `022` or `023`.

---

## Starting the Development Environment

Run these on the same PC for Phase 3.

```bash
# Terminal 1 — Ollama (if not already running as a service)
ollama serve

# Terminal 2 — Cloudflare Tunnel (exposes FastAPI to internet)
cloudflared tunnel --url http://localhost:8000
# Copy the generated URL → set as PIPELINE_SERVER_URL in Next.js .env

# Terminal 3 — FastAPI
cd Onara_Code/pipeline
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Terminal 4 — Next.js
cd Onara_Code/app
pnpm install
pnpm dev
# Open http://localhost:3000
```

---

## Supabase Setup (One-Time)

After creating the Supabase project:

1. Run schema migrations — see `wiki/data/migrations.md`
2. Configure Google OAuth — see `wiki/integrations/google.md`
3. Set Site URL: `http://localhost:3000` (dev), `https://onara.tech` (prod)
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
