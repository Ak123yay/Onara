import re
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, ValidationError

from onara_pipeline.agents.agent_06_codegen import split_component_files
from onara_pipeline.agents.context import build_business_context
from onara_pipeline.agents.contracts import MobileOutput, PlannerOutput
from onara_pipeline.agents.fact_repair import ensure_hours_rendered, ensure_onara_spacing, ensure_onara_typography
from onara_pipeline.agents.generation_contracts import (
    ONARA_GENERATION_QUALITY_CONTRACT,
    business_fact_contract,
)
from onara_pipeline.agents.json_utils import compact_json, parse_json_model
from onara_pipeline.agents.supervisor import SupervisorValidationError, validate_mobile_output
from onara_pipeline.ai_client import AIClient, AIClientError, AIMessage, AIRequest, get_agent_model_route
from onara_pipeline.config import Settings
from onara_pipeline.job_queue import PipelineJob

MobileStatus = Literal["pass", "fixed"]

SYSTEM_PROMPT = """You are Agent 10, Onara's mobile/responsive QA engineer.

Your job is to return the same self-contained contractor website HTML with only mobile and responsive hardening changes.

Strict rules:
- Return valid JSON only.
- Preserve all business copy, SEO metadata, LocalBusiness schema, component IDs, and desktop visual direction.
- Do not add sections, frameworks, external assets, tracking scripts, or new claims.
- Fix mobile issues only: viewport, responsive layout, tap targets, flexible media, overflow, and reduced-motion safety.
- Keep all CSS in the existing <style> block.
- Do not use JavaScript-driven animations or infinite animation loops."""


class MobileAIOutput(BaseModel):
    model_config = ConfigDict(extra="ignore", str_strip_whitespace=True)

    status: MobileStatus
    issues: list[str] = Field(default_factory=list)
    fixes: list[str] = Field(default_factory=list)
    html: str = Field(min_length=500)


async def run_mobile_agent(
    job: PipelineJob,
    ai_client: AIClient,
    settings: Settings,
    planner: PlannerOutput,
) -> MobileOutput:
    source_html = _clean_html_document(str(job.blackboard.get("generated_html") or ""))
    deterministic = deterministic_mobile(
        source_html,
        business_data=job.business_data,
        planner=planner,
        style_preferences=job.style_preferences,
    )
    validate_mobile_output(deterministic)

    if deterministic.status == "pass":
        return deterministic

    route = get_agent_model_route(
        "agent_10_mobile",
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
                    AIMessage(
                        role="user",
                        content=_user_prompt(job, source_html, deterministic, planner, settings),
                    ),
                ],
                metadata={"agent_id": "agent_10_mobile", "job_id": job.job_id},
                temperature=0.12,
            ),
        )
        ai_output = parse_json_model(response.content, MobileAIOutput)
        html = _clean_html_document(ai_output.html)
        html, typography_fixes = ensure_onara_typography(html)
        html, spacing_fixes = ensure_onara_spacing(html)
        html, fact_fixes = ensure_hours_rendered(
            html,
            business_data=job.business_data,
            style_preferences=job.style_preferences,
        )
        status: MobileStatus = ai_output.status
        if html != source_html:
            status = "fixed"

        output = MobileOutput(
            checks=audit_mobile(html)[0],
            component_files=split_component_files(html, planner),
            fallback_used=response.fallback_used,
            fixes=_unique([*(ai_output.fixes or deterministic.fixes), *typography_fixes, *spacing_fixes, *fact_fixes]),
            html=html,
            issues=ai_output.issues or deterministic.issues,
            model=response.model,
            provider=response.provider,
            raw_output=response.content,
            status=status,
        )
        validate_mobile_output(output)
        return output
    except (AIClientError, ValueError, ValidationError, SupervisorValidationError):
        return deterministic


def deterministic_mobile(
    html: str,
    *,
    business_data: dict[str, Any] | None = None,
    planner: PlannerOutput,
    style_preferences: dict[str, Any] | None = None,
) -> MobileOutput:
    checks, issues = audit_mobile(html)
    fixed = html
    fixes: list[str] = []

    if not checks["viewport"]:
        fixed = _insert_after_head_open(
            fixed,
            '    <meta name="viewport" content="width=device-width, initial-scale=1" />\n',
        )
        fixes.append("Added responsive viewport meta tag")

    if "infinite" in fixed.lower():
        fixed = re.sub(r"\s+infinite(?=[;\s])", "", fixed, flags=re.IGNORECASE)
        fixes.append("Removed infinite animation keyword")

    if _needs_mobile_css_patch(fixed):
        fixed = _append_style_patch(fixed, MOBILE_CSS_PATCH)
        fixes.append("Added mobile-safe layout, media, overflow, tap-target, and fluid-type CSS")

    if business_data is not None:
        fixed, typography_fixes = ensure_onara_typography(fixed)
        fixes.extend(typography_fixes)
        fixed, spacing_fixes = ensure_onara_spacing(fixed)
        fixes.extend(spacing_fixes)
        fixed, fact_fixes = ensure_hours_rendered(
            fixed,
            business_data=business_data,
            style_preferences=style_preferences,
        )
        fixes.extend(fact_fixes)

    status: MobileStatus = "fixed" if fixes else "pass"
    output = MobileOutput(
        checks=audit_mobile(fixed)[0],
        component_files=split_component_files(fixed, planner),
        fallback_used=bool(fixes),
        fixes=fixes,
        html=fixed,
        issues=issues,
        model="deterministic-mobile",
        provider="deterministic",
        raw_output=compact_json({"status": status, "issues": issues, "fixes": fixes}),
        status=status,
        used_deterministic_fallback=bool(fixes),
    )
    validate_mobile_output(output)
    return output


def audit_mobile(html: str) -> tuple[dict[str, bool], list[str]]:
    lower = html.lower()
    checks = {
        "viewport": "name=\"viewport\"" in lower or "name='viewport'" in lower,
        "responsive_media_query": bool(re.search(r"@media\s*\([^)]*max-width", lower)),
        "overflow_guard": "overflow-x:hidden" in lower.replace(" ", "") or "overflow-x:clip" in lower.replace(" ", ""),
        "flexible_media": "max-width:100%" in lower.replace(" ", "") and "height:auto" in lower.replace(" ", ""),
        "tap_targets": "min-height:44px" in lower.replace(" ", "") or "min-height:48px" in lower.replace(" ", ""),
        "fluid_type": "clamp(" in lower,
        "reduced_motion": "prefers-reduced-motion" in lower,
        "safe_motion": "requestanimationframe" not in lower and "setinterval(" not in lower and "infinite" not in lower,
        "seo_preserved": _seo_preserved(lower),
    }

    issue_labels = {
        "viewport": "Missing viewport meta tag",
        "responsive_media_query": "Missing max-width responsive media query",
        "overflow_guard": "Missing horizontal overflow guard",
        "flexible_media": "Missing flexible media sizing",
        "tap_targets": "Missing mobile tap-target minimum height",
        "fluid_type": "Missing fluid type scaling for small screens",
        "reduced_motion": "Missing prefers-reduced-motion safety",
        "safe_motion": "Unsafe animation loop detected",
        "seo_preserved": "SEO metadata or LocalBusiness schema was not preserved",
    }
    return checks, [issue_labels[key] for key, passed in checks.items() if not passed]


def _user_prompt(
    job: PipelineJob,
    html: str,
    deterministic: MobileOutput,
    planner: PlannerOutput,
    settings: Settings,
) -> str:
    context = build_business_context(job.business_data, job.style_preferences)
    return f"""Fix mobile/responsive issues in this generated contractor website.

Business data:
{compact_json(job.business_data)}
{business_fact_contract(context, job.style_preferences)}
{ONARA_GENERATION_QUALITY_CONTRACT}

Planner component order:
{compact_json(planner.component_order)}

Deterministic mobile audit and fallback patch:
{compact_json(deterministic.model_dump())}

Relevant RAG guidance:
{_load_mobile_patterns(settings)}

Return exactly this JSON:
{{
  "status": "pass" | "fixed",
  "issues": ["specific mobile issues found"],
  "fixes": ["specific mobile fixes made"],
  "html": "<!doctype html>..."
}}

HTML to harden:
{html}"""


def _load_mobile_patterns(settings: Settings) -> str:
    try:
        from onara_pipeline.rag import build_pattern_store

        store = build_pattern_store(settings)
        results = store.search(
            query="mobile responsive contractor website tap target overflow media flexible type reduced motion",
            top_k=5,
        )
        if not results:
            return "No RAG patterns available."

        return "\n\n".join(
            f"{result.title}: {result.summary}\n{result.content}" for result in results
        )
    except Exception:
        return "RAG unavailable; use built-in mobile rules."


def _seo_preserved(lower_html: str) -> bool:
    required = (
        "<title>",
        'name="description"',
        'property="og:title"',
        'property="og:description"',
        'name="twitter:card"',
        "application/ld+json",
        "localbusiness",
        "onara canonical placeholder",
    )
    return all(marker in lower_html for marker in required)


def _needs_mobile_css_patch(html: str) -> bool:
    checks, _issues = audit_mobile(html)
    css_keys = (
        "responsive_media_query",
        "overflow_guard",
        "flexible_media",
        "tap_targets",
        "fluid_type",
        "safe_motion",
    )
    return any(not checks[key] for key in css_keys)


def _append_style_patch(html: str, css: str) -> str:
    if "</style>" not in html.lower():
        return _insert_after_head_open(html, f"    <style>\n{css}\n    </style>\n")

    return re.sub(r"</style>", f"\n{css}\n      </style>", html, count=1, flags=re.IGNORECASE)


def _insert_after_head_open(html: str, insertion: str) -> str:
    match = re.search(r"<head\b[^>]*>", html, flags=re.IGNORECASE)
    if not match:
        return html
    return html[: match.end()] + "\n" + insertion + html[match.end() :]


def _clean_html_document(value: str) -> str:
    stripped = value.strip()
    if stripped.startswith("```"):
        stripped = re.sub(r"^```[a-zA-Z0-9_-]*\s*", "", stripped)
        stripped = re.sub(r"\s*```$", "", stripped)
    return stripped.strip()


def _unique(values: list[str]) -> list[str]:
    seen: set[str] = set()
    output: list[str] = []
    for value in values:
        normalized = str(value).strip()
        key = normalized.lower()
        if normalized and key not in seen:
            seen.add(key)
            output.append(normalized)
    return output


MOBILE_CSS_PATCH = """
      html {
        -webkit-text-size-adjust: 100%;
      }

      *,
      *::before,
      *::after {
        box-sizing: border-box;
      }

      body {
        overflow-x: hidden;
      }

      img,
      video,
      iframe,
      svg {
        max-width: 100%;
        height: auto;
      }

      a,
      button,
      input,
      textarea,
      select,
      [role="button"],
      .primary-cta,
      .header-cta,
      .contact-cta {
        min-height: 44px;
      }

      a,
      button,
      [role="button"],
      .primary-cta,
      .header-cta,
      .contact-cta {
        touch-action: manipulation;
      }

      h1 {
        font-size: clamp(2.25rem, 11vw, 5rem);
        line-height: 0.94;
        text-wrap: balance;
      }

      p,
      li,
      address {
        overflow-wrap: anywhere;
      }

      @media (max-width: 720px) {
        body {
          min-width: 0;
        }

        header,
        main,
        section,
        footer {
          max-width: 100%;
        }

        .container,
        .wrap,
        [class*="container"],
        [class*="wrapper"] {
          width: min(100% - 32px, var(--container, 1120px));
          margin-inline: auto;
        }

        [class*="grid"],
        [class*="columns"],
        [class*="cards"] {
          grid-template-columns: 1fr !important;
        }

        .primary-cta,
        .header-cta,
        .contact-cta {
          width: 100%;
          justify-content: center;
        }
      }

      @media (max-width: 420px) {
        body {
          font-size: 16px;
        }

        h1 {
          font-size: clamp(2rem, 14vw, 3.5rem);
        }
      }
""".strip()
