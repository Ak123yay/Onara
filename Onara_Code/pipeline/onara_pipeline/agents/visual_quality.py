import re

from onara_pipeline.agents.onara_theme import ONARA_REQUIRED_VARIABLES


def professional_visual_issues(html: str) -> list[str]:
    """Detect low-effort generated pages before they reach deployment."""
    lower = html.lower()
    issues: list[str] = []

    hero_rule = _css_rule(lower, ".hero")
    centered_hero = "text-align: center" in hero_rule and "display: grid" not in hero_rule
    if centered_hero:
        issues.append("Hero uses a centered brochure layout instead of a designed conversion composition")

    if "grid-template-columns" not in lower or not any(token in lower for token in ("minmax(", "repeat(")):
        issues.append("Page lacks a deliberate multi-column desktop layout")

    if "clamp(" not in lower:
        issues.append("Page lacks fluid display typography or responsive spacing")

    atmosphere_tokens = (
        "radial-gradient",
        "linear-gradient",
        "repeating-linear-gradient",
        "color-mix(",
        "clip-path",
        "aspect-ratio",
        "background-image",
    )
    if not any(token in lower for token in atmosphere_tokens):
        issues.append("Page lacks professional visual atmosphere such as gradients, texture, image framing, or shaped panels")

    center_count = lower.count("text-align: center")
    if center_count >= 5 and "display: grid" not in hero_rule:
        issues.append("Page is too center-aligned and reads like a generic template")

    proof_panel_tokens = (
        "hero-card",
        "trust-list",
        "review-proof",
        "proof-card",
        "contact-card",
        "service-card",
    )
    if sum(1 for token in proof_panel_tokens if token in lower) < 3:
        issues.append("Page lacks enough structured proof, service, and contact panels")

    issues.extend(composition_depth_issues(html))
    issues.extend(onara_theme_issues(html))

    return _unique(issues)


def has_professional_visual_system(html: str) -> bool:
    return not professional_visual_issues(html)


def composition_depth_issues(html: str) -> list[str]:
    """Require the Onara page to feel composed, not just styled."""
    lower = html.lower()
    issues: list[str] = []

    depth_tokens = (
        "accent-bar",
        "browser-frame",
        "card-stack",
        "contact-card",
        "cta-band",
        "detail-card",
        "figcaption",
        "hero-card",
        "hero-photo",
        "hero-proof",
        "hero-side",
        "hours-card",
        "image-stack",
        "local-card",
        "map-card",
        "metric-card",
        "panel-stack",
        "photo-stack",
        "proof-card",
        "proof-grid",
        "proof-strip",
        "review-card",
        "review-proof",
        "service-card",
        "service-menu",
        "side-panel",
        "trust-list",
        "trust-rail",
    )
    depth_score = sum(1 for token in depth_tokens if token in lower)
    if depth_score < 8:
        issues.append(
            "Page lacks Onara composition depth: add layered proof, service, photo, contact, and detail panels"
        )

    first_fold_match = re.search(r"<section\b[^>]*class=[\"'][^\"']*\bhero\b.*?</section>", html, flags=re.IGNORECASE | re.DOTALL)
    first_fold = first_fold_match.group(0).lower() if first_fold_match else lower[:6500]
    hero_depth_tokens = (
        "hero-side",
        "hero-card",
        "hero-photo",
        "proof-strip",
        "proof-grid",
        "service-menu",
        "detail-card",
        "local-card",
        "hours-card",
        "panel-stack",
        "metric-card",
    )
    hero_depth_score = sum(1 for token in hero_depth_tokens if token in first_fold)
    if hero_depth_score < 4:
        issues.append(
            "Hero fold is too sparse; it needs a side panel plus proof/service/detail cards above the fold"
        )

    if lower.count("<section") < 4:
        issues.append("Page needs at least four real sections after header for a complete local-business site")

    if "data-component=\"hero\"" in lower and "data-component=\"services\"" in lower:
        hero_start = lower.find("data-component=\"hero\"")
        services_start = lower.find("data-component=\"services\"")
        hero_markup = lower[hero_start:services_start] if services_start > hero_start else ""
        if hero_markup and hero_markup.count("<a ") < 1:
            issues.append("Hero is missing a clear conversion CTA")

    return _unique(issues)


def onara_theme_issues(html: str) -> list[str]:
    lower = html.lower()
    issues: list[str] = []

    missing_vars = [variable for variable in ONARA_REQUIRED_VARIABLES if variable not in lower]
    if missing_vars:
        issues.append(f"Page is missing required Onara theme variables: {', '.join(missing_vars[:4])}")

    serif_markers = ("fraunces", "var(--serif)")
    ui_markers = ("inter", "var(--ui)")
    mono_markers = ("jetbrains mono", "var(--mono)", "font-family: var(--mono)")
    if not any(marker in lower for marker in serif_markers):
        issues.append("Page does not use Onara serif display typography")
    if not any(marker in lower for marker in ui_markers):
        issues.append("Page does not use Onara UI body typography")
    if not any(marker in lower for marker in mono_markers):
        issues.append("Page does not use Onara mono eyebrow/metadata typography")

    if not any(token in lower for token in ("--accent", "#c76f35", "#a95724", "terracotta")):
        issues.append("Page does not define an Onara action accent")

    paper_tokens = ("--paper", "radial-gradient", "repeating-linear-gradient", "background-image")
    if sum(1 for token in paper_tokens if token in lower) < 2:
        issues.append("Page does not include the Onara warm paper texture treatment")

    if "border-radius: 999" in lower or "border-radius: 9999" in lower:
        issues.append("Page overuses oversized pill radii instead of Onara low-radius surfaces")

    return _unique(issues)


def _css_rule(lower_html: str, selector: str) -> str:
    escaped = re.escape(selector)
    match = re.search(rf"{escaped}\s*\{{(?P<body>.*?)\}}", lower_html, flags=re.DOTALL)
    return match.group("body") if match else ""


def _unique(values: list[str]) -> list[str]:
    seen = set()
    output: list[str] = []
    for value in values:
        normalized = value.strip()
        key = normalized.lower()
        if normalized and key not in seen:
            seen.add(key)
            output.append(normalized)
    return output
