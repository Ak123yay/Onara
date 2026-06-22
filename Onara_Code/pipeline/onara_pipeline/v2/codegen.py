from __future__ import annotations

import asyncio
import hashlib
import re

from pydantic import ValidationError

from onara_pipeline.agents.agent_06_codegen import SYSTEM_PROMPT, extract_index_html, split_component_files
from onara_pipeline.agents.context import build_business_context, materialize_photo_tokens
from onara_pipeline.agents.contracts import (
    AnalystOutput,
    CodegenOutput,
    ContentOutput,
    PlannerOutput,
    PromptOutput,
    StyleOutput,
)
from onara_pipeline.agents.fallbacks import fallback_codegen
from onara_pipeline.agents.supervisor import SupervisorValidationError, validate_codegen_output
from onara_pipeline.ai_client import AIClient, AIClientError, AIMessage, AIRequest
from onara_pipeline.ai_client.model_picker import (
    BENCHMARKED_PRIMARY_MODEL,
    BENCHMARKED_QUALITY_FALLBACK_MODEL,
    ModelCandidate,
    ModelRoute,
    get_agent_model_route,
)
from onara_pipeline.config import Settings
from onara_pipeline.job_queue import PipelineJob
from onara_pipeline.v2.contracts import CandidateArtifact


async def generate_candidates(
    *,
    ai_client: AIClient,
    analyst: AnalystOutput,
    content: ContentOutput,
    job: PipelineJob,
    planner: PlannerOutput,
    prompt_a: PromptOutput,
    prompt_b: PromptOutput,
    recipe_a: str,
    recipe_b: str,
    settings: Settings,
    style: StyleOutput,
) -> list[CandidateArtifact]:
    route_a, route_b = candidate_routes(job=job, settings=settings)
    tasks = [
        asyncio.create_task(
            _generate_candidate(
                ai_client=ai_client,
                job=job,
                key="a",
                planner=planner,
                prompt=prompt_a,
                recipe=recipe_a,
                route=route_a,
                settings=settings,
            )
        ),
        asyncio.create_task(
            _generate_candidate(
                ai_client=ai_client,
                job=job,
                key="b",
                planner=planner,
                prompt=prompt_b,
                recipe=recipe_b,
                route=route_b,
                settings=settings,
            )
        ),
    ]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    candidates = [result for result in results if isinstance(result, CandidateArtifact)]
    
    # Log failures for debugging
    for i, result in enumerate(results):
        if isinstance(result, Exception):
            key = "a" if i == 0 else "b"
            error_msg = f"Candidate {key} initial generation failed: {type(result).__name__}: {str(result)[:200]}"
            print(f"[codegen] {error_msg}")
    
    if len(candidates) == 1:
        missing_key = "a" if candidates[0].key == "b" else "b"
        missing_prompt = prompt_a if missing_key == "a" else prompt_b
        missing_recipe = recipe_a if missing_key == "a" else recipe_b
        recovery_route = route_b if missing_key == "a" else route_a
        print(f"[codegen] Attempting recovery for candidate {missing_key}")
        try:
            recovered = await _generate_candidate(
                ai_client=ai_client,
                job=job,
                key=missing_key,
                planner=planner,
                prompt=missing_prompt,
                recipe=missing_recipe,
                route=recovery_route,
                settings=settings,
            )
            recovered.warnings.append(
                "Original candidate route failed; alternate route recovered this concept"
            )
            candidates.append(recovered)
            print(f"[codegen] Recovery succeeded for candidate {missing_key}")
        except (AIClientError, TimeoutError) as exc:
            print(f"[codegen] Recovery failed for candidate {missing_key}: {type(exc).__name__}: {str(exc)[:200]}")
    if len(candidates) >= 2:
        return sorted(candidates, key=lambda candidate: candidate.key)
    if candidates:
        missing_key = "a" if candidates[0].key == "b" else "b"
        fallback = _fallback_candidate(
            analyst=analyst,
            content=content,
            job=job,
            key=missing_key,
            planner=planner,
            recipe=recipe_a if missing_key == "a" else recipe_b,
            style=style,
        )
        fallback.warnings.append(
            "Alternate AI concept failed; deterministic fallback preserved two-concept evaluation"
        )
        candidates.append(fallback)
        return sorted(candidates, key=lambda candidate: candidate.key)

    return [
        _fallback_candidate(
            analyst=analyst,
            content=content,
            job=job,
            key="a",
            planner=planner,
            recipe=recipe_a,
            style=style,
        ),
        _fallback_candidate(
            analyst=analyst,
            content=content,
            job=job,
            key="b",
            planner=planner,
            recipe=recipe_b,
            style=style,
        ),
    ]


async def _generate_candidate(
    *,
    ai_client: AIClient,
    job: PipelineJob,
    key: str,
    planner: PlannerOutput,
    prompt: PromptOutput,
    recipe: str,
    route: ModelRoute,
    settings: Settings,
) -> CandidateArtifact:
    context = build_business_context(job.business_data, job.style_preferences)
    response = await asyncio.wait_for(
        ai_client.generate_text(
            route=route,
            request=AIRequest(
                max_tokens=14_000,
                messages=[
                    AIMessage(role="system", content=SYSTEM_PROMPT),
                    AIMessage(role="user", content=prompt.prompt),
                ],
                metadata={
                    "agent_id": "agent_06_codegen",
                    "candidate": key,
                    "job_id": job.job_id,
                    "recipe": recipe,
                },
                temperature=0.22 if key == "a" else 0.28,
            ),
        ),
        timeout=settings.pipeline_v2_candidate_timeout,
    )
    try:
        html = materialize_photo_tokens(extract_index_html(response.content), context)
        output = CodegenOutput(
            component_files=split_component_files(html, planner),
            fallback_used=response.fallback_used,
            html=html,
            model=response.model,
            provider=response.provider,
            raw_output=response.content,
        )
        validate_codegen_output(output, allow_repairable_visual_issues=True)
    except (ValueError, ValidationError, SupervisorValidationError) as exc:
        raise AIClientError(f"Candidate {key} returned invalid HTML: {exc}") from exc

    return CandidateArtifact(
        fallback_used=response.fallback_used,
        fingerprint=document_fingerprint(html),
        html=html,
        key=key,
        model=response.model,
        provider=response.provider,
        recipe=recipe,
    )


def candidate_routes(*, job: PipelineJob, settings: Settings) -> tuple[ModelRoute, ModelRoute]:
    selected = get_agent_model_route(
        "agent_06_codegen",
        agent_6_model=job.agent_6_model,
        is_trial=job.is_trial,
        ollama_fallback_model=settings.ollama_fallback_model,
        ollama_primary_model=settings.ollama_primary_model,
        user_plan=job.user_plan,
    )
    selected_primary = selected.model
    second_model = (
        BENCHMARKED_PRIMARY_MODEL
        if selected_primary == BENCHMARKED_QUALITY_FALLBACK_MODEL
        else BENCHMARKED_QUALITY_FALLBACK_MODEL
    )
    route_a = _without_model(selected, second_model)
    route_b = ModelRoute(
        fallback_model=settings.ollama_fallback_model,
        fallback_provider="ollama",
        fallback_chain=(
            ModelCandidate(model=settings.ollama_fallback_model, provider="ollama"),
        ),
        model=second_model,
        provider="nim",
    )
    return route_a, route_b


def document_fingerprint(html: str) -> str:
    normalized = re.sub(r"\s+", " ", html.lower()).strip()
    normalized = re.sub(r">[^<]{1,200}<", "><", normalized)
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()


def _fallback_candidate(
    *,
    analyst: AnalystOutput,
    content: ContentOutput,
    job: PipelineJob,
    key: str,
    planner: PlannerOutput,
    recipe: str,
    style: StyleOutput,
) -> CandidateArtifact:
    preferences = dict(job.style_preferences)
    preferences["layout"] = _fallback_layout(recipe, key)
    fallback = fallback_codegen(
        analyst=analyst,
        content=content,
        context=build_business_context(job.business_data, preferences),
        planner=planner,
        style=style,
        style_preferences=preferences,
    )
    validate_codegen_output(fallback, allow_repairable_visual_issues=True)
    return CandidateArtifact(
        fallback_used=True,
        fingerprint=document_fingerprint(fallback.html),
        html=fallback.html,
        key=key,
        model=fallback.model,
        provider=fallback.provider,
        recipe=recipe,
        used_fallback_template=True,
        warnings=[
            f"AI candidate {key.upper()} was unavailable; deterministic {recipe} concept generated"
        ],
    )


def _fallback_layout(recipe: str, key: str) -> str:
    if recipe in {"editorial-trust", "proof-led"}:
        return "trust-led"
    if recipe in {"service-led", "emergency-utility"}:
        return "service-grid" if key == "b" else "phone-first"
    if recipe == "photo-led":
        return "split-hero"
    return "split-hero" if key == "b" else "phone-first"


def _without_model(route: ModelRoute, excluded_model: str) -> ModelRoute:
    chain = tuple(candidate for candidate in route.fallback_chain if candidate.model != excluded_model)
    return ModelRoute(
        fallback_model=chain[0].model if chain else None,
        fallback_provider=chain[0].provider if chain else None,
        fallback_chain=chain,
        model=route.model,
        provider=route.provider,
    )
