import re
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, ValidationError

from onara_pipeline.agents.agent_06_codegen import extract_index_html, split_component_files
from onara_pipeline.agents.contracts import DebuggerOutput, PlannerOutput
from onara_pipeline.agents.json_utils import compact_json, parse_json_model
from onara_pipeline.agents.supervisor import SupervisorValidationError, validate_debugger_output
from onara_pipeline.ai_client import AIClient, AIClientError, AIMessage, AIRequest, get_agent_model_route
from onara_pipeline.config import Settings
from onara_pipeline.job_queue import PipelineJob

DebuggerStatus = Literal["pass", "fixed"]

SYSTEM_PROMPT = """You are Agent 7, Onara's production HTML/CSS debugger.

Your job is to inspect Agent 6's self-contained contractor website HTML and return a safe corrected version.

Strict rules:
- Return valid JSON only.
- Preserve the business copy, content order, component IDs, and visual direction.
- Fix only broken or risky HTML/CSS/accessibility/performance issues.
- Keep one self-contained index.html document.
- Keep all CSS inside <style> in <head>.
- Keep animation lightweight: opacity and transform only.
- Preserve @keyframes and @media (prefers-reduced-motion: reduce).
- Do not add frameworks, external JavaScript, infinite animation loops, scroll-jacking, or unrelated sections.
- If no changes are needed, return status "pass" and the original HTML unchanged."""


class DebuggerAIOutput(BaseModel):
    model_config = ConfigDict(extra="ignore", str_strip_whitespace=True)

    status: DebuggerStatus
    issues: list[str] = Field(default_factory=list)
    fixes: list[str] = Field(default_factory=list)
    html: str = Field(min_length=500)


async def run_debugger(
    job: PipelineJob,
    ai_client: AIClient,
    settings: Settings,
    planner: PlannerOutput,
) -> DebuggerOutput:
    source_html = str(job.blackboard.get("generated_html") or "")
    source_html = _clean_html_document(source_html)
    issues = audit_html(source_html, business_data=job.business_data, planner=planner)

    if not issues:
        output = DebuggerOutput(
            component_files=split_component_files(source_html, planner),
            html=source_html,
            model="deterministic-audit",
            provider="deterministic",
            raw_output="PASS",
            status="pass",
        )
        validate_debugger_output(output)
        return output

    route = get_agent_model_route(
        "agent_07_debugger",
        is_trial=job.is_trial,
        ollama_fallback_model=settings.ollama_fallback_model,
        ollama_primary_model=settings.ollama_primary_model,
        user_plan=job.user_plan,
    )

    try:
        response = await ai_client.generate_text(
            route=route,
            request=AIRequest(
                max_tokens=12000,
                messages=[
                    AIMessage(role="system", content=SYSTEM_PROMPT),
                    AIMessage(role="user", content=_user_prompt(job, source_html, issues, planner, settings)),
                ],
                metadata={"agent_id": "agent_07_debugger", "job_id": job.job_id},
                temperature=0.12,
            ),
        )
        ai_output = parse_json_model(response.content, DebuggerAIOutput)
        html = _clean_html_document(ai_output.html)
        status: DebuggerStatus = ai_output.status
        if status == "pass" and html != source_html:
            status = "fixed"

        output = DebuggerOutput(
            component_files=split_component_files(html, planner),
            fallback_used=response.fallback_used,
            fixes=ai_output.fixes,
            html=html,
            issues=ai_output.issues or issues,
            model=response.model,
            provider=response.provider,
            raw_output=response.content,
            status=status,
        )
        validate_debugger_output(output)
        return output
    except (AIClientError, ValueError, ValidationError, SupervisorValidationError):
        output = deterministic_debugger(source_html, issues=issues, planner=planner, business_data=job.business_data)
        validate_debugger_output(output)
        return output


def audit_html(html: str, *, business_data: dict[str, Any], planner: PlannerOutput) -> list[str]:
    lower = html.lower()
    issues: list[str] = []

    required_markup = ("<!doctype html", "<html", "<head", "<style", "<body", "</body>", "</html>")
    for marker in required_markup:
        if marker not in lower:
            issues.append(f"Missing required markup: {marker}")

    if "name=\"viewport\"" not in lower and "name='viewport'" not in lower:
        issues.append("Missing responsive viewport meta tag")
    if "@media" not in lower:
        issues.append("Missing responsive media query")
    if "@keyframes" not in lower:
        issues.append("Missing lightweight CSS keyframes")
    if "prefers-reduced-motion" not in lower:
        issues.append("Missing prefers-reduced-motion safety")
    if "requestanimationframe" in lower or "setinterval(" in lower:
        issues.append("Uses JavaScript-driven animation loop")
    if "infinite" in lower:
        issues.append("Uses infinite animation")
    if ("@keyframes" in lower or "animation" in lower) and ("opacity" not in lower or "transform" not in lower):
        issues.append("Animation does not clearly use opacity and transform")
    if "{file_marker_start}" in lower or "{file_marker_end}" in lower:
        issues.append("Contains FILE_MARKER tokens")
    if "```" in html:
        issues.append("Contains markdown fences")
    if _phone_digits(str(business_data.get("phone") or "")) and "tel:" not in lower:
        issues.append("Missing tap-to-call link")

    missing_components = [
        component_id
        for component_id in planner.component_order
        if f'data-component="{component_id}"' not in lower and f"data-component='{component_id}'" not in lower
    ]
    if missing_components:
        issues.append(f"Missing data-component markers: {', '.join(missing_components[:4])}")

    return _unique(issues)


def deterministic_debugger(
    html: str,
    *,
    business_data: dict[str, Any],
    issues: list[str],
    planner: PlannerOutput,
) -> DebuggerOutput:
    fixed = _clean_html_document(html)
    fixes: list[str] = []

    if not fixed.lower().startswith("<!doctype html"):
        fixed = "<!doctype html>\n" + fixed
        fixes.append("Added missing doctype")

    if "name=\"viewport\"" not in fixed.lower() and "name='viewport'" not in fixed.lower():
        fixed = _insert_after_head_open(
            fixed,
            '    <meta name="viewport" content="width=device-width, initial-scale=1" />\n',
        )
        fixes.append("Added responsive viewport meta tag")

    if _needs_debugger_css(fixed):
        fixed = _append_style_patch(fixed, DEBUGGER_CSS_PATCH)
        fixes.append("Added safe animation, responsive, and reduced-motion CSS patch")

    without_infinite = re.sub(r"\s+infinite(?=[;\s])", "", fixed, flags=re.IGNORECASE)
    if without_infinite != fixed:
        fixed = without_infinite
        fixes.append("Removed infinite animation loop")

    phone = str(business_data.get("phone") or "")
    digits = _phone_digits(phone)
    if digits and "tel:" not in fixed.lower():
        fixed, changed = _add_tap_to_call(fixed, digits)
        if changed:
            fixes.append("Added tap-to-call link")

    if not fixes:
        fixes.append("Revalidated HTML with no deterministic changes")

    output = DebuggerOutput(
        component_files=split_component_files(fixed, planner),
        fallback_used=True,
        fixes=fixes,
        html=fixed,
        issues=issues,
        model="deterministic-debugger",
        provider="deterministic",
        raw_output="DETERMINISTIC_DEBUGGER",
        status="fixed",
        used_deterministic_fallback=True,
    )
    return output


def _user_prompt(
    job: PipelineJob,
    html: str,
    issues: list[str],
    planner: PlannerOutput,
    settings: Settings,
) -> str:
    return f"""Debug this Agent 6 HTML.

Known issues from deterministic audit:
{compact_json(issues)}

Business data:
{compact_json(job.business_data)}

Planner component order:
{compact_json(planner.component_order)}

Relevant RAG guidance:
{_load_debugger_patterns(settings)}

Return exactly this JSON:
{{
  "status": "pass" | "fixed",
  "issues": ["specific issue strings"],
  "fixes": ["specific fix strings"],
  "html": "<!doctype html>..."
}}

HTML to debug:
{html}"""


def _load_debugger_patterns(settings: Settings) -> str:
    try:
        from onara_pipeline.rag import build_pattern_store

        store = build_pattern_store(settings)
        results = store.search(
            query="HTML CSS debugger accessibility animation prefers reduced motion transform opacity responsive contractor",
            top_k=4,
        )
        if not results:
            return "No RAG patterns available."

        return "\n\n".join(
            f"{result.title}: {result.summary}\n{result.content}" for result in results
        )
    except Exception:
        return "RAG unavailable; use built-in debugger rules."


def _clean_html_document(value: str) -> str:
    stripped = value.strip()
    if "{FILE_MARKER_START}" in stripped or "{FILE_MARKER_END}" in stripped:
        try:
            stripped = extract_index_html(stripped)
        except ValueError:
            stripped = stripped.replace("{FILE_MARKER_START}", "").replace("{FILE_MARKER_END}", "").strip()

    if stripped.startswith("```"):
        stripped = re.sub(r"^```[a-zA-Z0-9_-]*\s*", "", stripped)
        stripped = re.sub(r"\s*```$", "", stripped)

    return stripped.strip()


def _insert_after_head_open(html: str, insertion: str) -> str:
    match = re.search(r"<head\b[^>]*>", html, flags=re.IGNORECASE)
    if not match:
        return html
    return html[: match.end()] + "\n" + insertion + html[match.end() :]


def _needs_debugger_css(html: str) -> bool:
    lower = html.lower()
    return (
        "@media" not in lower
        or "@keyframes" not in lower
        or "prefers-reduced-motion" not in lower
        or "opacity" not in lower
        or "transform" not in lower
    )


def _append_style_patch(html: str, css: str) -> str:
    if "</style>" not in html.lower():
        return _insert_after_head_open(html, f"    <style>\n{css}\n    </style>\n")

    return re.sub(r"</style>", f"\n{css}\n      </style>", html, count=1, flags=re.IGNORECASE)


def _add_tap_to_call(html: str, digits: str) -> tuple[str, bool]:
    href = f'href="tel:{digits}"'
    replaced = re.sub(r'href=(["\'])#contact\1', href, html, count=1, flags=re.IGNORECASE)
    if replaced != html:
        return replaced, True

    cta = f'    <a class="debugger-phone-cta" href="tel:{digits}">Call now</a>\n'
    if "</body>" in html.lower():
        return re.sub(r"</body>", cta + "  </body>", html, count=1, flags=re.IGNORECASE), True

    return html + "\n" + cta, True


def _phone_digits(phone: str) -> str:
    return re.sub(r"[^0-9+]", "", phone)


def _unique(values: list[str]) -> list[str]:
    seen = set()
    output = []
    for value in values:
        normalized = value.strip()
        key = normalized.lower()
        if normalized and key not in seen:
            seen.add(key)
            output.append(normalized)
    return output


DEBUGGER_CSS_PATCH = """
      @keyframes onara-debugger-rise {
        from { opacity: 0; transform: translate3d(0, 14px, 0); }
        to { opacity: 1; transform: translate3d(0, 0, 0); }
      }

      .hero-copy > *,
      .hero-card,
      .service-card,
      .trust-list li,
      .contact-card {
        animation: onara-debugger-rise 620ms cubic-bezier(0.2, 0.65, 0.2, 1) both;
      }

      @media (hover: hover) {
        .primary-cta:hover,
        .header-cta:hover,
        .service-card:hover {
          transform: translate3d(0, -2px, 0);
        }
      }

      @media (prefers-reduced-motion: reduce) {
        *,
        *::before,
        *::after {
          animation-delay: 0ms !important;
          animation-duration: 1ms !important;
          animation-iteration-count: 1 !important;
          scroll-behavior: auto !important;
          transition-duration: 1ms !important;
        }
      }

      @media (max-width: 768px) {
        img,
        video,
        iframe {
          max-width: 100%;
          height: auto;
        }
      }
""".strip()
