import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/seo";

export const alt = siteConfig.ogImageAlt;
export const contentType = "image/png";
export const size = {
  height: 630,
  width: 1200,
};

export default function OpenGraphImage() {
  return new ImageResponse(
      <div
        style={{
          alignItems: "stretch",
          background: "#fbf8f1",
          color: "#1a1a1a",
          display: "flex",
          fontFamily: "Georgia, serif",
          height: "100%",
          padding: 52,
          width: "100%",
        }}
      >
        <div
          style={{
            border: "1px solid #d8d6cf",
            display: "flex",
            flexDirection: "column",
            height: "100%",
            justifyContent: "space-between",
            padding: 54,
            width: "100%",
          }}
        >
          <div style={{ alignItems: "center", display: "flex", gap: 18 }}>
            <div
              style={{
                alignItems: "center",
                border: "4px solid #1a1a1a",
                borderRadius: 999,
                display: "flex",
                height: 52,
                justifyContent: "center",
                width: 52,
              }}
            >
              <div style={{ background: "#ca7134", borderRadius: 999, height: 22, width: 22 }} />
            </div>
            <div style={{ fontSize: 32, fontWeight: 700 }}>Onara</div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 850 }}>
            <div
              style={{
                color: "#8a5a36",
                fontFamily: "monospace",
                fontSize: 22,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
              }}
            >
              AI websites for local contractors
            </div>
            <div style={{ fontSize: 84, letterSpacing: "-0.06em", lineHeight: 0.98 }}>
              Your contracting business deserves a website.
            </div>
            <div style={{ color: "#4a4a44", fontFamily: "Arial, sans-serif", fontSize: 28, lineHeight: 1.45 }}>
              Onara turns your Google Business Profile into a professional website in 90 seconds.
            </div>
          </div>

          <div style={{ color: "#6a6a6a", display: "flex", fontFamily: "monospace", fontSize: 20, gap: 28 }}>
            <span>Google import</span>
            <span>SEO-ready</span>
            <span>Live URL</span>
            <span>No code</span>
          </div>
        </div>
      </div>,
    size,
  );
}
