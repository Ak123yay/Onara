import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/seo";

export default function manifest(): MetadataRoute.Manifest {
  return {
    background_color: "#fbf8f1",
    description: siteConfig.description,
    display: "standalone",
    icons: [
      {
        sizes: "any",
        src: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    name: siteConfig.title,
    short_name: siteConfig.name,
    start_url: "/",
    theme_color: "#ca7134",
  };
}
