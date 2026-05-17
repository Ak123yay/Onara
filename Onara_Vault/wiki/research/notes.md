# Research Notes — Onara

_Compiled from raw/Onara_Business_Plan_v12.md._

---

## Market Overview

**Target**: Small business owners in service industries without a website.

**Primary verticals**: plumbers, cleaners, food trucks, photographers, tutors, caterers, landscapers, electricians, HVAC, contractors.

**Common profile**: no technical skills, have a GBP but no website, respond to emotional appeal and social proof, want zero effort.

---

## Core Problem

Every existing builder requires starting from a blank page. Onara's insight: every serious local business already has a Google Business Profile with name, address, phone, hours, photos, and reviews — Onara imports this automatically. The only user action is confirming their info.

**No competitor imports GBP as core onboarding. This is the primary differentiator.**

---

## Competitive Landscape

| Competitor | Target | Price | AI Gen | GBP Import |
|------------|--------|-------|--------|------------|
| Lovable / Bolt.new / Base44 | Developers | $20–$200/mo | Yes | No |
| Wix / Squarespace | General | $16–$17/mo | No | No |
| **Onara** | **Small biz owners** | **$0/$12/$29** | **Yes** | **Yes** |

**Gap**: AI generators target developers. Wix/Squarespace require significant user effort. Nothing targets local contractors with GBP but no website.

---

## Reverse Trial Strategy

All signups get 14 days full Pro access, no credit card required. After 14 days → auto-downgrade.

**Why**: core value (live URL) disappears on downgrade → loss aversion drives upgrades. Conversion: 4–12% (vs. standard freemium 2–5%).

Email sequence: Day 0 (welcome), Day 11 (3 days left), Day 13 (tomorrow your URL goes offline), Day 14 (auto-downgrade via Supabase edge function).

---

## Revenue Projections

| Users | Starter 10% | Pro 5% | MRR |
|-------|------------|--------|-----|
| 100 | $120 | — | $120 |
| 500 | $600 | $435 | $1,035 |
| 1,000 | $1,200 | $1,450 | $2,650 |

---

## Infrastructure Costs

**At launch: $0/month** (all free tiers). DigitalOcean Droplet when migrating: $12–24/month. Breakeven: 2 paying Starter users.

---

## Risk Register

| Risk | Mitigation |
|------|-----------|
| Google Places API changes | Manual fallback form built in |
| Agent 6 malformed output | Retry with simplified prompt; no revision deducted |
| NVIDIA NIM rate limits | 10s wait + retry; fall back to Ollama |
| Pipeline server down | PM2 auto-restart; UptimeRobot /health monitoring |
| Stripe payment failure | 3 retries over 7 days; downgrade after all fail |
| Wix copies GBP import | Speed to market; v2 hands-off maintenance is the deeper moat |

---

## Distribution

**Primary**: cold outbound to Google Maps listings without websites — search trade + city, filter no-website listings, send personalized email/text.

**Secondary**: contractor Facebook groups, trade association partnerships, accountant referral program ($20/month per active referral).

---

## Google Places API Notes

**API**: Google Places API (New) — Text Search + Place Details.

Available: name, address, phone, structured hours, photos (up to 10), rating + review count, primary category, existing website URL.

Missing fields shown with amber highlight + manual input fallback.

Cost: free ≤5,000 req/month; $17/1,000 after that. Free at launch scale.

---

## v2+ Moats

| Version | Feature |
|---------|---------|
| v2 | Hands-off maintenance (email a change → auto-update) |
| v2.5 | Continuous GBP sync (auto-detect changes, redeploy) |
| v2.5 | Visual Style DNA (vision model extracts palette from photos) |
| v2.5 | SEO landing pages per location/niche |
| v3 | Custom domain via Cloudflare API |
| v3 | SEO scoring dashboard |
| v3 | White-label for agencies |
