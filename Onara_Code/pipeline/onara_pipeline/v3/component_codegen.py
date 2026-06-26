from __future__ import annotations

import asyncio
import json
import re
from collections.abc import Awaitable, Callable

from onara_pipeline.agents.context import build_business_context, materialize_photo_tokens
from onara_pipeline.agents.contracts import (
    AnalystOutput,
    ComponentSpec,
    ContentOutput,
    PlannerOutput,
    StyleOutput,
)
from onara_pipeline.ai_client import AIClient, AIClientError, AIMessage, AIRequest
from onara_pipeline.ai_client.model_picker import ModelRoute
from onara_pipeline.config import Settings
from onara_pipeline.job_queue import PipelineJob
from onara_pipeline.rag import build_pattern_store
from onara_pipeline.agents.onara_theme import ONARA_THEME_CONTRACT
from onara_pipeline.v2.codegen import _route_after_model
from onara_pipeline.v3.assembler import fallback_component
from onara_pipeline.v3.contracts import ComponentArtifact, DesignDirection
from onara_pipeline.v3.quality import audit_component, component_fingerprint


ComponentCallback = Callable[[ComponentArtifact], Awaitable[None]]
HTML_START = "{COMPONENT_HTML_START}"
HTML_END = "{COMPONENT_HTML_END}"
CSS_START = "{COMPONENT_CSS_START}"
CSS_END = "{COMPONENT_CSS_END}"


async def generate_candidate_components(
    *,
    ai_client: AIClient,
    analyst: AnalystOutput,
    baseline_files: dict[str, str],
    candidate_key: str,
    content: ContentOutput,
    direction: DesignDirection,
    job: PipelineJob,
    planner: PlannerOutput,
    route: ModelRoute,
    settings: Settings,
    style: StyleOutput,
    persist_component: ComponentCallback,
) -> list[ComponentArtifact]:
    recovered = _recovered_components(job, candidate_key)

    async def build(component: ComponentSpec) -> ComponentArtifact:
        artifact = _recovered_artifact(
            candidate_key=candidate_key,
            component=component,
            row=recovered.get(component.id),
        )
        if artifact is None:
            artifact = await _generate_component(
                ai_client=ai_client,
                analyst=analyst,
                baseline_files=baseline_files,
                candidate_key=candidate_key,
                component=component,
                content=content,
                direction=direction,
                job=job,
                route=route,
                settings=settings,
                style=style,
            )
        await persist_component(artifact)
        return artifact

    tasks = [
        asyncio.create_task(build(component))
        for component in sorted(planner.components, key=lambda item: item.order)
    ]
    return await asyncio.gather(*tasks)


async def _generate_component(
    *,
    ai_client: AIClient,
    analyst: AnalystOutput,
    baseline_files: dict[str, str],
    candidate_key: str,
    component: ComponentSpec,
    content: ContentOutput,
    direction: DesignDirection,
    job: PipelineJob,
    route: ModelRoute,
    settings: Settings,
    style: StyleOutput,
) -> ComponentArtifact:
    reference = fallback_component(component.id, baseline_files)
    if not reference:
        return _fallback_artifact(
            baseline_files=baseline_files,
            candidate_key=candidate_key,
            component=component,
            warning="Approved template had no matching component",
        )

    rag_context = await _rag_context(
        component_id=component.id,
        industry=analyst.industryType,
        settings=settings,
    )
    feedback: list[str] = []
    active_route = route
    last_model = route.model
    last_provider = route.provider
    for attempt in range(1, settings.pipeline_v3_max_component_attempts + 1):
        prompt = _component_prompt(
            analyst=analyst,
            component=component,
            content=content,
            direction=direction,
            feedback=feedback,
            job=job,
            rag_context=rag_context,
            reference=reference,
            style=style,
        )
        try:
            response = await asyncio.wait_for(
                ai_client.generate_text(
                    route=active_route,
                    request=AIRequest(
                        max_tokens=settings.pipeline_v3_component_max_tokens,
                        messages=[
                            AIMessage(
                                role="system",
                                content=(
                                    "You are an expert frontend component engineer. Write one bounded, "
                                    "accessible local-business component. Follow output markers exactly."
                                ),
                            ),
                            AIMessage(role="user", content=prompt),
                        ],
                        metadata={
                            "agent_id": "v3_component_codegen",
                            "candidate": candidate_key,
                            "component": component.id,
                            "job_id": job.job_id,
                        },
                        temperature=0.18 if attempt == 1 else 0.05,
                    ),
                ),
                timeout=settings.pipeline_v3_component_timeout,
            )
            if str(response.finish_reason or "").lower() in {"length", "max_tokens"}:
                raise ValueError(
                    f"{response.model} stopped at its output limit before completing component {component.id}"
                )
            last_model = response.model
            last_provider = response.provider
            html, css = _extract_component(response.content, component.id)
            html = materialize_photo_tokens(
                html,
                build_business_context(job.business_data, job.style_preferences),
            )
            html = _ensure_component_class(html, component.id)
            audit = audit_component(
                component_id=component.id,
                css=css,
                html=html,
                spec=component,
            )
            if audit.eligible:
                return ComponentArtifact(
                    attempts=attempt,
                    candidate_key=candidate_key,
                    component_id=component.id,
                    css=css,
                    fallback_used=response.fallback_used,
                    fingerprint=component_fingerprint(html, css),
                    html=html,
                    model=response.model,
                    provider=response.provider,
                    warnings=audit.warnings,
                )
            feedback = audit.blockers
            active_route = _route_after_model(route, response.model) or route
        except (AIClientError, TimeoutError, ValueError) as exc:
            feedback = [str(exc)[:600]]
            active_route = _route_after_model(route, last_model) or route

    return _fallback_artifact(
        baseline_files=baseline_files,
        candidate_key=candidate_key,
        component=component,
        model=last_model,
        provider=last_provider,
        warning="Model component failed bounded validation: " + "; ".join(feedback[:3]),
    )


def _component_prompt(
    *,
    analyst: AnalystOutput,
    component: ComponentSpec,
    content: ContentOutput,
    direction: DesignDirection,
    feedback: list[str],
    job: PipelineJob,
    rag_context: str,
    reference: str,
    style: StyleOutput,
) -> str:
    return f"""Write only the `{component.id}` component for candidate {direction.name}.

{ONARA_THEME_CONTRACT}

Verified business facts:
{json.dumps(job.business_data, ensure_ascii=True, default=str)}

Approved content:
{json.dumps(content.model_dump(), ensure_ascii=True, default=str)}

Component specification:
{json.dumps(component.model_dump(), ensure_ascii=True, default=str)}

Design direction:
{json.dumps(direction.model_dump(), ensure_ascii=True, default=str)}

Approved design tokens:
{json.dumps(style.model_dump(), ensure_ascii=True, default=str)}

Relevant approved patterns:
{rag_context or "No additional pattern was available."}

Safe structural reference:
{reference}

Previous validation feedback:
{json.dumps(feedback, ensure_ascii=True)}

Output exactly:
{HTML_START}
<one semantic root with data-component="{component.id}" and class="c-{component.id} ...">
{HTML_END}
{CSS_START}
.c-{component.id} {{ /* component-scoped styles */ }}
{CSS_END}

Rules:
- Preserve verified facts and approved content. Do not invent claims, reviews, licenses, awards, guarantees, or years.
- Anti-brochure constraints: avoid generic centered layouts, oversized rounded pills, and plain templates.
- Use Fraunces for display serif typography, Inter for UI body copy, and JetBrains Mono for eyebrows/metadata.
- Return one root only and exactly one data-component attribute.
- Use semantic HTML and visible labels.
- Use no script, iframe, event handler, inline style, or external form action.
- Scope every CSS selector under .c-{component.id}.
- Use only existing color variables: --paper, --paper-2, --paper-3, --ink, --ink-2,
  --ink-3, --rule, --accent, --accent-ink, --choice-primary, --choice-accent,
  --choice-background, --choice-surface, --choice-text, --choice-muted, and --choice-border.
- Do not use hex, rgb, hsl, or oklch color literals.
- Do not style html, body, :root, main, generic tags, or other components.
- Controls and primary links must be at least 44px high.
- Use responsive grid/flex rules without fixed page widths or fixed section heights.
- Images must use supplied verified src values, descriptive alt text, width/height or aspect-ratio, and object-fit.
- Motion may use opacity and transform only and must respect prefers-reduced-motion.
- Improve the reference rather than copying it mechanically."""


def _extract_component(content: str, component_id: str) -> tuple[str, str]:
    value = content.strip().strip("`")
    html_match = re.search(
        rf"{re.escape(HTML_START)}\s*(.*?)\s*{re.escape(HTML_END)}",
        value,
        flags=re.IGNORECASE | re.DOTALL,
    )
    css_match = re.search(
        rf"{re.escape(CSS_START)}\s*(.*?)\s*{re.escape(CSS_END)}",
        value,
        flags=re.IGNORECASE | re.DOTALL,
    )
    if not html_match:
        html_match = re.search(
            rf"(<(?P<tag>header|nav|main|section|footer|aside)\b[^>]*"
            rf"data-component=[\"']{re.escape(component_id)}[\"'][^>]*>.*?</(?P=tag)>)",
            value,
            flags=re.IGNORECASE | re.DOTALL,
        )
    if not html_match:
        raise ValueError(f"Component {component_id} output did not contain a marked root")
    html = html_match.group(1).strip()
    css = css_match.group(1).strip() if css_match else ""
    css = re.sub(r"^```css\s*|\s*```$", "", css, flags=re.IGNORECASE)
    return html, css


def _ensure_component_class(html: str, component_id: str) -> str:
    opening = re.match(r"(?P<prefix><[a-z0-9-]+\b)(?P<attrs>[^>]*>)", html, flags=re.IGNORECASE)
    if not opening:
        return html
    attrs = opening.group("attrs")
    class_match = re.search(r"\bclass\s*=\s*([\"'])(.*?)\1", attrs, flags=re.IGNORECASE)
    class_name = f"c-{component_id}"
    if class_match:
        classes = class_match.group(2).split()
        if class_name not in classes:
            replacement = f'class="{class_name} {class_match.group(2)}"'
            attrs = attrs[: class_match.start()] + replacement + attrs[class_match.end() :]
    else:
        attrs = f' class="{class_name}"' + attrs
    return opening.group("prefix") + attrs + html[opening.end() :]


async def _rag_context(*, component_id: str, industry: str, settings: Settings) -> str:
    pattern_type = {
        "site_header": "layout",
        "hero": "hero",
        "services": "services",
        "trust": "reviews",
        "reviews": "reviews",
        "service_area": "local-seo",
        "gallery": "gallery",
        "contact": "conversion",
        "site_footer": "layout",
    }.get(component_id)
    try:
        store = build_pattern_store(settings)
        results = await asyncio.to_thread(
            store.search,
            query=f"{industry} {component_id} accessible responsive contractor website",
            top_k=2,
            vertical=industry,
            pattern_type=pattern_type,
        )
        if not results:
            results = await asyncio.to_thread(
                store.search,
                query=f"{industry} {component_id} accessible responsive contractor website",
                top_k=2,
                pattern_type=pattern_type,
            )
        return "\n\n".join(result.content[:1800] for result in results)
    except Exception:
        return ""


def _fallback_artifact(
    *,
    baseline_files: dict[str, str],
    candidate_key: str,
    component: ComponentSpec,
    warning: str,
    model: str = "pipeline-v3-template",
    provider: str = "deterministic",
) -> ComponentArtifact:
    html = fallback_component(component.id, baseline_files)
    if not html:
        tag = "footer" if component.type == "footer" else "header" if component.type == "header" else "section"
        html = (
            f'<{tag} class="c-{component.id}" data-component="{component.id}">'
            f"<p>{component.id.replace('_', ' ').title()}</p></{tag}>"
        )
    html = _ensure_component_class(html, component.id)
    return ComponentArtifact(
        attempts=1,
        candidate_key=candidate_key,
        component_id=component.id,
        css="",
        fallback_used=True,
        fingerprint=component_fingerprint(html, ""),
        html=html,
        model=model,
        provider=provider,
        warnings=[warning],
    )


def _recovered_components(job: PipelineJob, candidate_key: str) -> dict[str, dict]:
    rows = job.blackboard.get("recovered_component_rows")
    if not isinstance(rows, list):
        return {}
    return {
        str(row.get("component_id")): row
        for row in rows
        if isinstance(row, dict)
        and row.get("candidate_key") == candidate_key
        and row.get("status") in {"eligible", "fallback"}
    }


def _recovered_artifact(
    *,
    candidate_key: str,
    component: ComponentSpec,
    row: dict | None,
) -> ComponentArtifact | None:
    if not row:
        return None
    html = str(row.get("artifact_html") or "")
    css = str(row.get("artifact_css") or "")
    if not html:
        return None
    audit = audit_component(
        component_id=component.id,
        css=css,
        html=html,
        spec=component,
    )
    if not audit.eligible:
        return None
    return ComponentArtifact(
        attempts=max(1, int(row.get("attempts") or 1)),
        candidate_key=candidate_key,
        component_id=component.id,
        css=css,
        fallback_used=bool(row.get("fallback_used")),
        fingerprint=str(row.get("fingerprint") or component_fingerprint(html, css)),
        html=html,
        model=str(row.get("model") or "recovered"),
        provider=str(row.get("provider") or "durable-store"),
        warnings=list(row.get("warnings") or audit.warnings),
    )
