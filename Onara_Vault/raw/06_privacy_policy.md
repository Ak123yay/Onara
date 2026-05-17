# PRIVACY POLICY

**Onara** | onara.tech
**Last Updated**: May 14, 2026

---

This Privacy Policy explains what data Onara collects, why we collect it, how we use it, and your rights regarding your data.

---

## 1. Data We Collect

### 1.1 Account Data
When you create an account, we collect:
- **Email address** — required for login, notifications, and billing communication
- **Name and profile photo** — collected via Google OAuth if you sign in with Google
- **Account creation date** and last activity timestamp

### 1.2 Business Data
When you search for and confirm your business listing, we collect and store:
- Business name, address, phone number, and email
- Business hours and services
- Google rating and review count
- Business photos (URLs from Google)
- Google Place ID

This data is used to generate your website and may be stored in your account for future updates and revisions.

### 1.3 Generated Site Data
We store the HTML code of your generated website in:
- Our Supabase database and storage buckets (for dashboard preview and revisions)
- A private GitHub repository (as a deployment backup)

### 1.4 Payment Data
We use **Stripe** to process payments. Onara never stores your credit card number, CVV, or full payment details. We store:
- Your Stripe Customer ID (a reference token)
- Your subscription status and plan type
- Billing history (available in the Stripe Customer Portal)

### 1.5 Usage Data
We collect technical usage data including:
- Pages visited and features used within the Onara dashboard
- Pipeline generation events (which agents ran, generation duration)
- Error logs associated with your account

### 1.6 Cookies and Session Tokens
Onara uses browser session tokens managed by Supabase Auth to keep you logged in. A cookie/session notice is shown on first visit. We do not use advertising cookies or tracking pixels.

---

## 2. How We Use Your Data

| Purpose | Data Used | Legal Basis |
|---------|-----------|-------------|
| Account creation and authentication | Email, name, OAuth data | Contract performance |
| Generating your website | Business data, photos | Contract performance |
| Hosting and deploying your website | Generated HTML | Contract performance |
| Billing and subscription management | Email, Stripe customer ID | Contract performance |
| Sending transactional emails | Email | Contract performance |
| Monitoring service health and debugging | Error logs, usage data | Legitimate interest |
| Improving the product | Anonymized usage patterns | Legitimate interest |

We do not use your data for advertising. We do not sell your data to any third party.

---

## 3. Data Sharing — Third-Party Services

We share your data with the following services to operate Onara. Each link goes to their privacy policy.

| Service | What We Share | Purpose |
|---------|--------------|---------|
| **Supabase** | Email, business data, generated site code | Database, auth, storage |
| **Stripe** | Email, billing info | Payment processing |
| **Cloudflare** | Generated site HTML | Hosting your public site |
| **GitHub** | Generated site HTML | Backup storage (private repo) |
| **Vercel** | Request metadata | Hosting the Onara application |
| **Google** | Business search queries | Google Places API for business data import |
| **Resend** | Email address, name | Transactional email delivery |
| **DigitalOcean** | AI pipeline requests | Running the generation pipeline server |

We do not share your data with any other parties except as required by law.

---

## 4. Data Retention

| Data Type | Retention Period |
|-----------|-----------------|
| Active account data | Retained while account is active |
| Generated site code | Retained for 90 days after account cancellation |
| Pipeline error logs | 30 days |
| Stripe billing records | 7 years (legal requirement) |
| Deleted account data | Purged within 30 days of deletion request |

---

## 5. Your Rights

Depending on your location, you may have the following rights:

**Access**: Request a copy of the personal data we hold about you.

**Correction**: Request correction of inaccurate personal data.

**Deletion**: Request deletion of your personal data. Note: some data (e.g., billing records) must be retained for legal compliance.

**Portability**: Request your data in a machine-readable format. For Onara, this includes your business data and generated site HTML.

**Objection / Restriction**: Object to or request restriction of certain processing activities.

**Withdrawal of Consent**: Where processing is based on consent, withdraw that consent at any time.

To exercise any of these rights, email **privacy@onara.tech**. We will respond within 30 days.

---

## 6. EU/UK Users — GDPR and UK GDPR

If you are located in the European Union or United Kingdom, the General Data Protection Regulation (GDPR) or UK GDPR applies to your data.

**Data Controller**: Onara, [Your Business Address]

**Legal Bases for Processing**: As described in Section 2 above — primarily contract performance and legitimate interest.

**International Transfers**: Your data is processed in the United States and may be transferred to servers operated by our third-party providers. We rely on Standard Contractual Clauses and the data processing agreements of each provider to ensure adequate protection.

**Right to Lodge a Complaint**: You have the right to lodge a complaint with your local data protection authority (e.g., the ICO in the UK, or your country's DPA in the EU).

---

## 7. California Users — CCPA

If you are a California resident, you have the following additional rights under the California Consumer Privacy Act:

- **Right to Know**: Request disclosure of the categories and specific pieces of personal information we collect.
- **Right to Delete**: Request deletion of personal information we have collected from you.
- **Right to Non-Discrimination**: We will not discriminate against you for exercising your CCPA rights.

To submit a CCPA request, email **privacy@onara.tech** with "CCPA Request" in the subject line.

We do not sell personal information as defined by the CCPA.

---

## 8. Children's Privacy

Onara is not intended for use by anyone under the age of 18. We do not knowingly collect personal information from children. If you believe we have inadvertently collected information from a minor, contact us at privacy@onara.tech and we will delete it promptly.

---

## 9. Security

We implement industry-standard security measures including:
- All data in transit encrypted via TLS/HTTPS
- Passwords hashed using bcrypt (email/password accounts)
- Database protected by Row Level Security (RLS) — users can only access their own rows
- API keys and secrets stored as environment variables, never in code
- Payment data handled exclusively by Stripe (PCI DSS compliant)

No security system is perfect. If you discover a security vulnerability, please report it to security@onara.tech.

---

## 10. Changes to This Policy

We will notify you of material changes to this Privacy Policy by email and by updating the "Last Updated" date above. Continued use of the Service after changes take effect constitutes acceptance.

---

## 11. Contact

**Privacy inquiries**: privacy@onara.tech
**General support**: support@onara.tech
**Mailing address**: [Your Business Address]

---

*[Note for launch: Replace bracketed placeholders with your actual address. Have a licensed attorney review before your first paying customer, especially if you expect EU users.]*
