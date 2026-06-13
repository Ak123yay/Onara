# Product Roadmap — Onara

_Version milestones, feature scope, and release criteria._

---

## v1.0 — Core Product (Current Focus)

**Theme**: Prove the loop. GBP → 10 agents → live site in 60–120 seconds.

**Scope**:
- Google OAuth + email/password auth (Supabase)
- Business search (Google Places API)
- 10-agent pipeline (FastAPI, Blackboard pattern)
- SSE real-time progress
- Cloudflare Pages deployment
- GitHub commit (backup)
- Supabase storage (HTML archive)
- Resend transactional emails (8 templates)
- Stripe billing (Starter $12/month or $99/year, Pro $29/month, 14-day reverse trial)
- Dashboard: site list, preview, revision request form
- Manual revision handling
- Lead SMS notification on contact form submit
- Weekly Google reviews badge refresh
- UptimeRobot + PostHog monitoring

**Release criteria**:
- [ ] 10 successful end-to-end generations across different business types
- [ ] < 5% QA Gate failure rate
- [ ] Stripe webhooks tested in production
- [ ] All 8 email templates tested and delivered
- [ ] 3 real users (non-team) have completed the full flow
- [ ] Uptime > 99% over 7-day pre-launch period

---

## v1.5 — Stability & Scale

**Theme**: Harden for real traffic.

**Features**:
- Redis job queue (`REDIS_URL`) — replaces in-memory dict
- Improved SSE reconnection (exponential backoff)
- Generation retry UI
- PostHog funnel tracking and dashboards
- UptimeRobot webhook integration
- pg_cron email automation (Day 11, Day 13, Day 14 trial emails)
- DigitalOcean Droplet (production server migration)
- **Step 27.5 — Three-layer rate limiting** (see `wiki/architecture/rate-limiting.md`):
  - FastAPI: Redis-backed slowapi, per-plan limits (Free 3/day → Starter 10/day → Pro 500/day), keyed on `user_id`
  - Next.js middleware: sliding window per route (`/api/places` 20/min per IP, `/api/generate` by plan, `/api/billing/create-checkout` 5/hour)
  - Frontend: `RateLimitBanner` with human message, retry countdown, upgrade CTA
  - Production upgrade: replace in-memory Map with Upstash Redis (`@upstash/ratelimit`) — ~20 min, free tier

**Release criteria**:
- [ ] 100+ successful generations in production
- [ ] 3+ paid subscribers
- [ ] < 2% error rate on NIM calls
- [ ] pg_cron trial emails verified in production

---

## v2.0 — Automated Revisions

**Theme**: Close the loop. User requests change → AI makes it.

**Features**:
- Automated revision pipeline (FastAPI endpoint)
- Partial agent re-runs (only regenerate changed sections)
- Site analytics embed on generated sites
- Improved QA Gate (10 → 15 checks)
- Multiple layout templates per business type

**Release criteria**:
- [ ] 50+ active paying subscribers
- [ ] Automated revision round-trip < 90 seconds
- [ ] Site analytics visible in dashboard

---

## v2.5 — GBP Sync & Multi-Language

**Theme**: Sites that stay current automatically.

**Features**:
- GBP polling (`FEATURE_GBP_SYNC=true`) — pg_cron polls Places API every 24h
- Detects changes in hours, phone, address; notifies user; offers auto-regeneration
- Multi-language support (Spanish first)
- Referral program infrastructure
- Site performance score post-deploy

**Release criteria**:
- [ ] 200+ active paying subscribers
- [ ] GBP sync tested across 5 business types
- [ ] Spanish language generation validated

---

## v3.0 — Platform & API

**Theme**: Become the infrastructure.

**Features**:
- Public API (agencies generate sites programmatically)
- White-label option
- Team/agency accounts
- Multi-location businesses (one site per location)
- Custom domain support (Cloudflare API)
- Marketplace: installable page sections (menu, booking, testimonials)
- Enterprise plan ($99+/month)

**Release criteria**:
- [ ] 1,000+ active paying subscribers
- [ ] API stable with versioning
- [ ] 3+ agencies using white-label

---

## Feature Flags (Current)

| Flag | Default | Controls |
|------|---------|---------|
| `FEATURE_CODE_DOWNLOAD` | `true` | Pro code download |
| `FEATURE_ANNUAL_PLAN` | `true` | Annual Starter option |
| `FEATURE_GBP_SYNC` | `false` | GBP polling (v2.5) |

---

## Moats by Version

| Version | Moat |
|---------|------|
| v1 | Speed (60–120s) + GBP data integration |
| v2 | Automated revisions without full re-generation |
| v2.5 | Sites that self-update from GBP |
| v3 | Platform lock-in via API + white-label |

---

## Related Files

- `TASKS.md` — current sprint tasks mapped to v1 phases
- `wiki/research/notes.md` — v2+ moats and competitive analysis
