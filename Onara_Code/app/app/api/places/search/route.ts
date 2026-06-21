import { NextResponse } from "next/server";
import {
  fetchWithTimeout,
  publicServiceError,
  serviceDegradation,
} from "@/lib/resilience";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type SearchRequest = {
  query?: unknown;
  locationBias?: unknown;
};

type GoogleTextSearchResponse = {
  places?: GooglePlace[];
  error?: {
    message?: string;
    status?: string;
  };
};

type GooglePlace = {
  id?: string;
  displayName?: {
    text?: string;
  };
  formattedAddress?: string;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  primaryType?: string;
  primaryTypeDisplayName?: {
    text?: string;
  };
  rating?: number;
  userRatingCount?: number;
  websiteUri?: string;
  currentOpeningHours?: {
    weekdayDescriptions?: string[];
  };
  photos?: Array<{
    name?: string;
    authorAttributions?: Array<{
      displayName?: string;
      uri?: string;
    }>;
  }>;
};

const GOOGLE_TEXT_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText";
const DEFAULT_DC_NOVA_LOCATION_BIAS = {
  rectangle: {
    low: {
      latitude: 38.55,
      longitude: -77.75,
    },
    high: {
      latitude: 39.1,
      longitude: -76.85,
    },
  },
};
const FIELD_MASK = [
  "places.id",
  "places.displayName.text",
  "places.formattedAddress",
  "places.nationalPhoneNumber",
  "places.internationalPhoneNumber",
  "places.primaryType",
  "places.primaryTypeDisplayName.text",
  "places.rating",
  "places.userRatingCount",
  "places.websiteUri",
  "places.currentOpeningHours.weekdayDescriptions",
  "places.photos.name",
  "places.photos.authorAttributions.displayName",
  "places.photos.authorAttributions.uri",
].join(",");

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: SearchRequest;
  try {
    body = (await request.json()) as SearchRequest;
  } catch {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const query = typeof body.query === "string" ? body.query.trim() : "";
  if (query.length < 2 || query.length > 200) {
    return NextResponse.json(
      { error: "validation_error", message: "query must be between 2 and 200 characters" },
      { status: 422 },
    );
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return degradedPlacesResponse();
  }

  const googleRequestBody: Record<string, unknown> = {
    textQuery: query,
    languageCode: "en",
    regionCode: "US",
    // Soft launch-market bias. Explicit locations in the query can still win.
    locationBias: DEFAULT_DC_NOVA_LOCATION_BIAS,
    pageSize: 5,
  };

  if (isPlainObject(body.locationBias)) {
    googleRequestBody.locationBias = body.locationBias;
  }

  let googleResponse: Response;
  try {
    googleResponse = await fetchWithTimeout(
      GOOGLE_TEXT_SEARCH_URL,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": FIELD_MASK,
        },
        body: JSON.stringify(googleRequestBody),
        cache: "no-store",
      },
      8_000,
    );
  } catch {
    return degradedPlacesResponse();
  }

  const payload = (await googleResponse.json().catch(() => ({}))) as GoogleTextSearchResponse;
  if (!googleResponse.ok) {
    return degradedPlacesResponse(payload.error?.status);
  }

  const results = (payload.places ?? []).map((place, index) => ({
    place_id: place.id ?? "",
    name: place.displayName?.text ?? "",
    address: place.formattedAddress ?? null,
    phone: place.nationalPhoneNumber ?? place.internationalPhoneNumber ?? null,
    rating: place.rating ?? null,
    review_count: place.userRatingCount ?? null,
    category: place.primaryTypeDisplayName?.text ?? formatPlaceType(place.primaryType),
    website: place.websiteUri ?? null,
    hours: place.currentOpeningHours?.weekdayDescriptions ?? null,
    photos: (place.photos ?? [])
      .filter((photo) => Boolean(photo.name))
      .map((photo) => ({
        name: photo.name as string,
        attribution: photo.authorAttributions?.[0]
          ? {
              displayName: photo.authorAttributions[0].displayName,
              uri: photo.authorAttributions[0].uri,
            }
          : undefined,
      })),
    confidence: confidenceForResult(index, place),
  }));

  return NextResponse.json({ results });
}

function degradedPlacesResponse(providerStatus?: string) {
  const message = publicServiceError("google_places");
  return NextResponse.json({
    degraded: serviceDegradation("google_places", message),
    manualEntryAvailable: true,
    providerStatus,
    results: [],
  });
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function formatPlaceType(type?: string): string | null {
  if (!type) {
    return null;
  }

  return type
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function confidenceForResult(index: number, place: GooglePlace): number {
  const base = Math.max(0.55, 0.95 - index * 0.08);
  const hasAddress = place.formattedAddress ? 0.02 : 0;
  const hasPhone = place.nationalPhoneNumber || place.internationalPhoneNumber ? 0.02 : 0;
  const hasRating = typeof place.rating === "number" ? 0.01 : 0;

  return Number(Math.min(0.99, base + hasAddress + hasPhone + hasRating).toFixed(2));
}
