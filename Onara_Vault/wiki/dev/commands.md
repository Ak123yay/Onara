# Common Commands — Daily Development

Quick reference for the commands used most often.

---

## Starting the Stack

```bash
# Start Ollama (if not running as a service)
ollama serve

# Start Cloudflare Tunnel (new URL on every run — update PIPELINE_SERVER_URL)
cloudflared tunnel --url http://localhost:8000

# Start FastAPI (from pipeline project root)
uvicorn main:app --reload --port 8000

# Start Next.js (from app project root)
pnpm dev
```

---

## Ollama

```bash
ollama list                          # list pulled models
ollama pull qwen3:8b                 # pull primary model
ollama pull llama3.3:8b              # pull fallback model
ollama rm model-name                 # remove a model
curl http://localhost:11434/api/tags  # check running models
```

---

## Supabase CLI

```bash
# Install
npm install -g supabase

# Login
supabase login

# Pull remote schema to local migration files
supabase db pull

# Push local migrations to remote
supabase db push

# Open Supabase Studio locally
supabase start

# Run a SQL file against remote DB
supabase db query < migration.sql
```

---

## Stripe CLI (local webhook testing)

```bash
# Install
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local Next.js
stripe listen --forward-to localhost:3000/api/billing/webhook

# Trigger a test event
stripe trigger checkout.session.completed
stripe trigger customer.subscription.deleted
stripe trigger invoice.payment_failed
```

---

## FastAPI

```bash
# Install dependencies
pip install -r requirements.txt

# Run with auto-reload
uvicorn main:app --reload --port 8000

# Run with PM2 (production)
pm2 start "uvicorn main:app --port 8000" --name onara-pipeline
pm2 save
pm2 startup

# Health check
curl http://localhost:8000/health
curl -H "X-Pipeline-Secret: your-secret" http://localhost:8000/health
```

---

## Next.js

```bash
pnpm dev          # local dev server
pnpm build        # production build
pnpm start        # run production build locally
pnpm lint         # ESLint check
pnpm type-check   # TypeScript check (tsc --noEmit)
```

---

## Git (common patterns)

```bash
# Start a new feature
git checkout -b feat/phase-15-fastapi

# Stage specific files (never use git add -A with .env files around)
git add src/app/api/generate/route.ts src/lib/pipeline.ts

# Commit
git commit -m "feat: add pipeline start endpoint"

# Push
git push -u origin feat/phase-15-fastapi
```

---

## Database Queries (Supabase SQL Editor)

```sql
-- Check active pipeline jobs
SELECT * FROM public.active_jobs;

-- Check user state
SELECT id, email, plan, is_trial, trial_ends_at, revisions_used, revisions_limit
FROM public.users ORDER BY created_at DESC LIMIT 10;

-- Check recent errors
SELECT job_id, active_agent, error_type, error_message, created_at
FROM public.pipeline_errors ORDER BY created_at DESC LIMIT 20;

-- Check pg_cron job history
SELECT jobname, start_time, end_time, status, return_message
FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
```

---

## ChromaDB

```python
# Quick inspection (run in Python REPL from pipeline root)
import chromadb
client = chromadb.PersistentClient(path="./chroma_db")
collection = client.get_collection("onara_patterns")
print(f"Documents in collection: {collection.count()}")

# Re-seed from scratch
python scripts/seed_chroma.py
```
