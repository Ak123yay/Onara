import re

from pydantic import ValidationError

from onara_pipeline.agents.context import (
    build_business_context,
    materialize_photo_tokens,
    tokenize_photo_sources,
)
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
from onara_pipeline.agents.supervisor import (
    SupervisorValidationError,
    repair_codegen_motion,
    validate_codegen_output,
)
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
- If hours are supplied, render the full weekly schedule unless all supplied days share the same hours and the copy clearly says Daily or Every day.
- Hero service-menu items must be specific services, not category/filler labels like Services, Service calls, Repairs, or Maintenance.
- If no review quotes are supplied, use one aggregate Google rating/review summary with factual rows; do not create fake testimonials or three generic proof cards.
- Never claim licensing, insurance, bonded status, certification, or "implied by trade" credentials unless the owner notes or business data supply those exact details.
- Keep the first fold compact: do not let a tall side photo/card stack create a large blank gap before the services section.
- The hero side column may contain at most two major blocks on desktop. Do not stack service menu + large photo + local proof in the same hero side column; move lower proof/detail cards into later sections or a compact strip.
- The services section must begin immediately after the hero content. Avoid designs where the left hero column ends early while a taller right column forces a large blank area above Services.
- If an hours card says the same hours every day, the card heading must be simple ("Open 24 hours" or "Open daily"), with the schedule below; never render awkward text like "Daily Open 24 hours" as a large heading.
- Header must use one clean horizontal alignment: brand, nav, and CTA share the same vertical centerline; avoid CTA blocks that sit higher/lower than the logo or nav.
- Use the whole browser width. Do not wrap the entire page, header, hero, or main sections in a narrow centered max-width shell; only constrain inner text lines and individual cards.
- Hours cards must not squeeze the summary, phone, CTA, and weekly list into one cramped row. Use a small two-column card: summary left, phone right, CTA/list below.
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
- Do not use JavaScript animations, infinite loops, layout-shifting animation, or heavy filters.

EXACT REQUIRED OUTPUT SHAPE:
{FILE_MARKER_START}
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Business name</title>
  <style>/* complete CSS, including safe keyframes */</style>
</head>
<body>
  <!-- complete page with data-component attributes -->
</body>
</html>
{FILE_MARKER_END}

Return only that complete marked document. Do not use markdown fences or add commentary."""


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
        html = repair_codegen_motion(
            materialize_photo_tokens(extract_index_html(response.content), context)
        )
        output = CodegenOutput(
            component_files=split_component_files(html, planner),
            fallback_used=response.fallback_used,
            html=html,
            model=response.model,
            provider=response.provider,
            raw_output=response.content,
            used_fallback_template=False,
        )
    except (AIClientError, ValueError, ValidationError):
        return _fallback_codegen_output(analyst, content, context, planner, style, job.style_preferences)

    try:
        validate_codegen_output(output, allow_repairable_visual_issues=True)
        return output
    except SupervisorValidationError as exc:
        try:
            repaired = await _repair_codegen_with_model(
                ai_client=ai_client,
                context=context,
                issue=str(exc),
                job=job,
                original=output,
                planner=planner,
                prompt=prompt,
                route=route,
            )
            validate_codegen_output(repaired, allow_repairable_visual_issues=True)
            return repaired
        except (AIClientError, ValueError, ValidationError, SupervisorValidationError):
            return _fallback_codegen_output(analyst, content, context, planner, style, job.style_preferences)


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
- Keep desktop hero side stacks shallow: one compact service/contact panel plus one compact photo/proof block is enough. Put extra local proof under Services or Proof, not under the photo in the hero.
- Do not create a first-fold layout where Services starts far below the proof cards because the right hero column is taller than the left.
- For same-hours-every-day businesses, use "Open 24 hours" or "Open daily" as the hours-card headline, then render the weekly list in compact rows.
- Header layout must be a stable grid or flex row with align-items:center; brand, nav, and CTA should look vertically centered together.
- The page should feel full-screen on desktop: header, hero, and sections span 100% width with responsive side padding; avoid a single centered 1100px wrapper around the whole site.
- Hours-card layout must reserve separate space for the phone number and avoid headline collisions or awkward wrapping.
- Include at least four named composition surfaces in or near the first fold: hero-side, panel-stack, proof-strip, proof-grid, service-menu, local-card, hours-card, detail-card, review-card, contact-card.
- Include at least three distinct card types across the page: service-card, proof-card, review-card, local-card, contact-card, hours-card, metric-card, or detail-card.
- Include CSS grid with grid-template-columns, fluid typography with clamp(), and a visual atmosphere layer using gradients, texture, image framing, color-mix(), clip-path, or aspect-ratio panels.
- Use resolved photo assets from the prompt when present; otherwise use designed CSS placeholder panels, not broken image tags.
- Keep hero photos cropped with a compact landscape or square aspect ratio unless the layout intentionally balances the opposite column.
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


async def _repair_codegen_with_model(
    *,
    ai_client: AIClient,
    context,
    issue: str,
    job: PipelineJob,
    original: CodegenOutput,
    planner: PlannerOutput,
    prompt: PromptOutput,
    route,
) -> CodegenOutput:
    response = await ai_client.generate_text(
        route=route,
        request=AIRequest(
            max_tokens=12000,
            messages=[
                AIMessage(role="system", content=SYSTEM_PROMPT),
                AIMessage(
                    role="user",
                    content=_repair_prompt(
                        context=context,
                        issue=issue,
                        original=original,
                        planner=planner,
                        prompt=prompt,
                    ),
                ),
            ],
            metadata={
                "agent_id": "agent_06_codegen",
                "job_id": job.job_id,
                "repair_for": issue,
                "repair_source_model": original.model,
                "requested_model": job.agent_6_model,
            },
            temperature=0.12,
        ),
    )
    html = repair_codegen_motion(
        materialize_photo_tokens(extract_index_html(response.content), context)
    )
    return CodegenOutput(
        component_files=split_component_files(html, planner),
        fallback_used=original.fallback_used or response.fallback_used,
        html=html,
        model=response.model,
        provider=response.provider,
        raw_output=response.content,
        used_fallback_template=False,
    )


def _repair_prompt(
    *,
    context,
    issue: str,
    original: CodegenOutput,
    planner: PlannerOutput,
    prompt: PromptOutput,
) -> str:
    return f"""Repair this Agent 6 HTML output. The supervisor rejected it for:
{issue}

Repair rules:
- Return a complete replacement index.html, not a patch.
- Keep the existing Onara theme, business facts, component IDs, and planner component order.
- Do not rewrite unrelated sections unless required to fix the rejected issue.
- If the issue mentions a missing conversion CTA, add a clear above-the-fold CTA inside data-component="hero".
- The hero CTA must be an <a> with an href to tel:, #contact, #booking, #estimate, or another valid on-page conversion target.
- CTA copy must match the selected conversion goal and business type, such as "Get a Free Estimate", "Call Now", "Book Online", or "Get Emergency Help".
- Keep the hero split/composed; do not collapse it into a centered brochure layout.

Required planner component order:
{", ".join(planner.component_order)}

Original generation prompt for context:
{prompt.prompt}

Business:
- Name: {context.name}
- Category: {context.category}
- Phone: {context.phone or "not supplied"}
- City/region: {context.city or context.address or "not supplied"}

Rejected HTML:
{tokenize_photo_sources(original.html, context)}

Return only:
{{FILE_MARKER_START}}
<!doctype html>
...
</html>
{{FILE_MARKER_END}}"""


def _fallback_codegen_output(
    analyst: AnalystOutput,
    content: ContentOutput,
    context,
    planner: PlannerOutput,
    style: StyleOutput,
    style_preferences: dict,
) -> CodegenOutput:
    output = fallback_codegen(
        analyst=analyst,
        content=content,
        context=context,
        planner=planner,
        style=style,
        style_preferences=style_preferences,
    )
    validate_codegen_output(output, allow_repairable_visual_issues=True)
    return output


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
