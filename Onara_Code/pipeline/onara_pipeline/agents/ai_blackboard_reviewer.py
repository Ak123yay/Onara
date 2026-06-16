from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, ValidationError

from onara_pipeline.agents.blackboard_supervisor import BlackboardDecision, SupervisorStage
from onara_pipeline.agents.json_utils import compact_json, parse_json_model
from onara_pipeline.ai_client import AIClientError, AIMessage, AIRequest, build_ai_client, get_agent_model_route
from onara_pipeline.config import Settings

ReviewStatus = Literal["clear", "warning", "suggest_rerun"]

MAX_SNAPSHOT_VALUE_CHARS = 3000
MAX_HTML_CHARS = 12000

SYSTEM_PROMPT = """You are Onara's advisory AI blackboard reviewer.

You review outputs from a multi-agent website generation pipeline.

Strict rules:
- You are a user-facing notice agent only.
- You do not decide pass/fail, rerun agents, or change pipeline control flow.
- The deterministic supervisor remains the final authority.
- Return valid JSON only.
- Flag subjective quality risks: generic design, weak copy, services that do not match the business, poor layout, fake claims, duplicated sections, suspicious visual issues.
- Do not invent missing facts.
- Do not suggest reruns for small issues that the Debugger/QA agents can handle.
- If the deterministic supervisor already found a blocking problem, summarize it but do not override it.
- Keep warnings specific, short, and useful to the user watching the build."""


class AIReviewerOutput(BaseModel):
    model_config = ConfigDict(extra="ignore", str_strip_whitespace=True)

    status: ReviewStatus
    summary: str = Field(min_length=1, max_length=500)
    warnings: list[str] = Field(default_factory=list, max_length=8)
    suggested_actions: list[str] = Field(default_factory=list, max_length=6)
    suggested_target_agent: str | None = Field(default=None, max_length=80)
    confidence: float = Field(default=0.5, ge=0, le=1)


async def review_blackboard_with_ai(
    blackboard: dict[str, Any],
    *,
    business_data: dict[str, Any],
    deterministic_decision: BlackboardDecision,
    settings: Settings,
    stage: SupervisorStage,
    style_preferences: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Run a non-blocking advisory model pass over blackboard state."""
    ai_client = build_ai_client(settings)
    route = get_agent_model_route(
        "supervisor",
        ollama_fallback_model=settings.ollama_fallback_model,
        ollama_primary_model=settings.ollama_primary_model,
        user_plan="pro",
    )

    try:
        response = await ai_client.generate_text(
            route=route,
            request=AIRequest(
                max_tokens=1200,
                messages=[
                    AIMessage(role="system", content=SYSTEM_PROMPT),
                    AIMessage(
                        role="user",
                        content=_user_prompt(
                            blackboard,
                            business_data=business_data,
                            deterministic_decision=deterministic_decision,
                            stage=stage,
                            style_preferences=style_preferences or {},
                        ),
                    ),
                ],
                metadata={
                    "agent_id": "supervisor",
                    "advisory_only": True,
                    "stage": stage,
                },
                temperature=0.1,
            ),
        )
        parsed = parse_json_model(response.content, AIReviewerOutput)
        review = {
            **parsed.model_dump(),
            "advisory_only": True,
            "control_flow": "none",
            "fallback_used": response.fallback_used,
            "notice": _notice_from_review(parsed),
            "model": response.model,
            "provider": response.provider,
            "stage": stage,
        }
    except (AIClientError, ValueError, ValidationError) as exc:
        review = {
            "advisory_only": True,
            "control_flow": "none",
            "error": str(exc),
            "model": None,
            "notice": "AI build note unavailable. The deterministic supervisor is still controlling the build.",
            "provider": None,
            "stage": stage,
            "status": "unavailable",
            "summary": "AI blackboard reviewer was unavailable; deterministic supervisor decision was preserved.",
            "suggested_actions": [],
            "suggested_target_agent": None,
            "warnings": [],
        }

    _record_review(blackboard, review)
    return review


def _user_prompt(
    blackboard: dict[str, Any],
    *,
    business_data: dict[str, Any],
    deterministic_decision: BlackboardDecision,
    stage: SupervisorStage,
    style_preferences: dict[str, Any],
) -> str:
    return f"""Review this blackboard snapshot for subjective quality risks.

Stage:
{stage}

Deterministic supervisor decision:
{compact_json(deterministic_decision.to_dict())}

Business data:
{compact_json(_safe_business_data(business_data))}

Style preferences:
{compact_json(style_preferences)}

Blackboard snapshot:
{compact_json(_blackboard_snapshot(blackboard, stage))}

Return JSON:
{{
  "status": "clear | warning | suggest_rerun",
  "summary": "one short user-facing build note",
  "warnings": ["specific subjective issue, if any"],
  "suggested_actions": ["specific non-binding user note, if any"],
  "suggested_target_agent": "agent id or null",
  "confidence": 0.0
}}"""


def _safe_business_data(business_data: dict[str, Any]) -> dict[str, Any]:
    allowed_keys = (
        "address",
        "category",
        "hours",
        "name",
        "phone",
        "rating",
        "review_count",
        "services",
        "website",
    )
    return {key: business_data.get(key) for key in allowed_keys if key in business_data}


def _blackboard_snapshot(blackboard: dict[str, Any], stage: SupervisorStage) -> dict[str, Any]:
    keys_by_stage = {
        "after_phase_18": (
            "analyst_output",
            "content_output",
            "style_output",
        ),
        "after_phase_19": (
            "analyst_output",
            "content_output",
            "style_output",
            "planner_output",
            "prompt_output",
        ),
        "after_phase_20": (
            "analyst_output",
            "content_output",
            "style_output",
            "planner_output",
            "codegen_output",
            "generated_html",
            "component_files",
        ),
    }
    snapshot: dict[str, Any] = {
        "available_keys": sorted(blackboard.keys()),
    }

    for key in keys_by_stage[stage]:
        if key not in blackboard:
            continue
        snapshot[key] = _truncate_value(blackboard[key], max_chars=MAX_HTML_CHARS if key == "generated_html" else MAX_SNAPSHOT_VALUE_CHARS)

    return snapshot


def _truncate_value(value: Any, *, max_chars: int) -> Any:
    if isinstance(value, str):
        return _truncate_text(value, max_chars=max_chars)
    if isinstance(value, dict):
        output: dict[str, Any] = {}
        for key, item in value.items():
            if key in {"raw_code", "raw_output"}:
                continue
            output[str(key)] = _truncate_value(item, max_chars=max_chars)
        return output
    if isinstance(value, list):
        return [_truncate_value(item, max_chars=max_chars) for item in value[:12]]
    return value


def _truncate_text(value: str, *, max_chars: int) -> str:
    if len(value) <= max_chars:
        return value
    return f"{value[:max_chars]}...[truncated {len(value) - max_chars} chars]"


def _record_review(blackboard: dict[str, Any], review: dict[str, Any]) -> None:
    reviews = blackboard.setdefault("ai_blackboard_reviews", [])
    if isinstance(reviews, list):
        reviews.append(review)
    else:
        blackboard["ai_blackboard_reviews"] = [review]

    blackboard["latest_ai_blackboard_review"] = review


def _notice_from_review(review: AIReviewerOutput) -> str:
    if review.status == "clear":
        return review.summary

    first_warning = review.warnings[0] if review.warnings else ""
    if first_warning:
        return f"{review.summary} {first_warning}".strip()

    first_action = review.suggested_actions[0] if review.suggested_actions else ""
    if first_action:
        return f"{review.summary} {first_action}".strip()

    return review.summary
