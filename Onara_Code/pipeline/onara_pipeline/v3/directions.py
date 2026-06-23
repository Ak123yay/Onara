from __future__ import annotations

import json

from pydantic import ValidationError

from onara_pipeline.agents.contracts import AnalystOutput, ContentOutput, StyleOutput
from onara_pipeline.agents.json_utils import parse_json_model
from onara_pipeline.ai_client import AIClient, AIClientError, AIMessage, AIRequest
from onara_pipeline.ai_client.model_picker import get_agent_model_route
from onara_pipeline.config import Settings
from onara_pipeline.job_queue import PipelineJob
from onara_pipeline.v2.contracts import GenerationSpec
from onara_pipeline.v3.contracts import DesignDirection, DirectionSet


async def generate_directions(
    *,
    ai_client: AIClient,
    analyst: AnalystOutput,
    content: ContentOutput,
    job: PipelineJob,
    settings: Settings,
    spec: GenerationSpec,
    style: StyleOutput,
) -> list[DesignDirection]:
    route = get_agent_model_route(
        "agent_03_style",
        ollama_fallback_model=settings.ollama_fallback_model,
        ollama_primary_model=settings.ollama_primary_model,
    )
    prompt = f"""Create exactly three distinct design directions for one local-business website.

Business brief:
{json.dumps(spec.brief.model_dump(), ensure_ascii=True, default=str)}

Content:
{json.dumps(content.model_dump(), ensure_ascii=True, default=str)}

Analysis:
{json.dumps(analyst.model_dump(), ensure_ascii=True, default=str)}

Existing style:
{json.dumps(style.model_dump(), ensure_ascii=True, default=str)}

User preferences:
{json.dumps(job.style_preferences, ensure_ascii=True, default=str)}

Return JSON only:
{{
  "directions": [
    {{
      "key": "short-id",
      "name": "human-readable name",
      "recipe": "short visual recipe",
      "layout": "phone-first | trust-led | service-grid | split-hero | editorial",
      "palette": "copper | navy | forest | charcoal | clay",
      "hero_composition": "specific composition",
      "proof_strategy": "specific factual proof treatment",
      "image_strategy": "how verified images are used or how CSS visuals replace them",
      "mobile_strategy": "specific narrow-screen behavior"
    }}
  ]
}}

Rules:
- All three layouts and hero compositions must differ.
- Do not invent business facts.
- Avoid generic centered SaaS heroes, excessive pills, and large empty areas.
- Favor editorial contractor layouts, clear local proof, strong service hierarchy, and obvious contact actions.
- Use only the listed enum values."""
    try:
        response = await ai_client.generate_text(
            route=route,
            request=AIRequest(
                max_tokens=1800,
                messages=[
                    AIMessage(
                        role="system",
                        content=(
                            "You are Onara's senior design director. Produce concise, implementable, "
                            "visually distinct website direction manifests as valid JSON."
                        ),
                    ),
                    AIMessage(role="user", content=prompt),
                ],
                metadata={"agent_id": "v3_design_director", "job_id": job.job_id},
                temperature=0.35,
            ),
        )
        directions = parse_json_model(response.content, DirectionSet).directions
        valid = _distinct_directions(directions)
        if len(valid) >= 2:
            return _fill_to_three(valid, spec)
    except (AIClientError, ValidationError, ValueError):
        pass
    return _fallback_directions(spec)


def select_directions(directions: list[DesignDirection]) -> tuple[DesignDirection, DesignDirection]:
    valid = _distinct_directions(directions)
    if len(valid) < 2:
        valid = _fallback_directions(None)
    return valid[0], valid[1]


def _distinct_directions(directions: list[DesignDirection]) -> list[DesignDirection]:
    output: list[DesignDirection] = []
    seen_layouts: set[str] = set()
    seen_compositions: set[str] = set()
    for direction in directions:
        composition = " ".join(direction.hero_composition.lower().split())[:120]
        if direction.layout in seen_layouts or composition in seen_compositions:
            continue
        seen_layouts.add(direction.layout)
        seen_compositions.add(composition)
        output.append(direction)
    return output


def _fill_to_three(
    directions: list[DesignDirection],
    spec: GenerationSpec | None,
) -> list[DesignDirection]:
    output = list(directions)
    for fallback in _fallback_directions(spec):
        if len(output) >= 3:
            break
        if all(item.layout != fallback.layout for item in output):
            output.append(fallback)
    return output[:3]


def _fallback_directions(spec: GenerationSpec | None) -> list[DesignDirection]:
    recipe_a = spec.recipe_a if spec else "editorial-trust"
    recipe_b = spec.recipe_b if spec else "service-led"
    return [
        DesignDirection(
            key="local-editorial",
            name="Local Editorial",
            recipe=recipe_a,
            layout="trust-led",
            palette="copper",
            hero_composition=(
                "Asymmetrical editorial headline beside a compact local-proof and contact stack, "
                "with services beginning immediately below the fold."
            ),
            proof_strategy="Use verified rating, review count, service area, hours, and phone as compact factual surfaces.",
            image_strategy="Frame one verified business image as an editorial proof asset; use a textured CSS panel when absent.",
            mobile_strategy="Put headline, primary action, compact proof, then image in one readable column without fixed heights.",
        ),
        DesignDirection(
            key="service-command",
            name="Service Command",
            recipe=recipe_b,
            layout="service-grid",
            palette="navy",
            hero_composition=(
                "Utility-led split hero with direct phone action, concise business promise, and a "
                "visible service menu occupying the secondary column."
            ),
            proof_strategy="Lead with services and availability, then use aggregate Google proof and local details.",
            image_strategy="Use verified images inside later service or proof panels instead of allowing photography to dominate.",
            mobile_strategy="Show the phone action first, followed by a two-column-to-one-column service menu and compact proof.",
        ),
        DesignDirection(
            key="photo-split",
            name="Photo Split",
            recipe="photo-led",
            layout="split-hero",
            palette="forest",
            hero_composition=(
                "Full-width split composition with an oversized but bounded headline and one strong "
                "verified image, followed by a contrasting service and estimate band."
            ),
            proof_strategy="Place review and location proof directly adjacent to the image and repeat only the strongest facts.",
            image_strategy="Use up to three verified photos with consistent aspect ratios, descriptive alt text, and no stock treatment.",
            mobile_strategy="Place the headline and CTA before the image, crop images consistently, and eliminate side-by-side overflow.",
        ),
    ]

