from pydantic import ValidationError

from onara_pipeline.agents.context import build_business_context
from onara_pipeline.agents.contracts import AnalystOutput, StyleOutput
from onara_pipeline.agents.fallbacks import fallback_style
from onara_pipeline.agents.json_utils import compact_json, parse_json_model
from onara_pipeline.agents.supervisor import SupervisorValidationError, validate_style_output
from onara_pipeline.ai_client import AIClient, AIClientError, AIMessage, AIRequest, get_agent_model_route
from onara_pipeline.config import Settings
from onara_pipeline.job_queue import PipelineJob

SYSTEM_PROMPT = """You are a UI design system specialist. Your job is to define the complete visual identity for a small business website based on their industry and tone.

Output precise CSS values - no vague descriptions. Every color must be a valid hex code. Every font must be a Google Fonts name.

Industry-to-palette defaults:
- plumber/hvac: trust blue (#1a4f8a), clean white, accent orange (#f97316)
- electrician: bold yellow (#facc15), dark navy (#0f172a), white
- landscaper: forest green (#166534), warm tan (#d4a96a), cream white
- cleaner: sky blue (#0ea5e9), bright white, subtle grey
- contractor/builder: slate grey (#475569), warm orange (#ea580c), white
- food truck: energetic red (#dc2626), warm yellow (#fbbf24), near-black
- photographer: near-black (#111827), warm cream (#fef3c7), gold accent (#d97706)
- salon/beauty: blush pink (#fce7f3), champagne (#e5d5b0), charcoal

Always return valid JSON only."""


async def run_style_agent(
    job: PipelineJob,
    ai_client: AIClient,
    settings: Settings,
    analyst: AnalystOutput,
) -> StyleOutput:
    context = build_business_context(job.business_data, job.style_preferences)
    route = get_agent_model_route(
        "agent_03_style",
        ollama_fallback_model=settings.ollama_fallback_model,
        ollama_primary_model=settings.ollama_primary_model,
        user_plan=job.user_plan,
        is_trial=job.is_trial,
    )

    try:
        response = await ai_client.generate_text(
            route=route,
            request=AIRequest(
                max_tokens=1600,
                messages=[
                    AIMessage(role="system", content=SYSTEM_PROMPT),
                    AIMessage(role="user", content=_user_prompt(job, analyst)),
                ],
                metadata={"agent_id": "agent_03_style", "job_id": job.job_id},
                temperature=0.35,
            ),
        )
        output = parse_json_model(response.content, StyleOutput)
        validate_style_output(output)
        return output
    except (AIClientError, ValueError, ValidationError, SupervisorValidationError):
        output = fallback_style(context, analyst, job.style_preferences)
        validate_style_output(output)
        return output


def _user_prompt(job: PipelineJob, analyst: AnalystOutput) -> str:
    context = build_business_context(job.business_data, job.style_preferences)
    return f"""Define a complete design system for this business website.

Industry: {analyst.industryType}
Tone keywords: {compact_json(analyst.toneKeywords)}
Business name: {context.name}
Google photo dominant color (if available): Unknown
User style preferences: {compact_json(job.style_preferences)}
Owner notes: {context.notes or "None"}

Return this JSON structure:
{{
  "colors": {{
    "primary": "hex", "secondary": "hex", "background": "hex", "surface": "hex",
    "text_primary": "hex", "text_secondary": "hex", "border": "hex"
  }},
  "typography": {{
    "heading_font": "Google Fonts name", "body_font": "Google Fonts name",
    "heading_weight": "600 | 700 | 800", "base_size": "16px", "scale": "1.25"
  }},
  "spacing": {{ "section_padding": "80px 0", "container_max": "1100px", "border_radius": "8px" }},
  "style_notes": "string - 1-2 sentences describing overall visual direction"
}}"""
