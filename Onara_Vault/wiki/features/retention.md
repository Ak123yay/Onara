# Retention Features

Mechanisms that keep users engaged and their sites valuable over time. For v1, keep this small: lead SMS notifications and weekly review badge refresh. GBP polling, seasonal pages, and custom domains remain post-v1 scope.

---

## Feature 1 — Google Business Profile Sync

**Target version**: v2.5 for change-detection email; auto-deploy later  
**Feature flag**: `FEATURE_GBP_SYNC`

**What it does**: Polls the Google Places API every 24 hours for each live project. If the business has updated their hours, phone number, or address on Google, Onara detects the change and notifies the user. No v1 work should implement Places polling for change detection.

**Database table**: `gbp_sync_log` (see `wiki/data/models.md`)

**Detection flow (post-v1)**:
1. pg_cron job runs daily — queries Google Places API for each project's `google_place_id`
2. Compares response to stored `business_hours`, `business_phone`, `business_address` in `projects`
3. If any field differs → write row to `gbp_sync_log` with `field_changed`, `old_value`, `new_value`
4. If `auto_deployed = true` → trigger a revision pipeline automatically
5. If `auto_deployed = false` → send email to user: "We noticed your Google hours changed — click to update your site"

**Why this is a moat**: No competitor rebuilds the site when Google data changes. Users who link their site to Onara get a site that stays current automatically — a recurring reason to stay subscribed.

**v2.5 scope**: Notification only (email to user). User clicks to approve update.  
**Later scope**: Auto-deploy for hours/phone changes (low-risk fields). Still notify, but deploy without approval.

---

## Feature 2 — Google Reviews Badge

**Target version**: v1 (pulled forward 2026-05-15 — low complexity, high signal)  
**Feature flag**: `FEATURE_REVIEWS_BADGE`

**What it does**: Weekly job pulls the business's current Google review count and average rating via the Places API. Injects an updated reviews badge into the live site.

**Implementation**: Agent 8 (SEO) already injects the initial rating into the JSON-LD schema. The retention version updates this weekly without requiring a full regeneration — just a targeted HTML update to the badge section.

**User value**: The site gets fresher over time. A business that accumulates 50 more reviews sees that reflected automatically — making the site more credible and reducing churn.

---

## Feature 3 — Lead SMS Notification

**Target version**: v1 (pulled forward 2026-05-15 — highest churn-reduction impact)  
**Feature flag**: `FEATURE_LEAD_SMS`

**What it does**: When a visitor submits the contact form on the generated site, the business owner receives an SMS notification immediately.

**Why**: Local contractors check their phones constantly but don't check email. An instant SMS for every lead is a direct retention hook — the site is visibly generating business.

**Implementation**: 
- Contact form on generated site → POST to a Supabase Edge Function endpoint
- Edge Function → Twilio API → SMS to `business_phone`
- Supabase logs the lead for the user's dashboard

**Pricing consideration**: Twilio charges per SMS. At low volume (v1 scale), this is negligible. Price into the Pro tier if it becomes material cost.

---

## Feature 4 — Seasonal SEO Landing Pages

**Target version**: v2.5  
**Feature flag**: `FEATURE_SEASONAL_PAGES`

**What it does**: Generates additional landing pages for seasonal demand spikes specific to the business type. Examples:
- Plumbers: "emergency frozen pipe repair [city]" (November–February)
- HVAC: "AC tune-up [city]" (April–May), "furnace check [city]" (September)
- Landscapers: "spring cleanup [city]" (March–April), "fall cleanup [city]" (October)

**Implementation**: Deploys additional pages to the same Cloudflare Pages project as subdirectories (`/winter-plumbing`, `/spring-hvac`). Uses Agent 1 industry classification to select appropriate seasonal content.

**Why this is a moat**: The site grows in SEO depth over time, automatically. Each seasonal page is a new keyword ranking opportunity. This is impossible to replicate with a static site builder.

---

## Feature 5 — Custom Domain

**Target version**: v3  
**Feature flag**: `FEATURE_CUSTOM_DOMAIN`  
**Plan**: Starter and above

**What it does**: Allows users to connect their own domain (e.g., `mikesplumbing.com`) to their Cloudflare Pages site.

**Implementation via Cloudflare API**:
```python
# Cloudflare Pages Custom Domain API
POST /accounts/{account_id}/pages/projects/{project_name}/domains
{
  "name": "mikesplumbing.com"
}
```

Cloudflare returns the DNS records the user needs to point at their domain registrar. The dashboard shows these records with copy-to-clipboard and a verification status indicator.

**Complexity**: DNS propagation takes hours. Need a polling mechanism to check verification status and update the project record when the domain goes live.

---

## Retention Metric Targets (v1)

| Metric | Target | Why |
|--------|--------|-----|
| Day 14 trial conversion | 5–10% | Primary revenue driver |
| Month 3 churn rate | < 10% | Site still working = stay subscribed |
| Revision usage (paid users) | > 1/month | Usage = retention |
| "Site live" open rate (email) | > 60% | First value moment email |
| Lead SMS delivery time | < 30 seconds | Immediate proof that the site is generating leads |
| Reviews badge refresh success | > 95% | Fresh proof without requiring user effort |
