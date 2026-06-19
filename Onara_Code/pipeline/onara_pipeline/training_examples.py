import hashlib
from dataclasses import dataclass
from typing import Any

from onara_pipeline.agents.agent_09_qa import deterministic_qa
from onara_pipeline.agents.context import build_business_context, infer_industry
from onara_pipeline.agents.contracts import PlannerOutput
from onara_pipeline.rag.learning import qa_approval_skip_reason, redact_generated_text

MAX_COMPONENTS = 8
MAX_COMPONENT_CHARS = 12000
MAX_HTML_CHARS = 60000
REDACTION_VERSION = "2026-06-19.1"


@dataclass(frozen=True, slots=True)
class TrainingExampleBuildResult:
    content_hash: str | None
    payload: dict[str, Any] | None
    reason: str
    status: str

    def to_dict(self) -> dict[str, Any]:
        return {
            "content_hash": self.content_hash,
            "reason": self.reason,
            "status": self.status,
        }


def build_qa_approved_training_example(
    *,
    agent_6_model: str | None,
    blackboard: dict[str, Any],
    business_data: dict[str, Any],
    job_id: str,
    project_id: str,
    style_preferences: dict[str, Any],
    user_plan: str,
) -> TrainingExampleBuildResult:
    qa_reason = qa_approval_skip_reason(blackboard.get("qa_output"))
    if qa_reason:
        return _skipped(qa_reason)

    component_files = blackboard.get("component_files")
    final_html = str(blackboard.get("final_html") or blackboard.get("generated_html") or "")
    if not isinstance(component_files, dict) or not final_html:
        return _skipped("final component files are missing")

    try:
        planner = PlannerOutput.model_validate(blackboard.get("planner_output"))
    except Exception:
        return _skipped("planner output is missing or invalid")

    final_qa = deterministic_qa(
        final_html,
        business_data=business_data,
        component_files=component_files,
        planner=planner,
        style_preferences=style_preferences,
    )
    if final_qa.status != "pass" or final_qa.blocking_issues:
        return _skipped("final artifact no longer passes deterministic QA")

    context = build_business_context(business_data, style_preferences)
    industry = infer_industry(context)
    redacted_html = _truncate(redact_generated_text(final_html, business_data), MAX_HTML_CHARS)
    redacted_components = _redacted_components(component_files, business_data)
    rag_learning = blackboard.get("rag_learning") if isinstance(blackboard.get("rag_learning"), dict) else {}
    rag_pattern_ids = _string_list(rag_learning.get("pattern_ids"))
    content_hash = _content_hash(redacted_html, redacted_components, planner.component_order)

    payload = {
        "business_category": _string_value(business_data.get("category")) or context.category,
        "content_hash": content_hash,
        "example_kind": "generated_site",
        "industry": industry,
        "input_snapshot": {
            "has_google_place": bool(business_data.get("place_id")),
            "manual_entry": bool(business_data.get("manual_entry")),
            "photo_count": _count_items(business_data.get("resolved_photos")),
            "review_count_bucket": _review_count_bucket(business_data.get("review_count")),
            "service_count": _count_items(business_data.get("services")),
            "style_preferences": _safe_style_preferences(style_preferences),
        },
        "output_snapshot": {
            "component_count": len(redacted_components),
            "components": redacted_components,
            "html": redacted_html,
            "html_char_count": len(final_html),
        },
        "pipeline_job_id": job_id,
        "prompt_snapshot": {
            "agent_6_model": agent_6_model or "default",
            "component_order": planner.component_order,
            "planner_components": [
                {
                    "id": component.id,
                    "order": component.order,
                    "type": component.type,
                }
                for component in planner.components
            ],
            "project_id_hash": _short_hash(project_id),
            "rag_pattern_ids": rag_pattern_ids,
            "user_plan": user_plan,
        },
        "quality_gate": "agent_09_qa_pass+deterministic_final_pass",
        "qa_snapshot": {
            "checks": final_qa.checks,
            "model": final_qa.model,
            "provider": final_qa.provider,
            "status": final_qa.status,
            "warning_count": len(final_qa.warnings),
        },
        "rag_pattern_ids": rag_pattern_ids,
        "redaction_version": REDACTION_VERSION,
        "source_type": "initial_generation",
    }
    return TrainingExampleBuildResult(
        content_hash=content_hash,
        payload=payload,
        reason="built QA-approved redacted training example",
        status="ready",
    )


def _redacted_components(component_files: dict[Any, Any], business_data: dict[str, Any]) -> dict[str, str]:
    output: dict[str, str] = {}
    for path in sorted(str(key) for key in component_files.keys()):
        if path == "index.html" or not path.endswith(".html"):
            continue
        value = component_files.get(path)
        if not isinstance(value, str) or not value.strip():
            continue
        output[path] = _truncate(redact_generated_text(value, business_data), MAX_COMPONENT_CHARS)
        if len(output) >= MAX_COMPONENTS:
            break
    return output


def _safe_style_preferences(style_preferences: dict[str, Any]) -> dict[str, Any]:
    output: dict[str, Any] = {}
    for key in ("cta", "palette", "sections", "tone"):
        value = style_preferences.get(key)
        if isinstance(value, (str, int, float, bool)) or value is None:
            output[key] = value
        elif isinstance(value, list):
            output[key] = [str(item) for item in value[:12]]
        elif isinstance(value, dict):
            output[key] = {str(item_key): str(item_value) for item_key, item_value in list(value.items())[:12]}
    return output


def _content_hash(redacted_html: str, redacted_components: dict[str, str], component_order: list[str]) -> str:
    source = {
        "component_order": component_order,
        "components": redacted_components,
        "html": redacted_html,
        "redaction_version": REDACTION_VERSION,
    }
    return hashlib.sha256(str(source).encode("utf-8")).hexdigest()


def _short_hash(value: str) -> str:
    return hashlib.sha256(str(value).encode("utf-8")).hexdigest()[:16]


def _review_count_bucket(value: Any) -> str:
    try:
        count = int(value)
    except (TypeError, ValueError):
        return "unknown"
    if count < 10:
        return "0-9"
    if count < 50:
        return "10-49"
    if count < 100:
        return "50-99"
    return "100+"


def _count_items(value: Any) -> int:
    return len(value) if isinstance(value, list) else 0


def _string_list(value: Any) -> list[str]:
    return [str(item) for item in value if isinstance(item, str)] if isinstance(value, list) else []


def _string_value(value: Any) -> str:
    return value.strip() if isinstance(value, str) else ""


def _truncate(value: str, max_chars: int) -> str:
    if len(value) <= max_chars:
        return value
    return f"{value[:max_chars].rstrip()}\n...[truncated {len(value) - max_chars} chars]"


def _skipped(reason: str) -> TrainingExampleBuildResult:
    return TrainingExampleBuildResult(
        content_hash=None,
        payload=None,
        reason=reason,
        status="skipped",
    )
