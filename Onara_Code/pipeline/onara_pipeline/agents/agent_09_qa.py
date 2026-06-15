import re
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, ValidationError

from onara_pipeline.agents.contracts import PlannerOutput, QAOutput
from onara_pipeline.agents.json_utils import compact_json, parse_json_model
from onara_pipeline.agents.onara_theme import ONARA_THEME_CONTRACT
from onara_pipeline.agents.photos import prompt_photo_assets
from onara_pipeline.agents.style_directives import style_directive_text
from onara_pipeline.agents.supervisor import SupervisorValidationError, validate_qa_output
from onara_pipeline.agents.visual_quality import (
    composition_depth_issues,
    onara_theme_issues,
    professional_visual_issues,
)
from onara_pipeline.ai_client import AIClient, AIClientError, AIMessage, AIRequest, get_agent_model_route
from onara_pipeline.config import Settings
from onara_pipeline.job_queue import PipelineJob

QAStatus = Literal["pass", "fail"]

SYSTEM_PROMPT = """You are Agent 9, Onara's production QA reviewer.

Inspect the final generated contractor website after debugging and SEO.

Strict rules:
- Return valid JSON only.
- Do not rewrite HTML.
- Mark status "fail" for concrete launch blockers, including low-effort visual composition.
- Treat small subjective design improvements as warnings, but reject pages that look like generic centered templates or miss the Onara theme contract.
- Check local contractor basics: complete document, mobile readiness, safe motion, SEO metadata, LocalBusiness schema, tap-to-call, and component completeness.
- Do not invent missing data or require unsupported features."""


class QAReview(BaseModel):
    model_config = ConfigDict(extra="ignore", str_strip_whitespace=True)

    status: QAStatus
    blocking_issues: list[str] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)


async def run_qa_agent(
    job: PipelineJob,
    ai_client: AIClient,
    settings: Settings,
    planner: PlannerOutput,
) -> QAOutput:
    html = str(job.blackboard.get("seo_html") or job.blackboard.get("generated_html") or "")
    component_files = job.blackboard.get("component_files")
    deterministic = deterministic_qa(
        html,
        business_data=job.business_data,
        component_files=component_files,
        planner=planner,
    )
    validate_qa_output(deterministic)

    if deterministic.status == "fail":
        return deterministic

    route = get_agent_model_route(
        "agent_09_qa",
        is_trial=job.is_trial,
        ollama_fallback_model=settings.ollama_fallback_model,
        ollama_primary_model=settings.ollama_primary_model,
        user_plan=job.user_plan,
    )

    try:
        response = await ai_client.generate_text(
            route=route,
            request=AIRequest(
                max_tokens=2400,
                messages=[
                    AIMessage(role="system", content=SYSTEM_PROMPT),
                    AIMessage(role="user", content=_user_prompt(job, html, deterministic, planner, settings)),
                ],
                metadata={"agent_id": "agent_09_qa", "job_id": job.job_id},
                temperature=0.1,
            ),
        )
        review = parse_json_model(response.content, QAReview)
        status, blocking_issues = _normalize_ai_blockers(review, deterministic)
        output = QAOutput(
            blocking_issues=blocking_issues,
            checks=deterministic.checks,
            fallback_used=response.fallback_used,
            model=response.model,
            provider=response.provider,
            raw_output=response.content,
            status=status,
            warnings=_unique([*deterministic.warnings, *review.warnings]),
        )
        validate_qa_output(output)
        return output
    except (AIClientError, ValueError, ValidationError, SupervisorValidationError):
        return deterministic


def deterministic_qa(
    html: str,
    *,
    business_data: dict[str, Any],
    component_files: Any,
    planner: PlannerOutput,
) -> QAOutput:
    checks, blocking_issues, warnings = audit_site(
        html,
        business_data=business_data,
        component_files=component_files,
        planner=planner,
    )
    status: QAStatus = "fail" if blocking_issues else "pass"
    output = QAOutput(
        blocking_issues=blocking_issues,
        checks=checks,
        model="deterministic-qa",
        provider="deterministic",
        raw_output=compact_json(
            {
                "status": status,
                "blocking_issues": blocking_issues,
                "warnings": warnings,
                "checks": checks,
            }
        ),
        status=status,
        used_deterministic_fallback=True,
        warnings=warnings,
    )
    validate_qa_output(output)
    return output


def audit_site(
    html: str,
    *,
    business_data: dict[str, Any],
    component_files: Any,
    planner: PlannerOutput,
) -> tuple[dict[str, bool], list[str], list[str]]:
    lower = html.lower()
    checks: dict[str, bool] = {}
    blocking: list[str] = []
    warnings: list[str] = []

    required_markup = ("<!doctype html", "<html", "<head", "<style", "<body", "</body>", "</html>")
    missing_markup = [marker for marker in required_markup if marker not in lower]
    checks["html_structure"] = not missing_markup
    blocking.extend(f"Missing required HTML marker: {marker}" for marker in missing_markup)

    index_html = component_files.get("index.html") if isinstance(component_files, dict) else None
    checks["component_files"] = isinstance(index_html, str) and "<html" in index_html.lower()
    if not checks["component_files"]:
        blocking.append("component_files.index.html is missing or invalid")

    missing_components = [
        component_id
        for component_id in planner.component_order
        if f'data-component="{component_id}"' not in lower and f"data-component='{component_id}'" not in lower
    ]
    checks["component_markers"] = not missing_components
    if missing_components:
        blocking.append(f"Missing data-component markers: {', '.join(missing_components[:6])}")

    visual_issues = professional_visual_issues(html)
    checks["professional_visual_system"] = not visual_issues
    blocking.extend(visual_issues)

    depth_issues = composition_depth_issues(html)
    checks["composition_depth"] = not depth_issues

    theme_issues = onara_theme_issues(html)
    checks["onara_theme"] = not theme_issues

    unsafe_motion = "requestanimationframe" in lower or "setinterval(" in lower or "infinite" in lower
    checks["motion_safety"] = (
        "@keyframes" in lower
        and "prefers-reduced-motion" in lower
        and "opacity" in lower
        and "transform" in lower
        and not unsafe_motion
    )
    if not checks["motion_safety"]:
        blocking.append("Motion is missing safe CSS animation requirements or uses unsafe animation loops")

    seo_markers = (
        "<title>",
        'name="description"',
        'property="og:title"',
        'property="og:description"',
        'property="og:type"',
        'name="twitter:card"',
        "onara canonical placeholder",
    )
    missing_seo = [marker for marker in seo_markers if marker not in lower]
    checks["seo_metadata"] = not missing_seo
    blocking.extend(f"Missing SEO metadata: {marker}" for marker in missing_seo)

    checks["localbusiness_schema"] = "application/ld+json" in lower and "localbusiness" in lower
    if not checks["localbusiness_schema"]:
        blocking.append("Missing LocalBusiness JSON-LD schema")

    checks["tap_to_call"] = not _phone_digits(str(business_data.get("phone") or "")) or "tel:" in lower
    if not checks["tap_to_call"]:
        blocking.append("Missing tap-to-call link despite business phone")

    photo_assets = prompt_photo_assets(business_data)
    checks["photo_usage"] = not photo_assets or any(str(asset.get("src") or "") in html for asset in photo_assets)
    if not checks["photo_usage"]:
        blocking.append("Resolved business photos were available but not used in the generated HTML")
    if "/api/places/photo" in lower or "localhost" in lower or re.search(r"src=[\"']places/", html, flags=re.IGNORECASE):
        checks["photo_usage"] = False
        blocking.append("Generated HTML uses non-deployable photo URLs")

    checks["mobile_basics"] = ("name=\"viewport\"" in lower or "name='viewport'" in lower) and "@media" in lower
    if not checks["mobile_basics"]:
        blocking.append("Missing mobile viewport or responsive media query")

    has_artifacts = "{file_marker_start}" in lower or "{file_marker_end}" in lower or "```" in html
    checks["no_artifacts"] = not has_artifacts
    if has_artifacts:
        blocking.append("Generated HTML still contains prompt artifacts or markdown fences")

    if "aria-label" not in lower:
        warnings.append("No aria-label attributes found; verify interactive controls are still clear.")
    if len(html) > 120_000:
        warnings.append("HTML is large for a single-file landing page; monitor first-load performance.")

    return checks, _unique(blocking), _unique(warnings)


def _user_prompt(
    job: PipelineJob,
    html: str,
    deterministic: QAOutput,
    planner: PlannerOutput,
    settings: Settings,
) -> str:
    return f"""Review this generated contractor website for launch blockers.

Business data:
{compact_json(job.business_data)}
{style_directive_text(job.style_preferences)}

Planner component order:
{compact_json(planner.component_order)}

Deterministic QA checks:
{compact_json(deterministic.model_dump())}

Relevant RAG guidance:
{_load_qa_patterns(settings)}

{ONARA_THEME_CONTRACT}

Return exactly this JSON:
{{
  "status": "pass" | "fail",
  "blocking_issues": ["concrete launch blockers only"],
  "warnings": ["non-blocking quality notes"]
}}

HTML to review:
{html}"""


def _load_qa_patterns(settings: Settings) -> str:
    try:
        from onara_pipeline.rag import build_pattern_store

        store = build_pattern_store(settings)
        results = store.search(
            query="contractor website QA accessibility mobile SEO safe animation tap to call local business",
            top_k=5,
        )
        if not results:
            return "No RAG patterns available."

        return "\n\n".join(
            f"{result.title}: {result.summary}\n{result.content}" for result in results
        )
    except Exception:
        return "RAG unavailable; use built-in QA rules."


def _normalize_ai_blockers(review: QAReview, deterministic: QAOutput) -> tuple[QAStatus, list[str]]:
    if deterministic.status == "fail":
        return "fail", deterministic.blocking_issues

    blockers = _unique(review.blocking_issues)
    if review.status == "fail" and blockers:
        return "fail", blockers

    return "pass", []


def _phone_digits(phone: str) -> str:
    return re.sub(r"[^0-9+]", "", phone)


def _unique(values: list[str]) -> list[str]:
    seen = set()
    output = []
    for value in values:
        normalized = str(value).strip()
        key = normalized.lower()
        if normalized and key not in seen:
            seen.add(key)
            output.append(normalized)
    return output
