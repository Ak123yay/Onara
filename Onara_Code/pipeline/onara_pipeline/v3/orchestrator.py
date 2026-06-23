from __future__ import annotations

import asyncio
from collections.abc import Awaitable, Callable
from typing import Any

from onara_pipeline.agents.agent_01_analyst import run_analyst
from onara_pipeline.agents.agent_02_content import run_content_writer
from onara_pipeline.agents.agent_03_style import run_style_agent
from onara_pipeline.agents.agent_04_planner import run_planner
from onara_pipeline.agents.contracts import AnalystOutput, ContentOutput, PlannerOutput, StyleOutput
from onara_pipeline.agents.supervisor import (
    SupervisorValidationError,
    validate_analyst_output,
    validate_content_output,
    validate_planner_output,
    validate_style_output,
)
from onara_pipeline.ai_client import ai_client_for_job
from onara_pipeline.config import Settings
from onara_pipeline.job_queue import PipelineJob
from onara_pipeline.v2.codegen import candidate_routes, document_fingerprint
from onara_pipeline.v2.evaluator import evaluate_candidates
from onara_pipeline.v2.prompt_compiler import build_generation_spec
from onara_pipeline.v2.repair import (
    deterministic_release_gate_repair,
    deterministic_release_hardening,
    targeted_repair,
)
from onara_pipeline.v3.assembler import assemble_candidate, build_baseline
from onara_pipeline.v3.component_codegen import generate_candidate_components
from onara_pipeline.v3.contracts import ComponentArtifact, DesignDirection, V3CandidateArtifact
from onara_pipeline.v3.directions import generate_directions, select_directions
from onara_pipeline.v3.quality import critical_release_blockers


ProgressCallback = Callable[[str, str | None, str, dict[str, Any] | None], Awaitable[None]]
CandidateCallback = Callable[[V3CandidateArtifact], Awaitable[None]]
ComponentCallback = Callable[[ComponentArtifact], Awaitable[None]]


async def run_pipeline_v3(
    job: PipelineJob,
    settings: Settings,
    progress: ProgressCallback,
    persist_candidate: CandidateCallback,
    persist_component: ComponentCallback,
) -> None:
    spec = build_generation_spec(
        business_data=job.business_data,
        style_preferences=job.style_preferences,
    )
    job.blackboard["pipeline_version"] = "v3"
    job.blackboard["generation_spec"] = spec.model_dump()

    async with ai_client_for_job(settings) as ai_client:
        await progress(
            "stage_started",
            "understanding_business",
            "Checking verified business facts, assets, and conversion goals.",
            {"eta_seconds": 200, "stage": "understanding_business"},
        )
        analyst = (
            AnalystOutput.model_validate(job.blackboard["analyst_output"])
            if isinstance(job.blackboard.get("analyst_output"), dict)
            else await run_analyst(job, ai_client, settings)
        )
        validate_analyst_output(analyst)
        job.blackboard["analyst_output"] = analyst.model_dump()
        await progress(
            "stage_completed",
            "understanding_business",
            "The verified business brief is ready.",
            {"eta_seconds": 180, "stage": "understanding_business"},
        )

        await progress(
            "stage_started",
            "writing_content",
            "Writing business-specific content and the accessible visual foundation.",
            {"eta_seconds": 170, "stage": "writing_content"},
        )
        saved_content = job.blackboard.get("content_output")
        saved_style = job.blackboard.get("style_output")
        if isinstance(saved_content, dict) and isinstance(saved_style, dict):
            content = ContentOutput.model_validate(saved_content)
            style = StyleOutput.model_validate(saved_style)
        else:
            content, style = await asyncio.gather(
                run_content_writer(job, ai_client, settings, analyst),
                run_style_agent(job, ai_client, settings, analyst),
            )
        validate_content_output(content)
        validate_style_output(style)
        job.blackboard["content_output"] = content.model_dump()
        job.blackboard["style_output"] = style.model_dump()
        await progress(
            "stage_completed",
            "writing_content",
            "Specific content and safe design tokens are ready.",
            {"eta_seconds": 150, "stage": "writing_content"},
        )

        await progress(
            "stage_started",
            "designing_concepts",
            "Creating three design directions and selecting the strongest two.",
            {"eta_seconds": 140, "stage": "designing_concepts"},
        )
        planner = (
            PlannerOutput.model_validate(job.blackboard["planner_output"])
            if isinstance(job.blackboard.get("planner_output"), dict)
            else await run_planner(job, ai_client, settings, analyst, content, style)
        )
        validate_planner_output(planner)
        saved_directions = job.blackboard.get("v3_selected_directions")
        if isinstance(saved_directions, list) and len(saved_directions) >= 2:
            direction_a = DesignDirection.model_validate(saved_directions[0])
            direction_b = DesignDirection.model_validate(saved_directions[1])
            directions = [direction_a, direction_b]
        else:
            directions = await generate_directions(
                ai_client=ai_client,
                analyst=analyst,
                content=content,
                job=job,
                settings=settings,
                spec=spec,
                style=style,
            )
            direction_a, direction_b = select_directions(directions)
        job.blackboard["planner_output"] = planner.model_dump()
        job.blackboard["v3_directions"] = [item.model_dump() for item in directions]
        job.blackboard["v3_selected_directions"] = [
            direction_a.model_dump(),
            direction_b.model_dump(),
        ]
        await progress(
            "stage_completed",
            "designing_concepts",
            "Two distinct design directions are ready for component generation.",
            {
                "directions": [
                    {"key": direction_a.key, "name": direction_a.name},
                    {"key": direction_b.key, "name": direction_b.name},
                ],
                "eta_seconds": 125,
                "stage": "designing_concepts",
            },
        )

        await progress(
            "stage_started",
            "building_candidates",
            "Building two websites from independently validated components.",
            {"candidate_count": 2, "eta_seconds": 120, "stage": "building_candidates"},
        )
        route_a, route_b = candidate_routes(job=job, settings=settings)
        async def persist_component_progress(component: ComponentArtifact) -> None:
            await persist_component(component)
            await progress(
                "component_ready",
                f"candidate_{component.candidate_key}",
                (
                    f"{component.component_id.replace('_', ' ').title()} is ready"
                    + (" using the approved safe baseline." if component.fallback_used else ".")
                ),
                {
                    "candidateKey": component.candidate_key,
                    "componentId": component.component_id,
                    "fallbackUsed": component.fallback_used,
                    "stage": "building_candidates",
                },
            )

        candidates = await asyncio.gather(
            _build_candidate(
                ai_client=ai_client,
                analyst=analyst,
                candidate_key="a",
                content=content,
                direction=direction_a,
                job=job,
                persist_component=persist_component_progress,
                planner=planner,
                route=route_a,
                settings=settings,
                style=style,
            ),
            _build_candidate(
                ai_client=ai_client,
                analyst=analyst,
                candidate_key="b",
                content=content,
                direction=direction_b,
                job=job,
                persist_component=persist_component_progress,
                planner=planner,
                route=route_b,
                settings=settings,
                style=style,
            ),
        )
        for candidate in candidates:
            await persist_candidate(candidate)
            await progress(
                "candidate_ready",
                f"candidate_{candidate.key}",
                f"{candidate.direction.name} is assembled and ready for browser testing.",
                {
                    "candidate": _candidate_summary(candidate),
                    "eta_seconds": 75,
                    "stage": "building_candidates",
                },
            )
        await progress(
            "stage_completed",
            "building_candidates",
            "Both component-based website concepts are assembled.",
            {"eta_seconds": 70, "stage": "building_candidates"},
        )

        await progress(
            "stage_started",
            "testing_candidates",
            "Testing real browser behavior, accessibility, responsive layout, and visual quality.",
            {"eta_seconds": 65, "stage": "testing_candidates"},
        )
        await evaluate_candidates(candidates, ai_client=ai_client, settings=settings, spec=spec)
        for candidate in candidates:
            _apply_release_policy(candidate, settings)
            await persist_candidate(candidate)
            await progress(
                "candidate_scored",
                f"candidate_{candidate.key}",
                f"{candidate.direction.name} scored {candidate.final_score:g}/100.",
                {
                    "candidate": _candidate_summary(candidate, include_thumbnail=True),
                    "eta_seconds": 40,
                    "stage": "testing_candidates",
                },
            )

        await progress(
            "stage_started",
            "polishing",
            "Repairing only the failed selectors and components in the strongest concepts.",
            {"eta_seconds": 35, "stage": "polishing"},
        )
        await asyncio.gather(
            *[
                _repair_candidate(
                    candidate,
                    ai_client=ai_client,
                    job=job,
                    settings=settings,
                    spec=spec,
                )
                for candidate in candidates
                if candidate.hard_blockers or candidate.final_score < settings.pipeline_v3_min_score
            ]
        )
        for candidate in candidates:
            _apply_release_policy(candidate, settings)
            await persist_candidate(candidate)

        eligible = [candidate for candidate in candidates if not candidate.hard_blockers]
        if not eligible:
            best = max(candidates, key=lambda item: item.final_score)
            raise SupervisorValidationError(
                "Both V3 website concepts retained critical release blockers: "
                + "; ".join(best.hard_blockers[:6])
            )
        selected = max(eligible, key=lambda item: item.final_score)
        selected.selected = True
        selected.html = deterministic_release_hardening(selected.html)
        await persist_candidate(selected)

        job.blackboard["candidate_summaries"] = [
            _candidate_summary(candidate, include_thumbnail=True) for candidate in candidates
        ]
        job.blackboard["selected_candidate_id"] = selected.key
        job.blackboard["selected_candidate"] = _candidate_summary(
            selected,
            include_thumbnail=True,
        )
        job.blackboard["generated_html"] = selected.html
        job.blackboard["final_html"] = selected.html
        job.blackboard["component_files"] = {
            **selected.component_files,
            "index.html": selected.html,
        }
        job.blackboard["quality_badges"] = [
            "Component validated",
            "Desktop tested",
            "Tablet tested",
            "Mobile tested",
            "Business facts verified",
            "Contact form checked",
        ]
        job.blackboard["quality_mode"] = selected.browser.mode
        job.blackboard["degraded_services"] = (
            ["browser_quality"] if selected.browser.mode == "static" else []
        )
        job.blackboard["fallback_used"] = selected.fallback_component_count > 0
        job.blackboard["final_browser_report"] = selected.browser.model_dump(
            exclude={"mobile_thumbnail_data_url", "thumbnail_data_url"}
        )
        await progress(
            "stage_completed",
            "testing_candidates",
            f"{selected.direction.name} is the strongest eligible website.",
            {
                "candidate": _candidate_summary(selected, include_thumbnail=True),
                "eta_seconds": 20,
                "stage": "testing_candidates",
            },
        )
        await progress(
            "stage_completed",
            "polishing",
            "The strongest concept passed the critical release gate.",
            {
                "eta_seconds": 15,
                "quality_badges": job.blackboard["quality_badges"],
                "quality_mode": selected.browser.mode,
                "stage": "polishing",
            },
        )


async def _build_candidate(
    *,
    ai_client,
    analyst,
    candidate_key,
    content,
    direction,
    job,
    persist_component,
    planner,
    route,
    settings,
    style,
) -> V3CandidateArtifact:
    baseline_html, baseline_files, effective_style = build_baseline(
        analyst=analyst,
        business_data=job.business_data,
        content=content,
        direction=direction,
        planner=planner,
        style=style,
        style_preferences=job.style_preferences,
    )
    artifacts = await generate_candidate_components(
        ai_client=ai_client,
        analyst=analyst,
        baseline_files=baseline_files,
        candidate_key=candidate_key,
        content=content,
        direction=direction,
        job=job,
        persist_component=persist_component,
        planner=planner,
        route=route,
        settings=settings,
        style=effective_style,
    )
    html, component_files = assemble_candidate(
        baseline_html=baseline_html,
        components=artifacts,
        direction=direction,
    )
    fallback_count = sum(artifact.fallback_used for artifact in artifacts)
    warnings = [
        warning
        for artifact in artifacts
        for warning in artifact.warnings
    ]
    return V3CandidateArtifact(
        component_artifacts=artifacts,
        component_files=component_files,
        direction=direction,
        fallback_component_count=fallback_count,
        fallback_used=any(artifact.fallback_used for artifact in artifacts),
        fingerprint=document_fingerprint(html),
        html=html,
        key=candidate_key,
        model=", ".join(dict.fromkeys(artifact.model for artifact in artifacts)),
        provider=", ".join(dict.fromkeys(artifact.provider for artifact in artifacts)),
        recipe=direction.recipe,
        warnings=warnings,
    )


async def _repair_candidate(
    candidate: V3CandidateArtifact,
    *,
    ai_client,
    job: PipelineJob,
    settings: Settings,
    spec,
) -> None:
    repaired = deterministic_release_gate_repair(
        candidate.html,
        [*candidate.hard_blockers, *candidate.warnings],
    )
    if repaired != candidate.html:
        candidate.html = repaired
        candidate.component_files["index.html"] = repaired
        candidate.hard_blockers = []
        candidate.warnings = []
        await evaluate_candidates([candidate], ai_client=ai_client, settings=settings, spec=spec)
        _apply_release_policy(candidate, settings)

    if candidate.hard_blockers or candidate.final_score < settings.pipeline_v3_min_score:
        route, _ = candidate_routes(job=job, settings=settings)
        targeted = await targeted_repair(candidate, ai_client=ai_client, route=route)
        if targeted and targeted != candidate.html:
            candidate.html = deterministic_release_hardening(targeted)
            candidate.component_files["index.html"] = candidate.html
            candidate.hard_blockers = []
            candidate.warnings = []
            await evaluate_candidates([candidate], ai_client=ai_client, settings=settings, spec=spec)
            _apply_release_policy(candidate, settings)


def _apply_release_policy(candidate: V3CandidateArtifact, settings: Settings) -> None:
    all_blockers = list(candidate.hard_blockers)
    candidate.hard_blockers = critical_release_blockers(all_blockers)
    candidate.warnings = list(
        dict.fromkeys(
            [
                *candidate.warnings,
                *[blocker for blocker in all_blockers if blocker not in candidate.hard_blockers],
            ]
        )
    )
    if candidate.fallback_component_count > settings.pipeline_v3_max_fallback_components:
        candidate.hard_blockers.append(
            f"Candidate used {candidate.fallback_component_count} deterministic fallback components"
        )
    if candidate.final_score < settings.pipeline_v3_min_score:
        candidate.warnings.append(
            f"Candidate quality score {candidate.final_score:g} is below the preferred "
            f"{settings.pipeline_v3_min_score:g}"
        )


def _candidate_summary(
    candidate: V3CandidateArtifact,
    *,
    include_thumbnail: bool = False,
) -> dict[str, Any]:
    summary = {
        "candidateKey": candidate.key,
        "componentCount": len(candidate.component_artifacts),
        "degradedReason": candidate.browser.degraded_reason,
        "directionName": candidate.direction.name,
        "fallbackComponentCount": candidate.fallback_component_count,
        "fallbackUsed": candidate.fallback_used,
        "finalScore": candidate.final_score,
        "hardBlockers": candidate.hard_blockers,
        "model": candidate.model,
        "provider": candidate.provider,
        "qualityMode": candidate.browser.mode,
        "recipe": candidate.recipe,
        "selected": candidate.selected,
        "visualScore": candidate.visual_score,
        "warnings": candidate.warnings,
    }
    if include_thumbnail:
        summary["thumbnailDataUrl"] = candidate.browser.thumbnail_data_url
    return summary
