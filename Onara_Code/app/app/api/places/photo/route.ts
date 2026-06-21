import { NextResponse } from "next/server";
import { fetchWithTimeout } from "@/lib/resilience";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type GooglePhotoResponse = {
  photoUri?: string;
  error?: {
    message?: string;
    status?: string;
  };
};

const PHOTO_NAME_PATTERN = /^places\/[^/?#]+\/photos\/[^/?#]+$/;

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const photoName = searchParams.get("name")?.trim() ?? "";

  if (!PHOTO_NAME_PATTERN.test(photoName)) {
    return NextResponse.json({ error: "invalid_photo_name" }, { status: 422 });
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return photoPlaceholder();
  }

  const width = boundedInt(searchParams.get("w"), 1, 4800, 1000);
  const height = boundedInt(searchParams.get("h"), 1, 4800, 560);
  const googleUrl = new URL(`https://places.googleapis.com/v1/${photoName}/media`);

  googleUrl.searchParams.set("maxWidthPx", String(width));
  googleUrl.searchParams.set("maxHeightPx", String(height));
  googleUrl.searchParams.set("skipHttpRedirect", "true");
  googleUrl.searchParams.set("key", apiKey);

  let googleResponse: Response;
  try {
    googleResponse = await fetchWithTimeout(googleUrl, { cache: "no-store" }, 8_000);
  } catch {
    return photoPlaceholder();
  }
  const payload = (await googleResponse.json().catch(() => ({}))) as GooglePhotoResponse;

  if (!googleResponse.ok || !payload.photoUri) {
    return photoPlaceholder();
  }

  const response = NextResponse.redirect(payload.photoUri, 302);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

function photoPlaceholder() {
  return new Response(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="560" viewBox="0 0 1000 560" role="img" aria-label="Business photo unavailable">
      <rect width="1000" height="560" fill="#f3efe8"/>
      <path d="M0 560 1000 0M180 560 1000 100M0 420 820 0" stroke="#e4ddd2" stroke-width="2"/>
      <circle cx="500" cy="250" r="42" fill="#c96f38"/>
      <text x="500" y="330" text-anchor="middle" fill="#4f4a43" font-family="Arial, sans-serif" font-size="24">Business photo unavailable</text>
    </svg>`,
    {
      headers: {
        "Cache-Control": "public, max-age=300",
        "Content-Type": "image/svg+xml; charset=utf-8",
        "X-Onara-Degraded": "google_places_photo",
      },
      status: 200,
    },
  );
}

function boundedInt(value: string | null, min: number, max: number, fallback: number) {
  const parsed = Number.parseInt(value ?? "", 10);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, parsed));
}
