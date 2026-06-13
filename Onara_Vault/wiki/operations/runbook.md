# Operations Runbook — Onara

_Daily procedures, incident playbooks, and monitoring setup. Source: `raw/12_operations_runbook.md`._

---

## Daily Checks (5 minutes)

Run every morning before starting development:

1. **UptimeRobot**: Check all monitors green — Next.js app, FastAPI `/health`, Cloudflare Pages test site
2. **Supabase**: Check `pipeline_jobs` for any jobs stuck in `running` for >10 minutes
3. **Stripe**: Check for any failed payments or disputed charges in Stripe dashboard
4. **FastAPI logs**: Check for recurring 500 errors or NIM rate limit warnings
5. **Email delivery**: Check Resend dashboard for any bounced or failed sends

```sql
-- Check for stuck jobs (run in Supabase SQL editor)
SELECT id AS job_id, user_id, project_id, status, started_at,
       now() - started_at AS age
FROM pipeline_jobs
WHERE status = 'running'
  AND started_at < now() - interval '10 minutes'
ORDER BY started_at;
```

---

## Incident Playbooks

### 1. Pipeline Unresponsive

**Symptoms**: FastAPI health check failing; users can't generate sites; all jobs stuck in queue

**Steps**:
1. SSH to DigitalOcean droplet (or check dev machine)
2. Check FastAPI process: `ps aux | grep uvicorn`
3. If not running: `cd ~/onara && uvicorn main:app --host 0.0.0.0 --port 8000 &`
4. Check Cloudflare Tunnel status: `cloudflared tunnel list`
5. Restart tunnel if needed: `cloudflared tunnel --url http://localhost:8000`
6. Verify health: `curl https://{PIPELINE_SERVER_URL}/health`
7. Update `pipeline_jobs` stuck in `running`: set to `failed`
8. Send manual email to affected users (see email template below)

**Resolution time target**: < 15 minutes

---

### 2. Generation Stuck (Individual Job)

**Symptoms**: Single user reports progress bar stopped; SSE events stopped; job still shows `running`

**Steps**:
1. Find job in Supabase: `SELECT * FROM pipeline_jobs WHERE id = '{jobId}'`
2. Check FastAPI logs for the job ID to identify which agent failed
3. If Supervisor rejected after 3 retries → job should auto-fail (check job status)
4. If job is genuinely stuck (no log activity for 5+ minutes):
   - Manually update: `UPDATE pipeline_jobs SET status = 'failed' WHERE id = '{jobId}'`
   - Contact user: "Your generation failed — please try again, no charge"
5. If NIM rate limit caused failure: wait 1 minute and ask user to retry

**Note**: Generation failures do NOT count against site limits.

---

### 3. Cloudflare Deployment Failed

**Symptoms**: Job completed but site URL is 404 or Cloudflare error page

**Steps**:
1. Check Cloudflare Pages dashboard for failed deployment
2. Check FastAPI logs for deployment-module Cloudflare API errors
3. Common causes:
   - `CLOUDFLARE_API_TOKEN` expired → rotate in Cloudflare dashboard, update `.env`
   - Cloudflare Pages project doesn't exist → deployment module should create it; check logs
   - HTML file too large → check final HTML output size (should be < 25MB)
4. Manual re-deploy:
   ```bash
   curl -X POST "https://api.cloudflare.com/client/v4/accounts/{id}/pages/projects/{name}/deployments" \
     -H "Authorization: Bearer {token}" \
     -F "file=@index.html"
   ```
5. Update `projects.public_url` with the correct URL once deployed

---

### 4. Stripe Webhook Not Processing

**Symptoms**: User upgraded but plan not changed; payment succeeded in Stripe but `users` billing fields not updated

**Steps**:
1. Check Stripe dashboard → Webhooks → endpoint → recent deliveries
2. Look for failed deliveries (non-200 response)
3. Check Next.js logs for `/api/billing/webhook` errors
4. Common causes:
   - `STRIPE_WEBHOOK_SECRET` mismatch → regenerate in Stripe, update env
   - Raw body parsing issue → check Next.js route config (`bodyParser: false`)
   - Database error → check Supabase for connection issues
5. Manual fix: Use Stripe dashboard "Resend" button on failed webhook
6. If webhook cannot be resent: manually update the user's `plan`, `subscription_status`, `stripe_customer_id`, and `stripe_subscription_id` fields in Supabase

---

### 5. Wrong Site Content Generated

**Symptoms**: User's site has wrong business name, copy from a different business, or garbled content

**Steps**:
1. Check `pipeline_jobs` for the job and the linked `projects.google_place_id`
2. Verify the Google Place ID returned the correct business via Places API
3. If correct Place ID but wrong content → Agent 1 analysis or Agent 2 copy issue
4. Resolution: trigger a free regeneration for the user
   - Mark original job `status = 'failed'`
   - Do NOT count against their site limit
   - Ask user to regenerate
5. If systemic (multiple users affected): check NIM for degraded output quality

---

## Manual Email Templates

### Pipeline Down Notification

```
Subject: Onara — Brief service interruption

Hi [Name],

We experienced a brief interruption with our site generation service. This has been resolved.

If your site generation was affected, please try again — it will not count against your limit.

Apologies for the inconvenience.

The Onara Team
```

### Generation Failed Notification

```
Subject: Your site generation failed — please try again

Hi [Name],

Your recent site generation for [Business Name] encountered an error and didn't complete.

This was on our end, not yours. Please try again — it won't count against your limit.

The Onara Team
```

---

## Monitoring Setup Checklist

- [ ] UptimeRobot: monitor Next.js app URL (5-minute interval)
- [ ] UptimeRobot: monitor FastAPI `/health` endpoint (5-minute interval)
- [ ] UptimeRobot: set alert webhook to `UPTIME_ROBOT_WEBHOOK` in FastAPI env
- [ ] PostHog: `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST` set in Next.js
- [ ] Stripe: webhook endpoint registered for production URL
- [ ] Resend: verify `onara.tech` domain in Resend dashboard
- [ ] Supabase: pg_cron enabled (paid plan required)
- [ ] Cloudflare: API token has `Cloudflare Pages:Edit` permission only

---

## Related Files

- `wiki/operations/monitoring.md` — detailed monitoring dashboards and SQL queries
- `wiki/operations/billing-ops.md` — billing operations (refunds, plan changes)
- `raw/12_operations_runbook.md` — full source runbook
