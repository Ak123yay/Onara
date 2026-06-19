import type { MetadataRoute } from "next";
import { absoluteUrl, getSiteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    host: getSiteUrl(),
    rules: {
      allow: ["/", "/help", "/privacy", "/terms", "/icon.svg", "/opengraph-image", "/twitter-image"],
      disallow: ["/account/", "/api/", "/auth/", "/dashboard/", "/dev/"],
      userAgent: "*",
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
