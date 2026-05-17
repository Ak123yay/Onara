# Deployment Pipeline — Onara

_How a user's website goes from "Generate" button click to live URL._

---

## Overview

A single build job touches 6 systems in sequence: Next.js → FastAPI → 10 AI agents → Cloudflare Pages → GitHub → Supabase + Resend. Total wall-clock time: 60–120 seconds.

---

## Step-by-Step Flow

### 1. User Triggers Build (Next.js)

- User clicks **Generate Site** in the dashboard (`/dashboard`)
- Browser POSTs to `/api/generate` with `{ placeId, businessName, planTier }`
- Next.js API route:
  - Verifies Supabase session (JWT)
  - Checks `generation_jobs` for plan limits (Starter: 3 sites, Pro: unlimited)
  - If limit exceeded → returns `429` with upgrade prompt
  - Otherwise → calls FastAPI `POST /pipeline/start`

### 2. Job Enqueue (FastAPI)

- FastAPI receives `{ userId, placeId, businessName, planTier }`
- Creates a `job_id` (UUID)
- Inserts row into `generation_jobs` table: `status = 'queued'`
- Enqueues job:
  - **v1.0**: In-memory dict (`active_jobs: Dict[str, JobState]`)
  - **v1.5+**: Redis queue (`REDIS_URL`)
- Returns `{ jobId }` immediately (non-blocking)

### 3. SSE Connection (Browser → FastAPI)

- Next.js passes `jobId` to frontend
- Browser opens SSE connection: `GET /api/stream/:jobId`
- Next.js `/api/stream/:jobId` proxies to FastAPI `GET /pipeline/status/:jobId`
- FastAPI streams `data:` events as pipeline progresses
- SSE stays open until `event: complete` or `event: error`

### 4. Pipeline Execution (10 Agents)

See `wiki/ai_agents/workflows.md` for full sequence. Summary:

| Step | Agent | Model | Output |
|------|-------|-------|--------|
| 1 | GBP Fetcher | Google Places API | Raw business JSON |
| 2+3 | Content + Style (parallel) | Ollama qwen3:8b | Copy + color palette |
| 4 | Brand Voice | NVIDIA NIM | Tone-adjusted copy |
| 5 | SEO | NVIDIA NIM | Meta tags + structured data |
| 6 | Layout | NVIDIA NIM (gated) | Layout JSON |
| 7 | HTML Generator | NVIDIA NIM + ChromaDB | Full HTML skeleton |
| 8 | Asset Optimizer | Ollama llama3.3:8b | Optimized images/fonts |
| 9 | QA Gate | NVIDIA NIM | Pass/fail report (10 checks) |
| 10 | Deployment | None (API calls) | Live URL |

- Supervisor runs between each agent step, validating output
- If Supervisor rejects → agent retries up to 3× then marks job failed
- Each step emits SSE event: `{ step, agentName, status, progress }`

### 5. Cloudflare Pages Deployment (Agent 10)

Agent 10 uses the **Cloudflare Pages Direct Upload API** (not Git integration):

```
POST https://api.cloudflare.com/client/v4/accounts/{accountId}/pages/projects/{projectName}/deployments
Authorization: Bearer {CLOUDFLARE_API_TOKEN}
Content-Type: multipart/form-data
```

- Uploads `index.html` as a deployment artifact
- Each user's site lives under a unique project name: `onara-{userId-short}`
- First deployment creates the Pages project; subsequent builds update it
- Cloudflare returns `{ url }` — the live site URL (e.g., `onara-abc123.pages.dev`)
- Custom domains: added via Cloudflare API when user configures one (future)

**Why Direct Upload (not Git integration):** No GitHub Actions wait time; no CI quota; instant deployment; full programmatic control. See `wiki/decisions/adr-002.md`.

### 6. GitHub Commit (Agent 10)

- Agent 10 commits the generated `index.html` to `onara-sites` repo (owned by `GITHUB_REPO_OWNER`)
- Path: `sites/{userId}/{jobId}/index.html`
- Uses GitHub App authentication (`GITHUB_APP_ID`, `GITHUB_APP_PRIVATE_KEY`, `GITHUB_APP_INSTALLATION_ID`)
- Serves as a backup + audit trail; not the live serving path (Cloudflare serves live)

### 7. Supabase Storage (Agent 10)

- HTML blob uploaded to Supabase Storage bucket: `site-html`
- Path: `{userId}/{jobId}.html`
- Enables revision history — each build is a separate object
- Users can view/restore previous versions (Pro feature roadmap)

### 8. Database Update (Agent 10)

```sql
UPDATE generation_jobs
SET status = 'completed',
    site_url = '{cloudflare_url}',
    deployed_at = now(),
    cloudflare_deployment_id = '{cf_deployment_id}'
WHERE job_id = '{jobId}';

UPDATE user_sites
SET site_url = '{cloudflare_url}',
    last_deployed_at = now()
WHERE user_id = '{userId}';
```

### 9. Email Notification (Agent 10 → Resend)

- Agent 10 triggers `POST https://api.resend.com/emails`
- Template: "Site Live" (see `wiki/content/email-copy.md`)
- Variables: `{{first_name}}`, `{{site_url}}`, `{{business_name}}`
- From: `hello@onara.tech` (`RESEND_FROM_EMAIL`)
- Sent within seconds of Cloudflare deployment confirming

### 10. SSE Close

- FastAPI emits `event: complete\ndata: { "siteUrl": "..." }`
- Browser receives event → redirects to `/dashboard/sites/{siteId}` showing live preview
- SSE connection closed

---

## Error Handling

| Failure Point | Behavior |
|---------------|----------|
| FastAPI unreachable | Next.js returns `503`; user sees "Pipeline offline" banner |
| Agent exceeds 3 retries | Job marked `failed`; SSE `event: error`; user notified |
| Cloudflare API error | Job marked `failed`; retry queued for 5 minutes |
| GitHub commit fails | Logged; job still marked `completed` (non-critical path) |
| Resend email fails | Logged; job still `completed` (non-critical path) |
| Job exceeds `PIPELINE_JOB_TIMEOUT` (300s) | Hard-killed; marked `timeout`; user sees error |

---

## Concurrency

- `PIPELINE_MAX_CONCURRENCY` (default: 3) — max simultaneous jobs
- Jobs beyond limit are queued (in-memory v1.0; Redis v1.5+)
- Queue position shown in SSE: `event: queued\ndata: { "position": 2 }`

---

## Environment Variables

| Variable | Used By | Purpose |
|----------|---------|---------|
| `PIPELINE_SERVER_URL` | Next.js | FastAPI base URL |
| `PIPELINE_API_SECRET` | Both | Shared secret for Next.js → FastAPI auth |
| `PIPELINE_MAX_CONCURRENCY` | FastAPI | Max simultaneous jobs |
| `PIPELINE_JOB_TIMEOUT` | FastAPI | Hard timeout per job (seconds) |
| `CLOUDFLARE_ACCOUNT_ID` | FastAPI (Agent 10) | Cloudflare API auth |
| `CLOUDFLARE_API_TOKEN` | FastAPI (Agent 10) | Cloudflare API auth |
| `GITHUB_APP_ID` | FastAPI (Agent 10) | GitHub App auth |
| `GITHUB_APP_PRIVATE_KEY` | FastAPI (Agent 10) | GitHub App auth |
| `GITHUB_APP_INSTALLATION_ID` | FastAPI (Agent 10) | GitHub App auth |
| `GITHUB_REPO_OWNER` | FastAPI (Agent 10) | Target repo owner |
| `GITHUB_REPO_NAME` | FastAPI (Agent 10) | Always `onara-sites` |
| `RESEND_API_KEY` | Next.js | Email delivery |

Full variable reference: `wiki/architecture/env-vars.md`
