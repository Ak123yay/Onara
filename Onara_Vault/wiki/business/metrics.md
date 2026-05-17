# Metrics — KPIs and Tracking

What to measure, how to measure it, and what the targets are.

---

## Primary KPIs (Track Weekly)

| Metric | Definition | Target (Month 3) |
|--------|-----------|-----------------|
| **Signups** | New accounts created | 50+ |
| **Trials started** | Users who started a generation within 48h of signup | 80% of signups |
| **Trial → Paid conversion** | Users who upgrade before Day 14 | 5–10% |
| **MRR** | Monthly recurring revenue | $1,000+ |
| **Churn rate** | Paid subscribers who cancel / total paid | < 8%/month |
| **Sites generated** | Total successful pipeline completions | 100+ |
| **Avg generation time** | P50 time from submit → live site | < 75 seconds |

---

## Secondary KPIs (Track Monthly)

| Metric | Definition |
|--------|-----------|
| **CAC** | Total outbound time cost / new paid users |
| **LTV** | Avg revenue per user × avg subscription months |
| **Revision usage rate** | % of paid users who use at least 1 revision/month |
| **NPS proxy** | % of users who build a second site (high intent = satisfied) |
| **Pipeline failure rate** | Failed jobs / total jobs |
| **P95 generation time** | 95th percentile pipeline duration |

---

## PostHog Events (Product Analytics)

All key user actions are instrumented. See `wiki/operations/monitoring.md` for the full events table.

Key events for funnel analysis:

```
signup_completed
  → places_search_performed
  → business_confirmed
  → generation_started
  → generation_completed      ← first value moment
  → preview_viewed
  → upgrade_clicked
  → checkout_completed        ← conversion event
  → revision_submitted        ← retention signal
```

**Conversion funnel** (track in PostHog):
1. `signup_completed` → `generation_started`: should be > 70%
2. `generation_started` → `generation_completed`: should be > 90%
3. `generation_completed` → `upgrade_clicked`: depends on Day 14 email timing
4. `upgrade_clicked` → `checkout_completed`: should be > 50%

---

## Revenue Tracking

**MRR formula**:
```sql
SELECT
  SUM(CASE plan
    WHEN 'starter' THEN 12
    WHEN 'pro'     THEN 29
    ELSE 0
  END) AS mrr_estimate
FROM public.users
WHERE subscription_status = 'active'
   OR (is_trial = TRUE AND trial_ends_at > NOW());
```

**Growth accounting** (track monthly):
- New MRR = revenue from new paid users
- Expansion MRR = upgrades from Starter → Pro
- Churn MRR = cancellations × their plan price
- Net MRR = New + Expansion - Churn

---

## Cohort Analysis

Group users by signup week. For each cohort track:
- % still active at Week 2 (post-trial)
- % still active at Month 1
- % still active at Month 3

A healthy retention curve flattens after Month 2 — indicates product is retaining core users.

---

## Pipeline Health Metrics

```sql
-- Success rate over last 7 days
SELECT
  COUNT(*) FILTER (WHERE status = 'done') AS success,
  COUNT(*) FILTER (WHERE status = 'failed') AS failed,
  ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'done') / COUNT(*), 1) AS success_rate_pct,
  AVG(duration_ms) / 1000 AS avg_seconds,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms) / 1000 AS p95_seconds
FROM public.pipeline_jobs
WHERE created_at > NOW() - INTERVAL '7 days'
  AND status IN ('done', 'failed');
```

**Targets**:
- Success rate > 90%
- P50 duration < 75 seconds
- P95 duration < 120 seconds

---

## Daily Dashboard (Paste Into Supabase SQL Editor)

```sql
SELECT
  -- Today's signups
  (SELECT COUNT(*) FROM public.users WHERE created_at > NOW() - INTERVAL '24 hours') AS new_signups,

  -- Active trials
  (SELECT COUNT(*) FROM public.users WHERE is_trial = TRUE AND trial_ends_at > NOW()) AS active_trials,

  -- Paid users
  (SELECT COUNT(*) FROM public.users WHERE plan != 'free' AND subscription_status = 'active') AS paid_users,

  -- MRR estimate
  (SELECT SUM(CASE plan WHEN 'starter' THEN 12 WHEN 'pro' THEN 29 ELSE 0 END)
   FROM public.users WHERE subscription_status = 'active') AS mrr,

  -- Sites generated today
  (SELECT COUNT(*) FROM public.pipeline_jobs
   WHERE status = 'done' AND created_at > NOW() - INTERVAL '24 hours') AS sites_today,

  -- Failed jobs today
  (SELECT COUNT(*) FROM public.pipeline_jobs
   WHERE status = 'failed' AND created_at > NOW() - INTERVAL '24 hours') AS failures_today;
```

---

## Launch Targets

| Milestone | Target | By |
|-----------|-------|----|
| First 10 paying users | $120–$290 MRR | Week 2 post-launch |
| $1K MRR | ~50 paying users | Month 2 |
| $5K MRR | ~200 paying users | Month 6 |
| $10K MRR | ~400 paying users | Month 12 |
| Ramen profitability | > $2K MRR | Month 3 |
