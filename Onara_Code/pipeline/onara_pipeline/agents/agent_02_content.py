from pydantic import ValidationError

from onara_pipeline.agents.context import build_business_context
from onara_pipeline.agents.contracts import AnalystOutput, ContentOutput
from onara_pipeline.agents.fallbacks import fallback_content
from onara_pipeline.agents.json_utils import compact_json, parse_json_model
from onara_pipeline.agents.style_directives import style_directive_text
from onara_pipeline.agents.supervisor import SupervisorValidationError, validate_content_output
from onara_pipeline.ai_client import AIClient, AIClientError, AIMessage, AIRequest, get_agent_model_route
from onara_pipeline.config import Settings
from onara_pipeline.job_queue import PipelineJob

SYSTEM_PROMPT = """You are a conversion copywriter specializing in local service business websites.

Write copy that is direct, confident, and speaks to homeowners or property owners who need a contractor. Use the language the business owner uses to describe their work - not corporate marketing language.

Rules:
- Never use the word "solutions"
- Never use the phrase "we are committed to"
- Never use "world-class" or "industry-leading"
- Every section should have one clear point
- Headlines should name the benefit, not the feature
- Always include the city or service area in the hero headline
- Always return valid JSON only. No markdown, no preamble."""


async def run_content_writer(
    job: PipelineJob,
    ai_client: AIClient,
    settings: Settings,
    analyst: AnalystOutput,
) -> ContentOutput:
    context = build_business_context(job.business_data, job.style_preferences)
    route = get_agent_model_route(
        "agent_02_content",
        ollama_fallback_model=settings.ollama_fallback_model,
        ollama_primary_model=settings.ollama_primary_model,
        user_plan=job.user_plan,
        is_trial=job.is_trial,
    )

    try:
        response = await ai_client.generate_text(
            route=route,
            request=AIRequest(
                max_tokens=2200,
                messages=[
                    AIMessage(role="system", content=SYSTEM_PROMPT),
                    AIMessage(role="user", content=_user_prompt(job, analyst)),
                ],
                metadata={"agent_id": "agent_02_content", "job_id": job.job_id},
                temperature=0.45,
            ),
        )
        output = parse_json_model(response.content, ContentOutput)
        validate_content_output(output)
        return output
    except (AIClientError, ValueError, ValidationError, SupervisorValidationError):
        output = fallback_content(context, analyst)
        validate_content_output(output)
        return output


def _user_prompt(job: PipelineJob, analyst: AnalystOutput) -> str:
    context = build_business_context(job.business_data, job.style_preferences)
    return f"""Write all website copy for this business.

BUSINESS DATA:
Name: {context.name}
Category: {context.category}
Address: {context.address or "Unknown"}
Phone: {context.phone or "Unknown"}
Years in business: Unknown
Services: {compact_json(context.services)}
Owner notes: {context.notes or "None"}
Tone keywords from Analyst: {compact_json(analyst.toneKeywords)}
Primary CTA: {analyst.primaryCta}
Trust signals: {compact_json(analyst.trustSignals)}
Target keyword: {analyst.targetKeyword}
{style_directive_text(job.style_preferences)}

Return this JSON structure:
{{
  "hero": {{
    "headline": "string - punchy, benefit-led, includes city",
    "subheadline": "string - 1-2 sentences, specific value prop",
    "cta_button": "string - action text"
  }},
  "about": {{ "headline": "string", "body": "string - 2-3 sentences, first person, specific" }},
  "services": [{{ "name": "string", "description": "string - 1 sentence, benefit-focused" }}],
  "social_proof": {{ "headline": "string - references real rating if available", "subtext": "string" }},
  "contact": {{ "headline": "string", "subtext": "string - reduce friction" }},
  "footer_tagline": "string - short, memorable"
}}"""
