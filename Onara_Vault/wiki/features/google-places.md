# Google Places Integration — Onara

_How the Google Places API (New) is used to fetch business data for site generation._

---

## Overview

The Places API is the preferred data source for site generation. The Next.js build flow calls it to pull available business information: name, address, phone, hours, description, photos, rating, and reviews. Agent 1 (Business Analyst) receives that confirmed business data and turns it into site requirements for the rest of the pipeline. If the business is not listed on Google Maps yet, the user can enter the same core business details manually and continue without a `google_place_id`.

---

## API Version

- **API**: Google Places API (New) — not the legacy Places API
- **Key restriction**: API key restricted to Places API only (`GOOGLE_PLACES_API_KEY`)
- **Target**: FastAPI calls Places API directly (not via Next.js)
- **Billing**: Charged per request to Google; free tier covers ~$200/month

---

## Endpoints Used

### 1. Text Search (Find by Name)

Used when user types a business name in the search form.

**Proxy route**: Next.js `POST /api/places/search` → FastAPI `POST /places/search`

```
POST https://places.googleapis.com/v1/places:searchText
{
  "textQuery": "Joe's Pizza Brooklyn NY",
  "locationBias": { ... }
}
```

The production route applies a default soft `locationBias` around Washington DC and Northern Virginia to match the v1
launch market. This is not a hard restriction: if the query names another city or state, Google can still return that
explicit location.

**Response fields extracted**:
- `places[].id` — the Place ID used for detail fetch
- `places[].displayName.text` — business name
- `places[].formattedAddress` — full address
- `places[].primaryType` — business category (e.g., `restaurant`)
- `places[].rating` — 1–5 star rating

**Returned to browser**: Array of `{ placeId, name, address, category, rating }` for dropdown

### 2. Place Details (Fetch Full Data)

Called by Agent 1 at pipeline start with the confirmed `placeId`.

```
GET https://places.googleapis.com/v1/places/{placeId}
X-Goog-FieldMask: displayName,formattedAddress,nationalPhoneNumber,websiteUri,
                  currentOpeningHours,primaryType,rating,userRatingCount,
                  editorialSummary,photos,reviews,priceLevel
```

**Fields extracted for Blackboard**:

| Field | Blackboard Key | Used By |
|-------|---------------|---------|
| `displayName.text` | `business_name` | All agents |
| `formattedAddress` | `address` | Agents 2, 5, 7 |
| `nationalPhoneNumber` | `phone` | Agents 2, 7 |
| `websiteUri` | `existing_website` | Agent 5 (canonical URL hint) |
| `currentOpeningHours.weekdayDescriptions` | `hours` | Agents 2, 7 |
| `primaryType` | `business_category` | Agents 2, 3, 4, 6 |
| `rating` | `rating` | Agent 7 (social proof) |
| `userRatingCount` | `review_count` | Agent 7 |
| `editorialSummary.text` | `description` | Agent 2 |
| `photos[0..2]` | `photo_refs` | Agent 8 |
| `reviews[0..2]` | `reviews` | Agent 2 (tone analysis) |

---

## Key Restrictions

- `GOOGLE_PLACES_API_KEY` restricted to Places API only in Google Cloud Console
- Key stored in FastAPI `.env` only — never in Next.js (server-side call)
- Rate limit: 600 QPM (queries per minute) per project — well within expected load

---

## Fallback: Manual Business Entry

If the Places text search fails (API error or no results), the UI shows:
- A manual business details form for name, category, service area or address, phone, email,
  website, services, and hours
- User confirms the manually entered profile, then continues to style and generation
- The project is created with `google_place_id = null`, so reviews refresh and GBP-only
  retention jobs skip it until a Place ID is available

This ensures business owners can still generate a site even if search doesn't find them.

---

## GBP Sync (Feature Flag: `FEATURE_GBP_SYNC`)

- **v2.5 feature** — not active in v1
- When enabled: pg_cron polls Google Places every 24h for changes
- Detects changes in hours, phone, address, description
- Triggers notification email if changes found (user can choose to regenerate)
- Env: `FEATURE_GBP_SYNC=false` (default off)

---

## Related Files

- `wiki/architecture/env-vars.md` — `GOOGLE_PLACES_API_KEY` location
- `wiki/features/api.md` — `/api/places/search` route contract
- `wiki/ai_agents/agents.md` — Agent 1 (Business Analyst) details
