import type { Metadata } from "next";
import { LegalPage, type LegalSection } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  alternates: {
    canonical: "/privacy",
  },
  description: "How Onara collects, uses, stores, and protects account, business, billing, and generated site data.",
  title: "Privacy Policy",
};

const sections: LegalSection[] = [
  {
    title: "Information we collect",
    body: (
      <p>
        Onara collects the information needed to create your account, generate contractor websites, host those sites,
        process billing, and support the product.
      </p>
    ),
    bullets: [
      "Account data such as name, email address, authentication provider, account status, plan, trial dates, and support messages.",
      "Business data such as company name, service area, address, phone number, website goals, services, photos, Google Place ID, ratings, review counts, and manually entered business details.",
      "Generated site data such as site HTML, CSS, JavaScript, deployment metadata, revision requests, build logs, preview URLs, public URLs, and backup repository references.",
      "Billing references such as Stripe customer ID, subscription ID, plan, billing interval, subscription status, and invoice/payment event state. Onara does not store full card numbers, CVV, or raw payment credentials.",
      "Technical data such as dashboard events, generation pipeline status, error logs, security logs, device/browser metadata, and contact-form submissions from generated sites.",
    ],
  },
  {
    title: "How we use information",
    bullets: [
      "Create and protect your account, keep you signed in, and show the correct dashboard, billing, trial, and plan limits.",
      "Generate, revise, deploy, suspend, restore, and back up the websites you create through Onara.",
      "Process subscriptions and payment status through Stripe, including checkout, renewals, failed-payment handling, cancellation handling, and plan changes.",
      "Send operational messages such as account emails, contact-form lead notifications, support replies, billing notices, and security notices.",
      "Debug failures, prevent abuse, monitor uptime, improve reliability, and understand which parts of the product need work.",
      "Improve the product using approved, redacted examples only when your account settings or request history allow that use.",
    ],
  },
  {
    title: "Generated sites and public data",
    body: (
      <p>
        Websites created with Onara are intended to be public once deployed. Business names, services, phone numbers,
        photos, reviews, service-area copy, and contact forms may be visible on the live generated site. If your plan is
        canceled, past due, or downgraded, Onara may replace the public URL with a placeholder while keeping your project
        record and backup files available for reactivation where possible.
      </p>
    ),
  },
  {
    title: "Training data and product improvement",
    body: (
      <p>
        Onara does not treat every generated site as training data. Optional training-data use is opt-in from your
        Account page. When enabled, we may save only QA-approved, redacted generation examples for retrieval,
        evaluation, or future model improvement. We do not store failed builds, private owner notes, support emails,
        payment data, or unredacted business contact details as training examples.
      </p>
    ),
    bullets: [
      "You can leave optional training-data use off and still use Onara normally.",
      "You can withdraw consent from the Account page to stop future approved examples from being saved.",
      "You can delete saved approved examples connected to your account from the Account page or by emailing privacy@onara.tech.",
      "Deleting saved examples does not delete your active projects, deployed sites, billing records, or required operational logs.",
    ],
  },
  {
    title: "Service providers",
    body: (
      <p>
        Onara uses third-party processors to operate the service. We share only the data needed for each provider to
        perform its role.
      </p>
    ),
    bullets: [
      "Supabase for authentication, database, storage, edge functions, and account/project records.",
      "Stripe for checkout, subscriptions, invoices, payment status, and payment method handling.",
      "Cloudflare for generated-site hosting, public URLs, DNS, caching, security, and placeholder deployment.",
      "GitHub for private generated-site backup repositories and source version history.",
      "Vercel or equivalent hosting infrastructure for the Onara application.",
      "Google Places APIs for business search, place details, photos, ratings, and review metadata when you use Google import features.",
      "Resend or equivalent email infrastructure for transactional messages and lead notifications.",
      "AI providers and pipeline infrastructure, including Onara's FastAPI pipeline and configured model providers, to generate and revise sites.",
    ],
  },
  {
    title: "What we do not do",
    bullets: [
      "We do not sell personal information.",
      "We do not store full credit card numbers or CVV codes.",
      "We do not use your account data for third-party advertising.",
      "We do not knowingly collect information from children under 18.",
      "We do not publish private dashboard data unless it is part of a site you choose to deploy publicly.",
    ],
  },
  {
    title: "Retention",
    bullets: [
      "Active account, project, and generated-site records are retained while your account remains active.",
      "Canceled, suspended, or free-account project data may be retained for a limited period so the site can be restored or exported when eligible.",
      "Generated code backups may remain in private repositories until the project or account is deleted or the retention window expires.",
      "Pipeline logs, error traces, and operational logs are kept only as long as needed for debugging, security, and reliability.",
      "Billing records may be retained as required for accounting, tax, fraud-prevention, and legal obligations.",
      "Deletion requests are processed within a reasonable period, except where retention is required by law, security, billing, or dispute needs.",
    ],
  },
  {
    title: "Your choices and rights",
    bullets: [
      "You can request access to personal data connected to your account.",
      "You can ask us to correct inaccurate account or business data.",
      "You can request deletion of your account data, subject to legal and operational retention requirements.",
      "You can request an export of your business data and generated site data where technically available and plan-eligible.",
      "You can withdraw consent for optional training-data use or delete approved training examples connected to your account from the Account page.",
      "California residents can request access, deletion, correction, and non-discrimination rights under applicable California privacy law.",
    ],
  },
  {
    title: "Security",
    bullets: [
      "Onara uses HTTPS/TLS for data in transit.",
      "Supabase Row Level Security is used to restrict account and project records.",
      "Secrets and API keys are stored outside source code in environment variables or platform secret stores.",
      "Stripe handles payment method collection and PCI-sensitive payment data.",
      "No internet service can guarantee perfect security, so please contact security@onara.tech if you believe you found a vulnerability.",
    ],
  },
  {
    title: "Contact and changes",
    body: (
      <p>
        Email privacy questions, rights requests, or training-data removal requests to privacy@onara.tech. For general
        support, email support@onara.tech. We may update this policy as Onara changes. Material updates will be reflected
        by the updated date on this page.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Privacy Policy"
      title="How Onara handles your data"
      intro="This policy explains what Onara collects, why we collect it, how we use service providers, and the controls you have over account, business, billing, and generated-site data."
      updated="June 19, 2026"
      sections={sections}
    />
  );
}
