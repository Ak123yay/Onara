from pydantic import BaseModel, ConfigDict, Field, ValidationError

from onara_pipeline.agents.json_utils import compact_json, parse_json_model
from onara_pipeline.ai_client import AIClientError, AIMessage, AIRequest, build_ai_client, get_agent_model_route
from onara_pipeline.config import Settings
from onara_pipeline.schemas import DashboardBriefRequest, DashboardBriefResponse


class _DashboardBriefModel(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    headline: str = Field(min_length=1, max_length=120)
    recommendations: list[str] = Field(default_factory=list, max_length=4)
    summary: str = Field(min_length=1, max_length=500)


async def build_dashboard_brief(
    *,
    body: DashboardBriefRequest,
    settings: Settings,
) -> DashboardBriefResponse:
    try:
        response = await build_ai_client(settings).generate_text(
            request=AIRequest(
                max_tokens=450,
                messages=[
                    AIMessage(
                        role="system",
                        content=(
                            "You write concise Onara dashboard briefs for local-business website owners. "
                            "Return only valid JSON with keys headline, summary, recommendations. "
                            "Do not invent analytics, traffic, sales, credentials, or website data. "
                            "Base recommendations only on the supplied project statuses, URLs, review counts, "
                            "build failures, active builds, and revision availability."
                        ),
                    ),
                    AIMessage(
                        role="user",
                        content=(
                            "Create today's dashboard brief. Mention what sites are deployed, if any, "
                            "and give 2-3 practical recommendations.\n\n"
                            f"Workspace data:\n{compact_json(body.model_dump())}"
                        ),
                    ),
                ],
                temperature=0.25,
            ),
            route=get_agent_model_route(
                "agent_01_analyst",
                is_trial=body.is_trial,
                ollama_fallback_model=settings.ollama_fallback_model,
                ollama_primary_model=settings.ollama_primary_model,
                user_plan=body.user_plan,
            ),
        )
        parsed = parse_json_model(response.content, _DashboardBriefModel)

        return DashboardBriefResponse(
            generated_on=body.today,
            headline=parsed.headline,
            model=response.model,
            provider=response.provider,
            recommendations=_clean_recommendations(parsed.recommendations),
            source="ai",
            summary=parsed.summary,
        )
    except (AIClientError, ValueError, ValidationError):
        return fallback_dashboard_brief(body)


def fallback_dashboard_brief(body: DashboardBriefRequest) -> DashboardBriefResponse:
    live_sites = [project for project in body.projects if project.status == "live" and project.public_url]
    failed_sites = [project for project in body.projects if project.status == "failed"]
    active_sites = [project for project in body.projects if project.status in {"queued", "generating", "deploying"}]

    if live_sites:
        names = ", ".join(project.business_name for project in live_sites[:3])
        headline = f"{len(live_sites)} site{' is' if len(live_sites) == 1 else 's are'} deployed"
        summary = (
            f"Live today: {names}. "
            f"Your workspace has {body.total_count} total site{'s' if body.total_count != 1 else ''}."
        )
    elif active_sites:
        headline = "Builds are still running"
        summary = "No deployed site is available yet, but at least one build is moving through the pipeline."
    elif failed_sites:
        headline = "A build needs attention"
        summary = "No deployed site is available yet. Review the failed build and retry once the issue is fixed."
    else:
        headline = "No deployed sites yet"
        summary = "Start a build by searching a Google Business Profile, then confirm the details before generation."

    recommendations = _fallback_recommendations(body, live_sites, failed_sites, active_sites)

    return DashboardBriefResponse(
        generated_on=body.today,
        headline=headline,
        recommendations=recommendations,
        source="fallback",
        summary=summary,
    )


def _fallback_recommendations(
    body: DashboardBriefRequest,
    live_sites: list,
    failed_sites: list,
    active_sites: list,
) -> list[str]:
    recommendations: list[str] = []

    if active_sites:
        recommendations.append("Let the active build finish before starting another draft.")
    if failed_sites:
        recommendations.append("Open the failed build, review the error, and retry after the blocker is fixed.")
    if live_sites:
        recommendations.append("Open each live site and verify the public link, phone CTA, and business details.")
    if body.revisions_label != "0/0":
        recommendations.append(f"Use revisions carefully; your current revision usage is {body.revisions_label}.")
    if not recommendations:
        recommendations.append("Build your first site from a confirmed Google Business Profile.")

    return recommendations[:3]


def _clean_recommendations(values: list[str]) -> list[str]:
    cleaned = [value.strip() for value in values if value.strip()]
    return cleaned[:3] or ["Review your deployed sites and check that public links are working."]

