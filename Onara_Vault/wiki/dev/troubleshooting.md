# Troubleshooting — Common Dev Issues

Quick-fix reference for the most common problems encountered during development.

---

## Ollama

**Models not responding**
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# If not, start it
ollama serve

# Verify models are pulled
ollama list
```

**Out of memory / model crashes**
- Running both `qwen3.5:9b` and `gemma4:e4b` reliably is a 24 GB+ RAM target
- If you have 16 GB, keep `PIPELINE_MAX_CONCURRENCY=1` and avoid keeping both models hot
- Check RAM usage: `free -h` (Linux) or Activity Monitor (Mac)

**Slow responses (>60 seconds)**
- Local under-10B models can take 5–20 seconds per completion on CPU-only hardware
- If responses take >30s, check: CPU-only inference (no GPU acceleration) or system is swapping
- Enable GPU offloading: `OLLAMA_NUM_GPU=1 ollama serve`

---

## NVIDIA NIM

**429 Too Many Requests**
- Free tier limit: 40 RPM, 1000 RPD for `meta/llama-3.3-70b-instruct`
- Implement exponential backoff: wait 2s → 4s → 8s before retrying
- Check current usage at build.nvidia.com → API Keys → Usage
- Agent 6 hits NIM most frequently — reduce concurrent jobs if hitting limits

**`z-ai/glm-5.1` / `meta/llama-4-maverick-17b-128e-instruct` not found**
- Model IDs change as NVIDIA updates their catalog
- Check current model IDs at: `https://integrate.api.nvidia.com/v1/models`
- Update the model IDs in `Onara_Code/pipeline/onara_pipeline/ai_client/model_picker.py` if NIM model IDs changed

---

## Cloudflare Tunnel

**Tunnel URL changes on restart**
- Free tunnel URLs are ephemeral — they change each time you run `cloudflared tunnel`
- Update `PIPELINE_SERVER_URL` in Next.js `.env.local` whenever you restart the tunnel
- For stable dev URLs: create a named tunnel with a Cloudflare account

**Next.js can't reach FastAPI**
```bash
# Test from Next.js host
curl https://your-tunnel-url.trycloudflare.com/health

# Check the X-Pipeline-Secret header
curl -H "X-Pipeline-Secret: your-secret" https://your-tunnel-url.trycloudflare.com/health
```

**CORS errors**
- FastAPI must allow the Next.js origin explicitly
- Add `APP_URL` (e.g., `http://localhost:3000`) to FastAPI CORS `origins` list

---

## Supabase

**Google OAuth callback URL mismatch**
- Supabase Dashboard → Authentication → URL Configuration
- Add `http://localhost:3000/auth/callback` for local dev
- Add `https://onara.tech/auth/callback` for production
- The URL must exactly match what was registered in Google Cloud Console

**RLS blocking service role operations**
- Verify you're using `SUPABASE_SERVICE_ROLE_KEY` (not the anon key) for server-side writes
- The service role key bypasses ALL RLS — never expose it to the browser
- Check which key is being used: `console.log(process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 10))`

**pg_cron not available (free tier)**
- pg_cron requires Supabase Pro plan
- Alternative: GitHub Actions cron or Vercel cron — see `wiki/data/pg-cron-jobs.md`
- Free tier workaround: call a Supabase Edge Function from a cron service (cron-job.org)

**Trigger not creating user profile**
- Check the `on_auth_user_created` trigger exists: query `information_schema.triggers`
- Check for errors in Supabase Dashboard → Database → Logs
- Manual fix for existing auth users without profiles:
```sql
INSERT INTO public.users (id, email)
SELECT id, email FROM auth.users
WHERE id NOT IN (SELECT id FROM public.users);
```

---

## FastAPI

**`ModuleNotFoundError` for ChromaDB**
```bash
pip install chromadb sentence-transformers
```

**ChromaDB collection empty after restart**
- ChromaDB persists to `./chroma_db/` — verify this directory exists and has content
- If lost, re-seed: run `python scripts/seed_chroma.py` (reads from `raw/10_rag_seed_content.md`)

**Pipeline jobs stuck in `queued` state**
```sql
-- Check for stuck jobs (Supabase SQL Editor)
SELECT id, status, queued_at, NOW() - queued_at AS wait
FROM public.pipeline_jobs
WHERE status IN ('queued', 'running')
ORDER BY queued_at;
```
- If stuck > 15 min: FastAPI likely crashed, restart it
- Mark stuck jobs as failed manually:
```sql
UPDATE public.pipeline_jobs SET status = 'failed', error_message = 'Server restart'
WHERE status IN ('queued', 'running') AND queued_at < NOW() - INTERVAL '15 minutes';
```

---

## Stripe

**Webhook signature validation failing**
- Use `STRIPE_WEBHOOK_SECRET` from the Stripe CLI, not the Dashboard
- For local testing: `stripe listen --forward-to localhost:3000/api/billing/webhook`
- The CLI generates its own webhook secret — use that for local dev

**Test mode vs live mode**
- All keys starting with `sk_test_` / `pk_test_` are test mode
- Test card: `4242 4242 4242 4242`, any future date, any CVC

---

## Next.js

**Environment variables not loading**
- `.env.local` is not committed to git (correct)
- `NEXT_PUBLIC_*` vars are exposed to the browser; all others are server-only
- After changing `.env.local`, restart the dev server

**API routes timing out**
- Vercel serverless functions have a 60-second timeout
- Never call FastAPI pipeline endpoints directly from a Next.js API route that the user waits on synchronously
- Always use the async pattern: submit to FastAPI → return job_id → poll or SSE from client
