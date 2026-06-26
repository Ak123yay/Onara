from __future__ import annotations

import re

from onara_pipeline.agents.context import build_business_context
from onara_pipeline.agents.contracts import (
    AnalystOutput,
    ContentOutput,
    PlannerOutput,
    StyleOutput,
)
from onara_pipeline.agents.fallbacks import fallback_codegen
from onara_pipeline.v2.repair import deterministic_release_hardening
from onara_pipeline.v3.contracts import ComponentArtifact, DesignDirection


PALETTES: dict[str, dict[str, str]] = {
    "copper": {
        "primary": "#2d211b",
        "secondary": "#b85322",
        "background": "#fbf7ef",
        "surface": "#fffdf8",
        "text_primary": "#191714",
        "text_secondary": "#554d46",
        "border": "#d8cfc4",
    },
    "navy": {
        "primary": "#123354",
        "secondary": "#c84f1d",
        "background": "#f5f8fb",
        "surface": "#ffffff",
        "text_primary": "#13212e",
        "text_secondary": "#465b6d",
        "border": "#cad7e1",
    },
    "forest": {
        "primary": "#18432d",
        "secondary": "#a84f24",
        "background": "#f6f7f0",
        "surface": "#fffef8",
        "text_primary": "#17251d",
        "text_secondary": "#4c5b51",
        "border": "#ccd4c9",
    },
    "charcoal": {
        "primary": "#22201e",
        "secondary": "#c05b2a",
        "background": "#f5f2ec",
        "surface": "#fffdf8",
        "text_primary": "#191816",
        "text_secondary": "#55514c",
        "border": "#d4cec5",
    },
    "clay": {
        "primary": "#553026",
        "secondary": "#a84424",
        "background": "#fbf3eb",
        "surface": "#fffaf5",
        "text_primary": "#241815",
        "text_secondary": "#624f48",
        "border": "#ddc9be",
    },
}

V3_GUARDRAILS = """
/* Onara Pipeline V3 guardrails */
[data-component] {
  min-width: 0;
}

[data-component] p,
[data-component] li,
[data-component] label,
[data-component] small {
  overflow-wrap: anywhere;
}

[data-component] a,
[data-component] button,
[data-component] input,
[data-component] select,
[data-component] textarea,
[data-component] [role="button"] {
  min-height: 44px;
  min-width: 44px;
}

[data-component] input,
[data-component] select,
[data-component] textarea {
  color: var(--ink);
  background: var(--paper);
  border-color: var(--rule-2);
}

[data-component] img {
  display: block;
  height: auto;
  max-width: 100%;
}

.hero-card p,
.hero-card span,
.hero-photo figcaption {
  color: #f4efe7;
}

@media (max-width: 780px) {
  [data-component] [class*="grid"],
  [data-component] [class*="split"],
  [data-component] [class*="columns"] {
    grid-template-columns: minmax(0, 1fr);
  }
}
""".strip()


def direction_style(style: StyleOutput, direction: DesignDirection) -> StyleOutput:
    palette = PALETTES[direction.palette]
    return style.model_copy(
        update={
            "colors": style.colors.model_copy(update=palette),
            "style_notes": (
                f"{style.style_notes} V3 direction: {direction.name}. "
                f"{direction.hero_composition} {direction.proof_strategy}"
            ),
        },
        deep=True,
    )


def build_baseline(
    *,
    analyst: AnalystOutput,
    business_data: dict,
    content: ContentOutput,
    direction: DesignDirection,
    planner: PlannerOutput,
    style: StyleOutput,
    style_preferences: dict,
) -> tuple[str, dict[str, str], StyleOutput]:
    effective_preferences = {
        **style_preferences,
        "layout": direction.layout,
    }
    effective_style = direction_style(style, direction)
    context = build_business_context(business_data, effective_preferences)
    baseline = fallback_codegen(
        analyst=analyst,
        content=content,
        context=context,
        planner=planner,
        style=effective_style,
        style_preferences=effective_preferences,
        model="pipeline-v3-template",
        provider="deterministic",
    )
    return baseline.html, baseline.component_files, effective_style


def assemble_candidate(
    *,
    baseline_html: str,
    components: list[ComponentArtifact],
    direction: DesignDirection,
) -> tuple[str, dict[str, str]]:
    html = baseline_html
    component_files: dict[str, str] = {}
    css_blocks: list[str] = []
    for artifact in components:
        html = _replace_component(html, artifact.component_id, artifact.html)
        component_files[f"components/{artifact.component_id}.html"] = artifact.html
        if artifact.css.strip():
            css_blocks.append(
                f"/* V3 component: {artifact.component_id} */\n{artifact.css.strip()}"
            )

    html = _append_css(
        html,
        "\n\n".join(
            [
                V3_GUARDRAILS,
                f'.site-shell {{ --v3-direction: "{direction.key}"; }}',
                *css_blocks,
            ]
        ),
    )
    html = deterministic_release_hardening(html)
    component_files["index.html"] = html
    return html, component_files


def fallback_component(
    component_id: str,
    baseline_files: dict[str, str],
) -> str | None:
    return baseline_files.get(f"components/{component_id}.html")


def _replace_component(document: str, component_id: str, replacement: str) -> str:
    pattern = re.compile(
        rf"<(?P<tag>header|nav|main|section|footer|aside)\b[^>]*"
        rf"data-component=[\"']{re.escape(component_id)}[\"'][^>]*>.*?</(?P=tag)>",
        flags=re.IGNORECASE | re.DOTALL,
    )
    if pattern.search(document):
        return pattern.sub(lambda _: replacement, document, count=1)

    raise ValueError(f"Placeholder for component {component_id} not found in document")


def _append_css(document: str, css: str) -> str:
    index = document.lower().rfind("</style>")
    if index < 0:
        return document
    return document[:index] + "\n" + css + "\n" + document[index:]

