import re

from pydantic import ValidationError

from onara_pipeline.agents.context import build_business_context
from onara_pipeline.agents.contracts import (
    AnalystOutput,
    CodegenOutput,
    ContentOutput,
    PlannerOutput,
    PromptOutput,
    StyleOutput,
)
from onara_pipeline.agents.fallbacks import fallback_codegen
from onara_pipeline.agents.json_utils import compact_json
from onara_pipeline.agents.supervisor import SupervisorValidationError, validate_codegen_output
from onara_pipeline.ai_client import AIClient, AIClientError, AIMessage, AIRequest, get_agent_model_route
from onara_pipeline.config import Settings
from onara_pipeline.job_queue import PipelineJob

FILE_MARKER_RE = re.compile(
    r"\{FILE_MARKER_START\}\s*(?P<html>.*?)\s*\{FILE_MARKER_END\}",
    flags=re.IGNORECASE | re.DOTALL,
)
HTML_DOCUMENT_RE = re.compile(
    r"(?P<html><!doctype\s+html\b.*?</html>|<html\b.*?</html>)",
    flags=re.IGNORECASE | re.DOTALL,
)

SYSTEM_PROMPT = """You are Agent 6, Onara's senior frontend code generator.

Generate production-ready contractor website code from the exact prompt and blueprint provided.

Strict output rules:
- Return exactly one self-contained index.html document.
- Wrap the document between {FILE_MARKER_START} and {FILE_MARKER_END}.
- Return no markdown fences, no explanation, and no text outside the markers.
- Put all CSS inside one <style> tag in <head>.
- Use no frameworks and no external JavaScript.
- Every root component from the planner must include data-component="<component_id>".
- Preserve the planner component order and exact business copy.
- Make the page mobile-first, accessible, phone-first, and visually polished.
- Add lightweight CSS-only motion using opacity and transform for page entry, cards, CTAs, and trust proof.
- Include at least one @keyframes rule and a @media (prefers-reduced-motion: reduce) block that disables animation, transitions, and smooth scrolling.
- Do not use JavaScript animations, infinite loops, layout-shifting animation, or heavy filters."""


async def run_codegen(
    job: PipelineJob,
    ai_client: AIClient,
    settings: Settings,
    analyst: AnalystOutput,
    content: ContentOutput,
    style: StyleOutput,
    planner: PlannerOutput,
    prompt: PromptOutput,
) -> CodegenOutput:
    context = build_business_context(job.business_data, job.style_preferences)
    route = get_agent_model_route(
        "agent_06_codegen",
        agent_6_model=job.agent_6_model,
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
                    AIMessage(role="user", content=_user_prompt(context.name, planner, prompt)),
                ],
                metadata={
                    "agent_id": "agent_06_codegen",
                    "job_id": job.job_id,
                    "requested_model": job.agent_6_model,
                },
                temperature=0.18,
            ),
        )
        html = extract_index_html(response.content)
        output = CodegenOutput(
            component_files=split_component_files(html, planner),
            fallback_used=response.fallback_used,
            html=html,
            model=response.model,
            provider=response.provider,
            raw_output=response.content,
            used_fallback_template=False,
        )
        validate_codegen_output(output)
        return output
    except (AIClientError, ValueError, ValidationError, SupervisorValidationError):
        output = fallback_codegen(
            analyst=analyst,
            content=content,
            context=context,
            planner=planner,
            style=style,
        )
        validate_codegen_output(output)
        return output


def extract_index_html(raw_output: str) -> str:
    content = _strip_markdown_fences(raw_output.strip())
    marker_match = FILE_MARKER_RE.search(content)

    if marker_match:
        return _strip_markdown_fences(marker_match.group("html").strip())

    document_match = HTML_DOCUMENT_RE.search(content)
    if document_match:
        return _strip_markdown_fences(document_match.group("html").strip())

    raise ValueError("Agent 6 output did not contain a marked index.html document")


def split_component_files(html: str, planner: PlannerOutput) -> dict[str, str]:
    files = {"index.html": html}

    for component in planner.components:
        component_html = _extract_component_html(html, component.id)
        if component_html:
            files[f"components/{component.id}.html"] = component_html
        else:
            files[f"components/{component.id}.spec.txt"] = component.html_structure

    return files


def _user_prompt(business_name: str, planner: PlannerOutput, prompt: PromptOutput) -> str:
    return f"""{prompt.prompt}

Final Agent 6 requirements:
- Business name: {business_name}
- Root component IDs that must appear as data-component values: {", ".join(planner.component_order)}
- Keep these CSS variables available in :root: {compact_json(planner.css_variables)}
- Each root component should be independently extractable by data-component.
- Add polished, lightweight CSS motion: entry reveals, subtle CTA/card hover states, and staggered proof/card reveals.
- Motion must animate only transform and opacity; no infinite loops, no layout-affecting animation, no JS animation.
- Include @media (prefers-reduced-motion: reduce) that disables animations, transitions, and smooth scrolling.
- Do not invent extra pages, pricing sections, SaaS UI, or unrelated copy.

Return only:
{{FILE_MARKER_START}}
<!doctype html>
...
</html>
{{FILE_MARKER_END}}"""


def _extract_component_html(html: str, component_id: str) -> str | None:
    variants = {component_id, component_id.replace("_", "-")}
    tags = ("header", "nav", "section", "footer", "main")

    for variant in variants:
        escaped = re.escape(variant)
        for tag in tags:
            patterns = (
                rf"(<{tag}\b[^>]*data-component=[\"']{escaped}[\"'][^>]*>.*?</{tag}>)",
                rf"(<{tag}\b[^>]*id=[\"']{escaped}[\"'][^>]*>.*?</{tag}>)",
                rf"(<{tag}\b[^>]*class=[\"'][^\"']*\b{escaped}\b[^\"']*[\"'][^>]*>.*?</{tag}>)",
            )
            for pattern in patterns:
                match = re.search(pattern, html, flags=re.IGNORECASE | re.DOTALL)
                if match:
                    return match.group(1).strip()

    return None


def _strip_markdown_fences(value: str) -> str:
    stripped = value.strip()
    if not stripped.startswith("```"):
        return stripped

    stripped = re.sub(r"^```[a-zA-Z0-9_-]*\s*", "", stripped)
    stripped = re.sub(r"\s*```$", "", stripped)
    return stripped.strip()
