from typing import Any

from onara_pipeline.agents.context import BusinessContext, default_services, infer_industry
from onara_pipeline.agents.contracts import AnalystOutput, ContentOutput, StyleOutput


def fallback_analyst(context: BusinessContext, style_preferences: dict[str, Any]) -> AnalystOutput:
    industry = infer_industry(context)
    selected_sections = _selected_sections(style_preferences)
    cta = _cta_text(style_preferences, context)
    rating_signal = (
        f"{context.rating:g} stars from {context.review_count} Google reviews"
        if context.rating and context.review_count
        else "Google Business Profile verified"
    )
    notes = context.notes.lower()

    urgency = []
    if any(term in notes for term in ("emergency", "24/7", "same day", "same-day")):
        urgency.append("Emergency or same-day service mentioned by owner")
    if industry in {"plumber", "hvac", "electrician", "roofer"}:
        urgency.append("Homeowners often need urgent help for this trade")

    return AnalystOutput(
        industryType=industry,
        primaryCta=cta,
        ctaType="phone_call" if context.phone else "contact_form",
        mustHaveSections=_unique(["hero", "services", "contact", *selected_sections]),
        optionalSections=["gallery", "service_area", "faq"],
        trustSignals=_unique([rating_signal, "local service area", "clear phone number"]),
        urgencyTriggers=urgency,
        targetKeyword=_target_keyword(industry, context),
        competitorWeaknesses=[
            "Phone number is not visible enough on mobile",
            "Service area is unclear",
            "Reviews and trust proof are buried too low",
        ],
        toneKeywords=_tone_keywords(style_preferences, industry),
    )


def fallback_content(context: BusinessContext, analyst: AnalystOutput) -> ContentOutput:
    services = context.services or default_services(analyst.industryType)
    service_area = context.service_area
    cta = analyst.primaryCta
    rating_line = (
        f"Built around a {context.rating:g}-star Google rating and {context.review_count} local reviews."
        if context.rating and context.review_count
        else "Built around clear proof, local service details, and fast contact."
    )

    return ContentOutput.model_validate(
        {
            "hero": {
                "headline": f"{_industry_label(analyst.industryType)} help in {service_area}.",
                "subheadline": (
                    f"{context.name} gives homeowners a clear way to get help, compare services, "
                    "and call without digging through a long page."
                ),
                "cta_button": cta,
            },
            "about": {
                "headline": f"Local work from {context.name}.",
                "body": (
                    f"We help customers around {service_area} understand what is needed, what happens next, "
                    "and how to get a straightforward estimate."
                ),
            },
            "services": [
                {
                    "name": service,
                    "description": f"Practical {service.lower()} support with clear next steps and a simple way to call.",
                }
                for service in services[:6]
            ],
            "social_proof": {
                "headline": "Proof homeowners can check quickly.",
                "subtext": rating_line,
            },
            "contact": {
                "headline": "Tell us what is going on.",
                "subtext": "No pressure. Call or request an estimate and get a clear next step.",
            },
            "footer_tagline": f"{context.name} - local help without the runaround.",
        }
    )


def fallback_style(
    context: BusinessContext,
    analyst: AnalystOutput,
    style_preferences: dict[str, Any],
) -> StyleOutput:
    palette = _palette(style_preferences, analyst.industryType)
    tone = str(style_preferences.get("tone") or "professional")
    layout = str(style_preferences.get("layout") or "phone-first")

    return StyleOutput.model_validate(
        {
            "colors": palette,
            "typography": _typography(tone),
            "spacing": {
                "section_padding": "84px 0",
                "container_max": "1120px",
                "border_radius": "10px" if layout == "trust-led" else "6px",
            },
            "style_notes": (
                f"{context.name} should feel {tone}, local, and easy to call. "
                f"Use a {layout.replace('-', ' ')} layout with strong contrast and practical trust proof."
            ),
        }
    )


def _cta_text(style_preferences: dict[str, Any], context: BusinessContext) -> str:
    cta = style_preferences.get("cta")
    if cta == "call-now" and context.phone:
        return "Call Now"
    if cta == "emergency" and context.phone:
        return "Call for Emergency Help"
    if cta == "book-online":
        return "Book Online"
    return "Get a Free Estimate"


def _industry_label(industry: str) -> str:
    labels = {
        "hvac": "HVAC",
        "plumber": "Plumbing",
        "roofer": "Roof repair",
        "electrician": "Electrical",
    }
    return labels.get(industry, industry.replace("-", " ").title())


def _palette(style_preferences: dict[str, Any], industry: str) -> dict[str, str]:
    if style_preferences.get("palette") == "custom":
        custom = style_preferences.get("customPalette")
        if isinstance(custom, dict):
            return {
                "primary": _hex(custom.get("primary"), "#10263a"),
                "secondary": _hex(custom.get("accent"), "#ea5b0c"),
                "background": _hex(custom.get("background"), "#f8f2e8"),
                "surface": "#ffffff",
                "text_primary": _hex(custom.get("text"), "#191919"),
                "text_secondary": "#62615d",
                "border": "#ddd5ca",
            }

    preset = style_preferences.get("palette")
    palettes = {
        "emergency": ("#10263a", "#ea5b0c", "#fff8ef", "#ffffff", "#191919", "#62615d", "#ddd5ca"),
        "trust": ("#1a4f8a", "#047481", "#f5efe4", "#ffffff", "#10263a", "#617080", "#d8d0c4"),
        "clean": ("#191919", "#c76f35", "#f8f2e8", "#ffffff", "#191919", "#6c6a66", "#d8d0c4"),
    }
    industry_palettes = {
        "plumber": ("#1a4f8a", "#f97316", "#f8fbff", "#ffffff", "#10263a", "#5b6b7b", "#d8e3ed"),
        "hvac": ("#1a4f8a", "#f97316", "#f8fbff", "#ffffff", "#10263a", "#5b6b7b", "#d8e3ed"),
        "electrician": ("#0f172a", "#facc15", "#fffbea", "#ffffff", "#111827", "#5b5b4d", "#e4dec8"),
        "landscaper": ("#166534", "#d4a96a", "#fbf7ef", "#ffffff", "#17351f", "#64705f", "#d8cdbb"),
        "cleaner": ("#0ea5e9", "#94a3b8", "#f6fbff", "#ffffff", "#183044", "#637583", "#d8e7ef"),
    }
    values = palettes.get(str(preset)) or industry_palettes.get(industry) or palettes["clean"]
    keys = ("primary", "secondary", "background", "surface", "text_primary", "text_secondary", "border")
    return dict(zip(keys, values, strict=True))


def _typography(tone: str) -> dict[str, str]:
    if tone == "premium":
        return {
            "heading_font": "Cormorant Garamond",
            "body_font": "Manrope",
            "heading_weight": "700",
            "base_size": "16px",
            "scale": "1.28",
        }
    if tone == "direct":
        return {
            "heading_font": "Archivo",
            "body_font": "Source Sans 3",
            "heading_weight": "800",
            "base_size": "16px",
            "scale": "1.22",
        }

    return {
        "heading_font": "Fraunces",
        "body_font": "Work Sans",
        "heading_weight": "700",
        "base_size": "16px",
        "scale": "1.25",
    }


def _selected_sections(style_preferences: dict[str, Any]) -> list[str]:
    sections = style_preferences.get("sections")
    return [item for item in sections if isinstance(item, str)] if isinstance(sections, list) else []


def _target_keyword(industry: str, context: BusinessContext) -> str:
    area = context.service_area
    return f"{industry} in {area}" if area != "your area" else context.category


def _tone_keywords(style_preferences: dict[str, Any], industry: str) -> list[str]:
    tone = str(style_preferences.get("tone") or "professional")
    keywords = [tone, "local", "clear", "trustworthy"]
    if industry in {"plumber", "hvac", "electrician", "roofer"}:
        keywords.append("responsive")
    return _unique(keywords)[:5]


def _hex(value: Any, fallback: str) -> str:
    if isinstance(value, str) and len(value) == 7 and value.startswith("#"):
        return value
    return fallback


def _unique(values: list[str]) -> list[str]:
    seen = set()
    output = []
    for value in values:
        normalized = value.strip()
        key = normalized.lower()
        if normalized and key not in seen:
            seen.add(key)
            output.append(normalized)
    return output
