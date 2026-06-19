import re
from typing import Any

import httpx

from onara_pipeline.config import Settings

PHOTO_NAME_PATTERN = re.compile(r"^places/[^/?#]+/photos/[^/?#]+$")


async def enrich_business_photos(
    business_data: dict[str, Any],
    settings: Settings,
    *,
    limit: int = 4,
) -> dict[str, Any]:
    """Resolve deploy-safe image URLs before the generation agents run."""
    enriched = dict(business_data)
    existing = _valid_photo_assets(enriched.get("resolved_photos"))
    if existing:
        enriched["resolved_photos"] = existing[:limit]
        enriched["photo_resolution_status"] = "already_resolved"
        return enriched

    assets = _manual_photo_assets(enriched)
    google_assets = await _google_photo_assets(enriched, settings, limit=max(0, limit - len(assets)))
    assets.extend(google_assets)

    if assets:
        enriched["resolved_photos"] = assets[:limit]
        enriched["photo_resolution_status"] = "resolved"
    elif _has_google_photo_refs(enriched) and not settings.google_places_api_key:
        enriched["resolved_photos"] = []
        enriched["photo_resolution_status"] = "skipped_missing_google_places_api_key"
    else:
        enriched["resolved_photos"] = []
        enriched["photo_resolution_status"] = "none"

    return enriched


def prompt_photo_assets(business_data: dict[str, Any], *, limit: int = 4) -> list[dict[str, str]]:
    return _valid_photo_assets(business_data.get("resolved_photos"))[:limit]


def _manual_photo_assets(business_data: dict[str, Any]) -> list[dict[str, str]]:
    manual = business_data.get("manual_photo")
    if not isinstance(manual, dict):
        return []

    src = _string_value(manual, "preview_url")
    if not src.startswith("data:image/"):
        return []

    business_name = _string_value(business_data, "name") or "the business"
    return [
        {
            "alt": f"Uploaded photo for {business_name}",
            "source": "manual_upload",
            "src": src,
        }
    ]


async def _google_photo_assets(
    business_data: dict[str, Any],
    settings: Settings,
    *,
    limit: int,
) -> list[dict[str, str]]:
    if limit <= 0 or not settings.google_places_api_key:
        return []

    photos = business_data.get("photos")

    output: list[dict[str, str]] = []
    async with httpx.AsyncClient(timeout=min(settings.ai_request_timeout, 20.0)) as client:
        if not isinstance(photos, list) or not photos:
            photos = await _fetch_place_photos(client, business_data, settings.google_places_api_key)

        for photo in photos:
            if len(output) >= limit:
                break
            if not isinstance(photo, dict):
                continue

            photo_name = _string_value(photo, "name")
            if not PHOTO_NAME_PATTERN.match(photo_name):
                direct_url = _first_string(photo, ("src", "url", "photo_url", "photoUrl", "photoUri", "uri"))
                if direct_url.startswith(("https://", "data:image/")):
                    output.append(_photo_asset_from_values(business_data, photo, direct_url, source="direct"))
                continue

            resolved_url = await _resolve_google_photo(client, photo_name, settings.google_places_api_key)
            if resolved_url:
                output.append(_photo_asset_from_values(business_data, photo, resolved_url, source="google_places"))

    return output


async def _fetch_place_photos(
    client: httpx.AsyncClient,
    business_data: dict[str, Any],
    api_key: str,
) -> list[dict[str, Any]]:
    place_id = _string_value(business_data, "place_id")
    if not place_id:
        return []

    resource_name = place_id if place_id.startswith("places/") else f"places/{place_id}"
    try:
        response = await client.get(
            f"https://places.googleapis.com/v1/{resource_name}",
            headers={
                "X-Goog-Api-Key": api_key,
                "X-Goog-FieldMask": "photos.name,photos.authorAttributions.displayName,photos.authorAttributions.uri",
            },
        )
        response.raise_for_status()
        payload = response.json()
    except (httpx.HTTPError, ValueError):
        return []

    photos = payload.get("photos") if isinstance(payload, dict) else None
    if not isinstance(photos, list):
        return []

    return [photo for photo in photos if isinstance(photo, dict)]


async def _resolve_google_photo(client: httpx.AsyncClient, photo_name: str, api_key: str) -> str:
    url = f"https://places.googleapis.com/v1/{photo_name}/media"
    try:
        response = await client.get(
            url,
            params={
                "key": api_key,
                "maxHeightPx": "1100",
                "maxWidthPx": "1600",
                "skipHttpRedirect": "true",
            },
        )
        response.raise_for_status()
        payload = response.json()
    except (httpx.HTTPError, ValueError):
        return ""

    photo_uri = payload.get("photoUri") if isinstance(payload, dict) else None
    return photo_uri if isinstance(photo_uri, str) and photo_uri.startswith("https://") else ""


def _photo_asset_from_values(
    business_data: dict[str, Any],
    photo: dict[str, Any],
    src: str,
    *,
    source: str,
) -> dict[str, str]:
    business_name = _string_value(business_data, "name") or "the business"
    attribution = photo.get("attribution")
    attribution_display = ""
    attribution_uri = ""
    if isinstance(attribution, dict):
        attribution_display = _string_value(attribution, "displayName")
        attribution_uri = _string_value(attribution, "uri")

    asset = {
        "alt": _string_value(photo, "alt") or f"Business photo for {business_name}",
        "source": source,
        "src": src,
    }
    if attribution_display:
        asset["attribution_display"] = attribution_display
    if attribution_uri:
        asset["attribution_uri"] = attribution_uri

    return asset


def _valid_photo_assets(value: Any) -> list[dict[str, str]]:
    if not isinstance(value, list):
        return []

    output: list[dict[str, str]] = []
    for item in value:
        if not isinstance(item, dict):
            continue
        src = _first_string(item, ("src", "url", "photo_url", "photoUrl"))
        if not src.startswith(("https://", "data:image/")):
            continue
        output.append(
            {
                key: text
                for key in ("alt", "attribution_display", "attribution_uri", "source", "src")
                if (text := _string_value(item, key))
            }
        )
    return output


def _has_google_photo_refs(business_data: dict[str, Any]) -> bool:
    photos = business_data.get("photos")
    return isinstance(photos, list) and any(
        isinstance(photo, dict) and PHOTO_NAME_PATTERN.match(_string_value(photo, "name"))
        for photo in photos
    )


def _first_string(data: dict[str, Any], keys: tuple[str, ...]) -> str:
    for key in keys:
        value = _string_value(data, key)
        if value:
            return value
    return ""


def _string_value(data: dict[str, Any], key: str) -> str:
    value = data.get(key)
    return value.strip() if isinstance(value, str) else ""
