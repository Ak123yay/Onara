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
from onara_pipeline.agents.generation_contracts import (
    ONARA_GENERATION_QUALITY_CONTRACT,
    business_fact_contract,
)
from onara_pipeline.agents.json_utils import compact_json
from onara_pipeline.agents.onara_theme import ONARA_THEME_CONTRACT
from onara_pipeline.agents.style_directives import style_directive_text
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

Onara visual quality bar:
- The output must look like a professionally designed local-business website, not a generic AI landing page.
- The output must follow the Onara design contract: warm paper, ink text, selected palette details through --choice-* tokens, Fraunces display type, Inter UI copy, JetBrains Mono metadata, low-radius panels.
- Define protected Onara theme variables once. Do not redeclare --paper, --ink, --accent, or --leaf after the canonical theme block.
- Do not create a centered brochure hero with a small badge, centered H1, centered paragraph, and one CTA as the whole fold.
- Desktop hero must use a split/asymmetrical composition with a proof, service, image, booking, or contact panel beside the copy.
- First fold must include at least four Onara composition surfaces such as hero-side, panel-stack, proof-strip, proof-grid, service-menu, local-card, hours-card, detail-card, review-card, or contact-card.
- Do not output a page that is only a giant headline, short paragraph, one CTA, and one photo; layer useful local-business proof and action panels.
- Use strong editorial type scale, low-radius cards, section contrast, atmospheric background treatment, and conversion-first CTAs.
- Use CSS grid, grid-template-columns, minmax/repeat, clamp() typography, and at least one gradient/texture/shaped visual treatment.
- Avoid Tailwind-looking defaults, oversized empty whitespace, generic rounded pills, and bland template symmetry.
- If the prompt includes resolved photo assets, use exact provided `src` values in real <img> tags with meaningful alt text.
- Never use raw Google Places photo names, /api/places/photo routes, localhost URLs, or authenticated app URLs in deployed HTML.

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
                    AIMessage(role="user", content=_user_prompt(context, job.style_preferences, planner, prompt)),
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
            style_preferences=job.style_preferences,
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


def _user_prompt(
    context,
    style_preferences: dict,
    planner: PlannerOutput,
    prompt: PromptOutput,
) -> str:
    return f"""{prompt.prompt}

{ONARA_THEME_CONTRACT}
{style_directive_text(style_preferences)}
{business_fact_contract(context, style_preferences)}
{ONARA_GENERATION_QUALITY_CONTRACT}

Final Agent 6 requirements:
- Business name: {context.name}
- Root component IDs that must appear as data-component values: {", ".join(planner.component_order)}
- Keep these CSS variables available in :root: {compact_json(planner.css_variables)}
- Each root component should be independently extractable by data-component.
- Build a professional Onara-style local-business page, not a generic centered brochure page.
- Define and use the Onara theme variables in :root: --paper, --paper-2, --ink, --ink-2, --ink-3, --rule, --accent, --accent-ink, --serif, --ui, --mono.
- Do not redeclare protected Onara variables after the canonical theme definitions; use --choice-* variables for selected palette details.
- Use Fraunces/var(--serif) for H1-H3, Inter/var(--ui) for body copy, and JetBrains Mono/var(--mono) for eyebrows, labels, metadata, and tiny proof text.
- Use the selected palette for CTAs and accents, while keeping Onara paper cards, ink panels, low-radius borders, rule-line separators, and subtle paper texture.
- The desktop hero must be a composed grid/split layout; do not set .hero to text-align:center unless there is still a designed side panel.
- Include a proof/contact/service panel near the hero so the first fold has more than centered copy.
- Include at least four named composition surfaces in or near the first fold: hero-side, panel-stack, proof-strip, proof-grid, service-menu, local-card, hours-card, detail-card, review-card, contact-card.
- Include at least three distinct card types across the page: service-card, proof-card, review-card, local-card, contact-card, hours-card, metric-card, or detail-card.
- Include CSS grid with grid-template-columns, fluid typography with clamp(), and a visual atmosphere layer using gradients, texture, image framing, color-mix(), clip-path, or aspect-ratio panels.
- Use resolved photo assets from the prompt when present; otherwise use designed CSS placeholder panels, not broken image tags.
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
