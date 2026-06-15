from typing import Any


PALETTE_LABELS = {
    "emergency": "Emergency orange",
    "trust": "Trust blue",
    "clean": "Clean local",
    "custom": "Custom",
}

LAYOUT_LABELS = {
    "phone-first": "Phone-first",
    "trust-led": "Trust-led",
    "service-grid": "Service grid",
    "split-hero": "Split hero",
}

TONE_LABELS = {
    "direct": "Direct",
    "professional": "Professional",
    "friendly": "Friendly",
    "premium": "Premium",
}

CTA_LABELS = {
    "call-now": "Call now",
    "free-estimate": "Free estimate",
    "emergency": "Emergency help",
    "book-online": "Book online",
}

SECTION_LABELS = {
    "reviews": "Google reviews",
    "license": "License proof",
    "service-area": "Service area",
    "gallery": "Photo gallery",
    "faq": "FAQ block",
    "financing": "Financing",
}

SECTION_COMPONENT_IDS = {
    "reviews": "reviews",
    "license": "license_proof",
    "service-area": "service_area",
    "gallery": "gallery",
    "faq": "faq",
    "financing": "financing",
}


def normalized_style_preferences(style_preferences: dict[str, Any] | None) -> dict[str, Any]:
    preferences = style_preferences if isinstance(style_preferences, dict) else {}
    palette = _choice(preferences.get("palette"), PALETTE_LABELS, "emergency")
    layout = _choice(preferences.get("layout"), LAYOUT_LABELS, "phone-first")
    tone = _choice(preferences.get("tone"), TONE_LABELS, "professional")
    cta = _choice(preferences.get("cta"), CTA_LABELS, "free-estimate")
    sections = [
        section
        for section in preferences.get("sections", [])
        if isinstance(section, str) and section in SECTION_LABELS
    ] if isinstance(preferences.get("sections"), list) else []

    return {
        "cta": cta,
        "customPalette": preferences.get("customPalette") if isinstance(preferences.get("customPalette"), dict) else {},
        "layout": layout,
        "notes": str(preferences.get("notes") or ""),
        "palette": palette,
        "sections": sections,
        "tone": tone,
    }


def style_directive_text(style_preferences: dict[str, Any] | None) -> str:
    preferences = normalized_style_preferences(style_preferences)
    sections = preferences["sections"]
    selected_sections = ", ".join(SECTION_LABELS[section] for section in sections) or "None selected"
    required_components = ", ".join(required_component_ids_for_preferences(preferences)) or "none"

    return f"""User-selected style directives:
- Palette: {PALETTE_LABELS[preferences["palette"]]} ({preferences["palette"]}). {palette_directive(preferences)}
- Layout: {LAYOUT_LABELS[preferences["layout"]]} ({preferences["layout"]}). {layout_directive(preferences)}
- Tone: {TONE_LABELS[preferences["tone"]]} ({preferences["tone"]}). {tone_directive(preferences)}
- Conversion goal: {CTA_LABELS[preferences["cta"]]} ({preferences["cta"]}). {cta_directive(preferences)}
- Include on page: {selected_sections}. Required component IDs for selected sections: {required_components}.
- Additional owner notes: {preferences["notes"] or "None"}.
These directives are not suggestions. The generated site must visibly change when these values change."""


def palette_directive(preferences: dict[str, Any]) -> str:
    palette = str(preferences.get("palette") or "emergency")
    if palette == "trust":
        return "Use cream paper, blue-green proof accents, quieter CTAs, license/review proof, and confidence-first contrast."
    if palette == "clean":
        return "Use charcoal ink, sand paper, copper accents, practical maintenance framing, and calm planned-work spacing."
    if palette == "custom":
        return "Use the custom palette values exactly for primary, accent, background, and text while keeping Onara typography."
    return "Use navy/ink contrast, urgent orange CTAs, an emergency/action strip, and high-contrast phone-first surfaces."


def layout_directive(preferences: dict[str, Any]) -> str:
    layout = str(preferences.get("layout") or "phone-first")
    if layout == "trust-led":
        return "Lead with license, review, and service-area proof before the primary CTA; trust cards must be above the fold."
    if layout == "service-grid":
        return "Make the service menu/grid a dominant first-fold surface; services should not be buried below generic copy."
    if layout == "split-hero":
        return "Use a large visual/photo area beside services, proof, and CTA; the right side should feel like a composed panel stack."
    return "Prioritize phone visibility, tap-to-call, emergency strip, service cards, then trust proof."


def tone_directive(preferences: dict[str, Any]) -> str:
    tone = str(preferences.get("tone") or "professional")
    if tone == "direct":
        return "Use short sentences, direct claims, urgent verbs, and minimal warm-up copy."
    if tone == "friendly":
        return "Use warmer local phrasing, helpful explanations, and less aggressive urgency."
    if tone == "premium":
        return "Use refined, restrained copy for higher-ticket work; fewer exclamation-style urgency cues."
    return "Use proof-led, polished copy without generic filler or hype."


def cta_directive(preferences: dict[str, Any]) -> str:
    cta = str(preferences.get("cta") or "free-estimate")
    if cta == "call-now":
        return "Use tap-to-call language and keep the phone number visible in the header, hero, and final CTA."
    if cta == "emergency":
        return "Use emergency/same-day language, urgent action strips, and fast-response CTAs."
    if cta == "book-online":
        return "Use appointment/booking language and make the primary CTA read like a booking action."
    return "Use estimate language for homeowners comparing options and repeat estimate CTAs."


def required_component_ids_for_preferences(style_preferences: dict[str, Any] | None) -> list[str]:
    preferences = normalized_style_preferences(style_preferences)
    return [
        SECTION_COMPONENT_IDS[section]
        for section in preferences["sections"]
        if section in SECTION_COMPONENT_IDS
    ]


def _choice(value: Any, choices: dict[str, str], default: str) -> str:
    return value if isinstance(value, str) and value in choices else default
