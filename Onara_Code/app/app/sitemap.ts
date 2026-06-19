import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

const publicRoutes = [
  {
    changeFrequency: "weekly",
    path: "/",
    priority: 1,
  },
  {
    changeFrequency: "monthly",
    path: "/help",
    priority: 0.72,
  },
  {
    changeFrequency: "yearly",
    path: "/privacy",
    priority: 0.35,
  },
  {
    changeFrequency: "yearly",
    path: "/terms",
    priority: 0.35,
  },
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return publicRoutes.map((route) => ({
    changeFrequency: route.changeFrequency,
    lastModified,
    priority: route.priority,
    url: absoluteUrl(route.path),
  }));
}
