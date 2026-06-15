from pydantic import ValidationError

from onara_pipeline.agents.context import build_business_context, photo_assets_for_prompt
from onara_pipeline.agents.contracts import AnalystOutput, ContentOutput, PlannerOutput, StyleOutput
from onara_pipeline.agents.fallbacks import fallback_planner
from onara_pipeline.agents.json_utils import compact_json, parse_json_model
from onara_pipeline.agents.onara_theme import ONARA_THEME_CONTRACT
from onara_pipeline.agents.supervisor import SupervisorValidationError, validate_planner_output
from onara_pipeline.ai_client import AIClient, AIClientError, AIMessage, AIRequest, get_agent_model_route
from onara_pipeline.config import Settings
from onara_pipeline.job_queue import PipelineJob

SYSTEM_PROMPT = """You are a senior frontend architect. You translate content and design systems into precise HTML component blueprints.

You do not write code. You write an unambiguous specification that a code generator can follow exactly to produce production-ready HTML.

Onara quality bar:
- The blueprint must produce a designed local-business website, not a generic centered brochure template.
- The blueprint must follow the Onara design contract: paper texture, ink/terracotta palette, Fraunces display type, Inter body type, mono eyebrows, low-radius panels.
- Desktop hero must use a deliberate composition: split grid, editorial panel, image/proof card, service menu, or trust/contact module beside the copy.
- Do not plan a hero whose main CSS direction is only text-align:center and max-width copy.
- Include visible proof, services, and conversion panels above or immediately after the fold.
- Specify strong typography scale, section contrast, and practical mobile behavior.

Each component specification must include:
- Exact HTML structure (element types, hierarchy, classes)
- Which CSS variables to use (from the design system)
- Responsive behavior (what changes at mobile breakpoints)
- Any interactive behaviors (hover states, click actions)
- Exact copy to use (pulled from the content)

Return valid JSON only."""


async def run_planner(
    job: PipelineJob,
    ai_client: AIClient,
    settings: Settings,
    analyst: AnalystOutput,
    content: ContentOutput,
    style: StyleOutput,
) -> PlannerOutput:
    route = get_agent_model_route(
        "agent_04_planner",
        ollama_fallback_model=settings.ollama_fallback_model,
        ollama_primary_model=settings.ollama_primary_model,
        user_plan=job.user_plan,
        is_trial=job.is_trial,
    )

    try:
        response = await ai_client.generate_text(
            route=route,
            request=AIRequest(
                max_tokens=3600,
                messages=[
                    AIMessage(role="system", content=SYSTEM_PROMPT),
                    AIMessage(role="user", content=_user_prompt(job, analyst, content, style)),
                ],
                metadata={"agent_id": "agent_04_planner", "job_id": job.job_id},
                temperature=0.25,
            ),
        )
        output = parse_json_model(response.content, PlannerOutput)
        validate_planner_output(output)
        return output
    except (AIClientError, ValueError, ValidationError, SupervisorValidationError):
        output = fallback_planner(analyst, content, style)
        validate_planner_output(output)
        return output


def _user_prompt(
    job: PipelineJob,
    analyst: AnalystOutput,
    content: ContentOutput,
    style: StyleOutput,
) -> str:
    context = build_business_context(job.business_data, job.style_preferences)
    return f"""Create a complete component blueprint for this website.

BUSINESS:
Name: {context.name}
Phone: {context.phone or "Unknown"}
Address: {context.address or "Unknown"}
Owner notes: {context.notes or "None"}
Resolved photo assets: {compact_json(photo_assets_for_prompt(context))}

DESIGN SYSTEM: {compact_json(style.model_dump())}
CONTENT: {compact_json(content.model_dump())}
SITE REQUIREMENTS: {compact_json(analyst.model_dump())}

{ONARA_THEME_CONTRACT}

The site must use semantic HTML5. All styles use CSS custom properties defined in :root.
No external CSS libraries. No JavaScript frameworks. Vanilla HTML, CSS, and minimal JS only.
Desktop visual requirements:
- Use Onara CSS variables for paper, ink, rule, accent, accent-ink, serif, ui, and mono tokens.
- Use mono uppercase labels, serif H1/H2 display type, terracotta CTAs, paper cards, and low-radius browser/proof panels.
- Hero must be asymmetrical or split-composition, not a centered single-column brochure hero.
- Include one proof/contact/service panel in the hero or directly adjacent to it.
- Use section contrast, card structure, and distinctive type scale so the site looks professionally designed.
- If resolved photo assets are available, plan a real photo panel, gallery strip, or proof image using those exact `src` values and useful alt text.
- If no resolved photo assets are available, plan designed placeholders or illustrated panels instead of broken image tags.

Return this exact JSON structure:
{{
  "components": [{{
    "id": "snake_case_component_name",
    "type": "section | header | footer | nav",
    "order": 1,
    "html_structure": "string - describe the exact HTML hierarchy",
    "css_classes": ["list of classes to create"],
    "content_mapping": {{ "field_name": "exact text to use" }},
    "responsive_changes": "string - mobile-specific changes",
    "interactive": "string | null"
  }}],
  "css_variables": {{ "--color-primary": "hex", "--font-heading": "font name" }},
  "component_order": ["ordered list of component IDs"],
  "special_notes": "string"
}}"""
