from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True, slots=True)
class BusinessContext:
    address: str
    category: str
    city: str
    hours: list[str]
    name: str
    notes: str
    phone: str
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
    }

    return defaults.get(industry, ["Service calls", "Repairs", "Maintenance", "Free estimates"])


def _services_from_business(business_data: dict[str, Any]) -> list[str]:
    raw = business_data.get("services")
    values = _string_list(raw)
    if values:
        return values[:8]

    category = _string_value(business_data, "category")
    return [category] if category else []


def _string_value(data: dict[str, Any], key: str) -> str:
    value = data.get(key)
    return value.strip() if isinstance(value, str) else ""


def _string_list(value: Any) -> list[str]:
    if not isinstance(value, list):
        return []

    return [item.strip() for item in value if isinstance(item, str) and item.strip()]


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
