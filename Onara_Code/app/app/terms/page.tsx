import type { Metadata } from "next";
import { LegalPage, type LegalSection } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Service - Onara",
  description: "The terms that apply when using Onara to generate, revise, host, and manage local business websites.",
};

const sections: LegalSection[] = [
  {
    title: "Agreement",
    body: (
      <p>
        These Terms govern your access to Onara and the websites, generated code, account tools, billing tools, and
        support services we provide. By creating an account, starting a site generation, using checkout, or continuing to
        use Onara, you agree to these Terms.
      </p>
    ),
  },
  {
    title: "Who can use Onara",
    bullets: [
      "You must be at least 18 years old.",
      "You must be able to enter a binding agreement.",
      "If you use Onara for a business, you represent that you are authorized to act for that business.",
      "You may not import, generate, or publish a site for a business you do not own or have permission to represent.",
    ],
  },
  {
    title: "What Onara provides",
    body: (
      <p>
        Onara is an AI website generation and revision system for local service businesses. It can import business data,
        generate a site, deploy it, store project records, back up generated code, accept revision requests, and provide
        account, billing, and support controls.
      </p>
    ),
    bullets: [
      "Generated websites may use Google Places data, manually entered business information, AI-generated copy, generated code, and user revision instructions.",
      "Generated sites may be deployed through Cloudflare Pages or similar infrastructure.",
      "Generated code may be backed up in private GitHub repositories or equivalent storage.",
      "Paid plans may include public URL access, more site slots, unlimited revisions, and code download depending on the active plan.",
    ],
  },
  {
    title: "Accounts and accurate information",
    bullets: [
      "You are responsible for account credentials and activity under your account.",
      "You agree to provide accurate business information, contact details, and billing information.",
      "Onara is not responsible for errors caused by incorrect, incomplete, outdated, or unauthorized business information.",
      "You are responsible for reviewing generated site copy before relying on it publicly.",
    ],
  },
  {
    title: "Plans, trials, billing, and cancellation",
    body: (
      <p>
        Onara offers free, trial, Starter, Pro, and other plan states as shown in the product. Stripe processes checkout,
        payment methods, subscription renewals, invoices, failed payments, and billing events.
      </p>
    ),
    bullets: [
      "Paid plans renew automatically unless canceled before the next billing period.",
      "Trials may provide temporary access to paid features and can downgrade when the trial ends unless a paid plan is active.",
      "If payment fails or a subscription is canceled, Onara may downgrade the account, hide public URLs, suspend generated sites, or replace public pages with placeholders.",
      "Cancellation does not always delete generated code or project records immediately; Onara may retain records for restoration, compliance, security, billing, or support.",
      "Fees are non-refundable except where required by law or where Onara decides a refund is appropriate.",
    ],
  },
  {
    title: "Generated content and ownership",
    bullets: [
      "You keep ownership of the business information, photos, brand details, and other materials you provide.",
      "You own the generated site content created for your business, subject to any third-party materials, open-source licenses, or provider terms that may apply.",
      "You grant Onara the rights needed to generate, store, revise, host, deploy, suspend, restore, back up, and support your site.",
      "Pro or eligible users may download generated code where the product makes that feature available.",
      "Onara retains ownership of the Onara platform, brand, workflows, prompts, infrastructure, product UI, and internal tooling.",
    ],
  },
  {
    title: "AI output and review responsibility",
    body: (
      <p>
        Onara uses AI systems, retrieval, business data, and generation pipelines. AI output can be incomplete,
        inaccurate, repetitive, legally unsuitable, or inconsistent with your exact business operations. You are
        responsible for checking generated content, pricing, claims, service descriptions, contact details, testimonials,
        review references, and compliance-sensitive language before publishing or relying on it.
      </p>
    ),
  },
  {
    title: "Prohibited use",
    bullets: [
      "Do not create misleading, fraudulent, illegal, infringing, hateful, abusive, or deceptive sites.",
      "Do not impersonate another person or business.",
      "Do not upload malicious code, spam, phishing material, or content intended to abuse infrastructure.",
      "Do not scrape, overload, bypass, reverse engineer, or interfere with Onara systems.",
      "Do not use Onara to violate Google, Stripe, Cloudflare, GitHub, Supabase, or other third-party service terms.",
    ],
  },
  {
    title: "Third-party services",
    body: (
      <p>
        Onara depends on third-party services such as Supabase, Stripe, Cloudflare, GitHub, Google, Resend, Vercel, AI
        model providers, and monitoring or infrastructure tools. Their services may have separate terms and availability.
        Onara is not responsible for third-party outages, policy changes, rejected payments, unavailable payment methods,
        API limits, imported data errors, or provider-side failures.
      </p>
    ),
  },
  {
    title: "Suspension and termination",
    bullets: [
      "We may suspend or terminate access if you violate these Terms, fail to pay, abuse the service, create risk for Onara or others, or use the product unlawfully.",
      "Suspended public sites may be replaced by placeholder pages while account records and backups remain retained for a limited period.",
      "You may stop using Onara at any time, but cancellation does not remove charges already incurred or legal obligations already created.",
    ],
  },
  {
    title: "Disclaimers and limits",
    body: (
      <p>
        Onara is provided on an &quot;as is&quot; and &quot;as available&quot; basis. We do not guarantee uninterrupted service, perfect site
        quality, specific search rankings, specific lead volume, uninterrupted public URLs, legal compliance of generated
        copy, or availability of every provider integration. To the maximum extent allowed by law, Onara will not be
        liable for indirect, incidental, special, consequential, punitive, lost-profit, lost-data, lost-business, or
        similar damages.
      </p>
    ),
  },
  {
    title: "Changes and contact",
    body: (
      <p>
        We may update these Terms as the product changes. The updated date on this page shows the latest version. For
        legal questions, email legal@onara.tech. For account or billing support, email support@onara.tech.
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Terms of Service"
      title="The rules for using Onara"
      intro="These terms explain how Onara accounts, generated websites, billing, cancellation, AI output, and hosted public URLs work."
      updated="June 19, 2026"
      sections={sections}
    />
  );
}
