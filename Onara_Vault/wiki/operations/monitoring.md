# Monitoring — Onara

_UptimeRobot alerts, PostHog analytics, Supabase health queries, and weekly metrics._

---

## Uptime Monitoring (UptimeRobot)

**Monitors to configure**:

| Monitor | URL | Interval | Alert |
|---------|-----|----------|-------|
| Next.js App | `https://onara.tech` | 5 min | Email + `UPTIME_ROBOT_WEBHOOK` |
| Next.js Capability Health | `https://www.onara.tech/api/health` | 5 min | Email |
| FastAPI Health | `{PIPELINE_SERVER_URL}/health` | 5 min | Email + webhook |
| Cloudflare Pages Test | `https://onara-test.pages.dev` | 15 min | Email only |

**Webhook handler** (`UPTIME_ROBOT_WEBHOOK`):
- FastAPI receives UptimeRobot POST on monitor down/up events
- Logs alert to console; future: Slack/Discord notification (v2)

**Alert thresholds**:
- 1 failed check → warn (email)
- 2 consecutive failed checks → page (webhook + email)

`GET /api/health` reports whether Supabase, Stripe, Google Places, and the FastAPI
pipeline are configured. It never returns secret values. Optional services can return
`status: "degraded"` with HTTP 200; missing core Supabase app configuration returns HTTP 503.

Do not treat a degraded optional service as a full app outage. Follow the service-specific
fallback in `wiki/architecture/graceful-degradation.md`.

---

## Product Analytics (PostHog)

**Configuration**:
- Key: `NEXT_PUBLIC_POSTHOG_KEY`
- Host: `NEXT_PUBLIC_POSTHOG_HOST` (`https://app.posthog.com`)

**Events tracked** (client-side, auto-captured + custom):

| Event | Trigger | Properties |
|-------|---------|------------|
| `pageview` | Every page load | `path`, `plan` |
| `generate_started` | "Generate Site" clicked | `plan`, `business_category` |
| `generate_completed` | SSE `complete` received | `plan`, `duration_seconds` |
| `generate_failed` | SSE `error` received | `plan`, `failed_at_step` |
| `upgrade_clicked` | Upgrade button clicked | `current_plan`, `target_plan` |
| `upgrade_completed` | Webhook `checkout.session.completed` | `plan`, `price_id` |
| `revision_requested` | Revision form submitted | `plan`, `section` |
| `trial_started` | User signup | — |
| `trial_converted` | First payment received | `plan` |

**Key dashboards to build in PostHog**:
- Conversion funnel: signup → first generation → upgrade
- Trial-to-paid conversion rate
- Generation success rate by plan
- Top failure steps in pipeline

---

## Supabase Health Queries

Run these in Supabase SQL editor for operational visibility.

### Stuck Jobs (Daily)

```sql
SELECT job_id, user_id, status, created_at,
       now() - created_at AS age
FROM (
  SELECT id AS job_id, user_id, status, started_at AS created_at
  FROM pipeline_jobs
) j
WHERE status = 'running'
  AND created_at < now() - interval '10 minutes'
ORDER BY created_at;
```

### Generation Success Rate (Last 7 Days)

```sql
SELECT
  status,
  count(*) AS count,
  round(count(*) * 100.0 / sum(count(*)) OVER (), 1) AS pct
FROM pipeline_jobs
WHERE COALESCE(completed_at, started_at, queued_at) > now() - interval '7 days'
GROUP BY status
ORDER BY count DESC;
```

### Weekly Metrics (Monday Morning)

```sql
-- New signups this week
SELECT count(*) AS new_users
FROM users
WHERE created_at > now() - interval '7 days';

-- Active trials
SELECT count(*) AS active_trials
FROM users
WHERE is_trial = true
  AND trial_ends_at > now();

-- Trials ending in 3 days (conversion opportunity)
SELECT count(*) AS expiring_soon
FROM users
WHERE is_trial = true
  AND trial_ends_at BETWEEN now() AND now() + interval '3 days';

-- Paid subscribers by plan
SELECT plan, count(*) AS count
FROM users
WHERE plan IN ('starter', 'pro')
GROUP BY plan;

-- Sites generated this week
SELECT count(*) AS sites_generated
FROM projects
WHERE status = 'live'
  AND created_at > now() - interval '7 days';

-- MRR estimate
SELECT
  sum(CASE WHEN plan = 'starter' THEN 12 ELSE 0 END) +
  sum(CASE WHEN plan = 'pro' THEN 29 ELSE 0 END) AS mrr_usd
FROM users
WHERE plan IN ('starter', 'pro');
```

---

## Application Error Monitoring

**FastAPI** logs to stdout — collected by system journal or PM2 log:

```bash
# View recent FastAPI errors (on DigitalOcean droplet)
journalctl -u onara-api --since "1 hour ago" | grep ERROR

# Or if using PM2
pm2 logs onara-api --lines 100 | grep ERROR
```

**Next.js** errors visible in Vercel Function logs:

```bash
vercel logs --prod --since 1h | grep ERROR
```

**Key error patterns to watch**:
- `RateLimitError` from NIM → approaching free tier limit (40 RPM)
- `OllamaConnectionError` → Ollama process down on droplet
- `CloudflareAPIError` → token expired or quota issue
- `StripeSignatureVerificationError` → webhook secret mismatch

---

## Alert Response Targets

| Severity | Target Response |
|----------|----------------|
| Next.js app down | < 5 minutes |
| FastAPI unresponsive | < 15 minutes |
| Individual job stuck | < 30 minutes |
| Stripe webhook failing | < 1 hour |
| Email delivery failing | < 4 hours |

---

## Related Files

- `wiki/operations/runbook.md` — incident playbooks and resolution steps
- `wiki/architecture/env-vars.md` — `UPTIME_ROBOT_WEBHOOK`, `NEXT_PUBLIC_POSTHOG_KEY`
- `wiki/architecture/graceful-degradation.md` — fallback matrix and fail-closed rules
