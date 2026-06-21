import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/LandingPage";
import { absoluteUrl, getSiteUrl, siteConfig } from "@/lib/seo";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
  description: siteConfig.description,
  keywords: [
    "website builder for contractors",
    "contractor website builder",
    "AI website builder for contractors",
    "plumber website builder",
    "HVAC website builder",
    "roofer website builder",
  ],
  openGraph: {
    description: siteConfig.description,
    title: siteConfig.title,
    url: "/",
  },
  title: {
    absolute: siteConfig.title,
  },
  twitter: {
    description: siteConfig.description,
    title: siteConfig.title,
  },
};

export default function HomePage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@id": `${getSiteUrl()}/#organization`,
        "@type": "Organization",
        logo: {
          "@type": "ImageObject",
          url: absoluteUrl("/onara-icon.png"),
        },
        name: "Onara",
        url: getSiteUrl(),
      },
      {
        "@id": `${getSiteUrl()}/#website`,
        "@type": "WebSite",
        description: siteConfig.description,
        name: "Onara",
        publisher: {
          "@id": `${getSiteUrl()}/#organization`,
        },
        url: getSiteUrl(),
      },
      {
        "@id": `${getSiteUrl()}/#software`,
        "@type": "SoftwareApplication",
        applicationCategory: "BusinessApplication",
        audience: {
          "@type": "BusinessAudience",
          audienceType: "Local contractors and home service businesses",
        },
        description: siteConfig.description,
        featureList: [
          "Google Business Profile import",
          "AI-generated contractor website",
          "Mobile-first contractor design",
          "Local SEO structure",
          "Lead contact form",
          "Website revisions from the Onara dashboard",
        ],
        name: "Onara",
        offers: {
          "@type": "Offer",
          availability: "https://schema.org/InStock",
          category: "14-day free trial",
          price: "0",
          priceCurrency: "USD",
          url: absoluteUrl("/auth/signup"),
        },
        operatingSystem: "Web",
        provider: {
          "@id": `${getSiteUrl()}/#organization`,
        },
        url: getSiteUrl(),
      },
    ],
  };

  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replaceAll("<", "\\u003c"),
        }}
        type="application/ld+json"
      />
      <LandingPage />
    </>
  );
}
