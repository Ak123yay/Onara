# Terms of Service — Onara

_Key provisions affecting product and engineering decisions. Full legal text: `raw/05_terms_of_service.md`._

---

## Service Description

Onara provides an AI-powered website generation service that creates websites from Google Business Profile data. Generated websites are hosted on Cloudflare Pages infrastructure.

---

## User Obligations

- Users must own or have permission to represent the business they generate a site for
- Users must have a legitimate Google Business Profile for their business
- Users may not use Onara to generate sites for businesses they don't represent
- Users may not attempt to reverse-engineer the AI pipeline or scrape generated output at scale

---

## Service Limits (Enforced by Product)

These limits are defined in the ToS and enforced in code:

| Plan | Site limit | Revision limit | Code download |
|------|-----------|---------------|---------------|
| Free / Trial | 3 sites | 3/month | No |
| Starter | 3 sites | 3/month | No |
| Pro | Unlimited | Unlimited | Yes |

---

## Content Ownership

- **User retains ownership** of the business information (name, address, photos, etc.) sourced from their Google Business Profile
- **Onara grants a license** to users to use the generated HTML under their subscription
- Generated HTML may be downloaded (Pro plan) and used outside Onara
- Onara retains the right to use anonymized generated site data to improve the AI pipeline

---

## Refund Policy

- 7-day money-back guarantee from first charge
- No refunds after 7 days (except where required by law)
- Service failures on Onara's end (pipeline down, wrong content) → full refund at discretion
- Operator discretion for case-by-case requests

---

## Liability Limitations

- Onara is not liable for the accuracy of content sourced from Google Business Profile
- Onara is not liable if the generated website content contains errors from the source GBP data
- Service availability target: 99% uptime — not guaranteed
- Generated websites are static HTML — Onara is not liable for changes to external services that may affect the appearance

---

## Account Termination

- Onara may terminate accounts for ToS violations without refund
- Users may cancel anytime — existing sites remain live for 30 days after cancellation
- GDPR/CCPA deletion requests handled within 30 days — see `wiki/operations/billing-ops.md`

---

## Key Engineering Implications

| ToS Provision | Engineering Implication |
|--------------|------------------------|
| 3-site limit for Starter | Enforced in `/api/generate` with plan check |
| 7-day refund | Support must process within 7 days — see billing-ops |
| 30-day post-cancellation site availability | Sites not deleted from Cloudflare immediately on cancellation |
| Content ownership | Do not modify or claim generated HTML beyond serving it |
| GDPR deletion SLA | Account deletion flow must complete within 30 days |

---

## Full Legal Text

`raw/05_terms_of_service.md` — not compiled into wiki (legal document, kept in raw).

Consult a lawyer before launching — this summary is for engineering reference only.
