from __future__ import annotations

import hashlib
import re

from onara_pipeline.agents.contracts import ComponentSpec
from onara_pipeline.v3.contracts import ComponentAudit


ALLOWED_COLOR_VALUES = {
    "inherit",
    "currentcolor",
    "transparent",
    "white",
    "black",
}
UNSAFE_HTML = re.compile(
    r"<(?:script|iframe|object|embed)\b|javascript:|\son[a-z]+\s*=",
    flags=re.IGNORECASE,
)
UNSAFE_CSS = re.compile(r"@import|expression\s*\(|javascript:|position\s*:\s*fixed", flags=re.IGNORECASE)
GLOBAL_SELECTOR = re.compile(
    r"(^|,)\s*(?:\*|html|body|:root|main|header|footer|section|nav|a|button|input|textarea|select)\s*(?:,|\{)",
    flags=re.IGNORECASE | re.MULTILINE,
)
RAW_COLOR = re.compile(
    r"(?:^|;|\{)\s*(?:color|background(?:-color)?|border(?:-[a-z]+)?-color)\s*:\s*([^;}{]+)",
    flags=re.IGNORECASE,
)


def audit_component(
    *,
    component_id: str,
    css: str,
    html: str,
    spec: ComponentSpec,
) -> ComponentAudit:
    blockers: list[str] = []
    warnings: list[str] = []
    lower = html.lower()
    css_lower = css.lower()
    marker_patterns = (
        f'data-component="{component_id}"',
        f"data-component='{component_id}'",
    )
    if not any(marker in lower for marker in marker_patterns):
        blockers.append(f"Component {component_id} is missing its exact data-component root")
    if len(re.findall(r"\bdata-component\s*=", html, flags=re.IGNORECASE)) != 1:
        blockers.append(f"Component {component_id} must contain exactly one component root")
    if UNSAFE_HTML.search(html):
        blockers.append(f"Component {component_id} contains unsafe executable HTML")
    if re.search(r"\bstyle\s*=", html, flags=re.IGNORECASE):
        blockers.append(f"Component {component_id} contains inline styles")
    if UNSAFE_CSS.search(css):
        blockers.append(f"Component {component_id} contains unsafe CSS")
    if GLOBAL_SELECTOR.search(css):
        blockers.append(f"Component {component_id} contains unscoped global CSS")
    if css and f".c-{component_id}" not in css:
        blockers.append(f"Component {component_id} CSS is not scoped under .c-{component_id}")
    if _contains_raw_color(css):
        blockers.append(
            f"Component {component_id} uses raw color values instead of approved Onara variables"
        )

    # Protected variables redeclaration check
    protected_vars = (
        "--paper",
        "--paper-2",
        "--paper-3",
        "--ink",
        "--ink-2",
        "--ink-3",
        "--rule",
        "--accent",
        "--accent-ink",
        "--leaf",
    )
    duplicate_vars = [
        variable
        for variable in protected_vars
        if len(re.findall(rf"{re.escape(variable)}\s*:", css_lower)) > 0
    ]
    if duplicate_vars:
        blockers.append(
            f"Component {component_id} redeclares protected Onara variables: {', '.join(duplicate_vars)}"
        )

    # Font family checks: ensure it only uses Onara font variables
    font_families = re.findall(r"font-family\s*:\s*([^;}{]+)", css_lower)
    for family in font_families:
        if "var(" not in family:
            blockers.append(
                f"Component {component_id} CSS font-family '{family.strip()}' does not use Onara theme variables"
            )

    # Pill radius check on non-badge/chip/tag selectors
    if "border-radius: 999" in css_lower or "border-radius: 9999" in css_lower:
        if not any(token in css_lower for token in ("badge", "chip", "tag", "pill")):
            blockers.append(
                f"Component {component_id} uses pill-shaped border-radius for non-badge elements"
            )

    # Onara composition depth: components must use named Onara surface classes
    _check_composition_depth(component_id, lower, css_lower, blockers, warnings)

    # Onara anti-brochure: reject centered-only layouts in hero and services
    _check_anti_brochure(component_id, lower, css_lower, blockers, warnings)

    if component_id == "hero":
        if "<h1" not in lower:
            blockers.append("Hero component has no h1")
        if not re.search(r"<(?:a|button)\b", lower):
            blockers.append("Hero component has no primary action")
    if component_id == "site_header" and "<nav" not in lower:
        warnings.append("Header component has no navigation landmark")
    if component_id == "services" and lower.count("<article") < 3:
        blockers.append("Services component must contain at least three service cards")
    if component_id == "contact":
        if "<form" not in lower:
            blockers.append("Contact component has no form")
        if lower.count("<label") < 3:
            blockers.append("Contact component must visibly label its form controls")
    if spec.type == "footer" and "<footer" not in lower:
        blockers.append("Footer component must use a footer root")
    return ComponentAudit(eligible=not blockers, blockers=blockers, warnings=warnings)


def component_fingerprint(html: str, css: str) -> str:
    return hashlib.sha256(f"{html}\n{css}".encode("utf-8")).hexdigest()


def critical_release_blockers(blockers: list[str]) -> list[str]:
    critical_markers = (
        "axe critical",
        "axe serious",
        "broken image",
        "broken images",
        "contact form is missing",
        "no usable contact form",
        "horizontal overflow",
        "html document structure",
        "incomplete html document structure",
        "no site header",
        "no hero section",
        "no primary conversion",
        "primary conversion cta is missing",
        "site header is missing",
        "hero section is missing",
        "unsafe executable",
        "unlabeled form",
        "non-deployable image",
        "controls below 24px",
        "browser audit failed",
    )
    return [
        blocker
        for blocker in blockers
        if any(marker in blocker.lower() for marker in critical_markers)
    ]


def _contains_raw_color(css: str) -> bool:
    for match in RAW_COLOR.finditer(css):
        value = match.group(1).strip().lower()
        if value in ALLOWED_COLOR_VALUES:
            continue
        if "var(" in value or "color-mix(" in value:
            continue
        if re.search(r"#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(|oklch\(", value):
            return True
    return False
