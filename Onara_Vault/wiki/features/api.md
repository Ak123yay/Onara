# API — Onara

_All Next.js and FastAPI routes: request shapes, response shapes, and error codes._

Source: `raw/04_api_contract.md`

---

## Auth Model

```
Next.js internal routes:  Authorization: Bearer {supabase_jwt}
Next.js → FastAPI calls:  X-Pipeline-Secret: {PIPELINE_API_SECRET}
```

---

## Next.js API Routes — Base: `https://onara.tech/api`

### POST `/api/generate`
Validates plan/revision limits, forwards to FastAPI.
- **202** → `{ job_id, project_id, queue_position, estimated_wait_seconds }`
- **402** → revision_limit_reached
- **403** → project_limit_reached
- **429** → duplicate_job (active generation already running)

### GET `/api/status/:job_id`
Polling fallback for pipeline status.
- **200** → `{ status, current_agent, agents_completed, agents_total, progress_percent, elapsed_seconds }`
- Terminal states: `done` (includes `preview_url`, `public_url`) or `failed` (includes `failed_agent`, `retry_available`)

### GET `/api/stream/:job_id`
SSE stream — preferred over polling.
- Events: `agent_started`, `agent_completed`, `pipeline_done`, `pipeline_failed`, `heartbeat`
- Reconnect policy: wait 2s, reopen stream, max 5 attempts → fall back to polling

### GET `/api/preview/:project_id`
Serves generated HTML from Supabase storage. All plans including free.

### POST `/api/places/search`
Proxy to Google Places Text Search.
- Body: `{ query: "Mike's Plumbing Austin TX" }`
- Returns: array of results with `place_id`, `name`, `address`, `phone`, `rating`, `hours`, `confidence`

### POST `/api/places/confirm`
User confirms their business listing — saves to project record.

### POST `/api/billing/create-checkout`
Creates Stripe Checkout session. Returns `checkout_url`.

### POST `/api/billing/portal`
Creates Stripe Customer Portal session. Returns `portal_url`.

### POST `/api/billing/webhook`
Stripe webhook — no auth header, validated via Stripe signature.
Handled events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`

### POST `/api/revision`
Submits plain-language revision request.
- **202** → `{ revision_id, job_id, revisions_remaining }`
- **402** → revision_limit_reached

### GET `/api/account`
Returns plan, usage, and project list for the authenticated user.

---

## FastAPI Routes — Base: `{PIPELINE_SERVER_URL}`, Header: `X-Pipeline-Secret`

### GET `/health`
```json
{ "status": "ok", "ollama": true, "queue_length": 2, "active_jobs": 1, "uptime_seconds": 86400 }
```

### POST `/pipeline/start`
Starts the 10-agent pipeline. Returns `{ job_id, queued: true, queue_position }`.

### GET `/pipeline/status/:job_id`
Returns job status with `progress_log` array (agent, status, ms per step).

### POST `/pipeline/retry/:job_id`
Retries from a specific failing agent — does NOT restart from Agent 1.
Body: `{ retry_from_agent: "code_generator" }`

---

## Error Code Reference

| Code | Key | Meaning |
|------|-----|---------|
| 400 | `invalid_request` | Missing or malformed body |
| 401 | `unauthorized` | Missing or invalid auth |
| 402 | `revision_limit_reached` | Monthly revision cap hit |
| 403 | `project_limit_reached` | Plan project cap hit |
| 404 | `not_found` | Resource doesn't exist |
| 409 | `conflict` | Duplicate job |
| 422 | `validation_error` | Body fails validation |
| 429 | `rate_limited` | Too many requests |
| 500 | `internal_error` | Server error |
| 503 | `pipeline_unavailable` | FastAPI unreachable |
