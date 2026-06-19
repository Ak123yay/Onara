import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Onara - AI Website Builder for Local Contractors",
  description:
    "Turn your Google Business Profile into a professional contractor website in 90 seconds. No designer, no code, no hassle.",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
