import html as html_lib
import re
from typing import Any

from onara_pipeline.agents.context import (
    BusinessContext,
    build_business_context,
    infer_industry,
    is_generic_service_label,
    service_candidates_for_context,
)
from onara_pipeline.agents.onara_theme import ONARA_FONT_IMPORT

CTA_TARGET_TOKENS = (
    "tel:",
    "mailto:",
    "#contact",
    "#estimate",
    "#quote",
    "#booking",
    "#book",
    "#order",
    "#schedule",
)

CTA_COPY_RE = re.compile(
    r"\b(call|book|schedule|reserve|quote|estimate|contact|get|start|order|request|emergency|pickup)\b",
    flags=re.IGNORECASE,
)


def ensure_onara_typography(html: str) -> tuple[str, list[str]]:
    fixed = html
    fixes: list[str] = []

    fixed, changed = _ensure_font_import(fixed)
    if changed:
        fixes.append("Added the Onara Google font import bundle")

    fixed, changed = _ensure_typography_variables(fixed)
    if changed:
        fixes.append("Normalized Onara typography variables")

    fixed, changed = _append_css_once(fixed, "onara-typography-lock", ONARA_TYPOGRAPHY_LOCK_CSS)
    if changed:
        fixes.append("Applied Onara typography lock selectors")

    return fixed, fixes


def ensure_onara_spacing(html: str) -> tuple[str, list[str]]:
    fixed = _normalize_full_viewport_spacing(html)
    fixes: list[str] = []
    if fixed != html:
        fixes.append("Replaced full-viewport section heights with content-sized spacing")

    fixed, changed = _append_css_once(fixed, "onara-root-reset", ONARA_ROOT_RESET_CSS)
    if changed:
        fixes.append("Applied Onara root reset to remove default browser page gaps")

    fixed, changed = _append_css_once(fixed, "onara-spacing-lock", ONARA_SPACING_LOCK_CSS)
    if changed:
        fixes.append("Applied Onara spacing lock to prevent oversized hero whitespace")

    return fixed, fixes


def ensure_first_fold_balance(html: str) -> tuple[str, list[str]]:
    fixed = _normalize_hours_card_summary(html)
    fixes: list[str] = []
    if fixed != html:
        fixes.append("Normalized awkward daily hours card summary copy")

    lower = fixed.lower()
    if any(
        token in lower
        for token in (
            "<header",
            "site-header",
            "hero-side",
            "panel-stack",
            "hours-card",
            "local-card",
            "hero-photo",
        )
    ):
        fixed, changed = _append_css_once(fixed, "onara-first-fold-balance-lock", ONARA_FIRST_FOLD_BALANCE_LOCK_CSS)
        if changed:
            fixes.append("Applied first-fold balance lock to align the header, compact hero side stacks, and close service-section whitespace")

    return fixed, fixes


def ensure_hero_conversion_cta(
    html: str,
    *,
    business_data: dict[str, Any],
    style_preferences: dict[str, Any] | None = None,
) -> tuple[str, list[str]]:
    context = build_business_context(business_data, style_preferences or {})
    hero = _hero_section(html)
    if not hero or _has_conversion_cta(hero):
        return html, []

    href = f"tel:{_phone_digits(context.phone)}" if _phone_digits(context.phone) else "#contact"
    cta = (
        f'\n        <a class="primary-cta hero-cta onara-injected-hero-cta" '
        f'href="{html_lib.escape(href, quote=True)}">{html_lib.escape(_conversion_cta_label(style_preferences, context))}</a>\n'
    )
    repaired_hero = _insert_before_closing_component_tag(hero, cta)
    if repaired_hero == hero:
        return html, []

    fixed = html.replace(hero, repaired_hero, 1)
    fixed, css_changed = _append_css_once(fixed, "onara-hero-cta-lock", ONARA_HERO_CTA_LOCK_CSS)
    fixes = ["Added a clear conversion CTA inside the hero"]
    if css_changed:
        fixes.append("Applied hero CTA visibility lock")
    return fixed, fixes


def onara_typography_issues(html: str) -> list[str]:
    lower = html.lower()
    issues: list[str] = []

    if "onara-typography-lock" not in lower:
        issues.append("Generated page is missing the Onara typography lock for light Fraunces display headings")

    required_font_names = ("fraunces", "inter", "jetbrains")
    if "fonts.googleapis.com/css2" not in lower or not all(name in lower for name in required_font_names):
        issues.append("Generated page does not import the Onara Google font bundle")

    required_variables = {
        "--serif": "fraunces",
        "--ui": "inter",
        "--mono": "jetbrains",
    }
    for variable, font_name in required_variables.items():
        pattern = rf"{re.escape(variable)}\s*:\s*[^;]*{font_name}"
        if not re.search(pattern, lower):
            issues.append(f"Generated page does not define {variable} with the Onara font")

    body_uses_ui = re.search(r"(?:html\s*,\s*body|body)\s*\{[^}]*font-family\s*:\s*var\(--ui\)", lower, flags=re.DOTALL)
    if not body_uses_ui:
        issues.append("Generated page does not apply Inter/var(--ui) to body copy")

    headings_use_serif = re.search(r"(?:h1|h1\s*,\s*h2|\.serif|\.display)[^{]*\{[^}]*font-family\s*:\s*var\(--serif\)", lower, flags=re.DOTALL)
    if not headings_use_serif:
        issues.append("Generated page does not apply Fraunces/var(--serif) to display headings")

    mono_uses_labels = re.search(r"(?:\.eyebrow|\.mono|label|small)[^{]*\{[^}]*font-family\s*:\s*var\(--mono\)", lower, flags=re.DOTALL)
    if not mono_uses_labels:
        issues.append("Generated page does not apply JetBrains Mono/var(--mono) to labels or metadata")

    return _unique(issues)


def onara_spacing_issues(html: str) -> list[str]:
    lower = html.lower()
    issues: list[str] = []
    has_spacing_lock = "onara-spacing-lock" in lower

    if "onara-root-reset" not in lower and not re.search(
        r"(?:html\s*,\s*body|body)\s*\{[^}]*margin\s*:\s*0",
        lower,
        flags=re.DOTALL,
    ):
        issues.append("Generated page is missing a root margin reset, causing a visible browser gap above the header")

    if not has_spacing_lock:
        issues.append("Generated page is missing the Onara spacing lock that prevents oversized hero whitespace")

    compact = lower.replace(" ", "")
    if (
        "min-height:100vh" in compact
        or "height:100vh" in compact
        or "min-height:100svh" in compact
        or "height:100svh" in compact
        or "min-height:100dvh" in compact
        or "height:100dvh" in compact
    ):
        issues.append("Generated page uses full-viewport hero height that creates excessive whitespace")

    if not has_spacing_lock and re.search(
        r"padding(?:-block|-top|-bottom)?\s*:\s*(?:clamp\([^;]*(?:1[6-9]\d|[2-9]\d\d)px|(?:1[6-9]\d|[2-9]\d\d)px)",
        lower,
    ):
        issues.append("Generated page uses oversized vertical padding that creates excessive whitespace")

    return _unique(issues)


def ensure_hours_rendered(
    html: str,
    *,
    business_data: dict[str, Any],
    style_preferences: dict[str, Any] | None = None,
) -> tuple[str, list[str]]:
    context = build_business_context(business_data, style_preferences or {})
    if not context.hours or hours_visible(html, context.hours):
        return html, []

    fixed = _append_style_patch_once(html, LOCAL_HOURS_CSS)
    fixed = _insert_before_main_or_body_end(fixed, _local_hours_section(context))
    return fixed, ["Rendered supplied business hours in a local details section"]


def ensure_core_page_structure(
    html: str,
    *,
    business_data: dict[str, Any],
    style_preferences: dict[str, Any] | None = None,
) -> tuple[str, list[str]]:
    context = build_business_context(business_data, style_preferences or {})
    fixed = html
    fixes: list[str] = []

    fixed, changed = _ensure_services_section(fixed, context)
    if changed:
        fixes.append("Rendered four distinct service cards from business/category context")

    fixed, changed = _ensure_trust_section(fixed, context)
    if changed:
        fixes.append("Rendered substantive trust proof from verifiable business facts")

    fixed, changed = _ensure_service_area_section(fixed, context)
    if changed:
        fixes.append("Rendered natural service-area copy without raw SEO keyword text")

    fixed, changed = _ensure_contact_section(fixed, context, style_preferences)
    if changed:
        fixes.append("Rendered a complete bottom contact section with clear conversion paths")

    if fixes:
        fixed, _ = _append_css_once(fixed, "onara-core-structure", ONARA_CORE_STRUCTURE_CSS)

    return fixed, _unique(fixes)


def ensure_review_and_license_integrity(
    html: str,
    *,
    business_data: dict[str, Any],
    style_preferences: dict[str, Any] | None = None,
) -> tuple[str, list[str]]:
    context = build_business_context(business_data, style_preferences or {})
    fixed = html
    fixes: list[str] = []

    review_issues = review_integrity_issues(
        fixed,
        business_data=business_data,
        style_preferences=style_preferences,
    )
    if review_issues and not _review_quotes_supplied(business_data):
        replacement = _aggregate_review_section(context)
        fixed, changed = _replace_component_section(fixed, "reviews", replacement)
        if changed:
            fixed, _ = _append_css_once(fixed, "onara-review-facts", REVIEW_FACTS_CSS)
            fixes.append("Replaced unsupported review cards with public-facing aggregate Google review proof")

    credentials_supplied = _credentials_supplied(context, business_data)
    license_issues = license_integrity_issues(
        fixed,
        business_data=business_data,
        style_preferences=style_preferences,
    )
    if not credentials_supplied:
        fixed, changed = _remove_unsupplied_credential_sections(fixed)
        if changed:
            fixes.append("Omitted credential sections because no credential data was supplied")

        stripped = _remove_unsupplied_credential_blocks(fixed)
        stripped = _strip_unsupplied_credential_claims(stripped)
        if stripped != fixed:
            fixed = stripped
            fixes.append("Removed unsupported license, insurance, bonded, or certified trust claims")

        if license_issues and not fixes:
            fixes.append("Checked generated copy for unsupported credential claims")

    cleaned = _strip_internal_instruction_leaks(fixed)
    if cleaned != fixed:
        fixed = cleaned
        fixes.append("Removed internal instruction leak text from generated copy")

    return fixed, _unique(fixes)


def ensure_service_menu_integrity(
    html: str,
    *,
    business_data: dict[str, Any],
    style_preferences: dict[str, Any] | None = None,
) -> tuple[str, list[str]]:
    context = build_business_context(business_data, style_preferences or {})
    issues = service_menu_integrity_issues(
        html,
        business_data=business_data,
        style_preferences=style_preferences,
    )
    if not issues:
        return html, []

    services = service_candidates_for_context(context, infer_industry(context), limit=4)
    if len(services) < 3:
        return html, []

    def replace_menu(match: re.Match[str]) -> str:
        menu_html = match.group(0)
        labels = _list_item_texts(menu_html)
        if len(labels) >= 3 and not _mostly_generic_services(labels):
            return menu_html

        opening = re.match(r"<ul\b[^>]*>", menu_html, flags=re.IGNORECASE)
        if not opening:
            return menu_html

        items = "\n".join(
            f"      <li>{html_lib.escape(service)}</li>" for service in services[:4]
        )
        return f"{opening.group(0)}\n{items}\n    </ul>"

    fixed = re.sub(
        r"<ul\b(?=[^>]*class=[\"'][^\"']*\bservice-menu\b[^\"']*[\"'])[^>]*>.*?</ul>",
        replace_menu,
        html,
        flags=re.IGNORECASE | re.DOTALL,
    )
    if fixed == html:
        return html, []
    return fixed, ["Replaced generic hero service-menu labels with specific business services"]


def ensure_section_dedupe(
    html: str,
    *,
    business_data: dict[str, Any],
    style_preferences: dict[str, Any] | None = None,
) -> tuple[str, list[str]]:
    del business_data, style_preferences

    issues = section_dedupe_issues(html)
    if not issues:
        return html, []

    fixed = html
    fixes: list[str] = []

    reviews_section = _component_section(fixed, "reviews")
    proof_section = _first_component_section(
        fixed,
        ("trust_proof", "trust", "proof", "social_proof", "license_proof"),
    )
    if reviews_section and proof_section:
        fixed, changed = _replace_component_section(fixed, "reviews", "")
        if changed:
            fixes.append("Merged duplicate Google reviews section into the visible trust proof section")

    return fixed, _unique(fixes)


def section_dedupe_issues(
    html: str,
    *,
    business_data: dict[str, Any] | None = None,
    style_preferences: dict[str, Any] | None = None,
) -> list[str]:
    del business_data, style_preferences

    reviews_section = _component_section(html, "reviews")
    if not reviews_section or _is_hidden_section(reviews_section):
        return []

    proof_section = _first_component_section(
        html,
        ("trust_proof", "trust", "proof", "social_proof", "license_proof"),
    )
    if not proof_section or _is_hidden_section(proof_section):
        return []

    if _sections_repeat_same_proof(proof_section, reviews_section):
        return ["Trust proof and Google reviews sections repeat the same visible aggregate rating copy"]

    return []


def service_menu_integrity_issues(
    html: str,
    *,
    business_data: dict[str, Any],
    style_preferences: dict[str, Any] | None = None,
) -> list[str]:
    del business_data, style_preferences

    menu_match = re.search(
        r"<ul\b(?=[^>]*class=[\"'][^\"']*\bservice-menu\b[^\"']*[\"'])[^>]*>.*?</ul>",
        html,
        flags=re.IGNORECASE | re.DOTALL,
    )
    if not menu_match:
        return []

    labels = _list_item_texts(menu_match.group(0))
    if len(labels) < 3:
        return ["Hero service menu contains fewer than three service entries"]
    if _mostly_generic_services(labels):
        return ["Hero service menu uses generic filler labels instead of distinct services"]
    return []


def review_license_integrity_issues(
    html: str,
    *,
    business_data: dict[str, Any],
    style_preferences: dict[str, Any] | None = None,
) -> list[str]:
    return _unique(
        [
            *_internal_instruction_leak_issues(html),
            *review_integrity_issues(html, business_data=business_data, style_preferences=style_preferences),
            *license_integrity_issues(html, business_data=business_data, style_preferences=style_preferences),
        ]
    )


def review_integrity_issues(
    html: str,
    *,
    business_data: dict[str, Any],
    style_preferences: dict[str, Any] | None = None,
) -> list[str]:
    context = build_business_context(business_data, style_preferences or {})
    section = _component_section(html, "reviews")
    if not section:
        return []

    lower = section.lower()
    issues: list[str] = []
    has_quotes = _review_quotes_supplied(business_data)

    if _internal_instruction_leak_issues(section):
        issues.append("Reviews section contains internal missing-data or prompt-instruction copy")

    generic_review_phrases = (
        "review volume gives customers a quick public trust signal",
        "rating, address, photos, hours, and contact details are grounded",
        "local proof is paired with practical next steps",
        "public profile signal customers can cross-check",
    )
    if any(phrase in lower for phrase in generic_review_phrases):
        issues.append("Reviews section contains generic aggregate-proof filler copy")

    if not has_quotes and (
        _class_instance_count(section, "review-card") > 0
        or "<blockquote" in lower
        or "customer said" in lower
        or "homeowner said" in lower
    ):
        issues.append("Reviews section uses quote-style or review-card content without supplied review quotes")

    rating_line = _rating_line(context).lower()
    card_texts = _card_texts(section, class_names=("review-card", "proof-card"))
    if rating_line and any(text.lower().count(rating_line) >= 2 for text in card_texts):
        issues.append("Reviews section repeats the aggregate Google rating as filler card copy")

    if context.address and any(_same_compact_text(text, context.address) for text in card_texts):
        issues.append("Reviews section uses the address as fake review/proof card body copy")

    if context.hours:
        compact_hours = [_compact_hour_text(item) for item in context.hours]
        if any(any(hour and hour in _compact_hour_text(text) for hour in compact_hours) for text in card_texts):
            issues.append("Reviews section uses business hours as fake review/proof card body copy")

    repeated = _repeated_card_text(card_texts)
    if repeated:
        issues.append("Reviews section contains repeated generic card copy")

    if not has_quotes and _class_instance_count(section, "proof-card") >= 3:
        issues.append("Reviews section uses generic proof cards instead of a factual aggregate Google summary")

    return _unique(issues)


def license_integrity_issues(
    html: str,
    *,
    business_data: dict[str, Any],
    style_preferences: dict[str, Any] | None = None,
) -> list[str]:
    context = build_business_context(business_data, style_preferences or {})
    if _credentials_supplied(context, business_data):
        return []

    if not _has_credential_claim(_visible_text(html).lower()):
        return []

    return ["Generated trust or license proof claims credentials that were not supplied"]


def hours_visible(html: str, hours: list[str]) -> bool:
    lower = html.lower()
    compact_html = _compact_hour_text(lower)
    normalized_hours = [re.sub(r"\s+", " ", str(item).strip().lower()) for item in hours if str(item).strip()]
    if not normalized_hours:
        return True

    if _daily_hours_summary_visible(lower, compact_html, normalized_hours):
        return True

    return all(_hour_item_visible(lower, compact_html, item) for item in normalized_hours)


def hours_summary(context: BusinessContext) -> str:
    hours = [item.strip() for item in context.hours if item.strip()]
    if not hours:
        return "Hours not supplied yet"

    time_parts = []
    for item in hours:
        if ":" in item:
            time_parts.append(item.split(":", 1)[1].strip())

    unique_times = _unique(time_parts)
    if len(unique_times) == 1 and len(hours) >= 5:
        return f"Daily {unique_times[0]}"

    return "Weekly hours listed below"


def _normalize_hours_card_summary(html: str) -> str:
    fixed = html
    tag_gap = r"(?:\s|&nbsp;|<[^>]+>)*"
    fixed = re.sub(
        rf"Daily{tag_gap}:?{tag_gap}Open{tag_gap}24{tag_gap}(?:hours|hrs)",
        "Open 24 hours",
        fixed,
        flags=re.IGNORECASE,
    )
    fixed = re.sub(
        rf"Every{tag_gap}day{tag_gap}:?{tag_gap}Open{tag_gap}24{tag_gap}(?:hours|hrs)",
        "Open 24 hours",
        fixed,
        flags=re.IGNORECASE,
    )
    fixed = re.sub(
        rf"Daily{tag_gap}:?{tag_gap}24{tag_gap}/{tag_gap}7",
        "Open 24/7",
        fixed,
        flags=re.IGNORECASE,
    )
    return fixed


def _local_hours_section(context: BusinessContext) -> str:
    hour_items = "\n".join(
        f"        <li>{html_lib.escape(item)}</li>" for item in context.hours
    )
    address = html_lib.escape(context.address or context.service_area)
    summary = html_lib.escape(hours_summary(context))
    return f"""
    <section class="optional-section service-area local-hours" data-component="local_hours" id="hours">
      <div class="section-head">
        <span class="eyebrow">Hours</span>
        <h2>Hours and local details.</h2>
        <p>{summary}</p>
      </div>
      <div class="proof-card hours-card">
        <strong>Business hours</strong>
        <ul class="hours-list">
{hour_items}
        </ul>
        <strong>Local address</strong>
        <p>{address}</p>
      </div>
    </section>
""".rstrip()


def _ensure_services_section(html: str, context: BusinessContext) -> tuple[str, bool]:
    services = service_candidates_for_context(context, infer_industry(context), limit=4)
    if len(services) < 4:
        return html, False

    section = _component_section(html, "services")
    if section and _distinct_service_card_count(section) >= 4:
        return html, False

    replacement = _services_section(context, services[:4])
    if section:
        return _replace_component_section(html, "services", replacement)

    return _insert_before_first_component_or_body_end(
        html,
        ("trust", "proof", "reviews", "service_area", "contact", "site_footer"),
        replacement,
    ), True


def _services_section(context: BusinessContext, services: list[str]) -> str:
    service_cards = "\n".join(
        f"""        <article class="service-card">
          <span class="eyebrow">{html_lib.escape(str(index).zfill(2))}</span>
          <h3>{html_lib.escape(service)}</h3>
          <p>{html_lib.escape(_service_description(context, service))}</p>
        </article>"""
        for index, service in enumerate(services, start=1)
    )
    return f"""
    <section class="optional-section services onara-repair-section" data-component="services" id="services">
      <div class="section-head">
        <span class="eyebrow">Services</span>
        <h2>Practical help for {html_lib.escape(context.service_area)}.</h2>
        <p>{html_lib.escape(context.name)} keeps the service menu clear so customers know exactly what to request.</p>
      </div>
      <div class="service-grid onara-card-grid">
{service_cards}
      </div>
    </section>
""".rstrip()


def _ensure_trust_section(html: str, context: BusinessContext) -> tuple[str, bool]:
    component_id = _first_existing_component_id(html, ("trust", "trust_proof", "proof", "social_proof"))
    section = _component_section(html, component_id) if component_id else ""
    if section and not _trust_section_is_weak(section):
        return html, False

    replacement = _trust_section(context)
    if component_id:
        return _replace_component_section(html, component_id, replacement)

    return _insert_before_first_component_or_body_end(
        html,
        ("reviews", "service_area", "contact", "site_footer"),
        replacement,
    ), True


def _trust_section(context: BusinessContext) -> str:
    facts = _trust_facts(context)
    fact_items = "\n".join(
        f"""        <li class="proof-card">
          <span>{html_lib.escape(label)}</span>
          <strong>{html_lib.escape(value)}</strong>
        </li>"""
        for label, value in facts
    )
    return f"""
    <section class="optional-section trust-proof onara-repair-section" data-component="trust" id="proof">
      <div class="section-head">
        <span class="eyebrow">Proof</span>
        <h2>Public details customers can verify.</h2>
        <p>Trust signals here come from the supplied business profile, not invented claims.</p>
      </div>
      <ul class="trust-facts onara-card-grid" aria-label="Business proof points">
{fact_items}
      </ul>
    </section>
""".rstrip()


def _ensure_service_area_section(html: str, context: BusinessContext) -> tuple[str, bool]:
    if context.service_area == "your area" and not context.address:
        return html, False

    section = _component_section(html, "service_area")
    if section and not _service_area_section_is_raw(section):
        return html, False

    replacement = _service_area_section(context)
    if section:
        return _replace_component_section(html, "service_area", replacement)

    return _insert_before_first_component_or_body_end(
        html,
        ("contact", "site_footer"),
        replacement,
    ), True


def _service_area_section(context: BusinessContext) -> str:
    address = context.address or context.service_area
    local_line = (
        f"{context.name} is listed at {address} and serves customers around {context.service_area}."
        if address
        else f"{context.name} serves customers around {context.service_area}."
    )
    return f"""
    <section class="optional-section service-area onara-repair-section" data-component="service_area" id="service-area">
      <div class="section-head">
        <span class="eyebrow">Service area</span>
        <h2>{html_lib.escape(context.service_area)}</h2>
        <p>{html_lib.escape(local_line)}</p>
      </div>
      <div class="local-card">
        <span class="eyebrow">Local details</span>
        <strong>{html_lib.escape(address)}</strong>
        <p>{html_lib.escape(_local_detail_sentence(context))}</p>
      </div>
    </section>
""".rstrip()


def _ensure_contact_section(
    html: str,
    context: BusinessContext,
    style_preferences: dict[str, Any] | None,
) -> tuple[str, bool]:
    section = _component_section(html, "contact")
    if section and _contact_section_is_complete(section, context):
        return html, False

    replacement = _contact_section(context, style_preferences)
    if section:
        return _replace_component_section(html, "contact", replacement)

    return _insert_before_main_or_body_end(html, replacement), True


def _contact_section(context: BusinessContext, style_preferences: dict[str, Any] | None) -> str:
    phone = context.phone or "Phone not supplied"
    phone_href = f"tel:{_phone_digits(context.phone)}" if _phone_digits(context.phone) else "#"
    website_link = (
        f'<a href="{html_lib.escape(context.website, quote=True)}" rel="noopener">Visit website</a>'
        if context.website.startswith("http")
        else ""
    )
    return f"""
    <section class="optional-section contact onara-repair-section" data-component="contact" id="contact">
      <div class="section-head">
        <span class="eyebrow">Contact</span>
        <h2>Ready for the next step?</h2>
        <p>{html_lib.escape(context.name)} can be reached directly from this page.</p>
      </div>
      <div class="contact-card">
        <div>
          <span class="eyebrow">Call</span>
          <strong>{html_lib.escape(phone)}</strong>
          <p>{html_lib.escape(context.address or context.service_area)}</p>
        </div>
        <div class="contact-actions">
          <a class="primary-cta" href="{html_lib.escape(phone_href, quote=True)}">{html_lib.escape(_conversion_cta_label(style_preferences, context))}</a>
          {website_link}
        </div>
      </div>
    </section>
""".rstrip()


def _distinct_service_card_count(section: str) -> int:
    texts = _card_texts(section, class_names=("service-card",))
    return len({re.sub(r"\s+", " ", text).strip().lower() for text in texts if text.strip()})


def _service_description(context: BusinessContext, service: str) -> str:
    area = context.service_area
    service_lower = service.lower()
    if "emergency" in service_lower:
        return f"Fast response language and tap-to-call action for urgent requests in {area}."
    if "water heater" in service_lower or "heating" in service_lower:
        return f"Clear service copy for homeowners comparing repair, replacement, or maintenance options in {area}."
    if "drain" in service_lower or "leak" in service_lower:
        return f"Specific repair framing so customers can quickly identify the right next step in {area}."
    return f"Plain-language service details for customers looking for {context.category.lower()} help in {area}."


def _first_existing_component_id(html: str, component_ids: tuple[str, ...]) -> str:
    for component_id in component_ids:
        if _component_section(html, component_id):
            return component_id
    return ""


def _trust_section_is_weak(section: str) -> bool:
    text = _visible_text(section).lower()
    card_count = _class_instance_count(section, "proof-card") + len(_list_item_texts(section))
    generic_only = all(
        phrase in text
        for phrase in ("google reviews", "24/7 availability")
    ) and len(text) < 160
    return card_count < 3 or generic_only


def _trust_facts(context: BusinessContext) -> list[tuple[str, str]]:
    facts: list[tuple[str, str]] = []
    if context.rating is not None and context.review_count is not None:
        facts.append(("Google proof", f"{context.rating:g} rating from {context.review_count:,} reviews"))
    elif context.rating is not None:
        facts.append(("Google proof", f"{context.rating:g} Google rating"))

    if context.hours:
        facts.append(("Availability", hours_summary(context).replace("Daily ", "")))

    if context.address:
        facts.append(("Local profile", context.address))
    else:
        facts.append(("Service area", context.service_area))

    if context.phone:
        facts.append(("Direct contact", context.phone))

    if context.photos:
        facts.append(("Photos", f"{len(context.photos)} supplied business photo{'s' if len(context.photos) != 1 else ''}"))

    return facts[:4] if len(facts) >= 3 else [*facts, ("Business profile", context.name)][:3]


def _service_area_section_is_raw(section: str) -> bool:
    text = _visible_text(section).lower()
    return any(
        phrase in text
        for phrase in (
            "built for",
            "searches",
            "seo keyword",
            "near me",
            "target keyword",
        )
    )


def _local_detail_sentence(context: BusinessContext) -> str:
    if context.phone:
        return f"Call {context.phone} for service details around {context.service_area}."
    return f"Service details are centered on {context.service_area}."


def _contact_section_is_complete(section: str, context: BusinessContext) -> bool:
    text = _visible_text(section)
    lower = section.lower()
    if len(text) < 40:
        return False
    if _phone_digits(context.phone) and "tel:" not in lower and context.phone not in text:
        return False
    return "#contact" in lower or "primary-cta" in lower or "contact-card" in lower or "tel:" in lower


def _insert_before_first_component_or_body_end(html: str, component_ids: tuple[str, ...], section: str) -> str:
    matches: list[re.Match[str]] = []
    for component_id in component_ids:
        match = re.search(_component_section_pattern(component_id), html, flags=re.IGNORECASE | re.DOTALL)
        if match:
            matches.append(match)

    if matches:
        first = min(matches, key=lambda match: match.start())
        return f"{html[: first.start()]}{section}\n{html[first.start():]}"

    return _insert_before_main_or_body_end(html, section)


def _aggregate_review_section(context: BusinessContext) -> str:
    rating_line = html_lib.escape(_rating_line(context) or "Google rating available on the public business profile")
    rating_value = f"{context.rating:g}" if context.rating is not None else "Google"
    count_value = f"{context.review_count:,}" if context.review_count is not None else "public"
    service_area = html_lib.escape(context.service_area)
    business_name = html_lib.escape(context.name)
    local_profile = html_lib.escape(context.address or context.service_area)
    return f"""
    <section class="optional-section reviews" data-component="reviews" id="reviews">
      <div class="section-head">
        <span class="eyebrow">Google reviews</span>
        <h2>Google profile proof customers can verify.</h2>
        <p>{rating_line}</p>
      </div>
      <div class="review-summary-card">
        <div class="review-stars" aria-label="{html_lib.escape(str(rating_value))} Google rating">
          <span>&#9733;</span><span>&#9733;</span><span>&#9733;</span><span>&#9733;</span><span>&#9733;</span>
        </div>
        <strong>{html_lib.escape(str(rating_value))} / 5 Google rating</strong>
        <p>Public Google Business Profile rating for {business_name}.</p>
      </div>
      <ul class="review-facts" aria-label="Google review facts">
        <li><span>Rating</span><strong>{html_lib.escape(str(rating_value))} / 5 on Google</strong></li>
        <li><span>Reviews</span><strong>{html_lib.escape(str(count_value))} public reviews</strong></li>
        <li><span>Local profile</span><strong>{local_profile}</strong></li>
      </ul>
    </section>
""".rstrip()


def _component_section(html: str, component_id: str) -> str:
    match = re.search(_component_section_pattern(component_id), html, flags=re.IGNORECASE | re.DOTALL)
    return match.group(0) if match else ""


def _hero_section(html: str) -> str:
    component = _component_section(html, "hero")
    if component:
        return component

    match = re.search(
        r"<(?P<tag>section|div|main|article)\b"
        r"(?=[^>]*(?:data-component=[\"']hero[\"']|id=[\"']hero[\"']|class=[\"'][^\"']*\bhero\b[^\"']*[\"']))"
        r"[^>]*>.*?</(?P=tag)>",
        html,
        flags=re.IGNORECASE | re.DOTALL,
    )
    return match.group(0) if match else ""


def _insert_before_closing_component_tag(markup: str, insertion: str) -> str:
    closing = re.search(
        r"</(?P<tag>section|div|main|article)\s*>\s*$",
        markup,
        flags=re.IGNORECASE,
    )
    if not closing:
        return markup

    return f"{markup[: closing.start()]}{insertion}    {closing.group(0)}"


def _has_conversion_cta(markup: str) -> bool:
    controls = re.finditer(
        r"<(?P<tag>a|button)\b(?P<attrs>[^>]*)>(?P<body>.*?)</(?P=tag)>",
        markup,
        flags=re.IGNORECASE | re.DOTALL,
    )
    for control in controls:
        attrs = control.group("attrs").lower()
        text = _visible_text(control.group("body"))
        if not text:
            continue
        if any(token in attrs for token in CTA_TARGET_TOKENS):
            return True
        if CTA_COPY_RE.search(text):
            return True
    return False


def _conversion_cta_label(style_preferences: dict[str, Any] | None, context: BusinessContext) -> str:
    preferences = style_preferences or {}
    goal = str(preferences.get("conversionGoal") or preferences.get("conversion_goal") or "").lower()
    industry = infer_industry(context)

    if "book" in goal or industry in {"grocery", "campground"}:
        return "Book Online" if "book" in goal else "Order Now" if industry == "grocery" else "Reserve Now"
    if "emergency" in goal:
        return "Get Emergency Help"
    if "call" in goal:
        return "Call Now"
    if "quote" in goal:
        return "Request a Quote"
    return "Get a Free Estimate"


def _phone_digits(phone: str) -> str:
    return re.sub(r"[^0-9+]", "", phone)


def _first_component_section(html: str, component_ids: tuple[str, ...]) -> str:
    for component_id in component_ids:
        section = _component_section(html, component_id)
        if section:
            return section
    return ""


def _replace_component_section(html: str, component_id: str, replacement: str) -> tuple[str, bool]:
    fixed = re.sub(
        _component_section_pattern(component_id),
        replacement,
        html,
        count=1,
        flags=re.IGNORECASE | re.DOTALL,
    )
    return fixed, fixed != html


def _component_section_pattern(component_id: str) -> str:
    escaped = re.escape(component_id)
    return (
        r"<section\b"
        rf"(?=[^>]*(?:data-component=[\"']{escaped}[\"']|id=[\"']{escaped}[\"']))"
        r"[^>]*>.*?</section>"
    )


def _is_hidden_section(section: str) -> bool:
    opening = re.search(r"<section\b[^>]*>", section, flags=re.IGNORECASE)
    if not opening:
        return False

    tag = opening.group(0).lower()
    return " hidden" in tag or "aria-hidden=\"true\"" in tag or "aria-hidden='true'" in tag


def _list_item_texts(html: str) -> list[str]:
    items = re.findall(r"<li\b[^>]*>(.*?)</li>", html, flags=re.IGNORECASE | re.DOTALL)
    return [_visible_text(item) for item in items if _visible_text(item)]


def _mostly_generic_services(labels: list[str]) -> bool:
    if not labels:
        return True

    generic_count = sum(1 for label in labels if is_generic_service_label(label))
    return generic_count >= max(2, len(labels) - 1)


def _sections_repeat_same_proof(left: str, right: str) -> bool:
    left_heading = _compact_visible_text(_section_heading_text(left))
    right_heading = _compact_visible_text(_section_heading_text(right))
    if left_heading and right_heading and left_heading == right_heading and len(left_heading) >= 24:
        return True

    left_text = _visible_text(left)
    right_text = _visible_text(right)
    if not left_text or not right_text:
        return False

    left_compact = _compact_visible_text(left_text)
    right_compact = _compact_visible_text(right_text)
    if min(len(left_compact), len(right_compact)) >= 80 and (
        left_compact in right_compact or right_compact in left_compact
    ):
        return True

    if not (_has_review_signal(left_text) and _has_review_signal(right_text)):
        return False

    left_word_count = len(_meaningful_words(left_text))
    right_word_count = len(_meaningful_words(right_text))
    if min(left_word_count, right_word_count) < 10:
        return False

    return _word_overlap(left_text, right_text) >= 0.72


def _section_heading_text(section: str) -> str:
    match = re.search(r"<h[1-3]\b[^>]*>(.*?)</h[1-3]>", section, flags=re.IGNORECASE | re.DOTALL)
    return _visible_text(match.group(1)) if match else ""


def _visible_text(html: str) -> str:
    without_hidden = re.sub(
        r"<[^>]+\b(?:hidden|aria-hidden=[\"']true[\"'])[^>]*>.*?</[^>]+>",
        " ",
        html,
        flags=re.IGNORECASE | re.DOTALL,
    )
    without_script = re.sub(r"<(?:script|style)\b[^>]*>.*?</(?:script|style)>", " ", without_hidden, flags=re.IGNORECASE | re.DOTALL)
    text = re.sub(r"<[^>]+>", " ", without_script)
    text = html_lib.unescape(text)
    return re.sub(r"\s+", " ", text).strip()


def _compact_visible_text(text: str) -> str:
    return re.sub(r"[^a-z0-9]", "", text.lower())


def _word_overlap(left: str, right: str) -> float:
    left_words = _meaningful_words(left)
    right_words = _meaningful_words(right)
    if not left_words or not right_words:
        return 0.0

    return len(left_words & right_words) / min(len(left_words), len(right_words))


def _meaningful_words(text: str) -> set[str]:
    return {word for word in re.findall(r"[a-z0-9]+", text.lower()) if len(word) > 3}


def _has_review_signal(text: str) -> bool:
    lower = text.lower()
    return "review" in lower or "rating" in lower or "rated" in lower or "google" in lower


def _review_quotes_supplied(business_data: dict[str, Any]) -> bool:
    raw_reviews = business_data.get("reviews") or business_data.get("review_snippets") or business_data.get("reviewQuotes")
    if not isinstance(raw_reviews, list):
        return False

    for review in raw_reviews:
        if isinstance(review, str) and review.strip():
            return True
        if isinstance(review, dict):
            text = review.get("text") or review.get("quote") or review.get("body")
            if isinstance(text, str) and text.strip():
                return True
    return False


def _credentials_supplied(context: BusinessContext, business_data: dict[str, Any]) -> bool:
    data_text = " ".join(
        str(value)
        for key, value in business_data.items()
        if "license" in str(key).lower()
        or "insurance" in str(key).lower()
        or "bond" in str(key).lower()
        or "cert" in str(key).lower()
        or str(key).lower() in {"notes", "owner_notes", "additional_notes"}
    )
    combined = f"{context.notes} {data_text}"
    return bool(
        re.search(
            r"(?i)\b(?:license(?:d)?|lic\.?|insured|insurance|bonded|certified|certification)\b",
            combined,
        )
    )


def _has_credential_claim(lower: str) -> bool:
    return any(
        phrase in lower
        for phrase in (
            "license proof",
            "license details",
            "license detail",
            "licensed professional",
            "licensed",
            "license",
            "proof omitted per rules",
            "owner input",
            "owner-provided credential",
            "credential status",
            "credential",
            "credential details pending",
            "credential details need",
            "verify before publishing",
            "license verification card",
            "license verification",
            "professional licensing",
            "implied by trade",
            "licensed and insured",
            "insured",
            "insurance",
            "fully insured",
            "bonded",
            "license #",
            "lic #",
            "certified",
            "certification",
        )
    )


def _remove_unsupplied_credential_sections(html: str) -> tuple[str, bool]:
    fixed = _replace_component_section(html, "license_proof", "")[0]
    fixed = re.sub(
        r"<section\b"
        r"(?=[^>]*(?:data-component|id|class)=[\"'][^\"']*(?:license|credential|insurance|insured|bond|cert)[^\"']*[\"'])"
        r"[^>]*>.*?</section>",
        "",
        fixed,
        flags=re.IGNORECASE | re.DOTALL,
    )
    return fixed, fixed != html


def _remove_unsupplied_credential_blocks(html: str) -> str:
    fixed = html

    def remove_if_credential(match: re.Match[str]) -> str:
        text = _visible_text(match.group(0)).lower()
        return "" if _has_credential_claim(text) else match.group(0)

    fixed = re.sub(
        r"<(?:article|li|aside)\b[^>]*>.*?</(?:article|li|aside)>",
        remove_if_credential,
        fixed,
        flags=re.IGNORECASE | re.DOTALL,
    )
    fixed = re.sub(
        r"<div\b(?=[^>]*class=[\"'][^\"']*(?:card|proof|trust|credential|license|badge|item|row)[^\"']*[\"'])[^>]*>.*?</div>",
        remove_if_credential,
        fixed,
        flags=re.IGNORECASE | re.DOTALL,
    )
    fixed = re.sub(
        r"<p\b[^>]*>.*?</p>",
        remove_if_credential,
        fixed,
        flags=re.IGNORECASE | re.DOTALL,
    )
    return fixed


def _strip_unsupplied_credential_claims(html: str) -> str:
    parts = re.split(
        r"(<(?:script|style)\b[^>]*>.*?</(?:script|style)>)",
        html,
        flags=re.IGNORECASE | re.DOTALL,
    )
    return "".join(
        part if re.match(r"<(?:script|style)\b", part, flags=re.IGNORECASE) else _strip_credential_claim_text(part)
        for part in parts
    )


def _strip_credential_claim_text(html: str) -> str:
    replacements = (
        (r"\blicense proof\b", ""),
        (r"\blicense details?\b", ""),
        (r"\blicensed professional\s*\([^)]*\)", ""),
        (r"\blicensed professional\b", ""),
        (r"\blicensed\b", ""),
        (r"\bproof omitted per rules[^<.\n]*", ""),
        (r"\bowner-provided credential[^<.\n]*", ""),
        (r"\blicense verification card\s*\([^)]*\)", ""),
        (r"\blicense verification card\b", ""),
        (r"\blicense verification\b", ""),
        (r"\bprofessional licensing\s*\([^)]*\)", ""),
        (r"\bprofessional licensing\b", ""),
        (r"\bimplied by trade[^<.\n]*", ""),
        (r"\blicensed and insured\b", ""),
        (r"\bfully insured\b", ""),
        (r"\binsured\b", ""),
        (r"\binsurance\b", ""),
        (r"\bbonded\b", ""),
        (r"\blicense\s*#\s*[\w-]+", ""),
        (r"\blic\s*#\s*[\w-]+", ""),
        (r"\blicense\b", ""),
        (r"\blic\.\b", ""),
        (r"\bcertified\b", ""),
        (r"\bcertification\b", ""),
        (r"\bcredential status\b", ""),
        (r"\bcredentials?\b", ""),
        (r"\bverify before publishing\b", ""),
        (r"\bowner input\b", ""),
    )
    fixed = html
    for pattern, replacement in replacements:
        fixed = re.sub(pattern, replacement, fixed, flags=re.IGNORECASE)
    fixed = re.sub(r">\s*(?:/|,|;|and|&amp;|&)\s*<", "><", fixed, flags=re.IGNORECASE)
    return fixed


def _internal_instruction_leak_issues(html: str) -> list[str]:
    visible = _visible_text(html).lower()
    lower = html.lower()
    issues: list[str] = []
    phrases = (
        "proof omitted per rules",
        "no review quotes supplied",
        "this page does not invent",
        "add real quotes",
        "pending owner input",
        "verification-needed",
        "not supplied for this draft",
    )
    if any(phrase in visible for phrase in phrases):
        issues.append("Generated page leaks internal missing-data or prompt-instruction copy")
    if "merged-section-marker" in lower:
        issues.append("Generated page contains hidden phantom component marker markup")
    return issues


def _strip_internal_instruction_leaks(html: str) -> str:
    fixed = html
    fixed = _remove_blocks_with_internal_leaks(fixed)
    replacements = (
        (r"\bNo review quotes supplied\b", "Public Google rating"),
        (r"\bThis page does not invent customer testimonials\.?\s*Add real quotes after approval\.?", "Customers can verify the public Google rating before contacting the business."),
        (r"\bLicensed professional\s*\([^)]*\)", ""),
        (r"\bProfessional licensing\s*\([^)]*\)", ""),
        (r"\bimplied by trade[^<.\n]*", ""),
        (r"\bproof omitted per rules[^<.\n]*", ""),
        (r"\bpending owner input\b", ""),
        (r"\bverification-needed\b", ""),
        (r"\bnot supplied for this draft\b", ""),
    )
    for pattern, replacement in replacements:
        fixed = re.sub(pattern, replacement, fixed, flags=re.IGNORECASE)
    return fixed


def _remove_blocks_with_internal_leaks(html: str) -> str:
    leak_phrases = (
        "proof omitted per rules",
        "no review quotes supplied",
        "this page does not invent",
        "add real quotes",
        "pending owner input",
        "verification-needed",
        "not supplied for this draft",
    )

    def remove_if_leak(match: re.Match[str]) -> str:
        text = _visible_text(match.group(0)).lower()
        return "" if any(phrase in text for phrase in leak_phrases) else match.group(0)

    fixed = re.sub(
        r"<(?:article|li)\b[^>]*>.*?</(?:article|li)>",
        remove_if_leak,
        html,
        flags=re.IGNORECASE | re.DOTALL,
    )
    fixed = re.sub(
        r"<div\b(?=[^>]*class=[\"'][^\"']*(?:card|proof|review)[^\"']*[\"'])[^>]*>.*?</div>",
        remove_if_leak,
        fixed,
        flags=re.IGNORECASE | re.DOTALL,
    )
    fixed = re.sub(
        r"<section\b(?=[^>]*\bhidden\b)[^>]*>\s*</section>",
        "",
        fixed,
        flags=re.IGNORECASE | re.DOTALL,
    )
    return fixed


def _rating_line(context: BusinessContext) -> str:
    if context.rating is None or context.review_count is None:
        return ""
    return f"{context.rating:g} from {context.review_count} Google reviews"


def _card_texts(section: str, *, class_names: tuple[str, ...]) -> list[str]:
    class_pattern = "|".join(re.escape(class_name) for class_name in class_names)
    matches = re.findall(
        rf"<(?:article|div)\b[^>]*class=[\"'][^\"']*\b(?:{class_pattern})\b[^\"']*[\"'][^>]*>(.*?)</(?:article|div)>",
        section,
        flags=re.IGNORECASE | re.DOTALL,
    )
    output: list[str] = []
    for match in matches:
        text = re.sub(r"<[^>]+>", " ", match)
        text = re.sub(r"\s+", " ", text).strip()
        if text:
            output.append(text)
    return output


def _class_instance_count(html: str, class_name: str) -> int:
    escaped = re.escape(class_name)
    return len(re.findall(rf"class=[\"'][^\"']*\b{escaped}\b[^\"']*[\"']", html, flags=re.IGNORECASE))


def _repeated_card_text(card_texts: list[str]) -> str:
    seen: set[str] = set()
    for text in card_texts:
        normalized = re.sub(r"\s+", " ", text).strip().lower()
        if len(normalized) < 40:
            continue
        if normalized in seen:
            return text
        seen.add(normalized)
    return ""


def _same_compact_text(left: str, right: str) -> bool:
    compact_right = re.sub(r"[^a-z0-9]", "", right.lower())
    compact_left = re.sub(r"[^a-z0-9]", "", left.lower())
    return bool(compact_right and compact_right in compact_left)


def _ensure_font_import(html: str) -> tuple[str, bool]:
    lower = html.lower()
    if "fonts.googleapis.com/css2" in lower and all(name in lower for name in ("fraunces", "inter", "jetbrains")):
        return html, False

    style_match = re.search(r"<style\b[^>]*>", html, flags=re.IGNORECASE)
    if style_match:
        fixed = html[: style_match.end()] + f"\n      {ONARA_FONT_IMPORT}\n" + html[style_match.end() :]
        return fixed, True

    head_match = re.search(r"<head\b[^>]*>", html, flags=re.IGNORECASE)
    if head_match:
        style = f"\n    <style>\n      {ONARA_FONT_IMPORT}\n    </style>\n"
        fixed = html[: head_match.end()] + style + html[head_match.end() :]
        return fixed, True

    return f"<style>\n{ONARA_FONT_IMPORT}\n</style>\n{html}", True


def _ensure_typography_variables(html: str) -> tuple[str, bool]:
    fixed = html
    changed = False
    variables = {
        "--serif": '"Fraunces", Georgia, serif',
        "--ui": '"Inter", Arial, sans-serif',
        "--mono": '"JetBrains Mono", "Courier New", monospace',
        "--hand": '"Caveat", cursive',
    }

    missing: dict[str, str] = {}
    for variable, value in variables.items():
        pattern = rf"({re.escape(variable)}\s*:\s*)[^;]+;"
        if re.search(pattern, fixed, flags=re.IGNORECASE):
            replaced = re.sub(pattern, rf"\1{value};", fixed, count=1, flags=re.IGNORECASE)
            if replaced != fixed:
                fixed = replaced
                changed = True
        else:
            missing[variable] = value

    if missing:
        declarations = "\n".join(f"        {variable}: {value};" for variable, value in missing.items())
        fixed, appended = _append_css_once(
            fixed,
            "onara-typography-vars",
            f"      /* onara-typography-vars */\n      :root {{\n{declarations}\n      }}",
        )
        changed = changed or appended

    return fixed, changed


def _normalize_full_viewport_spacing(html: str) -> str:
    fixed = re.sub(
        r"min-height\s*:\s*100(?:s|d)?vh\s*;?",
        "min-height: auto;",
        html,
        flags=re.IGNORECASE,
    )
    fixed = re.sub(
        r"height\s*:\s*100(?:s|d)?vh\s*;?",
        "height: auto;",
        fixed,
        flags=re.IGNORECASE,
    )
    return fixed


def _append_css_once(html: str, marker: str, css: str) -> tuple[str, bool]:
    if marker.lower() in html.lower():
        return html, False

    if "</style>" in html.lower():
        fixed = re.sub(r"</style>", f"\n{css}\n      </style>", html, count=1, flags=re.IGNORECASE)
        return fixed, fixed != html

    head_match = re.search(r"<head\b[^>]*>", html, flags=re.IGNORECASE)
    if head_match:
        style = f"\n    <style>\n{css}\n    </style>\n"
        fixed = html[: head_match.end()] + style + html[head_match.end() :]
        return fixed, True

    return f"<style>\n{css}\n</style>\n{html}", True


def _append_style_patch_once(html: str, css: str) -> str:
    if "local-hours" in html and "hours-list" in html:
        return html
    if "</style>" not in html.lower():
        return html
    return re.sub(r"</style>", f"\n{css}\n      </style>", html, count=1, flags=re.IGNORECASE)


def _insert_before_main_or_body_end(html: str, section: str) -> str:
    if "</main>" in html.lower():
        return re.sub(r"</main>", f"{section}\n    </main>", html, count=1, flags=re.IGNORECASE)
    if "</body>" in html.lower():
        return re.sub(r"</body>", f"{section}\n  </body>", html, count=1, flags=re.IGNORECASE)
    return f"{html}\n{section}"


def _unique(values: list[str]) -> list[str]:
    seen: set[str] = set()
    output: list[str] = []
    for value in values:
        normalized = value.strip()
        key = normalized.lower()
        if normalized and key not in seen:
            seen.add(key)
            output.append(normalized)
    return output


def _compact_hour_text(value: str) -> str:
    normalized = value.lower().replace("–", "-").replace("—", "-")
    normalized = re.sub(r"[^a-z0-9]", "", normalized)
    return normalized


def _hour_item_visible(lower_html: str, compact_html: str, item: str) -> bool:
    compact_item = _compact_hour_text(item)
    if compact_item and compact_item in compact_html:
        return True

    if ":" not in item:
        return bool(item and item in lower_html)

    day_part, time_part = [part.strip() for part in item.split(":", 1)]
    compact_day = _compact_hour_text(day_part)
    compact_time = _compact_hour_text(time_part)
    return bool(
        compact_day
        and compact_time
        and compact_day in compact_html
        and compact_time in compact_html
    )


def _daily_hours_summary_visible(lower_html: str, compact_html: str, hours: list[str]) -> bool:
    time_parts = [
        _compact_hour_text(item.split(":", 1)[1].strip())
        for item in hours
        if ":" in item and item.split(":", 1)[1].strip()
    ]
    if len(time_parts) < 5 or len(set(time_parts)) != 1:
        return False

    has_daily_label = "daily" in lower_html or "every day" in lower_html or "open 7 days" in lower_html
    return has_daily_label and time_parts[0] in compact_html


ONARA_CORE_STRUCTURE_CSS = """
      /* onara-core-structure */
      .onara-repair-section {
        border-top: 1px solid var(--rule, #d8d6cf);
        padding: clamp(42px, 6vw, 78px) clamp(18px, 4vw, 56px);
      }

      .onara-repair-section .section-head {
        display: grid;
        gap: 12px;
        margin-bottom: clamp(22px, 4vw, 38px);
        max-width: 760px;
      }

      .onara-card-grid {
        display: grid;
        gap: 14px;
        grid-template-columns: repeat(4, minmax(0, 1fr));
      }

      .onara-repair-section .service-card,
      .onara-repair-section .proof-card,
      .onara-repair-section .local-card,
      .onara-repair-section .contact-card {
        background: var(--paper, #fbfaf6);
        border: 1px solid var(--rule, #d8d6cf);
        box-shadow: 0 18px 50px color-mix(in srgb, var(--ink, #181716) 8%, transparent);
        display: grid;
        gap: 12px;
        min-width: 0;
        padding: clamp(18px, 2.6vw, 28px);
      }

      .onara-repair-section .service-card h3,
      .onara-repair-section .proof-card strong,
      .onara-repair-section .local-card strong,
      .onara-repair-section .contact-card strong {
        color: var(--ink, #181716);
        font-size: clamp(1.08rem, 1.6vw, 1.35rem);
        line-height: 1.12;
      }

      .trust-facts {
        list-style: none;
        margin: 0;
        padding: 0;
      }

      .trust-facts span,
      .contact-actions a:not(.primary-cta) {
        color: var(--ink-3, #6f6b63);
        font-family: var(--mono, monospace);
        font-size: 0.72rem;
        letter-spacing: 0.14em;
        text-transform: uppercase;
      }

      .contact-card {
        align-items: center;
        grid-template-columns: minmax(0, 1fr) auto;
      }

      .contact-actions {
        align-items: stretch;
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        justify-content: flex-end;
      }

      @media (max-width: 980px) {
        .onara-card-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }

      @media (max-width: 680px) {
        .onara-card-grid,
        .contact-card {
          grid-template-columns: 1fr;
        }

        .contact-actions {
          justify-content: stretch;
        }
      }
""".rstrip()


REVIEW_FACTS_CSS = """
      /* onara-review-facts */
      .review-facts {
        display: grid;
        gap: 10px;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        list-style: none;
        margin: 18px 0 0;
        padding: 0;
      }

      .review-facts li {
        background: var(--paper, #fbfaf6);
        border: 1px solid var(--rule, #d8d6cf);
        display: grid;
        gap: 8px;
        padding: 18px;
      }

      .review-facts span {
        color: var(--ink-3, #6a6a6a);
        font-family: var(--mono, monospace);
        font-size: 0.68rem;
        letter-spacing: 0.16em;
        text-transform: uppercase;
      }

      @media (max-width: 760px) {
        .review-facts {
          grid-template-columns: 1fr;
        }
      }
""".rstrip()


LOCAL_HOURS_CSS = """
      .local-hours .hours-card {
        display: grid;
        gap: 12px;
      }

      .local-hours .hours-list {
        color: var(--ink-3, #6a6a6a);
        display: grid;
        gap: 6px;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        list-style: none;
        margin: 0;
        padding: 0;
      }

      .review-facts {
        display: grid;
        gap: 10px;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        list-style: none;
        margin: 18px 0 0;
        padding: 0;
      }

      .review-facts li {
        background: var(--paper, #fbfaf6);
        border: 1px solid var(--rule, #d8d6cf);
        display: grid;
        gap: 8px;
        padding: 18px;
      }

      .review-facts span {
        color: var(--ink-3, #6a6a6a);
        font-family: var(--mono, monospace);
        font-size: 0.68rem;
        letter-spacing: 0.16em;
        text-transform: uppercase;
      }

      @media (max-width: 760px) {
        .local-hours .hours-list,
        .review-facts {
          grid-template-columns: 1fr;
        }
      }
""".rstrip()


ONARA_TYPOGRAPHY_LOCK_CSS = """
      /* onara-typography-lock */
      html,
      body {
        font-family: var(--ui);
        -webkit-font-smoothing: antialiased;
        font-feature-settings: "ss01", "ss03";
        font-synthesis-weight: none;
        text-rendering: optimizeLegibility;
      }

      body,
      button,
      input,
      select,
      textarea {
        font-family: var(--ui);
      }

      h1,
      h2,
      h3,
      .serif,
      .serif-italic,
      .display,
      .hero h1,
      .hero-copy h1,
      .hero-title,
      .headline,
      [data-component="hero"] h1,
      [data-component="hero"] .display,
      .section-head h2 {
        font-family: var(--serif) !important;
        font-optical-sizing: auto;
        font-synthesis: none;
        font-variation-settings: "wght" 400, "opsz" 72;
        font-weight: 400 !important;
        letter-spacing: -0.04em !important;
        line-height: 0.95 !important;
        text-wrap: balance;
      }

      h1 *,
      h2 *,
      h3 *,
      .serif *,
      .display *,
      .hero h1 *,
      .hero-copy h1 *,
      [data-component="hero"] h1 * {
        font-weight: inherit !important;
      }

      .serif-italic,
      h1 em,
      h2 em,
      .display em,
      [data-component="hero"] h1 em {
        font-style: italic;
        font-variation-settings: "wght" 300, "opsz" 72;
        font-weight: 300 !important;
      }

      h1,
      .hero h1,
      .hero-copy h1,
      .hero-title,
      .headline,
      [data-component="hero"] h1,
      .display {
        font-size: clamp(4rem, 8.5vw, 7.5rem);
        max-width: 12ch;
      }

      h2,
      .section-head h2 {
        font-size: clamp(2.8rem, 5.4vw, 5.5rem);
        max-width: 13ch;
      }

      .eyebrow,
      .mono,
      .chip-mono,
      .kicker,
      .meta,
      .badge,
      .pill,
      .proof-label,
      .stat-label,
      label,
      small,
      nav a {
        font-family: var(--mono);
      }

      .hand,
      .script,
      .handwritten {
        font-family: var(--hand);
      }

      .review-summary-card {
        background: color-mix(in srgb, var(--accent, #c76f35) 10%, var(--paper, #fbfaf6));
        border: 1px solid var(--rule, #d8d6cf);
        display: grid;
        gap: 10px;
        margin-bottom: clamp(18px, 3vw, 32px);
        padding: clamp(18px, 3vw, 28px);
      }

      .review-stars {
        color: var(--accent-ink, #8a461f);
        display: flex;
        font-family: var(--serif);
        font-size: clamp(1.35rem, 2.2vw, 2rem);
        gap: 4px;
        letter-spacing: 0.02em;
        line-height: 1;
      }

      .review-summary-card strong {
        font-family: var(--serif);
        font-size: clamp(1.5rem, 3vw, 2.4rem);
        font-weight: 400;
        letter-spacing: -0.03em;
        line-height: 1;
      }

      @media (max-width: 760px) {
        h1,
        .hero h1,
        .display {
          font-size: clamp(3.1rem, 15vw, 5.2rem);
          line-height: 0.94;
        }

        h2,
        .section-head h2 {
          font-size: clamp(2.35rem, 11vw, 4rem);
          line-height: 0.96;
        }
      }
""".rstrip()


ONARA_ROOT_RESET_CSS = """
      /* onara-root-reset */
      *,
      *::before,
      *::after {
        box-sizing: border-box;
      }

      html,
      body {
        margin: 0 !important;
        padding: 0 !important;
        min-width: 0;
      }

      body {
        min-height: 100%;
      }
""".rstrip()


ONARA_SPACING_LOCK_CSS = """
      /* onara-spacing-lock */
      html,
      body {
        margin: 0 !important;
        padding: 0 !important;
      }

      body {
        overflow-x: clip;
      }

      main {
        overflow: clip;
      }

      .hero,
      section.hero,
      [data-component="hero"] {
        min-height: auto !important;
        padding-block: clamp(40px, 6vw, 82px) !important;
        align-items: start;
        overflow: clip;
      }

      .hero,
      [data-component="hero"] {
        gap: clamp(24px, 4vw, 58px);
      }

      .hero > *,
      [data-component="hero"] > * {
        min-width: 0;
      }

      main > section:not([data-component="hero"]),
      section.optional-section {
        padding-block: clamp(40px, 6vw, 76px);
      }

      .site-header {
        align-items: center;
      }

      .brand {
        line-height: 1.12;
        max-width: 34ch;
      }

      .hero-photo img {
        aspect-ratio: 16 / 10 !important;
        max-height: 330px;
        object-fit: cover;
      }

      .hero-side,
      .panel-stack,
      .proof-grid,
      .service-menu,
      .hero-proof {
        align-self: start;
      }

      @media (min-width: 900px) {
        .hero,
        [data-component="hero"] {
          grid-template-columns: minmax(0, 1.04fr) minmax(320px, 0.76fr);
        }
      }

      @media (max-width: 899px) {
        .hero,
        [data-component="hero"] {
          padding-block: clamp(40px, 11vw, 72px) !important;
        }
      }
""".rstrip()


ONARA_HERO_CTA_LOCK_CSS = """
      /* onara-hero-cta-lock */
      .onara-injected-hero-cta {
        align-items: center;
        background: var(--accent, #c76f35);
        color: var(--paper, #fbfaf6);
        display: inline-flex;
        font-family: var(--ui, Inter, sans-serif);
        font-weight: 750;
        justify-content: center;
        line-height: 1;
        margin-top: clamp(18px, 2vw, 28px);
        min-height: 52px;
        padding: 0 clamp(20px, 3vw, 34px);
        text-decoration: none;
      }

      .onara-injected-hero-cta:focus-visible {
        outline: 3px solid color-mix(in srgb, var(--accent, #c76f35) 35%, transparent);
        outline-offset: 3px;
      }
""".rstrip()


ONARA_FIRST_FOLD_BALANCE_LOCK_CSS = """
      /* onara-first-fold-balance-lock */
      body > header,
      .site-header {
        align-items: center !important;
        column-gap: clamp(24px, 4vw, 58px) !important;
        display: grid !important;
        grid-template-columns: minmax(0, 1fr) auto max-content !important;
        min-height: 0 !important;
        padding-block: clamp(18px, 2.2vw, 30px) !important;
      }

      body > header > :first-child,
      .site-header > :first-child,
      .brand {
        align-items: center !important;
        align-self: center !important;
        display: flex !important;
        line-height: 1.08 !important;
        margin-block: 0 !important;
        min-height: 0 !important;
      }

      body > header nav,
      .site-header nav {
        align-items: center !important;
        align-self: center !important;
        display: flex !important;
        gap: clamp(18px, 2.5vw, 34px) !important;
        justify-content: center !important;
        line-height: 1 !important;
        margin: 0 !important;
        min-height: 0 !important;
      }

      body > header nav a,
      .site-header nav a {
        align-items: center !important;
        display: inline-flex !important;
        line-height: 1 !important;
      }

      body > header .cta,
      body > header .button,
      body > header .btn,
      body > header a[href^="tel"],
      .site-header .cta,
      .site-header .button,
      .site-header .btn,
      .site-header a[href^="tel"] {
        align-items: center !important;
        align-self: center !important;
        display: inline-flex !important;
        justify-content: center !important;
        line-height: 1 !important;
        margin-block: 0 !important;
        min-height: clamp(54px, 5vw, 70px) !important;
        padding: 0 clamp(24px, 3vw, 40px) !important;
        white-space: nowrap !important;
      }

      @media (min-width: 900px) {
        .hero,
        section.hero,
        [data-component="hero"] {
          padding-bottom: clamp(24px, 3.2vw, 46px) !important;
        }

        .hero + section,
        [data-component="hero"] + section,
        .hero + [data-component="services"],
        [data-component="hero"] + [data-component="services"],
        main > section[data-component="services"] {
          margin-top: 0 !important;
          padding-top: clamp(28px, 4vw, 54px) !important;
        }

        .hero-side,
        .panel-stack,
        .side-panel {
          align-self: start !important;
          display: grid;
          gap: clamp(12px, 1.6vw, 18px) !important;
        }

        .hero-side > *,
        .panel-stack > *,
        .side-panel > * {
          min-width: 0;
        }

        .hero-side .hero-photo,
        .panel-stack .hero-photo,
        .side-panel .hero-photo,
        .hero-side figure,
        .panel-stack figure,
        .side-panel figure {
          margin: 0 !important;
        }

        .hero-side .hero-photo img,
        .panel-stack .hero-photo img,
        .side-panel .hero-photo img,
        .hero-side figure img,
        .panel-stack figure img,
        .side-panel figure img {
          aspect-ratio: 16 / 9 !important;
          display: block;
          max-height: clamp(190px, 22vw, 255px) !important;
          object-fit: cover;
          width: 100%;
        }

        .hero-side .local-card,
        .panel-stack .local-card,
        .side-panel .local-card,
        .hero-side .detail-card,
        .panel-stack .detail-card,
        .side-panel .detail-card,
        .hero-side .proof-card,
        .panel-stack .proof-card,
        .side-panel .proof-card,
        .hero-side .hours-card,
        .panel-stack .hours-card,
        .side-panel .hours-card {
          padding: clamp(16px, 2vw, 24px) !important;
        }
      }

      .hours-card {
        display: grid !important;
        gap: clamp(12px, 2vw, 18px) !important;
        grid-template-columns: minmax(0, 1fr) auto !important;
      }

      .hours-card > strong:first-of-type,
      .hours-card h3,
      .hours-card h4 {
        grid-column: 1 / 2 !important;
        font-family: var(--serif, Georgia, serif);
        font-size: clamp(1.35rem, 2.4vw, 2rem) !important;
        font-weight: 400 !important;
        letter-spacing: -0.035em !important;
        line-height: 1 !important;
        margin: 0 !important;
        max-width: 12ch;
      }

      .hours-card > a[href^="tel"],
      .hours-card .phone,
      .hours-card .phone-number {
        align-self: start !important;
        color: var(--ink-2, #343434);
        font-family: var(--mono, monospace);
        font-size: clamp(0.9rem, 1.4vw, 1.1rem);
        grid-column: 2 / 3 !important;
        justify-self: end !important;
        line-height: 1.15 !important;
        margin-top: 0.2em !important;
        white-space: nowrap;
      }

      .hours-card .hours-list {
        display: grid !important;
        gap: 7px 16px !important;
        grid-column: 1 / -1 !important;
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        list-style: none !important;
        margin: clamp(8px, 1.5vw, 14px) 0 0 !important;
        padding: 0 !important;
      }

      .hours-card .hours-list li {
        color: var(--ink-3, #6a6a6a);
        font-size: clamp(0.92rem, 1.25vw, 1rem);
        line-height: 1.35;
        min-width: 0;
        overflow-wrap: anywhere;
      }

      .hours-card > a:not([href^="tel"]),
      .hours-card > p,
      .hours-card > .hours-cta,
      .hours-card > .primary-cta {
        grid-column: 1 / -1 !important;
      }

      .hours-card > .hours-cta,
      .hours-card > .primary-cta {
        justify-self: start !important;
      }

      @media (max-width: 640px) {
        body > header,
        .site-header {
          grid-template-columns: 1fr !important;
          row-gap: 18px !important;
        }

        body > header nav,
        .site-header nav {
          justify-content: start !important;
        }

        body > header .cta,
        body > header .button,
        body > header .btn,
        .site-header .cta,
        .site-header .button,
        .site-header .btn {
          justify-self: start !important;
        }

        .hours-card {
          grid-template-columns: 1fr !important;
        }

        .hours-card > a[href^="tel"],
        .hours-card .phone,
        .hours-card .phone-number {
          grid-column: 1 / -1 !important;
          justify-self: start !important;
        }

        .hours-card .hours-list {
          grid-template-columns: 1fr !important;
        }
      }
""".rstrip()
