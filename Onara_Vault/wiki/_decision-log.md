# _decision-log.md — Running Decision Log

_Chronological log of all decisions. Claude appends after each session._

---

## 2026-05-14 — Architecture (Pre-Development)

**Pipeline runtime: FastAPI on persistent server**
FastAPI on PC (Cloudflare Tunnel) at launch; migrate to DigitalOcean when needed. Serverless functions max out at 60s — pipeline runs 60–120s. See ADR-001.

**User site hosting: Cloudflare Pages Direct Upload**
All user sites on Cloudflare Pages. Free, unlimited sites, no DDoS billing risk, programmatic deployment. See ADR-002.

**No LangChain/LangGraph**
Plain Python + custom Blackboard pattern. LangChain adds abstraction overhead with no benefit since Onara controls all infrastructure.

**onara-sites repo: private**
Contains all users' generated code — must be private. GitHub Pages not used; Cloudflare handles hosting.

**GitHub App for deployment (not PAT)**
GitHub App uses hourly-expiring installation tokens. More secure than long-lived PATs. Permissions: `Contents R/W + Metadata R/O` only.

**Reverse trial, not freemium**
14 days full Pro access, no credit card. Core value (live URL) disappears on downgrade → loss aversion. Converts at 4–12% vs. 2–5% for standard freemium.

**Agent 6 model gated by plan**
Free/Starter → `kimi-k2.6`; Pro → Claude Sonnet or GPT. Higher-quality code generation is a meaningful Pro differentiator. Cloud models cost more per job — gating keeps economics viable.

**GitHub PAT scopes: `repo` only for Copilot**
`read:user` not needed once GitHub Education is verified via browser. Minimal permissions.

---

## 2026-05-15 — Retention

**v1 retention mechanisms: Lead SMS + Reviews Badge Refresh + GBP Change Detection Email**

Three mechanisms pulled forward from v1.5/v2 into v1 launch scope. Selection criteria: direct churn reduction + buildable in one sprint each.

1. **Lead SMS Notification** (`FEATURE_LEAD_SMS`) — Contact form submit → Twilio SMS to business owner. The highest-impact retention mechanism: every lead is proof the site is generating business. Build: Supabase Edge Function + Twilio. ~1 day.

2. **Reviews Badge Weekly Refresh** (`FEATURE_REVIEWS_BADGE`) — pg_cron job pulls current Google rating + count weekly, updates the badge HTML on the live site. Makes the site feel alive and self-updating without a full regen. Build: one cron job + Places API call + targeted Cloudflare Pages HTML update. ~0.5 days.

3. **GBP Change Detection Email** (simplified subset of `FEATURE_GBP_SYNC`) — pg_cron job runs daily, compares current GBP hours/phone/address against stored Blackboard values. On change: sends a Resend email ("We noticed your Google hours changed — click to update your site"). No auto-deploy at v1 — user must approve. Build: pg_cron diff + Resend email, reuses existing transactional email infrastructure. ~1 day. Full auto-deploy remains v2.5.

Mechanisms NOT pulled into v1: GBP auto-deploy sync (high complexity, low immediate impact at launch scale), seasonal SEO pages (requires new agent logic), custom domain (Cloudflare API + DNS polling, not a churn driver at launch).

---

## Template for Future Entries

```
## YYYY-MM-DD — [Topic]

**[Decision name]**
[What was decided and why in 1–2 sentences. Link to ADR if formal.]
```
