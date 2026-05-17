# ONARA — OPERATIONS RUNBOOK
## For day-to-day management once real customers exist
### Reference for founder or any future team member

---

## QUICK REFERENCE — Critical Links

| Resource | URL / Command |
|----------|--------------|
| Supabase Dashboard | https://supabase.com/dashboard/project/{your-project-id} |
| Stripe Dashboard | https://dashboard.stripe.com |
| Cloudflare Dashboard | https://dash.cloudflare.com |
| Vercel Dashboard | https://vercel.com/dashboard |
| GitHub onara-sites repo | https://github.com/{username}/onara-sites |
| UptimeRobot | https://uptimerobot.com |
| Pipeline server health | {PIPELINE_SERVER_URL}/health |
| Resend email logs | https://resend.com/emails |

---

## SECTION 1 — DAILY CHECK (5 minutes)

Run this check every morning before starting work.

**1. Pipeline health**
```bash
curl {PIPELINE_SERVER_URL}/health
```
Expected response: `{"status": "ok", "ollama": true, "queue_length": 0}`

If `status` is `degraded` → see "Pipeline Server Down" below.
If `ollama` is `false` → run `ollama ps` on the server to check model status.

**2. Supabase error log**
Open Supabase dashboard → Table Editor → `pipeline_errors` → sort by `created_at` DESC → check last 24 hours.
Any errors with `retry_count >= 2` need investigation.

**3. Stripe payment failures**
Open Stripe Dashboard → Payments → filter by "Failed" → check today.
Any failed payments → check if automated retry is set up. If customer hasn't responded in 3 days → send manual email.

**4. UptimeRobot alerts**
Check UptimeRobot for any downtime incidents since last check.
If there was downtime → check the server logs and document it.

---

## SECTION 2 — INCIDENT PLAYBOOKS

---

### INCIDENT: Pipeline Server Unresponsive

**Symptoms**: `/health` returns no response or 5xx. Users see "generation failed" errors.

**Step 1 — Check if the process is running (PC)**
```bash
pm2 status
```
If `onara-pipeline` shows `stopped` or `errored`:
```bash
pm2 restart onara-pipeline
```

**Step 1 — Check if the process is running (DigitalOcean)**
```bash
ssh root@{droplet-ip}
systemctl status onara-pipeline
```
If not running:
```bash
systemctl restart onara-pipeline
journalctl -u onara-pipeline -n 50  # check logs for crash reason
```

**Step 2 — Check Ollama**
```bash
ollama ps              # check loaded models
ollama serve           # restart if needed
```

**Step 3 — Check Cloudflare Tunnel (if using PC as server)**
```bash
pm2 status             # cloudflared should be a PM2 process
pm2 restart cloudflared
```

**Step 4 — Verify fix**
```bash
curl {PIPELINE_SERVER_URL}/health
```

**Step 5 — User communication**
If downtime exceeded 15 minutes:
- Check `pipeline_jobs` table for jobs with status `queued` or `running` during the outage
- Those users will get a "generation failed" state
- Email them manually (see Email Template: Manual Apology below)

---

### INCIDENT: Generation Stuck (Job Not Completing)

**Symptoms**: User reports their site has been "generating" for more than 5 minutes.

**Step 1 — Find the job**
```sql
SELECT * FROM pipeline_jobs
WHERE status = 'running'
ORDER BY queued_at ASC;
```

**Step 2 — Check FastAPI logs**
```bash
pm2 logs onara-pipeline --lines 100
```
Look for the job_id. Identify which agent is stuck.

**Step 3 — Force-fail the stuck job**
```bash
# Call the FastAPI admin endpoint
curl -X POST {PIPELINE_SERVER_URL}/admin/fail-job \
  -H "X-Pipeline-Secret: {PIPELINE_API_SECRET}" \
  -H "Content-Type: application/json" \
  -d '{"job_id": "{stuck_job_id}", "reason": "manual_timeout"}'
```

**Step 4 — Update database**
```sql
UPDATE pipeline_jobs
SET status = 'failed', error_message = 'Job manually failed due to timeout'
WHERE id = '{stuck_job_id}';

UPDATE projects
SET status = 'failed', error_message = 'Generation timed out — please retry'
WHERE id = '{project_id}';
```

**Step 5 — Restore revision credit**
```sql
UPDATE users
SET revisions_used = revisions_used - 1
WHERE id = '{user_id}';
```

**Step 6 — Notify user**
Send the "Retry Available" email (see email templates below) or trigger a retry from the dashboard.

---

### INCIDENT: Cloudflare Pages Deployment Failed

**Symptoms**: Pipeline completed but `status` is not `live`. `public_url` is null.

**Step 1 — Find the project**
```sql
SELECT id, cloudflare_project_name, status, error_message
FROM projects
WHERE user_id = '{user_id}'
ORDER BY created_at DESC LIMIT 1;
```

**Step 2 — Try manual deployment**
```bash
# Get the HTML from Supabase storage bucket
# Download: storage/sites/{project_id}/index.html

# Re-run Cloudflare Pages Direct Upload
curl -X POST "https://api.cloudflare.com/client/v4/accounts/{CLOUDFLARE_ACCOUNT_ID}/pages/projects/{project_name}/deployments" \
  -H "Authorization: Bearer {CLOUDFLARE_API_TOKEN}" \
  -F "files[]=@/tmp/index.html;filename=index.html"
```

**Step 3 — Update project record**
```sql
UPDATE projects
SET
  status = 'live',
  public_url = 'https://{project_name}.pages.dev',
  error_message = NULL
WHERE id = '{project_id}';
```

**Step 4 — Send site live email** (trigger manually via Resend)

---

### INCIDENT: Stripe Webhook Not Processing

**Symptoms**: User upgraded but their plan didn't change in Supabase.

**Step 1 — Check Stripe webhook logs**
Stripe Dashboard → Developers → Webhooks → your endpoint → Recent deliveries.
Look for failed deliveries.

**Step 2 — Manual plan update**
```sql
UPDATE users
SET
  plan = 'starter',     -- or 'pro'
  revisions_limit = 10, -- 10 for starter, -1 for pro
  subscription_status = 'active',
  stripe_subscription_id = '{sub_id_from_stripe}',
  stripe_customer_id = '{customer_id_from_stripe}'
WHERE email = '{user_email}';
```

**Step 3 — Reactivate their site if it was suspended**
```sql
UPDATE projects
SET status = 'live', show_url = TRUE
WHERE user_id = (SELECT id FROM users WHERE email = '{user_email}');
```

---

### INCIDENT: User's Site Shows Wrong Content

**Symptoms**: User says their site has incorrect information (wrong phone, old hours, etc.)

**Step 1 — Verify the complaint**
Visit the user's `public_url` to confirm.

**Step 2 — Check if it's a revision issue**
```sql
SELECT * FROM revisions
WHERE user_id = '{user_id}'
ORDER BY created_at DESC LIMIT 5;
```

**Step 3 — Option A: Ask user to submit a revision**
If they have revisions remaining, direct them to the dashboard.

**Step 4 — Option B: Manual revision (no revision credit deducted)**
- Pull the HTML from Supabase storage
- Make the specific correction manually
- Re-upload to Cloudflare Pages
- Do NOT deduct a revision from their count

---

## SECTION 3 — BILLING OPERATIONS

---

### How to Issue a Refund

Refunds are handled directly in Stripe. Onara's ToS says no refunds except as required by law, but use judgment for goodwill cases.

1. Stripe Dashboard → Customers → find customer → Payments → find charge → Issue Refund
2. Partial or full — your call
3. Send a brief email confirming the refund (see template below)
4. If refunding due to a product failure (e.g., site never deployed), restore the revision credit:
```sql
UPDATE users SET revisions_used = revisions_used - 1 WHERE email = '{email}';
```

---

### How to Manually Upgrade/Downgrade a User

```sql
-- Upgrade to Starter
UPDATE users SET
  plan = 'starter',
  revisions_limit = 10,
  show_url = TRUE,
  subscription_status = 'active'
WHERE email = '{email}';

-- Upgrade to Pro
UPDATE users SET
  plan = 'pro',
  revisions_limit = -1,   -- unlimited
  show_url = TRUE,
  subscription_status = 'active'
WHERE email = '{email}';

-- Downgrade to Free
UPDATE users SET
  plan = 'free',
  revisions_limit = 3,
  show_url = FALSE,
  subscription_status = NULL
WHERE email = '{email}';
```

---

### How to Extend a Trial

```sql
UPDATE users
SET trial_ends_at = trial_ends_at + INTERVAL '7 days'
WHERE email = '{email}';
```

---

### How to Reset Revisions Manually

```sql
UPDATE users
SET revisions_used = 0
WHERE email = '{email}';
```

---

## SECTION 4 — ACCOUNT DELETION REQUEST

When a user emails asking to delete their account (GDPR/CCPA right to erasure):

**Step 1 — Cancel their Stripe subscription**
Stripe Dashboard → Customer → Cancel Subscription immediately.

**Step 2 — Delete Cloudflare Pages project**
```bash
curl -X DELETE "https://api.cloudflare.com/client/v4/accounts/{CLOUDFLARE_ACCOUNT_ID}/pages/projects/{project_name}" \
  -H "Authorization: Bearer {CLOUDFLARE_API_TOKEN}"
```

**Step 3 — Delete GitHub site directory**
```bash
# Remove the sites/{project_id}/ directory from onara-sites repo
git rm -r sites/{project_id}/
git commit -m "Delete site data for user {user_id}"
git push
```

**Step 4 — Delete Supabase data**
Deleting the user row cascades to all related tables (projects, jobs, revisions) via `ON DELETE CASCADE`.
```sql
DELETE FROM auth.users WHERE id = '{user_id}';
-- The trigger and cascade handles the rest
```

**Step 5 — Confirm to user**
Send confirmation email within 30 days (required by GDPR/CCPA).

---

## SECTION 5 — MANUAL EMAIL TEMPLATES

### Template: Manual Apology (after downtime)
```
Subject: We're sorry — here's what happened and what we did

Hi {first_name},

We had an outage today between {start_time} and {end_time} that affected site generation.

Your generation attempt during that window failed. We've reset your revision credit so you weren't charged for it.

Try again now — everything is working: https://onara.tech/dashboard

Sorry for the interruption.

[Your name]
Onara
```

### Template: Retry Available
```
Subject: Your Onara generation failed — here's your retry

Hi {first_name},

Your recent site generation hit an error before it finished. It wasn't your fault and your revision wasn't used.

Go back to your dashboard and try again — it should work now:
https://onara.tech/dashboard

If it happens again, reply to this email and I'll look into it personally.

[Your name]
Onara
```

### Template: Refund Confirmation
```
Subject: Your Onara refund has been processed

Hi {first_name},

I've issued a refund of ${amount} to your payment method. It typically appears within 5-10 business days depending on your bank.

[Any additional context about why the refund was issued]

If you'd like to give Onara another try in the future, your account is still there.

[Your name]
Onara
```

---

## SECTION 6 — MONITORING SETUP CHECKLIST

Run this once at launch setup:

- [ ] UptimeRobot: Add monitor for `{PIPELINE_SERVER_URL}/health` — check every 5 minutes
- [ ] UptimeRobot: Add monitor for `https://onara.tech` — check every 5 minutes
- [ ] UptimeRobot: Set up email + SMS alerts to your phone
- [ ] Stripe: Set up email alerts for failed payments (Dashboard → Settings → Notifications)
- [ ] Supabase: Enable email alerts for database errors (Project Settings → Logs)
- [ ] Vercel: Enable email alerts for deploy failures
- [ ] Set calendar reminder: Every Sunday, run weekly check (Stripe revenue, new signups, churn, avg generation time from pipeline_jobs table)

---

## SECTION 7 — WEEKLY METRICS QUERY

Run every Sunday. Paste results into your metrics tracker.

```sql
-- Key weekly metrics
SELECT
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') AS new_signups_7d,
  COUNT(*) FILTER (WHERE plan = 'starter') AS starter_count,
  COUNT(*) FILTER (WHERE plan = 'pro') AS pro_count,
  COUNT(*) FILTER (WHERE plan = 'free' AND is_trial = FALSE) AS free_count,
  COUNT(*) FILTER (WHERE is_trial = TRUE) AS trial_count,
  ROUND(AVG(
    EXTRACT(EPOCH FROM (completed_at - queued_at))
  ) FILTER (WHERE status = 'done'), 1) AS avg_generation_seconds
FROM users
LEFT JOIN pipeline_jobs ON pipeline_jobs.user_id = users.id;
```
