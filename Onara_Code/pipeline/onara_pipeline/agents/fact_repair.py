import html as html_lib
import re
from typing import Any

from onara_pipeline.agents.context import BusinessContext, build_business_context
from onara_pipeline.agents.onara_theme import ONARA_FONT_IMPORT


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

    fixed, changed = _append_css_once(fixed, "onara-spacing-lock", ONARA_SPACING_LOCK_CSS)
    if changed:
        fixes.append("Applied Onara spacing lock to prevent oversized hero whitespace")

    return fixed, fixes


def onara_typography_issues(html: str) -> list[str]:
    lower = html.lower()
    issues: list[str] = []

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
            fixes.append("Replaced unsupported review cards with honest aggregate Google review proof")

    credentials_supplied = _credentials_supplied(context, business_data)
    license_issues = license_integrity_issues(
        fixed,
        business_data=business_data,
        style_preferences=style_preferences,
    )
    if not credentials_supplied and (_component_section(fixed, "license_proof") or license_issues):
        fixed, changed = _replace_component_section(fixed, "license_proof", _hidden_component_marker("license_proof"))
        if changed:
            fixes.append("Removed visible license proof section because no credential data was supplied")

        stripped = _remove_unsupplied_credential_blocks(fixed)
        stripped = _strip_unsupplied_credential_claims(stripped)
        if stripped != fixed:
            fixed = stripped
            fixes.append("Removed unsupported license, insurance, bonded, or certified trust claims")

    return fixed, _unique(fixes)


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
        marker = _hidden_component_marker("reviews")
        fixed, changed = _replace_component_section(fixed, "reviews", marker)
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


def review_license_integrity_issues(
    html: str,
    *,
    business_data: dict[str, Any],
    style_preferences: dict[str, Any] | None = None,
) -> list[str]:
    return _unique(
        [
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

    if not _has_credential_claim(html.lower()):
        return []

    return ["Generated trust or license proof claims credentials that were not supplied"]


def hours_visible(html: str, hours: list[str]) -> bool:
    lower = html.lower()
    compact_html = _compact_hour_text(lower)
    for item in hours:
        normalized = re.sub(r"\s+", " ", str(item).strip().lower())
        if normalized and normalized in lower:
            return True
        compact_normalized = _compact_hour_text(normalized)
        if compact_normalized and compact_normalized in compact_html:
            return True
        if ":" in normalized:
            time_part = normalized.split(":", 1)[1].strip()
            if time_part and time_part in lower:
                return True
            compact_time_part = _compact_hour_text(time_part)
            if compact_time_part and compact_time_part in compact_html:
                return True
    return False


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

    return hours[0]


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


def _aggregate_review_section(context: BusinessContext) -> str:
    rating = html_lib.escape(_rating_line(context) or "Google review count not supplied")
    service_area = html_lib.escape(context.service_area)
    return f"""
    <section class="optional-section reviews" data-component="reviews" id="reviews">
      <div class="section-head">
        <span class="eyebrow">Google reviews</span>
        <h2>Google proof without fake quotes.</h2>
        <p>{rating}</p>
      </div>
      <div class="proof-grid review-proof-grid">
        <article class="proof-card review-proof-card">
          <strong>{rating}</strong>
          <p>Aggregate Google review proof from the supplied business profile.</p>
        </article>
        <article class="proof-card review-proof-card">
          <strong>No review quotes supplied</strong>
          <p>This page does not invent customer testimonials. Add real quotes after approval.</p>
        </article>
        <article class="proof-card review-proof-card">
          <strong>Local profile signal</strong>
          <p>Customers can verify rating, hours, address, and service area details for {service_area}.</p>
        </article>
      </div>
    </section>
""".rstrip()


def _component_section(html: str, component_id: str) -> str:
    match = re.search(_component_section_pattern(component_id), html, flags=re.IGNORECASE | re.DOTALL)
    return match.group(0) if match else ""


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


def _hidden_component_marker(component_id: str) -> str:
    return (
        f'<section class="optional-section {html_lib.escape(component_id)} merged-section-marker" '
        f'data-component="{html_lib.escape(component_id)}" id="{html_lib.escape(component_id)}" '
        'hidden aria-hidden="true"></section>'
    )


def _is_hidden_section(section: str) -> bool:
    opening = re.search(r"<section\b[^>]*>", section, flags=re.IGNORECASE)
    if not opening:
        return False

    tag = opening.group(0).lower()
    return " hidden" in tag or "aria-hidden=\"true\"" in tag or "aria-hidden='true'" in tag


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

    return _word_overlap(left_text, right_text) >= 0.6


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
    left_words = {word for word in re.findall(r"[a-z0-9]+", left.lower()) if len(word) > 3}
    right_words = {word for word in re.findall(r"[a-z0-9]+", right.lower()) if len(word) > 3}
    if not left_words or not right_words:
        return 0.0

    return len(left_words & right_words) / min(len(left_words), len(right_words))


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
            "credential status",
            "credential details pending",
            "credential details need",
            "verify before publishing",
            "license verification card",
            "license verification",
            "licensed and insured",
            "fully insured",
            "bonded",
            "license #",
            "lic #",
            "certified",
        )
    )


def _remove_unsupplied_credential_blocks(html: str) -> str:
    fixed = html

    def remove_if_credential(match: re.Match[str]) -> str:
        text = _visible_text(match.group(0)).lower()
        return "" if _has_credential_claim(text) else match.group(0)

    fixed = re.sub(
        r"<(?:article|li)\b[^>]*>.*?</(?:article|li)>",
        remove_if_credential,
        fixed,
        flags=re.IGNORECASE | re.DOTALL,
    )
    fixed = re.sub(
        r"<div\b(?=[^>]*class=[\"'][^\"']*(?:card|proof)[^\"']*[\"'])[^>]*>.*?</div>",
        remove_if_credential,
        fixed,
        flags=re.IGNORECASE | re.DOTALL,
    )
    return fixed


def _strip_unsupplied_credential_claims(html: str) -> str:
    replacements = (
        (r"\blicense verification card\s*\([^)]*\)", ""),
        (r"\blicense verification card\b", ""),
        (r"\blicense verification\b", ""),
        (r"\blicensed and insured\b", ""),
        (r"\bfully insured\b", ""),
        (r"\bbonded\b", ""),
        (r"\blicense\s*#\s*[\w-]+", "license detail not supplied"),
        (r"\blic\s*#\s*[\w-]+", "license detail not supplied"),
        (r"\bcertified\b", ""),
    )
    fixed = html
    for pattern, replacement in replacements:
        fixed = re.sub(pattern, replacement, fixed, flags=re.IGNORECASE)
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


LOCAL_HOURS_CSS = """
      .local-hours .hours-card {
        display: grid;
        gap: 12px;
      }

      .local-hours .hours-list {
        color: var(--ink-3, #6a6a6a);
        display: grid;
        gap: 6px;
        list-style: none;
        margin: 0;
        padding: 0;
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
      .section-head h2 {
        font-family: var(--serif);
        font-optical-sizing: auto;
        font-weight: 400;
        letter-spacing: -0.045em;
        line-height: 0.92;
        text-wrap: balance;
      }

      h1,
      .hero h1,
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


ONARA_SPACING_LOCK_CSS = """
      /* onara-spacing-lock */
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
        padding-block: clamp(56px, 7vw, 104px) !important;
        align-items: center;
        overflow: clip;
      }

      .hero,
      [data-component="hero"] {
        gap: clamp(24px, 4vw, 64px);
      }

      .hero > *,
      [data-component="hero"] > * {
        min-width: 0;
      }

      main > section:not([data-component="hero"]),
      section.optional-section {
        padding-block: clamp(48px, 7vw, 88px);
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
