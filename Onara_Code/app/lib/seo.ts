export const siteConfig = {
  description:
    "Onara is an AI website builder for contractors. Turn your Google Business Profile into a professional, mobile-ready website in about 90 seconds.",
  name: "Onara",
  ogImageAlt: "Onara website builder for contractors",
  title: "Website Builder for Contractors | Onara",
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
