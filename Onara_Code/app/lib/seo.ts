export const siteConfig = {
  description:
    "Turn your Google Business Profile into a professional contractor website in 90 seconds. No designer, no code, no hassle. Free 14-day trial.",
  name: "Onara",
  ogImageAlt: "Onara - AI website builder",
  title: "Onara - AI Website Builder for Local Contractors",
};

export function getSiteUrl() {
  const rawUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL ||
    "https://onara.tech";

  const withProtocol = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
  return withProtocol.replace(/\/+$/, "");
}

export function absoluteUrl(path = "/") {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getSiteUrl()}${normalizedPath}`;
}
