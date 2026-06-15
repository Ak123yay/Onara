from onara_pipeline.agents.context import build_business_context, photo_assets_for_prompt
from onara_pipeline.agents.contracts import AnalystOutput, ContentOutput, PlannerOutput, PromptOutput, StyleOutput
from onara_pipeline.agents.fallbacks import fallback_prompt
from onara_pipeline.agents.generation_contracts import (
    ONARA_GENERATION_QUALITY_CONTRACT,
    business_fact_contract,
)
from onara_pipeline.agents.json_utils import compact_json
from onara_pipeline.agents.onara_theme import ONARA_THEME_CONTRACT
from onara_pipeline.agents.style_directives import style_directive_text
from onara_pipeline.agents.supervisor import SupervisorValidationError, validate_prompt_output
from onara_pipeline.ai_client import AIClient, AIClientError, AIMessage, AIRequest, get_agent_model_route
from onara_pipeline.config import Settings
from onara_pipeline.job_queue import PipelineJob

SYSTEM_PROMPT = """You are an expert at writing prompts for code generation AI models.

Your job is to take a structured website blueprint and convert it into the single most effective prompt for generating clean, production-ready HTML/CSS/JS code.

A good code generation prompt:
- Specifies exactly what must be in the output (file structure, CSS variables, components)
- Lists explicit constraints (no frameworks, valid HTML5, mobile-first)
- Provides the complete content so the model never needs to invent text
- Defines the exact output format expected
- Is specific enough that two different models would produce nearly identical output
- Explicitly rejects generic centered brochure layouts, Tailwind-like sameness, weak pills, and empty whitespace
- Requires a professional Onara-style local business composition: strong type, split hero, proof/contact panels, section contrast, and conversion-first mobile
- Requires the Onara theme contract: paper/ink/selected-accent palette, Fraunces headings, Inter UI copy, mono labels, low-radius surfaces

Return the prompt as a plain string, not JSON."""


async def run_prompt_engineer(
    job: PipelineJob,
    ai_client: AIClient,
    settings: Settings,
    analyst: AnalystOutput,
    content: ContentOutput,
    style: StyleOutput,
    planner: PlannerOutput,
) -> PromptOutput:
    context = build_business_context(job.business_data, job.style_preferences)
    route = get_agent_model_route(
        "agent_05_prompt_engineer",
        ollama_fallback_model=settings.ollama_fallback_model,
        ollama_primary_model=settings.ollama_primary_model,
        user_plan=job.user_plan,
        is_trial=job.is_trial,
    )

    try:
        response = await ai_client.generate_text(
            route=route,
            request=AIRequest(
                max_tokens=4200,
                messages=[
                    AIMessage(role="system", content=SYSTEM_PROMPT),
                    AIMessage(
                        role="user",
                        content=_user_prompt(
                            context.name,
                            context,
                            context.phone,
                            photo_assets_for_prompt(context),
                            job.style_preferences,
                            analyst,
                            content,
                            style,
                            planner,
                        ),
                    ),
                ],
                metadata={"agent_id": "agent_05_prompt_engineer", "job_id": job.job_id},
                temperature=0.2,
            ),
        )
        output = PromptOutput(prompt=_clean_prompt(response.content))
        validate_prompt_output(output)
        return output
    except (AIClientError, ValueError, SupervisorValidationError):
        output = fallback_prompt(
            analyst=analyst,
            business_name=context.name,
            content=content,
            context=context,
            photo_assets=photo_assets_for_prompt(context),
            phone=context.phone,
            planner=planner,
            style=style,
            style_preferences=job.style_preferences,
        )
        validate_prompt_output(output)
        return output


def _user_prompt(
    business_name: str,
    context,
    phone: str,
    photo_assets: list[dict[str, str]],
    style_preferences: dict,
    analyst: AnalystOutput,
    content: ContentOutput,
    style: StyleOutput,
    planner: PlannerOutput,
) -> str:
    return f"""Convert this blueprint into an optimized code generation prompt.

BLUEPRINT: {compact_json(planner.model_dump())}
CONTENT: {compact_json(content.model_dump())}
DESIGN SYSTEM: {compact_json(style.model_dump())}
BUSINESS NAME: {business_name}
PRIMARY CTA: {analyst.primaryCta}
PHONE NUMBER: {phone or "Unknown"}
RESOLVED PHOTO ASSETS: {compact_json(photo_assets)}
{style_directive_text(style_preferences)}

{business_fact_contract(context, style_preferences)}
{ONARA_GENERATION_QUALITY_CONTRACT}

{ONARA_THEME_CONTRACT}

The generated site must:
- Be a single self-contained index.html file
- Include all CSS in a <style> tag in <head>
- Include all JavaScript inline before </body>
- Use CSS custom properties for all colors and fonts
- Be fully responsive (mobile-first, single breakpoint at 768px)
- Pass HTML5 validation
- Score 90+ on Lighthouse accessibility
- Load in under 2 seconds (no external resources except Google Fonts)
- Use {{FILE_MARKER_START}} and {{FILE_MARKER_END}} at start and end of the HTML file for parser extraction
- Look professionally designed enough for a paying local business owner
- Follow the Onara design contract exactly, including the required CSS variables in :root
- Import or declare Fraunces, Inter, JetBrains Mono, and Caveat-compatible font stacks
- Define canonical Onara variables once; use selected palette values through --choice-* tokens and local component accents only
- Use the selected palette for CTAs/details while preserving warm paper/ink structure, mono uppercase metadata, and low-radius paper cards
- Avoid generic centered brochure templates; the desktop hero must not be only centered text, a badge, and one CTA
- Use a split/asymmetrical hero with a proof, service, contact, image, or booking panel beside the copy
- Keep the split hero compact; crop photos as landscape/square panels and avoid a tall right-side stack that creates blank space before services
- Build a complete first fold with at least four named Onara composition surfaces: hero-side, panel-stack, proof-strip, proof-grid, service-menu, local-card, hours-card, detail-card, review-card, contact-card
- Include at least three distinct card types across the page, such as service-card, proof-card, review-card, local-card, contact-card, hours-card, or metric-card
- Render the full supplied weekly schedule. Do not show only Monday or the first hours row unless all supplied days share the same hours and the page says Daily or Every day.
- Populate service-menu panels with distinct services from the business data/content plan/industry defaults. Never use generic filler labels like Services, Service calls, Repairs, or Maintenance as the whole menu.
- If no review quotes are supplied, do not invent testimonials and do not create three generic proof/review cards. Use one aggregate Google rating summary plus factual rows for rating, count, and local profile.
- Omit credential/license/insurance sections entirely unless owner notes or business data include real credential details. Never write "implied by trade" credential claims.
- Do not ship a page that is only a large H1, one paragraph, one CTA, and one photo; layer useful local-business proof and action panels
- Use fluid display type with clamp(), CSS grid with grid-template-columns, and at least one atmospheric background treatment
- Use low-radius cards, strong section contrast, practical local proof, and above-the-fold conversion structure
- Avoid rounded SaaS pill clutter, excessive empty whitespace, stock-template spacing, and vague decorative sections
- If RESOLVED PHOTO ASSETS is non-empty, include at least one real <img> above the fold or in a gallery/proof strip using an exact provided src.
- Every <img> must have meaningful alt text. Preserve attribution text/link near Google-sourced images when provided.
- Never use /api/places/photo, Google photo names, localhost URLs, or authenticated app routes in the deployed HTML.
- If no resolved photo assets are available, do not emit broken image tags; use designed CSS visual panels or placeholders instead.

Return only the final prompt string. Do not return JSON."""


def _clean_prompt(content: str) -> str:
    stripped = content.strip()
    if stripped.startswith("```"):
        stripped = stripped.strip("`")
        if stripped.lower().startswith(("text", "markdown")):
            stripped = stripped.split("\n", 1)[-1].strip()
    return stripped
