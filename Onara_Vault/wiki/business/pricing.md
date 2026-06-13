# Pricing Strategy — Onara

_Plan tiers, reverse trial rationale, pricing psychology, and revenue projections._

---

## Plan Tiers

| Plan | Price | Target Customer |
|------|-------|----------------|
| Trial | $0 / 14 days | All new signups |
| Starter | $12/month or $99/year | Single-location business owners |
| Pro | $29/month | Multi-location or agencies |

---

## The Reverse Trial

**What it is**: All new users get 14 days of full Pro access, no credit card required.

**Why it works** (vs. freemium):
- Freemium conversion: 2–5%
- Reverse trial conversion: 4–12% (industry benchmarks)
- Users experience the full product before hitting any limit
- Loss aversion: users don't want to lose features they've been using
- No "upgrade to unlock" frustration during the learning phase

**Why no credit card upfront**:
- Removes the #1 signup friction for SMB owners
- Trust signal: we're confident enough to not ask for payment first
- Reduces early churn from "forgot to cancel" resentment

**Trial-to-paid funnel**:
1. Day 0: Signup → welcome email → immediate generation
2. Day 1: User sees their site live → "aha moment"
3. Days 2–10: User builds more sites, shows to friends/customers
4. Day 11: First warning email — "3 days left"
5. Day 13: Second warning email — "1 day left"
6. Day 14: Downgrade email — limited features, upgrade CTA prominent
7. Days 14–30: Upgrade window (users often convert after downgrade hits them)

---

## Pricing Psychology

**$12/month (Starter)**:
- Positioned as "less than a coffee a week" ($2.77/week)
- Below the $15–20 threshold where SMB owners start to question ROI
- Competes directly with DIY website builders (Wix $17+, Squarespace $16+)
- Annual option ($99/year) creates a low-friction full-year commitment at $8.25/month effective pricing

**$29/month (Pro)**:
- Below $30 psychological barrier
- Positioned against hiring a web designer ($500–$2000 one-time)
- ROI clear: one new customer from the website pays for 1 year of Pro

**Annual plan**:
- Starter annual: $99/year = $8.25/month effective pricing
- Stripe price ID: `STRIPE_STARTER_ANNUAL_PRICE_ID`
- Feature flag: `FEATURE_ANNUAL_PLAN=true` by default

---

## Revenue Projections

_Conservative model. Source: Onara Business Plan v12._

| Month | Users | Trial→Paid Rate | MRR |
|-------|-------|----------------|-----|
| 1 | 50 | 5% | $60 |
| 3 | 200 | 6% | $360 |
| 6 | 500 | 7% | $1,050 |
| 12 | 1,500 | 8% | $3,600 |
| 18 | 3,000 | 9% | $8,700 |
| 24 | 6,000 | 10% | $21,600 |

**Break-even**: 2–5 paying Starter users while v1 runs on local infrastructure and free tiers. Re-check break-even before moving to a permanent cloud server or GPU-backed Ollama.

**Infrastructure costs** (v1 planning):
- Vercel hosting for the app
- Pipeline server sized for FastAPI + Ollama (16 GB minimum; 24 GB recommended if both local models stay available)
- Supabase
- Cloudflare Pages
- NVIDIA NIM
- Resend

Do not hardcode vendor pricing in implementation docs; verify current pricing before launch budgeting.

---

## Churn Assumptions

- Monthly churn target: < 5%
- LTV at 5% churn: ~20 months × $12 = $240 (Starter), ~20 months × $29 = $580 (Pro)
- CAC target: < $30 (organic channels only at launch)
- LTV:CAC target: > 5:1

---

## Competitive Positioning

| Competitor | Price | Time to Live | AI Quality |
|-----------|-------|-------------|-----------|
| Wix | $17–35/mo | Hours (DIY) | Low |
| Squarespace | $16–49/mo | Hours (DIY) | Low |
| GoDaddy Website Builder | $10–25/mo | Hours (DIY) | Medium |
| Lokal (AI) | $15–40/mo | 30–60 min | Medium |
| **Onara** | $0–29/mo | **60–120 sec** | **High** |

Onara wins on speed. SMB owners don't want to customize — they want a site that looks professional without touching code.

---

## Related Files

- `wiki/features/billing.md` — Stripe implementation of plans
- `wiki/business/icp.md` — who is paying these prices
- `wiki/research/notes.md` — market sizing and competitive landscape
