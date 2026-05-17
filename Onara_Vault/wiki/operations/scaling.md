# Scaling Guide — When and How to Scale

Thresholds and execution steps for each scaling decision. Everything below is post-v1.

---

## Current v1 Architecture Limits

| Bottleneck | Current capacity | Break point |
|-----------|-----------------|-------------|
| Concurrent pipeline jobs | 1–2 (single FastAPI server) | Avg wait time > 5 min |
| Ollama (qwen3:8b) | 1 request at a time | When 2+ jobs run concurrently |
| NVIDIA NIM (free) | 40 RPM / 1000 RPD | When pipeline fails with 429 > 5×/day |
| Supabase (free) | 500 MB DB, 50K MAU | At ~500 active users |
| Cloudflare Pages | Unlimited sites, unlimited bandwidth | No known limit |
| Resend (free) | 3K emails/month, 100/day | At ~200 active users |

---

## Trigger 1 — Add BullMQ + Redis Queue

**Signal**: Average wait time in queue > 5 minutes consistently for 3+ days

**Why now**: The in-memory Python queue in FastAPI is lost on restart and can't be inspected easily. BullMQ gives persistent queuing, job retries, and a monitoring dashboard.

**Steps**:
1. Provision Redis: **Upstash Redis** (serverless, free tier covers v1 volume)
2. Switch FastAPI job queue from in-memory dict to BullMQ via Python `bullmq` client
3. Add Bull Board dashboard at `/admin/queue` (protected by `PIPELINE_API_SECRET`)
4. Test job persistence across FastAPI restarts

**Cost**: Upstash free tier — $0 until 10K commands/day

---

## Trigger 2 — Second Pipeline Server

**Signal**: CPU usage on primary server > 80% for > 30 min during business hours

**Why now**: Ollama is CPU-bound. A second server doubles throughput without code changes.

**Steps**:
1. Provision second DigitalOcean Droplet: `$24/month 4 GB RAM` (same spec as primary)
2. Install identical stack: Python, FastAPI, Ollama, qwen3:8b, llama3.3:8b
3. Add simple round-robin load balancing in Next.js:
   ```typescript
   const servers = [process.env.PIPELINE_SERVER_1, process.env.PIPELINE_SERVER_2]
   const server = servers[Math.floor(Math.random() * servers.length)]
   ```
4. BullMQ must be in place first — both servers must share the same Redis queue

**Cost**: +$24/month

---

## Trigger 3 — Upgrade NVIDIA NIM

**Signal**: NIM 429 errors > 20/day (visible in `pipeline_errors` table by `error_type = 'RateLimitError'`)

**Steps**:
1. Go to build.nvidia.com → Upgrade to paid tier (starts at $0.35/1M tokens for most models)
2. Update `NVIDIA_NIM_API_KEY` with the paid key
3. Adjust rate limit constants in FastAPI AI client to match paid tier limits

**Cost**: ~$1–5/month at early user volume

---

## Trigger 4 — Upgrade Supabase

**Signal**: Any of:
- DB approaching 450 MB (90% of free 500 MB limit)
- > 45K MAU
- Need pg_cron but currently on free tier

**Steps**:
1. Upgrade to Supabase Pro ($25/month)
2. Enable pg_cron (available immediately on Pro)
3. Replace any external cron workarounds with native pg_cron jobs

**Cost**: +$25/month (but free tier lasts until ~500 active users)

---

## Trigger 5 — Upgrade Resend

**Signal**: Sending > 2,500 emails/month (approaching 3K free limit)

**Steps**:
1. Upgrade to Resend Starter ($20/month for 50K emails/month)
2. No code changes required

**Cost**: +$20/month at ~600+ active users

---

## Trigger 6 — GPU Server for Ollama

**Signal**: P95 pipeline time consistently > 120 seconds

**Why**: CPU-only inference on qwen3:8b takes 5–15s per agent. With a GPU, this drops to 0.5–2s, cutting pipeline time by 5–10×.

**Options**:
- **Runpod** GPU instance: RTX 3090 at ~$0.30/hour → stop when not in use
- **DigitalOcean GPU Droplet**: Reserved instance for consistent workloads
- **Local upgrade**: Add an NVIDIA GPU to the mini PC (if using local server)

**Steps**:
1. Migrate Ollama to GPU instance (same Docker image, different hardware)
2. Point FastAPI `OLLAMA_BASE_URL` at the GPU server
3. Keep CPU server as fallback during GPU instance maintenance

**Cost**: $50–200/month depending on GPU tier and usage pattern

---

## DigitalOcean Migration (PC → Cloud)

If moving from local PC + Cloudflare Tunnel to a permanent cloud server:

```bash
# 1. Provision Droplet: Ubuntu 22.04, 4 GB RAM, $24/month
# 2. SSH in
ssh root@your-droplet-ip

# 3. Install stack
apt update && apt install -y python3.11 python3-pip
pip install uvicorn fastapi chromadb sentence-transformers

# 4. Install Ollama
curl -fsSL https://ollama.com/install.sh | sh
ollama pull qwen3:8b
ollama pull llama3.3:8b

# 5. Install PM2
npm install -g pm2
pm2 start "uvicorn main:app --port 8000" --name onara-pipeline
pm2 save && pm2 startup

# 6. Point domain to Droplet IP
# Update PIPELINE_SERVER_URL in Next.js env to https://pipeline.onara.tech

# 7. SSL (optional but recommended)
apt install -y certbot python3-certbot-nginx
certbot --nginx -d pipeline.onara.tech
```

**Cost**: $24/month replaces Cloudflare Tunnel (free) but gives a stable URL and eliminates dependency on your PC's uptime.

---

## Infrastructure Cost Projection

| Monthly users | Monthly cost |
|--------------|-------------|
| 0–100 | ~$0 (all free tiers) |
| 100–300 | ~$50 (DigitalOcean Droplet + domain) |
| 300–600 | ~$75 (+ second Droplet for scale) |
| 600–1,000 | ~$120 (+ Supabase Pro + Resend paid) |
| 1,000+ | ~$200+ (GPU server, Redis, monitoring) |

Revenue at 1,000 users (50% paid avg $20/month) = $10,000 MRR. Infrastructure at $200/month = 2% margin cost.
