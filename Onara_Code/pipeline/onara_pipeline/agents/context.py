from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True, slots=True)
class BusinessPhoto:
    alt: str
    src: str
    source: str = ""
    attribution_display: str = ""
    attribution_uri: str = ""


@dataclass(frozen=True, slots=True)
class BusinessContext:
    address: str
    category: str
    city: str
    hours: list[str]
    name: str
    notes: str
    phone: str
    photos: list[BusinessPhoto]
    rating: float | None
    review_count: int | None
    services: list[str]
    state: str
    website: str

    @property
    def service_area(self) -> str:
        parts = [self.city, self.state]
        value = ", ".join(part for part in parts if part)
        return value or "your area"


def build_business_context(business_data: dict[str, Any], style_preferences: dict[str, Any]) -> BusinessContext:
    address = _string_value(business_data, "address")
    city, state = _city_state_from_address(address)

    return BusinessContext(
        address=address,
        category=_string_value(business_data, "category") or "Local contractor",
        city=city,
        hours=_string_list(business_data.get("hours")),
        name=_string_value(business_data, "name") or "Local Contractor",
        notes=_string_value(style_preferences, "notes"),
        phone=_string_value(business_data, "phone"),
        photos=_photo_assets_from_business(business_data),
        rating=_number_value(business_data.get("rating")),
        review_count=_int_value(business_data.get("review_count")),
        services=_services_from_business(business_data),
        state=state,
        website=_string_value(business_data, "website"),
    )


def infer_industry(context: BusinessContext) -> str:
    text = f"{context.name} {context.category} {' '.join(context.services)}".lower()
    mappings = (
        ("plumb", "plumber"),
        ("hvac", "hvac"),
        ("heating", "hvac"),
        ("air conditioning", "hvac"),
        ("roof", "roofer"),
        ("electric", "electrician"),
        ("landscap", "landscaper"),
        ("lawn", "landscaper"),
        ("clean", "cleaner"),
        ("remodel", "contractor"),
        ("builder", "contractor"),
        ("construction", "contractor"),
        ("paint", "painter"),
        ("floor", "flooring contractor"),
        ("grocery", "grocery"),
        ("supermarket", "grocery"),
        ("pharmacy", "grocery"),
        ("campground", "campground"),
        ("rv park", "campground"),
        ("camping", "campground"),
    )

    for needle, industry in mappings:
        if needle in text:
            return industry

    return "contractor"


def default_services(industry: str) -> list[str]:
    defaults = {
        "plumber": ["Emergency plumbing", "Water heaters", "Drain cleaning", "Leak repair"],
        "hvac": ["AC repair", "Heating service", "Seasonal maintenance", "System replacement"],
        "roofer": ["Roof repair", "Storm damage", "Roof replacement", "Leak inspection"],
        "electrician": ["Panel service", "Outlet repair", "Lighting", "Emergency electrical"],
        "landscaper": ["Lawn care", "Seasonal cleanup", "Mulching", "Landscape maintenance"],
        "cleaner": ["Deep cleaning", "Move-out cleaning", "Recurring service", "Office cleaning"],
        "painter": ["Interior painting", "Exterior painting", "Drywall repair", "Color refresh"],
        "grocery": ["Grocery pickup", "Fresh produce", "Pharmacy", "Weekly essentials"],
        "campground": ["RV sites", "Tent camping", "Full hookups", "Family stays"],
    }

    return defaults.get(
        industry,
        ["Project walkthroughs", "Installation work", "Repair planning", "Estimate requests"],
    )


def service_candidates_for_context(context: BusinessContext, industry: str, *, limit: int = 6) -> list[str]:
    """Return customer-facing services, not category/filler labels."""
    candidates = [
        *_compound_trade_services(context),
        *context.services,
        *default_services(industry),
        context.category,
    ]
    return _unique_strings(
        candidate for candidate in candidates if candidate and not is_generic_service_label(candidate)
    )[:limit]


def is_generic_service_label(value: str) -> bool:
    normalized = " ".join(value.lower().replace("&", "and").split())
    return normalized in {
        "service",
        "services",
        "service calls",
        "local service",
        "local services",
        "home services",
        "contractor",
        "local contractor",
        "repairs",
        "repair",
        "maintenance",
        "free estimates",
        "estimates",
        "plumber",
        "hvac",
        "electrician",
        "roofer",
    }


def photo_assets_for_prompt(context: BusinessContext, *, limit: int = 4) -> list[dict[str, str]]:
    return [
        {
            key: value
            for key, value in {
                "alt": photo.alt,
                "attribution_display": photo.attribution_display,
                "attribution_uri": photo.attribution_uri,
                "source": photo.source,
                "src": photo.src,
            }.items()
            if value
        }
        for photo in context.photos[:limit]
    ]


def _services_from_business(business_data: dict[str, Any]) -> list[str]:
    raw = business_data.get("services")
    values = _string_list(raw)
    if values:
        return values[:8]

    category = _string_value(business_data, "category")
    return [category] if category else []


def _compound_trade_services(context: BusinessContext) -> list[str]:
    text = f"{context.name} {context.category} {' '.join(context.services)}".lower()
    services: list[str] = []
    if "plumb" in text:
        services.append("Plumbing repairs & installations")
    if "heating" in text or "furnace" in text:
        services.append("Heating systems service")
    if "air conditioning" in text or "cooling" in text or "hvac" in text:
        services.append("Air conditioning & cooling")
    if "electric" in text:
        services.append("Electrical repairs")
    return services


def _photo_assets_from_business(business_data: dict[str, Any]) -> list[BusinessPhoto]:
    raw = business_data.get("resolved_photos")
    if not isinstance(raw, list):
        return []

    output: list[BusinessPhoto] = []
    business_name = _string_value(business_data, "name") or "the business"
    for item in raw:
        if not isinstance(item, dict):
            continue
        src = _string_value(item, "src")
        if not src.startswith(("https://", "data:image/")):
            continue
        output.append(
            BusinessPhoto(
                alt=_string_value(item, "alt") or f"Business photo for {business_name}",
                attribution_display=_string_value(item, "attribution_display"),
                attribution_uri=_string_value(item, "attribution_uri"),
                source=_string_value(item, "source"),
                src=src,
            )
        )
        if len(output) >= 6:
            break

    return output


def _string_value(data: dict[str, Any], key: str) -> str:
    value = data.get(key)
    return value.strip() if isinstance(value, str) else ""


def _string_list(value: Any) -> list[str]:
    if not isinstance(value, list):
        return []

    return [item.strip() for item in value if isinstance(item, str) and item.strip()]


def _unique_strings(values) -> list[str]:
    seen = set()
    output: list[str] = []
    for value in values:
        normalized = str(value).strip()
        key = normalized.lower()
        if normalized and key not in seen:
            seen.add(key)
            output.append(normalized)
    return output


def _number_value(value: Any) -> float | None:
    if isinstance(value, bool):
        return None
    if isinstance(value, int | float):
        return float(value)
    return None


def _int_value(value: Any) -> int | None:
    if isinstance(value, bool):
        return None
    if isinstance(value, int):
        return value
    if isinstance(value, float):
        return int(value)
    return None


def _city_state_from_address(address: str) -> tuple[str, str]:
    parts = [part.strip() for part in address.split(",") if part.strip()]
    city = parts[-2] if len(parts) >= 2 else ""
    state = ""

    if parts:
        last = parts[-1].split()
        if last:
            state = last[0]

    return city, state
