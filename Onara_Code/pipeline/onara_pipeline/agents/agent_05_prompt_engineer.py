from onara_pipeline.agents.context import build_business_context
from onara_pipeline.agents.contracts import AnalystOutput, ContentOutput, PlannerOutput, PromptOutput, StyleOutput
from onara_pipeline.agents.fallbacks import fallback_prompt
from onara_pipeline.agents.json_utils import compact_json
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
                    AIMessage(role="user", content=_user_prompt(context.name, context.phone, analyst, content, style, planner)),
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
            phone=context.phone,
            planner=planner,
            style=style,
        )
        validate_prompt_output(output)
        return output


def _user_prompt(
    business_name: str,
    phone: str,
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

Return only the final prompt string. Do not return JSON."""


def _clean_prompt(content: str) -> str:
    stripped = content.strip()
    if stripped.startswith("```"):
        stripped = stripped.strip("`")
        if stripped.lower().startswith(("text", "markdown")):
            stripped = stripped.split("\n", 1)[-1].strip()
    return stripped
