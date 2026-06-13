# Privacy Policy — Onara

_Key provisions affecting data handling decisions. Full legal text: `raw/06_privacy_policy.md`._

---

## Data Collected

| Data Type | Source | Where Stored | Retention |
|-----------|--------|-------------|-----------|
| Name, email | Signup (Google OAuth or form) | Supabase `users` | Until account deletion |
| Google Business Profile data | Google Places API | Supabase `projects` and `pipeline_jobs` | Until account deletion |
| Generated HTML | AI pipeline output | Supabase Storage + GitHub | Until account deletion |
| Payment method | Stripe (never stored by Onara) | Stripe only | Until subscription ends |
| Usage analytics | PostHog | PostHog (anonymized) | 2 years |
| IP address, browser info | Standard web logs | Vercel/CF logs | 30 days |

---

## Data NOT Collected

- Passwords (Google OAuth only — Supabase handles email auth with hashed passwords)
- Credit card numbers (Stripe handles all payment data — Onara never sees card details)
- Location beyond what Google Places returns
- Browsing history outside onara.tech

---

## Third-Party Data Sharing

| Third Party | What's Shared | Why |
|-------------|-------------|-----|
| Supabase | User account data, generated sites | Hosting and database |
| Stripe | Email, billing info | Payment processing |
| Cloudflare | Generated HTML | Site hosting |
| Google | Business search queries | Places API |
| Resend | User email address | Transactional email delivery |
| NVIDIA NIM | Business name + context (in prompts) | AI generation |
| PostHog | Anonymized usage events | Product analytics |

**No data is sold to third parties.**

---

## GDPR / CCPA Rights

Users have the right to:
- **Access**: request a copy of all data held
- **Deletion**: request permanent deletion of all data
- **Portability**: receive data in machine-readable format
- **Rectification**: correct inaccurate data

**Deletion SLA**: 30 days from request. See `wiki/operations/billing-ops.md` for the deletion procedure.

**Data controller**: Onara (contact: privacy@onara.tech)

---

## Cookie Policy

- **Strictly necessary**: Supabase session cookie (HttpOnly, SameSite=Strict)
- **Analytics**: PostHog (can be opted out via browser settings)
- **No advertising cookies**

---

## Key Engineering Implications

| Privacy Provision | Engineering Implication |
|-----------------|------------------------|
| Data stored in Supabase | All 5 user-related tables must be deletable per deletion request |
| Stripe handles payment data | Never log or store raw Stripe card data in Onara systems |
| NIM processes business data | Business name/description passed to NIM prompts — acceptable under commercial API ToS |
| 30-day log retention | Don't store raw access logs beyond 30 days |
| PostHog anonymization | Ensure PostHog events don't include PII (no email, no full name in events) |

---

## Full Legal Text

`raw/06_privacy_policy.md` — not compiled into wiki (legal document, kept in raw).

Consult a lawyer before launching — this summary is for engineering reference only.
