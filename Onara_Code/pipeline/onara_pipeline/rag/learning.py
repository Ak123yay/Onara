import hashlib
import re
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any

from onara_pipeline.agents.agent_09_qa import deterministic_qa
from onara_pipeline.agents.context import build_business_context, infer_industry
from onara_pipeline.agents.contracts import PlannerOutput
from onara_pipeline.config import Settings, get_settings
from onara_pipeline.rag.chroma_client import PatternStore, build_pattern_store
from onara_pipeline.rag.types import PatternDocument

MAX_COMPONENT_CHARS = 7000
MAX_LEARNED_PATTERNS_PER_SITE = 6
MIN_COMPONENT_CHARS = 300
SKIPPED_COMPONENT_IDS = {"site_header", "site_footer"}


@dataclass(frozen=True, slots=True)
class CuratedRagLearningResult:
    pattern_ids: list[str]
    reason: str
    skipped_count: int
    status: str
    stored_count: int

    def to_dict(self) -> dict[str, Any]:
        return {
            "pattern_ids": self.pattern_ids,
            "reason": self.reason,
            "skipped_count": self.skipped_count,
            "status": self.status,
            "stored_count": self.stored_count,
        }


def save_qa_approved_patterns(
    *,
    blackboard: dict[str, Any],
    business_data: dict[str, Any],
    job_id: str,
    project_id: str,
    settings: Settings | None = None,
    store: PatternStore | None = None,
    style_preferences: dict[str, Any] | None = None,
) -> CuratedRagLearningResult:
    """Persist redacted, QA-approved component patterns into ChromaDB."""
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
        style_preferences=style_preferences or {},
    )
    if final_qa.status != "pass" or final_qa.blocking_issues:
        return _skipped("final artifact no longer passes deterministic QA")

    active_settings = settings or get_settings()
    active_store = store or build_pattern_store(active_settings)
    patterns = _build_pattern_documents(
        business_data=business_data,
        component_files=component_files,
        job_id=job_id,
        planner=planner,
        project_id=project_id,
        style_preferences=style_preferences or {},
    )
    if not patterns:
        return _skipped("no reusable component patterns were found")

    fresh: list[PatternDocument] = []
    duplicate_count = 0
    for pattern in patterns:
        if _pattern_exists(active_store, pattern):
            duplicate_count += 1
            continue
        fresh.append(pattern)

    stored_count = active_store.upsert_patterns(fresh)
    if stored_count == 0:
        return CuratedRagLearningResult(
            pattern_ids=[],
            reason="all candidate patterns were already stored",
            skipped_count=duplicate_count,
            status="skipped",
            stored_count=0,
        )

    return CuratedRagLearningResult(
        pattern_ids=[pattern.id for pattern in fresh],
        reason="stored QA-approved generated component patterns",
        skipped_count=duplicate_count,
        status="stored",
        stored_count=stored_count,
    )


def _approved_qa_snapshot_reason(qa_output: Any) -> str:
    if not isinstance(qa_output, dict):
        return "QA output is missing"
    if qa_output.get("status") != "pass":
        return "QA status is not pass"
    blockers = qa_output.get("blocking_issues")
    if isinstance(blockers, list) and blockers:
        return "QA output has blocking issues"
    checks = qa_output.get("checks")
    if not isinstance(checks, dict) or not checks:
        return "QA checks are missing"
    if any(value is False for value in checks.values()):
        return "QA output has failed checks"
    return ""


def qa_approval_skip_reason(qa_output: Any) -> str:
    return _approved_qa_snapshot_reason(qa_output)


def redact_generated_text(markup: str, business_data: dict[str, Any]) -> str:
    return _redact_business_specifics(markup, business_data)


def _build_pattern_documents(
    *,
    business_data: dict[str, Any],
    component_files: dict[Any, Any],
    job_id: str,
    planner: PlannerOutput,
    project_id: str,
    style_preferences: dict[str, Any],
) -> list[PatternDocument]:
    context = build_business_context(business_data, style_preferences)
    vertical = _safe_slug(infer_industry(context), fallback="contractor")
    learned_at = datetime.now(timezone.utc).isoformat()
    source_job_hash = _short_hash(job_id)
    source_project_hash = _short_hash(project_id)
    ordered_ids = [component_id for component_id in planner.component_order if component_id not in SKIPPED_COMPONENT_IDS]
    documents: list[PatternDocument] = []

    for component_id in ordered_ids:
        raw_markup = component_files.get(f"components/{component_id}.html")
        if not isinstance(raw_markup, str):
            continue

        redacted = _redact_business_specifics(raw_markup, business_data)
        cleaned = _clean_component_markup(redacted)
        if len(cleaned) < MIN_COMPONENT_CHARS:
            continue

        pattern_type = _pattern_type_for_component(component_id)
        content = _pattern_content(
            cleaned,
            component_id=component_id,
            pattern_type=pattern_type,
            vertical=vertical,
        )
        content_hash = _content_hash(vertical, component_id, content)
        source_key_hash = _short_hash(f"{project_id}:{component_id}")

        documents.append(
            PatternDocument(
                content=content,
                content_hash=content_hash,
                id=f"learned-{vertical}-{_safe_slug(component_id, fallback='component')}-{content_hash[:16]}",
                learned_at=learned_at,
                pattern_type=pattern_type,
                quality_gate="agent_09_qa_pass+deterministic_final_pass",
                source="qa_approved_generation",
                source_job_hash=source_job_hash,
                source_key_hash=source_key_hash,
                source_project_hash=source_project_hash,
                summary=(
                    f"Redacted {pattern_type} component learned from a generated Onara site "
                    "that passed QA and final deterministic checks."
                ),
                tags=_tags_for_pattern(vertical, component_id, pattern_type, style_preferences),
                title=f"QA-approved {vertical} {component_id.replace('_', ' ')} pattern",
                vertical=vertical,
            )
        )
        if len(documents) >= MAX_LEARNED_PATTERNS_PER_SITE:
            break

    return documents


def _pattern_exists(store: PatternStore, pattern: PatternDocument) -> bool:
    return (
        bool(pattern.content_hash and store.metadata_exists("content_hash", pattern.content_hash))
        or bool(pattern.source_key_hash and store.metadata_exists("source_key_hash", pattern.source_key_hash))
    )


def _pattern_content(markup: str, *, component_id: str, pattern_type: str, vertical: str) -> str:
    if len(markup) > MAX_COMPONENT_CHARS:
        markup = f"{markup[:MAX_COMPONENT_CHARS].rstrip()}\n...[truncated]"

    return f"""
QA-approved Onara generated component pattern.
Vertical: {vertical}
Component: {component_id}
Pattern type: {pattern_type}
Use as structural guidance only; do not copy business-specific text.

HTML:
{markup}
""".strip()


def _redact_business_specifics(markup: str, business_data: dict[str, Any]) -> str:
    redacted = str(markup)
    explicit_replacements = {
        "address": "[ADDRESS]",
        "email": "[EMAIL]",
        "name": "[BUSINESS_NAME]",
        "phone": "[PHONE]",
        "website": "[WEBSITE_URL]",
    }
    for key, placeholder in explicit_replacements.items():
        for value in _string_values(business_data.get(key)):
            if len(value) >= 3:
                redacted = re.sub(re.escape(value), placeholder, redacted, flags=re.IGNORECASE)

    redacted = re.sub(r"\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b", "[EMAIL]", redacted, flags=re.IGNORECASE)
    redacted = re.sub(r"https?://[^\s\"'<>]+", "[URL]", redacted)
    redacted = re.sub(
        r"(data-(?:project|user|job)-id=)[\"'][^\"']+[\"']",
        lambda match: f'{match.group(1)}"[ID]"',
        redacted,
    )
    return redacted


def _string_values(value: Any) -> list[str]:
    if isinstance(value, str):
        return [value.strip()] if value.strip() else []
    if isinstance(value, list):
        output: list[str] = []
        for item in value:
            output.extend(_string_values(item))
        return output
    if isinstance(value, dict):
        output: list[str] = []
        for item in value.values():
            output.extend(_string_values(item))
        return output
    return []


def _clean_component_markup(markup: str) -> str:
    lines = [line.rstrip() for line in markup.strip().splitlines()]
    cleaned = "\n".join(lines)
    return re.sub(r"\n{3,}", "\n\n", cleaned).strip()


def _pattern_type_for_component(component_id: str) -> str:
    normalized = component_id.replace("-", "_").lower()
    if normalized in {"hero", "masthead"}:
        return "hero"
    if normalized in {"services", "service_menu", "service_grid"}:
        return "services"
    if normalized in {"reviews", "trust", "license_proof", "proof"}:
        return "trust"
    if normalized in {"service_area", "locations"}:
        return "service-area"
    if normalized in {"contact", "booking", "estimate"}:
        return "contact"
    return normalized


def _tags_for_pattern(
    vertical: str,
    component_id: str,
    pattern_type: str,
    style_preferences: dict[str, Any],
) -> list[str]:
    tags = ["learned", "qa-approved", "onara", vertical, pattern_type, component_id]
    tone = style_preferences.get("tone")
    if isinstance(tone, str) and tone.strip():
        tags.append(_safe_slug(tone, fallback="tone"))
    return _ordered_unique(tags)


def _content_hash(vertical: str, component_id: str, content: str) -> str:
    normalized = re.sub(r"\s+", " ", content).strip().lower()
    return hashlib.sha256(f"{vertical}:{component_id}:{normalized}".encode("utf-8")).hexdigest()


def _short_hash(value: str) -> str:
    return hashlib.sha256(str(value).encode("utf-8")).hexdigest()[:16]


def _safe_slug(value: str, *, fallback: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", str(value).lower()).strip("-")
    return slug or fallback


def _ordered_unique(values: list[str]) -> list[str]:
    seen = set()
    output: list[str] = []
    for value in values:
        normalized = str(value).strip()
        if normalized and normalized not in seen:
            seen.add(normalized)
            output.append(normalized)
    return output


def _skipped(reason: str) -> CuratedRagLearningResult:
    return CuratedRagLearningResult(
        pattern_ids=[],
        reason=reason,
        skipped_count=0,
        status="skipped",
        stored_count=0,
    )
