from __future__ import annotations

import hashlib
import re

from pydantic import ValidationError

from onara_pipeline.agents.json_utils import parse_json_model
from onara_pipeline.ai_client import AIClient, AIClientError, AIMessage, AIRequest
from onara_pipeline.ai_client.model_picker import ModelRoute
from onara_pipeline.v2.contracts import CandidateArtifact, PatchSet

RELEASE_HARDENING_MARKER = "Onara deterministic release hardening"
RELEASE_GATE_REPAIR_MARKER = "Onara deterministic release gate repair"
RELEASE_HARDENING_CSS = f"""
/* {RELEASE_HARDENING_MARKER} */
a[href],
button,
input,
select,
textarea,
[role="button"] {{
  min-block-size: 24px;
  min-inline-size: 24px;
}}

button,
input,
select,
textarea,
.primary-cta,
.header-cta,
.contact-cta,
nav a,
.site-header a {{
  min-height: 44px;
}}

nav a,
.site-header a,
.primary-cta,
.header-cta,
.contact-cta {{
  align-items: center;
  display: inline-flex;
}}

:focus-visible {{
  outline: 3px solid var(--choice-accent, var(--accent, #c76f35));
  outline-offset: 3px;
}}

.hero-card span,
.hero-card p,
.hero-photo figcaption {{
  color: #eee9df;
}}
""".strip()

RELEASE_GATE_REPAIR_CSS = f"""
/* {RELEASE_GATE_REPAIR_MARKER} */
html,
body {{
  max-width: 100%;
  overflow-x: clip;
}}

img,
picture,
video,
svg,
canvas {{
  max-width: 100%;
}}

img,
video {{
  height: auto;
}}

main,
section,
header,
footer,
nav,
form,
.container,
.wrapper,
[class*="grid"],
[class*="flex"] {{
  min-width: 0;
}}

a[href],
button,
input,
select,
textarea,
[role="button"] {{
  min-width: 24px;
  min-height: 24px;
}}

.primary-cta,
.header-cta,
.contact-cta,
a[href^="tel:"],
button[type="submit"],
input[type="submit"] {{
  min-width: 44px;
  min-height: 44px;
}}

input,
select,
textarea {{
  max-width: 100%;
}}

p,
h1,
h2,
h3,
h4,
li,
a,
button,
label {{
  overflow-wrap: anywhere;
}}

@media (max-width: 768px) {{
  body {{
    width: 100%;
  }}

  main,
  section,
  header,
  footer,
  nav {{
    max-width: 100%;
  }}

  [class*="grid"] {{
    grid-template-columns: minmax(0, 1fr);
  }}

  [class*="row"],
  [class*="columns"],
  [class*="split"] {{
    flex-wrap: wrap;
  }}
}}
""".strip()


async def targeted_repair(
    candidate: CandidateArtifact,
    *,
    ai_client: AIClient,
    route: ModelRoute,
) -> str | None:
    if not candidate.warnings and not candidate.hard_blockers:
        return None
    if any(_unrepairable(issue) for issue in candidate.hard_blockers):
        return None

    component_hashes = _component_hashes(candidate.html)
    document_hash = _hash(candidate.html)
    prompt = f"""Create one narrow patch for this generated website.

Issues:
{candidate.hard_blockers + candidate.warnings}

Rules:
- Return JSON only.
- Do not return a replacement document.
- Prefer css_append for spacing, overflow, hierarchy, and target-size fixes.
- replacements keys must be existing data-component IDs.
- Each replacement must include the supplied expected_source_hash and complete replacement root HTML.
- Do not add scripts, event handlers, iframes, new claims, new reviews, or external form actions.
- Preserve business copy and component order.
- expected_document_hash must equal {document_hash}.

Component hashes:
{component_hashes}

Current HTML:
{candidate.html}

JSON shape:
{{
  "expected_document_hash": "{document_hash}",
  "css_append": "small CSS patch or empty string",
  "replacements": {{
    "component_id": {{
      "expected_source_hash": "hash from component hashes",
      "html": "<section data-component=\\"component_id\\">...</section>"
    }}
  }},
  "summary": "short description"
}}"""
    try:
        response = await ai_client.generate_text(
            route=route,
            request=AIRequest(
                max_tokens=5000,
                messages=[
                    AIMessage(
                        role="system",
                        content="You repair only the reported website components. Return a bounded JSON patch.",
                    ),
                    AIMessage(role="user", content=prompt),
                ],
                metadata={"agent_id": "targeted_repair", "candidate": candidate.key},
                temperature=0.08,
            ),
        )
        patch = parse_json_model(response.content, PatchSet)
        return apply_patch_set(candidate.html, patch)
    except (AIClientError, ValidationError, ValueError):
        return None


def deterministic_release_hardening(html: str) -> str:
    if RELEASE_HARDENING_MARKER in html:
        return html

    index = html.lower().rfind("</style>")
    if index < 0:
        return html
    return (
        html[:index]
        + "\n"
        + RELEASE_HARDENING_CSS
        + "\n"
        + html[index:]
    )


def deterministic_release_gate_repair(html: str, issues: list[str]) -> str:
    if not issues:
        return html

    fixed = _add_accessible_names(html)
    if RELEASE_GATE_REPAIR_MARKER in fixed:
        return fixed

    index = fixed.lower().rfind("</style>")
    if index < 0:
        return fixed
    return fixed[:index] + "\n" + RELEASE_GATE_REPAIR_CSS + "\n" + fixed[index:]


def _add_accessible_names(html: str) -> str:
    def repair_control(match: re.Match[str]) -> str:
        tag = match.group("tag")
        attributes = match.group("attributes")
        content = match.group("content")
        if re.search(r"\baria-label(?:ledby)?\s*=", attributes, flags=re.IGNORECASE):
            return match.group(0)
        if re.sub(r"<[^>]+>", " ", content).strip():
            return match.group(0)

        title = _attribute_value(attributes, "title")
        href = _attribute_value(attributes, "href")
        label = title or _label_for_href(href) or ("Submit" if tag.lower() == "button" else "Open link")
        return f'<{tag}{attributes} aria-label="{label}">{content}</{tag}>'

    return re.sub(
        r"<(?P<tag>a|button)\b(?P<attributes>[^>]*)>(?P<content>.*?)</(?P=tag)>",
        repair_control,
        html,
        flags=re.IGNORECASE | re.DOTALL,
    )


def _attribute_value(attributes: str, name: str) -> str:
    match = re.search(
        rf"\b{re.escape(name)}\s*=\s*([\"'])(?P<value>.*?)\1",
        attributes,
        flags=re.IGNORECASE | re.DOTALL,
    )
    return re.sub(r"\s+", " ", match.group("value")).strip() if match else ""


def _label_for_href(href: str) -> str:
    lowered = href.lower()
    if lowered.startswith("tel:"):
        return "Call business"
    if lowered.startswith("mailto:"):
        return "Email business"
    if lowered.startswith("#"):
        target = lowered[1:].replace("-", " ").replace("_", " ").strip()
        return f"Go to {target}" if target else "Open section"
    return ""


def apply_patch_set(html: str, patch: PatchSet) -> str:
    if _hash(html) != patch.expected_document_hash:
        raise ValueError("Targeted patch document hash does not match")
    if _unsafe_patch(patch.css_append):
        raise ValueError("Targeted patch contains unsafe CSS")

    fixed = html
    for component_id, replacement in patch.replacements.items():
        source = _component_html(fixed, component_id)
        if not source or _hash(source) != replacement.expected_source_hash:
            raise ValueError(f"Targeted patch source hash mismatch for {component_id}")
        if f'data-component="{component_id}"' not in replacement.html and f"data-component='{component_id}'" not in replacement.html:
            raise ValueError(f"Replacement for {component_id} lost its component marker")
        if _unsafe_html(replacement.html):
            raise ValueError(f"Replacement for {component_id} contains unsafe HTML")
        fixed = fixed.replace(source, replacement.html, 1)

    if patch.css_append.strip():
        index = fixed.lower().rfind("</style>")
        if index < 0:
            raise ValueError("Targeted CSS patch could not find style element")
        fixed = fixed[:index] + "\n/* Onara targeted repair */\n" + patch.css_append.strip() + "\n" + fixed[index:]
    return fixed


def _component_hashes(html: str) -> dict[str, str]:
    output = {}
    for match in re.finditer(
        r"<(?P<tag>header|nav|main|section|footer)\b[^>]*data-component=[\"'](?P<id>[a-z0-9_-]+)[\"'][^>]*>.*?</(?P=tag)>",
        html,
        flags=re.IGNORECASE | re.DOTALL,
    ):
        output[match.group("id")] = _hash(match.group(0))
    return output


def _component_html(html: str, component_id: str) -> str | None:
    match = re.search(
        rf"<(?P<tag>header|nav|main|section|footer)\b[^>]*data-component=[\"']{re.escape(component_id)}[\"'][^>]*>.*?</(?P=tag)>",
        html,
        flags=re.IGNORECASE | re.DOTALL,
    )
    return match.group(0) if match else None


def _hash(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def _unsafe_patch(value: str) -> bool:
    lowered = value.lower()
    return "@import" in lowered or "javascript:" in lowered or "expression(" in lowered


def _unsafe_html(value: str) -> bool:
    lowered = value.lower()
    return (
        "<script" in lowered
        or "<iframe" in lowered
        or "javascript:" in lowered
        or bool(re.search(r"\son[a-z]+\s*=", lowered))
    )


def _unrepairable(issue: str) -> bool:
    lowered = issue.lower()
    return any(
        marker in lowered
        for marker in (
            "html document structure",
            "site header is missing",
            "hero section is missing",
            "unsafe executable",
            "primary conversion cta is missing",
            "browser audit failed",
            "browser audit timed out",
        )
    )
