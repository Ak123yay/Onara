from pydantic import ValidationError

from onara_pipeline.agents.context import BusinessContext, build_business_context
from onara_pipeline.agents.contracts import AnalystOutput
from onara_pipeline.agents.fallbacks import fallback_analyst
from onara_pipeline.agents.json_utils import compact_json, parse_json_model
from onara_pipeline.agents.style_directives import style_directive_text
from onara_pipeline.agents.supervisor import validate_analyst_output
from onara_pipeline.ai_client import AIClient, AIClientError, AIMessage, AIRequest, get_agent_model_route
from onara_pipeline.config import Settings
from onara_pipeline.job_queue import PipelineJob

SYSTEM_PROMPT = """You are a senior web strategist specializing in small business websites for local service contractors.

Your job is to analyze a business's Google Business Profile data and produce a precise website specification. You do not write content or code. You identify what the site must contain, how it should be structured, and what the primary conversion goal is.

Always return valid JSON only. No markdown, no explanation, no preamble."""


async def run_analyst(job: PipelineJob, ai_client: AIClient, settings: Settings) -> AnalystOutput:
    context = build_business_context(job.business_data, job.style_preferences)
    prompt = _user_prompt(context, job.style_preferences)
    route = get_agent_model_route(
        "agent_01_analyst",
        ollama_fallback_model=settings.ollama_fallback_model,
        ollama_primary_model=settings.ollama_primary_model,
        user_plan=job.user_plan,
        is_trial=job.is_trial,
    )

    try:
        response = await ai_client.generate_text(
            route=route,
            request=AIRequest(
                max_tokens=1800,
                messages=[
                    AIMessage(role="system", content=SYSTEM_PROMPT),
                    AIMessage(role="user", content=prompt),
                ],
                metadata={"agent_id": "agent_01_analyst", "job_id": job.job_id},
                temperature=0.2,
            ),
        )
        output = parse_json_model(response.content, AnalystOutput)
        validate_analyst_output(output)
        return output
    except (AIClientError, ValueError, ValidationError):
        output = fallback_analyst(context, job.style_preferences)
        validate_analyst_output(output)
        return output


def _user_prompt(context: BusinessContext, style_preferences: dict) -> str:
    return f"""Analyze this business and return a website specification as JSON.

BUSINESS DATA:
Name: {context.name}
Category: {context.category}
Address: {context.address or "Unknown"}
Phone: {context.phone or "Unknown"}
Hours: {compact_json(context.hours)}
Google Rating: {context.rating if context.rating is not None else "Unknown"} ({context.review_count if context.review_count is not None else 0} reviews)
Services listed on Google: {compact_json(context.services)}
Owner notes: {context.notes or "None"}
{style_directive_text(style_preferences)}

Return this exact JSON structure:
{{
  "industryType": "string - e.g. plumber, electrician, landscaper, hvac",
  "primaryCta": "string - the single most important action, e.g. 'Call for a Free Quote'",
  "ctaType": "phone_call | contact_form | booking",
  "mustHaveSections": ["array of section names the site must include"],
  "optionalSections": ["array of sections that would help but are not required"],
  "trustSignals": ["array of trust elements to feature"],
  "urgencyTriggers": ["array of urgency triggers"],
  "targetKeyword": "string - the primary local SEO keyword",
  "competitorWeaknesses": ["what most competitor sites for this trade are missing"],
  "toneKeywords": ["3-5 words describing how this business should feel"]
}}"""
