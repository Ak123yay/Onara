import { NextResponse } from "next/server";
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
    return NextResponse.json({ error: "missing_google_places_api_key" }, { status: 500 });
  }

  const width = boundedInt(searchParams.get("w"), 1, 4800, 1000);
  const height = boundedInt(searchParams.get("h"), 1, 4800, 560);
  const googleUrl = new URL(`https://places.googleapis.com/v1/${photoName}/media`);

  googleUrl.searchParams.set("maxWidthPx", String(width));
  googleUrl.searchParams.set("maxHeightPx", String(height));
  googleUrl.searchParams.set("skipHttpRedirect", "true");
  googleUrl.searchParams.set("key", apiKey);

  const googleResponse = await fetch(googleUrl, { cache: "no-store" });
  const payload = (await googleResponse.json()) as GooglePhotoResponse;

  if (!googleResponse.ok || !payload.photoUri) {
    return NextResponse.json(
      {
        error: "place_photo_failed",
        message: payload.error?.message ?? "Google Places photo lookup failed",
        status: payload.error?.status,
      },
      { status: googleResponse.ok ? 502 : googleResponse.status },
    );
  }

  const response = NextResponse.redirect(payload.photoUri, 302);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

function boundedInt(value: string | null, min: number, max: number, fallback: number) {
  const parsed = Number.parseInt(value ?? "", 10);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, parsed));
}
