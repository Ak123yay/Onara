import type { Metadata } from "next";
import { Suspense } from "react";
import { NavigationFeedback } from "@/components/system/NavigationFeedback";
import { absoluteUrl, getSiteUrl, siteConfig } from "@/lib/seo";
import "./globals.css";

export const metadata: Metadata = {
  applicationName: siteConfig.name,
  authors: [{ name: "Onara", url: getSiteUrl() }],
  category: "technology",
  creator: "Onara",
  description: siteConfig.description,
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
  keywords: [
    "AI website builder",
    "website builder for contractors",
    "contractor website builder",
    "AI website builder for contractors",
    "local business website builder",
    "Google Business Profile website",
    "plumber website builder",
    "HVAC website builder",
    "roofer website builder",
  ],
  metadataBase: new URL(getSiteUrl()),
  openGraph: {
    description: siteConfig.description,
    images: [
      {
        alt: siteConfig.ogImageAlt,
        height: 630,
        url: absoluteUrl("/opengraph-image"),
        width: 1200,
      },
    ],
    locale: "en_US",
    siteName: siteConfig.name,
    title: siteConfig.title,
    type: "website",
    url: getSiteUrl(),
  },
  publisher: "Onara",
  robots: {
    follow: true,
    googleBot: {
      follow: true,
      index: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
    index: true,
  },
  title: {
    default: siteConfig.title,
    template: "%s - Onara",
  },
  twitter: {
    card: "summary_large_image",
    description: siteConfig.description,
    images: [absoluteUrl("/twitter-image")],
    title: siteConfig.title,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Suspense fallback={null}>
          <NavigationFeedback />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
