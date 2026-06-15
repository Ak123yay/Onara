import html as html_lib
import json
import re
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, ValidationError

from onara_pipeline.agents.agent_06_codegen import split_component_files
from onara_pipeline.agents.context import BusinessContext, build_business_context
from onara_pipeline.agents.contracts import AnalystOutput, ContentOutput, PlannerOutput, SEOOutput
from onara_pipeline.agents.json_utils import compact_json, parse_json_model
from onara_pipeline.agents.supervisor import SupervisorValidationError, validate_seo_output
from onara_pipeline.ai_client import AIClient, AIClientError, AIMessage, AIRequest, get_agent_model_route
from onara_pipeline.config import Settings
from onara_pipeline.job_queue import PipelineJob

SYSTEM_PROMPT = """You are Agent 8, Onara's local SEO specialist.

Create SEO metadata for a generated local contractor website.

Strict rules:
- Return valid JSON only.
- Do not rewrite HTML.
- Do not invent claims, certifications, service areas, or reviews.
- Keep title under 80 characters.
- Keep meta description under 180 characters.
- Use practical local-search wording, not generic SaaS copy.
- Return LocalBusiness schema fields that can be backed by the supplied business data."""


class SEOMetadata(BaseModel):
    model_config = ConfigDict(extra="ignore", str_strip_whitespace=True)

    title: str = Field(min_length=8, max_length=80)
    meta_description: str = Field(min_length=40, max_length=180)
    og_title: str = Field(min_length=8, max_length=90)
    og_description: str = Field(min_length=40, max_length=200)
    local_business_type: str = Field(default="LocalBusiness", min_length=1)
    service_keywords: list[str] = Field(default_factory=list)


async def run_seo_agent(
    job: PipelineJob,
    ai_client: AIClient,
    settings: Settings,
    analyst: AnalystOutput,
    content: ContentOutput,
    planner: PlannerOutput,
) -> SEOOutput:
    source_html = str(job.blackboard.get("debugged_html") or job.blackboard.get("generated_html") or "")
    context = build_business_context(job.business_data, job.style_preferences)
    defaults = build_seo_metadata(context, analyst, content)
    route = get_agent_model_route(
        "agent_08_seo",
        is_trial=job.is_trial,
        ollama_fallback_model=settings.ollama_fallback_model,
        ollama_primary_model=settings.ollama_primary_model,
        user_plan=job.user_plan,
    )

    try:
        response = await ai_client.generate_text(
            route=route,
            request=AIRequest(
                max_tokens=1600,
                messages=[
                    AIMessage(role="system", content=SYSTEM_PROMPT),
                    AIMessage(role="user", content=_user_prompt(job, analyst, content, defaults, settings)),
                ],
                metadata={"agent_id": "agent_08_seo", "job_id": job.job_id},
                temperature=0.18,
            ),
        )
        ai_metadata = parse_json_model(response.content, SEOMetadata)
        metadata = merge_seo_metadata(defaults, ai_metadata, context, analyst, content)
        html = inject_seo_metadata(source_html, metadata, context)
        output = SEOOutput(
            component_files=split_component_files(html, planner),
            fallback_used=response.fallback_used,
            html=html,
            json_ld=metadata["json_ld"],
            meta_description=metadata["meta_description"],
            model=response.model,
            provider=response.provider,
            raw_output=response.content,
            title=metadata["title"],
        )
        validate_seo_output(output)
        return output
    except (AIClientError, ValueError, ValidationError, SupervisorValidationError):
        output = deterministic_seo(source_html, context=context, analyst=analyst, content=content, planner=planner)
        validate_seo_output(output)
        return output


def deterministic_seo(
    html: str,
    *,
    context: BusinessContext,
    analyst: AnalystOutput,
    content: ContentOutput,
    planner: PlannerOutput,
) -> SEOOutput:
    metadata = build_seo_metadata(context, analyst, content)
    seo_html = inject_seo_metadata(html, metadata, context)
    raw_output = compact_json(
        {
            "title": metadata["title"],
            "meta_description": metadata["meta_description"],
            "json_ld": metadata["json_ld"],
        }
    )
    return SEOOutput(
        component_files=split_component_files(seo_html, planner),
        fallback_used=True,
        html=seo_html,
        json_ld=metadata["json_ld"],
        meta_description=metadata["meta_description"],
        model="deterministic-seo",
        provider="deterministic",
        raw_output=raw_output,
        title=metadata["title"],
        used_deterministic_fallback=True,
    )


def build_seo_metadata(
    context: BusinessContext,
    analyst: AnalystOutput,
    content: ContentOutput,
) -> dict[str, Any]:
    title = _bounded_text(f"{context.name} | {analyst.targetKeyword}", max_length=80)
    description = _description(
        content.hero.subheadline,
        fallback=(
            f"{context.name} helps customers in {context.service_area} with {analyst.targetKeyword}, "
            f"clear service details, local proof, and fast contact."
        ),
    )
    keywords = _service_keywords(context, analyst, content)
    json_ld = _local_business_schema(context, analyst, content, description, keywords)

    return {
        "title": title,
        "meta_description": description,
        "og_title": title,
        "og_description": description,
        "service_keywords": keywords,
        "json_ld": json_ld,
    }


def merge_seo_metadata(
    defaults: dict[str, Any],
    ai_metadata: SEOMetadata,
    context: BusinessContext,
    analyst: AnalystOutput,
    content: ContentOutput,
) -> dict[str, Any]:
    title = _bounded_text(ai_metadata.title or defaults["title"], max_length=80)
    description = _description(ai_metadata.meta_description or defaults["meta_description"])
    keywords = _unique([*ai_metadata.service_keywords, *defaults["service_keywords"]])[:8]
    json_ld = _local_business_schema(context, analyst, content, description, keywords)

    return {
        "title": title,
        "meta_description": description,
        "og_title": _bounded_text(ai_metadata.og_title or title, max_length=90),
        "og_description": _description(ai_metadata.og_description or description, max_length=200),
        "service_keywords": keywords,
        "json_ld": json_ld,
    }


def inject_seo_metadata(html: str, metadata: dict[str, Any], context: BusinessContext) -> str:
    cleaned = _remove_existing_seo_metadata(html)
    block = _metadata_block(metadata, context)

    viewport_match = re.search(
        r"<meta\b[^>]*name=(['\"])viewport\1[^>]*>\s*",
        cleaned,
        flags=re.IGNORECASE,
    )
    if viewport_match:
        return cleaned[: viewport_match.end()] + block + cleaned[viewport_match.end() :]

    head_match = re.search(r"<head\b[^>]*>", cleaned, flags=re.IGNORECASE)
    if head_match:
        return cleaned[: head_match.end()] + "\n" + block + cleaned[head_match.end() :]

    return cleaned


def _user_prompt(
    job: PipelineJob,
    analyst: AnalystOutput,
    content: ContentOutput,
    defaults: dict[str, Any],
    settings: Settings,
) -> str:
    return f"""Create SEO metadata for this generated contractor website.

Business data:
{compact_json(job.business_data)}

Analyst requirements:
{compact_json(analyst.model_dump())}

Website copy:
{compact_json(content.model_dump())}

Default metadata baseline:
{compact_json({key: value for key, value in defaults.items() if key != "json_ld"})}

Relevant RAG guidance:
{_load_seo_patterns(settings)}

Return exactly this JSON:
{{
  "title": "SEO title under 80 chars",
  "meta_description": "SEO description under 180 chars",
  "og_title": "Open Graph title",
  "og_description": "Open Graph description",
  "local_business_type": "LocalBusiness",
  "service_keywords": ["short local keyword strings"]
}}"""


def _load_seo_patterns(settings: Settings) -> str:
    try:
        from onara_pipeline.rag import build_pattern_store

        store = build_pattern_store(settings)
        results = store.search(
            query="local contractor SEO title meta description LocalBusiness schema reviews service area",
            top_k=4,
        )
        if not results:
            return "No RAG patterns available."
        return "\n\n".join(f"{result.title}: {result.summary}\n{result.content}" for result in results)
    except Exception:
        return "RAG unavailable; use built-in local SEO rules."


def _metadata_block(metadata: dict[str, Any], context: BusinessContext) -> str:
    title = _escape(metadata["title"])
    description = _escape(metadata["meta_description"])
    og_title = _escape(metadata.get("og_title") or metadata["title"])
    og_description = _escape(metadata.get("og_description") or metadata["meta_description"])
    site_name = _escape(context.name)
    json_ld = json.dumps(metadata["json_ld"], ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")

    return f"""    <title>{title}</title>
    <meta name="description" content="{description}" />
    <meta property="og:title" content="{og_title}" />
    <meta property="og:description" content="{og_description}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="{site_name}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="{og_title}" />
    <meta name="twitter:description" content="{og_description}" />
    <!-- Onara canonical placeholder: set final public URL during deployment. -->
    <script type="application/ld+json">{json_ld}</script>
"""


def _remove_existing_seo_metadata(html: str) -> str:
    patterns = (
        r"\s*<title\b[^>]*>.*?</title>\s*",
        r"\s*<meta\b[^>]*(?:name|property)=(['\"])(?:description|og:title|og:description|og:type|og:site_name|twitter:card|twitter:title|twitter:description)\1[^>]*>\s*",
        r"\s*<!--\s*Onara canonical placeholder:.*?-->\s*",
        r"\s*<script\b[^>]*type=(['\"])application/ld\+json\1[^>]*>.*?</script>\s*",
    )

    cleaned = html
    for pattern in patterns:
        cleaned = re.sub(pattern, "\n", cleaned, flags=re.IGNORECASE | re.DOTALL)

    return cleaned


def _local_business_schema(
    context: BusinessContext,
    analyst: AnalystOutput,
    content: ContentOutput,
    description: str,
    keywords: list[str],
) -> dict[str, Any]:
    schema: dict[str, Any] = {
        "@context": "https://schema.org",
        "@type": ["LocalBusiness"],
        "name": context.name,
        "description": description,
        "areaServed": context.service_area,
        "keywords": ", ".join(keywords),
    }

    if context.phone:
        schema["telephone"] = context.phone
    if context.website:
        schema["url"] = context.website
    if context.address:
        schema["address"] = {
            "@type": "PostalAddress",
            "streetAddress": context.address,
            "addressLocality": context.city,
            "addressRegion": context.state,
        }
    if context.rating and context.review_count:
        schema["aggregateRating"] = {
            "@type": "AggregateRating",
            "ratingValue": round(float(context.rating), 1),
            "reviewCount": int(context.review_count),
        }

    services = [
        service.name for service in content.services[:6] if service.name
    ] or [analyst.targetKeyword]
    schema["makesOffer"] = [
        {
            "@type": "Offer",
            "itemOffered": {
                "@type": "Service",
                "name": service,
                "areaServed": context.service_area,
            },
        }
        for service in services
    ]

    return {key: value for key, value in schema.items() if value not in ("", [], None)}


def _service_keywords(
    context: BusinessContext,
    analyst: AnalystOutput,
    content: ContentOutput,
) -> list[str]:
    service_names = [service.name for service in content.services if service.name]
    return _unique(
        [
            analyst.targetKeyword,
            f"{context.category} in {context.service_area}",
            *service_names,
            context.service_area,
        ]
    )[:8]


def _description(value: str, *, fallback: str | None = None, max_length: int = 180) -> str:
    text = _compact_whitespace(value or fallback or "")
    if len(text) < 40:
        text = _compact_whitespace(f"{text} {fallback or 'Clear local contractor service details and fast contact.'}")
    return _bounded_text(text, max_length=max_length)


def _bounded_text(value: str, *, max_length: int) -> str:
    text = _compact_whitespace(value)
    if len(text) <= max_length:
        return text

    trimmed = text[: max_length - 1].rstrip()
    if " " in trimmed:
        trimmed = trimmed.rsplit(" ", 1)[0].rstrip()
    return trimmed.rstrip(".,;:-") + "."


def _compact_whitespace(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def _escape(value: str) -> str:
    return html_lib.escape(value, quote=True)


def _unique(values: list[str]) -> list[str]:
    seen = set()
    output = []
    for value in values:
        normalized = _compact_whitespace(str(value))
        key = normalized.lower()
        if normalized and key not in seen:
            seen.add(key)
            output.append(normalized)
    return output
