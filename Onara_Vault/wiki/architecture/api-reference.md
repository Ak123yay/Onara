# API Reference — Full Contract

Complete endpoint reference for the Next.js ↔ FastAPI interface. Source: `raw/04_api_contract.md`.

---

## Authentication Model

```
Next.js internal routes:  Authorization: Bearer {supabase_jwt}
Next.js → FastAPI calls:  X-Pipeline-Secret: {PIPELINE_API_SECRET}
FastAPI → Next.js calls:  X-Pipeline-Secret: {PIPELINE_API_SECRET}
```

All Next.js API routes validate the Supabase session before doing anything. All FastAPI routes reject requests missing the pipeline secret header.

---

## Next.js Routes — `https://onara.tech/api`

### POST `/api/generate`

Validates the user's plan + revision limit, then forwards to FastAPI.

**Request**
```json
{
  "project_id": "uuid",
  "business_data": {
    "name": "Mike's Plumbing Austin",
    "address": "123 Main St, Austin, TX 78701",
    "phone": "+15125551234",
    "email": "mike@mikesplumbing.com",
    "hours": { "monday": "7am-6pm", "saturday": "8am-2pm", "sunday": "closed" },
    "photos": ["https://maps.googleapis.com/..."],
    "category": "Plumber",
    "rating": 4.8,
    "review_count": 127,
    "place_id": "ChIJ..."
  },
  "style_preferences": { "color_scheme": "auto", "tone": "professional" }
}
```

**Success** `202 Accepted`
```json
{
  "job_id": "uuid",
  "project_id": "uuid",
  "queue_position": 2,
  "estimated_wait_seconds": 45
}
```

**Errors**
```json
// 402 — revision limit
{ "error": "revision_limit_reached", "message": "You have used all 3 revisions this month.", "reset_at": "2026-06-01T00:00:00Z" }

// 403 — project limit
{ "error": "project_limit_reached", "message": "Your plan allows 1 website. Upgrade to Pro for up to 3." }

// 429 — duplicate job
{ "error": "duplicate_job", "message": "A generation is already running for this project.", "existing_job_id": "uuid" }
```

---

### GET `/api/status/:job_id`

Polling fallback. Use SSE stream instead when possible.

**Success** `200 OK` — running state
```json
{
  "job_id": "uuid",
  "status": "running",
  "current_agent": "code_generator",
  "agents_completed": 5,
  "agents_total": 10,
  "progress_percent": 50,
  "elapsed_seconds": 34,
  "estimated_remaining_seconds": 25,
  "queue_position": 0
}
```

**Terminal states** — stop polling when status is one of these:
```json
// Done
{ "job_id": "uuid", "status": "done", "agents_completed": 10, "preview_url": "https://onara.tech/api/preview/uuid", "public_url": "https://abc123.pages.dev", "elapsed_seconds": 58 }

// Failed
{ "job_id": "uuid", "status": "failed", "failed_agent": "code_generator", "error_message": "Model timeout after 30s", "retry_available": true }
```

---

### GET `/api/stream/:job_id`

Server-Sent Events stream. `Content-Type: text/event-stream`

**Events**
```
event: agent_started
data: {"agent": "analyst", "started_at": "2026-05-14T10:00:00Z"}

event: agent_completed
data: {"agent": "analyst", "duration_ms": 3200, "agents_completed": 1}

event: pipeline_done
data: {"job_id": "uuid", "preview_url": "...", "public_url": "...", "total_ms": 54000}

event: pipeline_failed
data: {"job_id": "uuid", "failed_agent": "code_generator", "error": "Timeout"}

event: heartbeat
data: {"timestamp": "2026-05-14T10:00:30Z"}
```

**Reconnect policy**: Wait 2s → reopen stream → server sends current state immediately. Max 5 reconnects, then fall back to polling `/api/status` every 5s.

---

### GET `/api/preview/:project_id`

Serves generated HTML from Supabase storage. Works on all plans.

- `200 OK` → `Content-Type: text/html` with generated `index.html`
- `404` → `{ "error": "not_found" }`

---

### POST `/api/places/search`

**Request** `{ "query": "Mike's Plumbing Austin TX" }`

**Response**
```json
{
  "results": [{
    "place_id": "ChIJ...",
    "name": "Mike's Plumbing",
    "address": "123 Main St, Austin, TX 78701",
    "phone": "+15125551234",
    "rating": 4.8,
    "review_count": 127,
    "category": "Plumber",
    "website": null,
    "hours": { ... },
    "photos": ["https://..."],
    "confidence": 0.97
  }]
}
```

---

### POST `/api/places/confirm`

User confirms their Google listing. Saves to project record.

```json
// Request
{ "project_id": "uuid", "place_id": "ChIJ...", "confirmed_data": { "name": "Mike's Plumbing", "phone": "+15125551234", "email": "mike@mikesplumbing.com" } }

// Response 200
{ "project_id": "uuid", "saved": true }
```

---

### POST `/api/billing/create-checkout`

```json
// Request
{ "price_id": "price_...", "success_url": "https://onara.tech/dashboard?upgraded=true", "cancel_url": "https://onara.tech/pricing" }

// Response 200
{ "checkout_url": "https://checkout.stripe.com/..." }
```

---

### POST `/api/billing/portal`

```json
// Response 200
{ "portal_url": "https://billing.stripe.com/..." }
```

---

### POST `/api/billing/webhook`

Stripe webhook — no auth header, validated via Stripe signature. Always responds `200` (Stripe requires 2xx).

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Upgrade plan, set `revisions_limit` |
| `customer.subscription.updated` | Sync plan changes |
| `customer.subscription.deleted` | Downgrade to free, set `show_url=false` |
| `invoice.payment_failed` | Set `subscription_status=past_due`, send payment failure email |

---

### POST `/api/revision`

```json
// Request
{ "project_id": "uuid", "instruction": "Change the phone number to 512-555-9999 and add roof repair to the services list." }

// 202 Accepted
{ "revision_id": "uuid", "job_id": "uuid", "revisions_remaining": 2 }

// 402 — limit reached
{ "error": "revision_limit_reached", "message": "You have 0 revisions remaining this month.", "reset_at": "2026-06-01T00:00:00Z" }
```

---

### GET `/api/account`

Returns current user plan, usage, and project list.

```json
{
  "user": {
    "id": "uuid", "email": "user@example.com", "plan": "starter",
    "is_trial": false, "revisions_used": 4, "revisions_limit": 10,
    "revisions_reset_at": "2026-06-15T00:00:00Z"
  },
  "projects": [{
    "id": "uuid", "business_name": "Mike's Plumbing", "status": "live",
    "public_url": "https://abc123.pages.dev", "custom_domain": null,
    "last_deployed_at": "2026-05-14T08:23:00Z"
  }]
}
```

---

## FastAPI Routes — `http://{PIPELINE_SERVER_URL}`

All routes require: `X-Pipeline-Secret: {PIPELINE_API_SECRET}`

### GET `/health`

UptimeRobot monitoring target. Always returns `200` — watch the `status` field.

```json
// Healthy
{ "status": "ok", "ollama": true, "queue_length": 2, "active_jobs": 1, "uptime_seconds": 86400 }

// Degraded
{ "status": "degraded", "ollama": false, "queue_length": 0, "active_jobs": 0, "uptime_seconds": 3600 }
```

---

### POST `/pipeline/start`

Starts the 10-agent pipeline.

```json
// Request
{ "job_id": "uuid", "project_id": "uuid", "user_id": "uuid", "user_plan": "free", "business_data": { ... }, "style_preferences": { ... } }

// 202 Accepted
{ "job_id": "uuid", "queued": true, "queue_position": 1 }
```

---

### GET `/pipeline/status/:job_id`

Called by Next.js `/api/status`. Returns progress_log array.

```json
{
  "job_id": "uuid", "status": "running", "current_agent": "code_generator",
  "agents_completed": 5, "agents_total": 10, "elapsed_ms": 34000,
  "progress_log": [
    { "agent": "analyst", "status": "done", "ms": 3200 },
    { "agent": "content_writer", "status": "done", "ms": 8100 }
  ]
}
```

---

### POST `/pipeline/retry/:job_id`

Retries from the failing agent — does not restart from Agent 1.

```json
// Request
{ "retry_from_agent": "code_generator" }

// 202 Accepted
{ "job_id": "uuid", "retrying_from": "code_generator" }
```

---

### POST `/api/deploy` (Next.js internal)

FastAPI calls this after pipeline completes. Next.js then:
1. Uploads HTML to Cloudflare Pages Direct Upload
2. Commits HTML to GitHub `onara-sites` as backup
3. Saves to Supabase storage bucket
4. Updates project record with `public_url` and `status=live`
5. Sends "site is live" email via Resend

```json
// FastAPI → Next.js payload
{
  "job_id": "uuid", "project_id": "uuid", "user_id": "uuid",
  "final_html": "<!DOCTYPE html>...",
  "seo_metadata": { "title": "Mike's Plumbing | Plumber in Austin TX", "description": "...", "keywords": ["plumber austin"] },
  "duration_ms": 54000
}

// Response 200
{ "deployed": true, "public_url": "https://abc123.pages.dev", "github_path": "sites/uuid/index.html" }
```

---

## Error Code Reference

| Code | Key | Meaning |
|------|-----|---------|
| 400 | `invalid_request` | Missing or malformed body |
| 401 | `unauthorized` | Missing or invalid auth token |
| 402 | `revision_limit_reached` | Monthly revision cap hit |
| 403 | `project_limit_reached` | Plan project cap hit |
| 404 | `not_found` | Resource doesn't exist |
| 409 | `conflict` | Duplicate job or resource |
| 422 | `validation_error` | Body fails validation |
| 429 | `rate_limited` | Too many requests |
| 500 | `internal_error` | Server error — check logs |
| 503 | `pipeline_unavailable` | FastAPI server unreachable |
