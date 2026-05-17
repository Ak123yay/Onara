# ONARA — API CONTRACT & ENDPOINT MAP
## Next.js ↔ FastAPI Interface Reference
### All routes, request shapes, response shapes, and error codes

---

## Authentication Model

All Next.js API routes are protected by Supabase session validation.
All FastAPI routes require the shared `PIPELINE_API_SECRET` header.

```
Next.js internal routes:  Authorization: Bearer {supabase_jwt}
Next.js → FastAPI calls:  X-Pipeline-Secret: {PIPELINE_API_SECRET}
FastAPI → Next.js calls:  X-Pipeline-Secret: {PIPELINE_API_SECRET}
```

---

## NEXT.JS API ROUTES
### Base URL: `https://onara.tech/api`

---

### POST `/api/generate`
Validates the user's plan and revision limit, then forwards the generation request to FastAPI.

**Auth**: Supabase JWT required

**Request Body**
```json
{
  "project_id": "uuid",
  "business_data": {
    "name": "Mike's Plumbing Austin",
    "address": "123 Main St, Austin, TX 78701",
    "phone": "+15125551234",
    "email": "mike@mikesplumbing.com",
    "hours": {
      "monday": "7am-6pm",
      "tuesday": "7am-6pm",
      "wednesday": "7am-6pm",
      "thursday": "7am-6pm",
      "friday": "7am-6pm",
      "saturday": "8am-2pm",
      "sunday": "closed"
    },
    "photos": ["https://maps.googleapis.com/..."],
    "category": "Plumber",
    "rating": 4.8,
    "review_count": 127,
    "place_id": "ChIJ..."
  },
  "style_preferences": {
    "color_scheme": "auto",
    "tone": "professional"
  }
}
```

**Success Response** `202 Accepted`
```json
{
  "job_id": "uuid",
  "project_id": "uuid",
  "queue_position": 2,
  "estimated_wait_seconds": 45
}
```

**Error Responses**
```json
// 402 — Revision limit reached
{
  "error": "revision_limit_reached",
  "message": "You have used all 3 revisions this month.",
  "reset_at": "2026-06-01T00:00:00Z"
}

// 403 — Project limit reached
{
  "error": "project_limit_reached",
  "message": "Your plan allows 1 website. Upgrade to Pro for up to 3."
}

// 429 — Duplicate job
{
  "error": "duplicate_job",
  "message": "A generation is already running for this project.",
  "existing_job_id": "uuid"
}
```

---

### GET `/api/status/:job_id`
Polling fallback — returns current pipeline status. Use SSE stream instead when possible.

**Auth**: Supabase JWT required

**Success Response** `200 OK`
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

**Terminal States** (stop polling when status is one of these)
```json
// Done
{
  "job_id": "uuid",
  "status": "done",
  "current_agent": "done",
  "agents_completed": 10,
  "agents_total": 10,
  "preview_url": "https://onara.tech/api/preview/uuid",
  "public_url": "https://abc123.pages.dev",
  "elapsed_seconds": 58
}

// Failed
{
  "job_id": "uuid",
  "status": "failed",
  "failed_agent": "code_generator",
  "error_message": "Model timeout after 30s",
  "retry_available": true
}
```

---

### GET `/api/stream/:job_id`
Server-Sent Events stream for real-time pipeline progress.

**Auth**: Supabase JWT required
**Content-Type**: `text/event-stream`

**Event Types**
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

---

### GET `/api/preview/:project_id`
Serves the generated HTML file from Supabase storage. Works for all plans including free.

**Auth**: Supabase JWT required

**Success Response** `200 OK`
- Content-Type: `text/html`
- Body: the generated `index.html`

**Error Response** `404`
```json
{ "error": "not_found", "message": "No generated site found for this project." }
```

---

### POST `/api/places/search`
Searches Google Places API for a business.

**Auth**: Supabase JWT required

**Request Body**
```json
{
  "query": "Mike's Plumbing Austin TX"
}
```

**Success Response** `200 OK`
```json
{
  "results": [
    {
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
    }
  ]
}
```

---

### POST `/api/places/confirm`
User confirms their business listing. Saves to the project record.

**Auth**: Supabase JWT required

**Request Body**
```json
{
  "project_id": "uuid",
  "place_id": "ChIJ...",
  "confirmed_data": {
    "name": "Mike's Plumbing",
    "phone": "+15125551234",
    "email": "mike@mikesplumbing.com"
  }
}
```

**Success Response** `200 OK`
```json
{
  "project_id": "uuid",
  "saved": true
}
```

---

### POST `/api/billing/create-checkout`
Creates a Stripe Checkout session.

**Auth**: Supabase JWT required

**Request Body**
```json
{
  "price_id": "price_...",
  "success_url": "https://onara.tech/dashboard?upgraded=true",
  "cancel_url": "https://onara.tech/pricing"
}
```

**Success Response** `200 OK`
```json
{
  "checkout_url": "https://checkout.stripe.com/..."
}
```

---

### POST `/api/billing/portal`
Creates a Stripe Customer Portal session for plan management.

**Auth**: Supabase JWT required

**Success Response** `200 OK`
```json
{
  "portal_url": "https://billing.stripe.com/..."
}
```

---

### POST `/api/billing/webhook`
Receives Stripe webhook events. No auth header — validated via Stripe signature.

**Handled Events**
- `checkout.session.completed` → upgrade user plan, set revisions_limit
- `customer.subscription.updated` → sync plan changes
- `customer.subscription.deleted` → downgrade to free, set show_url=false
- `invoice.payment_failed` → set subscription_status=past_due, send payment failure email

**Success Response** `200 OK` (always — Stripe expects 2xx)

---

### POST `/api/revision`
Submits a plain-language revision request.

**Auth**: Supabase JWT required

**Request Body**
```json
{
  "project_id": "uuid",
  "instruction": "Change the phone number to 512-555-9999 and add roof repair to the services list."
}
```

**Success Response** `202 Accepted`
```json
{
  "revision_id": "uuid",
  "job_id": "uuid",
  "revisions_remaining": 2
}
```

**Error Response** `402`
```json
{
  "error": "revision_limit_reached",
  "message": "You have 0 revisions remaining this month.",
  "reset_at": "2026-06-01T00:00:00Z"
}
```

---

### GET `/api/account`
Returns current user plan, usage, and project list.

**Auth**: Supabase JWT required

**Success Response** `200 OK`
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "plan": "starter",
    "is_trial": false,
    "revisions_used": 4,
    "revisions_limit": 10,
    "revisions_reset_at": "2026-06-15T00:00:00Z"
  },
  "projects": [
    {
      "id": "uuid",
      "business_name": "Mike's Plumbing",
      "status": "live",
      "public_url": "https://abc123.pages.dev",
      "custom_domain": null,
      "last_deployed_at": "2026-05-14T08:23:00Z"
    }
  ]
}
```

---

## FASTAPI ROUTES
### Base URL: `http://{PIPELINE_SERVER_URL}`
### All routes require header: `X-Pipeline-Secret: {PIPELINE_API_SECRET}`

---

### GET `/health`
Health check endpoint for UptimeRobot monitoring.

**Success Response** `200 OK`
```json
{
  "status": "ok",
  "ollama": true,
  "queue_length": 2,
  "active_jobs": 1,
  "uptime_seconds": 86400
}
```

**Degraded Response** `200 OK` (still 200 — monitoring tool watches the `status` field)
```json
{
  "status": "degraded",
  "ollama": false,
  "queue_length": 0,
  "active_jobs": 0,
  "uptime_seconds": 3600
}
```

---

### POST `/pipeline/start`
Starts the 10-agent pipeline for a generation job.

**Request Body**
```json
{
  "job_id": "uuid",
  "project_id": "uuid",
  "user_id": "uuid",
  "user_plan": "free",
  "business_data": { ... },
  "style_preferences": { ... }
}
```

**Success Response** `202 Accepted`
```json
{
  "job_id": "uuid",
  "queued": true,
  "queue_position": 1
}
```

---

### GET `/pipeline/status/:job_id`
Returns current pipeline job status. Called by Next.js `/api/status` route.

**Success Response** `200 OK`
```json
{
  "job_id": "uuid",
  "status": "running",
  "current_agent": "code_generator",
  "agents_completed": 5,
  "agents_total": 10,
  "elapsed_ms": 34000,
  "progress_log": [
    { "agent": "analyst", "status": "done", "ms": 3200 },
    { "agent": "content_writer", "status": "done", "ms": 8100 }
  ]
}
```

---

### POST `/pipeline/retry/:job_id`
Retries a failed job from the failing agent (does not restart from Agent 1).

**Request Body**
```json
{
  "retry_from_agent": "code_generator"
}
```

**Success Response** `202 Accepted`
```json
{
  "job_id": "uuid",
  "retrying_from": "code_generator"
}
```

---

### POST `/pipeline/result`
Called by FastAPI itself (internally) when pipeline completes, to push result to Next.js for deployment.

**Destination**: `POST {APP_URL}/api/deploy`

**Request Body** (FastAPI → Next.js)
```json
{
  "job_id": "uuid",
  "project_id": "uuid",
  "user_id": "uuid",
  "final_html": "<!DOCTYPE html>...",
  "seo_metadata": {
    "title": "Mike's Plumbing | Plumber in Austin TX",
    "description": "...",
    "keywords": ["plumber austin", "emergency plumber austin tx"]
  },
  "duration_ms": 54000
}
```

---

### POST `/api/deploy` (Next.js internal route)
Receives pipeline result, then:
1. Uploads HTML to Cloudflare Pages Direct Upload
2. Commits HTML to GitHub onara-sites repo as backup
3. Saves to Supabase storage bucket
4. Updates project record with public_url and status=live
5. Sends "site is live" email via Resend

**Response** `200 OK`
```json
{
  "deployed": true,
  "public_url": "https://abc123.pages.dev",
  "github_path": "sites/uuid/index.html"
}
```

---

## ERROR CODE REFERENCE

| Code | Key | Meaning |
|------|-----|---------|
| 400  | `invalid_request` | Missing or malformed body |
| 401  | `unauthorized` | Missing or invalid auth token |
| 402  | `revision_limit_reached` | Monthly revision cap hit |
| 403  | `project_limit_reached` | Plan project cap hit |
| 404  | `not_found` | Resource doesn't exist |
| 409  | `conflict` | Duplicate job or resource |
| 422  | `validation_error` | Body fails validation |
| 429  | `rate_limited` | Too many requests |
| 500  | `internal_error` | Server error — check logs |
| 503  | `pipeline_unavailable` | FastAPI server unreachable |

---

## WEBSOCKET / SSE RECONNECT POLICY

If the SSE connection drops:
1. Frontend waits 2 seconds
2. Reopens `GET /api/stream/:job_id`
3. Server immediately sends current state on reconnect
4. If job is already `done` or `failed`, sends terminal event and closes

Max reconnect attempts: 5
After 5 failures: fall back to polling `/api/status/:job_id` every 5 seconds
