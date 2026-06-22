from __future__ import annotations

import asyncio
from collections.abc import Awaitable, Callable
from typing import Any

from onara_pipeline.agents.agent_01_analyst import run_analyst
from onara_pipeline.agents.agent_02_content import run_content_writer
from onara_pipeline.agents.agent_03_style import run_style_agent
from onara_pipeline.agents.agent_04_planner import run_planner
from onara_pipeline.agents.agent_07_debugger import deterministic_debugger
from onara_pipeline.agents.agent_08_seo import deterministic_seo
from onara_pipeline.agents.agent_09_qa import deterministic_qa
from onara_pipeline.agents.agent_10_mobile import deterministic_mobile
from onara_pipeline.agents.context import build_business_context
from onara_pipeline.agents.contracts import (
    AnalystOutput,
    ContentOutput,
    PlannerOutput,
    PromptOutput,
    StyleOutput,
)
from onara_pipeline.agents.supervisor import (
    SupervisorValidationError,
    validate_analyst_output,
    validate_content_output,
    validate_mobile_output,
    validate_planner_output,
    validate_qa_output,
    validate_seo_output,
    validate_style_output,
)
from onara_pipeline.ai_client import ai_client_for_job
from onara_pipeline.config import Settings
from onara_pipeline.job_queue import PipelineJob
from onara_pipeline.v2.browser_quality import audit_candidate_html
from onara_pipeline.v2.codegen import candidate_routes, generate_candidates
from onara_pipeline.v2.contracts import BrowserReport, CandidateArtifact
from onara_pipeline.v2.evaluator import choose_candidate, evaluate_candidates
from onara_pipeline.v2.prompt_compiler import build_generation_spec, compile_prompt
from onara_pipeline.v2.repair import (
    deterministic_release_gate_repair,
    deterministic_release_hardening,
    targeted_repair,
)

ProgressCallback = Callable[[str, str | None, str, dict[str, Any] | None], Awaitable[None]]
CandidateCallback = Callable[[CandidateArtifact], Awaitable[None]]


async def run_pipeline_v2(
    job: PipelineJob,
    settings: Settings,
    progress: ProgressCallback,
    persist_candidate: CandidateCallback,
) -> None:
    spec = build_generation_spec(
        business_data=job.business_data,
        style_preferences=job.style_preferences,
    )
    job.blackboard["pipeline_version"] = "v2"
    job.blackboard["generation_spec"] = spec.model_dump()

    async with ai_client_for_job(settings) as ai_client:
        await progress(
            "stage_started",
            "understanding_business",
            "Understanding your business, local facts, and conversion goal.",
            {"eta_seconds": 220, "stage": "understanding_business"},
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
            "Business facts and site requirements are ready.",
            {"eta_seconds": 195, "stage": "understanding_business"},
        )

        await progress(
            "stage_started",
            "writing_content",
            "Writing specific page content from the verified business facts.",
            {"eta_seconds": 180, "stage": "writing_content"},
        )
        saved_content = job.blackboard.get("content_output")
        saved_style = job.blackboard.get("style_output")
        if isinstance(saved_content, dict) and isinstance(saved_style, dict):
            content = ContentOutput.model_validate(saved_content)
            style = StyleOutput.model_validate(saved_style)
        else:
            content_task = asyncio.create_task(run_content_writer(job, ai_client, settings, analyst))
            style_task = asyncio.create_task(run_style_agent(job, ai_client, settings, analyst))
            content, style = await asyncio.gather(content_task, style_task)
        validate_content_output(content)
        validate_style_output(style)
        job.blackboard["content_output"] = content.model_dump()
        job.blackboard["style_output"] = style.model_dump()
        await progress(
            "stage_completed",
            "writing_content",
            "Business-specific page content is ready.",
            {"eta_seconds": 160, "stage": "writing_content"},
        )

        await progress(
            "stage_started",
            "designing_concepts",
            "Designing two compatible but distinct website concepts.",
            {"eta_seconds": 155, "stage": "designing_concepts"},
        )
        planner = (
            PlannerOutput.model_validate(job.blackboard["planner_output"])
            if isinstance(job.blackboard.get("planner_output"), dict)
            else await run_planner(job, ai_client, settings, analyst, content, style)
        )
        validate_planner_output(planner)
        job.blackboard["planner_output"] = planner.model_dump()
        prompt_a = (
            PromptOutput.model_validate(job.blackboard["prompt_output"])
            if isinstance(job.blackboard.get("prompt_output"), dict)
            else compile_prompt(
                analyst=analyst,
                content=content,
                planner=planner,
                recipe=spec.recipe_a,
                spec=spec,
                style=style,
            )
        )
        prompt_b = (
            PromptOutput.model_validate(job.blackboard["prompt_b_output"])
            if isinstance(job.blackboard.get("prompt_b_output"), dict)
            else compile_prompt(
                analyst=analyst,
                content=content,
                planner=planner,
                recipe=spec.recipe_b,
                spec=spec,
                style=style,
            )
        )
        job.blackboard["prompt_output"] = prompt_a.model_dump()
        job.blackboard["prompt_b_output"] = prompt_b.model_dump()
        await progress(
            "stage_completed",
            "designing_concepts",
            "Content and two distinct website concepts are planned.",
            {
                "eta_seconds": 140,
                "recipes": [spec.recipe_a, spec.recipe_b],
                "stage": "designing_concepts",
            },
        )

        await progress(
            "stage_started",
            "building_candidates",
            "Building two complete website concepts in parallel.",
            {
                "candidate_count": 2,
                "eta_seconds": 140,
                "stage": "building_candidates",
            },
        )
        recovered_rows = job.blackboard.get("recovered_candidate_rows")
        recovered_candidates = (
            [_candidate_from_row(row) for row in recovered_rows if isinstance(row, dict)]
            if isinstance(recovered_rows, list)
            else []
        )
        candidates = [candidate for candidate in recovered_candidates if candidate is not None]
        if not candidates:
            candidates = await generate_candidates(
                ai_client=ai_client,
                analyst=analyst,
                content=content,
                job=job,
                planner=planner,
                prompt_a=prompt_a,
                prompt_b=prompt_b,
                recipe_a=spec.recipe_a,
                recipe_b=spec.recipe_b,
                settings=settings,
                style=style,
            )
        for candidate in candidates:
            await persist_candidate(candidate)
            await progress(
                "candidate_ready",
                f"candidate_{candidate.key}",
                f"Concept {candidate.key.upper()} is ready for browser testing.",
                {
                    "candidate": _candidate_summary(candidate),
                    "eta_seconds": 95,
                    "stage": "building_candidates",
                },
            )
        await progress(
            "stage_completed",
            "building_candidates",
            "Both website concepts finished generating.",
            {"eta_seconds": 90, "stage": "building_candidates"},
        )

        await progress(
            "stage_started",
            "testing_candidates",
            "Testing both concepts on desktop, mobile, accessibility, and performance.",
            {"eta_seconds": 80, "stage": "testing_candidates"},
        )
        await evaluate_candidates(candidates, ai_client=ai_client, settings=settings, spec=spec)
        for candidate in candidates:
            await persist_candidate(candidate)
            await progress(
                "candidate_scored",
                f"candidate_{candidate.key}",
                f"Concept {candidate.key.upper()} scored {candidate.final_score:g}/100.",
                {
                    "candidate": _candidate_summary(candidate, include_thumbnail=True),
                    "eta_seconds": 55,
                    "stage": "testing_candidates",
                },
            )

        selected = _best_candidate(candidates)
        if selected.hard_blockers or selected.final_score < settings.pipeline_v2_min_score:
            await progress(
                "stage_started",
                "polishing",
                "Applying one focused repair to the strongest concept.",
                {
                    "candidate_key": selected.key,
                    "eta_seconds": 45,
                    "stage": "polishing",
                },
            )
            repaired_by_rules = deterministic_release_gate_repair(
                selected.html,
                [*selected.hard_blockers, *selected.warnings],
            )
            if repaired_by_rules != selected.html:
                selected.html = repaired_by_rules
                selected.hard_blockers = []
                selected.warnings = []
                await evaluate_candidates([selected], ai_client=ai_client, settings=settings, spec=spec)
                await persist_candidate(selected)

            repair_route, _ = candidate_routes(job=job, settings=settings)
            repaired_html = (
                await targeted_repair(selected, ai_client=ai_client, route=repair_route)
                if selected.hard_blockers or selected.final_score < settings.pipeline_v2_min_score
                else None
            )
            if repaired_html and repaired_html != selected.html:
                selected.html = repaired_html
                selected.hard_blockers = []
                selected.warnings = []
                await evaluate_candidates([selected], ai_client=ai_client, settings=settings, spec=spec)
                await persist_candidate(selected)

        selected = choose_candidate(candidates, minimum_score=settings.pipeline_v2_min_score)
        await persist_candidate(selected)
        await progress(
            "stage_completed",
            "testing_candidates",
            f"Concept {selected.key.upper()} is the strongest valid website.",
            {
                "candidate": _candidate_summary(selected, include_thumbnail=True),
                "eta_seconds": 40,
                "stage": "testing_candidates",
            },
        )

        await progress(
            "stage_started",
            "polishing",
            "Finishing responsive details, SEO, contact flow, and publish safeguards.",
            {"eta_seconds": 35, "stage": "polishing"},
        )
        final_html = _finish_selected_candidate(
            analyst=analyst,
            content=content,
            job=job,
            planner=planner,
            selected=selected,
        )
        final_browser = await audit_candidate_html(
            final_html,
            candidate_key=f"{selected.key}-final",
            settings=settings,
        )
        if final_browser.hard_blockers:
            repaired_final_html = deterministic_release_gate_repair(
                final_html,
                [*final_browser.hard_blockers, *final_browser.warnings],
            )
            if repaired_final_html != final_html:
                final_html = repaired_final_html
                final_browser = await audit_candidate_html(
                    final_html,
                    candidate_key=f"{selected.key}-final-repaired",
                    settings=settings,
                )
            if final_browser.hard_blockers:
                final_repair_candidate = selected.model_copy(
                    update={
                        "browser": final_browser,
                        "hard_blockers": list(final_browser.hard_blockers),
                        "html": final_html,
                        "warnings": [
                            *final_browser.warnings,
                            *_accessibility_repair_context(final_browser),
                        ],
                    }
                )
                final_repair_route, _ = candidate_routes(job=job, settings=settings)
                targeted_final_html = await targeted_repair(
                    final_repair_candidate,
                    ai_client=ai_client,
                    route=final_repair_route,
                )
                if targeted_final_html and targeted_final_html != final_html:
                    final_html = deterministic_release_hardening(targeted_final_html)
                    final_browser = await audit_candidate_html(
                        final_html,
                        candidate_key=f"{selected.key}-final-targeted-repair",
                        settings=settings,
                    )
                if final_browser.hard_blockers:
                    raise SupervisorValidationError(
                        "Final browser release gate failed after deterministic and targeted repair: "
                        + "; ".join(final_browser.hard_blockers[:6])
                    )

        job.blackboard["candidate_summaries"] = [
            _candidate_summary(candidate, include_thumbnail=True) for candidate in candidates
        ]
        job.blackboard["selected_candidate_id"] = selected.key
        job.blackboard["selected_candidate"] = _candidate_summary(selected, include_thumbnail=True)
        job.blackboard["generated_html"] = final_html
        job.blackboard["final_html"] = final_html
        job.blackboard["component_files"] = {
            "index.html": final_html,
            **{
                key: value
                for key, value in deterministic_mobile(
                    final_html,
                    business_data=job.business_data,
                    planner=planner,
                    style_preferences=job.style_preferences,
                ).component_files.items()
                if key != "index.html"
            },
        }
        job.blackboard["quality_badges"] = (
            [
                "Desktop tested",
                "Mobile tested",
                "Business facts verified",
                "Contact form checked",
            ]
            if final_browser.mode == "full"
            else [
                "Static safety checked",
                "Business facts verified",
                "Contact form checked",
            ]
        )
        job.blackboard["quality_mode"] = final_browser.mode
        job.blackboard["degraded_services"] = (
            ["browser_quality"] if final_browser.mode == "static" else []
        )
        job.blackboard["fallback_used"] = selected.used_fallback_template
        job.blackboard["final_browser_report"] = final_browser.model_dump(
            exclude={"mobile_thumbnail_data_url", "thumbnail_data_url"}
        )
        await progress(
            "stage_completed",
            "polishing",
            "The selected website passed final release checks.",
            {
                "eta_seconds": 20,
                "quality_badges": job.blackboard["quality_badges"],
                "quality_mode": final_browser.mode,
                "degraded_services": job.blackboard["degraded_services"],
                "stage": "polishing",
            },
        )


def _finish_selected_candidate(
    *,
    analyst: AnalystOutput,
    content: ContentOutput,
    job: PipelineJob,
    planner: PlannerOutput,
    selected: CandidateArtifact,
) -> str:
    debugger = deterministic_debugger(
        selected.html,
        business_data=job.business_data,
        issues=selected.warnings,
        planner=planner,
        style_preferences=job.style_preferences,
    )
    context = build_business_context(job.business_data, job.style_preferences)
    seo = deterministic_seo(
        debugger.html,
        analyst=analyst,
        content=content,
        context=context,
        planner=planner,
    )
    validate_seo_output(seo)
    mobile = deterministic_mobile(
        seo.html,
        business_data=job.business_data,
        planner=planner,
        style_preferences=job.style_preferences,
    )
    validate_mobile_output(mobile)
    qa = deterministic_qa(
        mobile.html,
        business_data=job.business_data,
        component_files=mobile.component_files,
        planner=planner,
        style_preferences=job.style_preferences,
    )
    validate_qa_output(qa)
    if qa.status == "fail":
        raise SupervisorValidationError("Final deterministic QA failed: " + "; ".join(qa.blocking_issues))
    return deterministic_release_hardening(mobile.html)


def _best_candidate(candidates: list[CandidateArtifact]) -> CandidateArtifact:
    if not candidates:
        raise ValueError("Pipeline V2 did not produce any candidates")
    return max(candidates, key=lambda item: item.final_score)


def _accessibility_repair_context(browser: BrowserReport) -> list[str]:
    return [
        (
            f"Accessibility repair detail: {issue.get('id', 'unknown')} - "
            f"{issue.get('help', 'accessibility issue')} at "
            f"{', '.join(str(selector) for selector in issue.get('selectors', [])[:4])}"
        )
        for issue in browser.accessibility_issues
    ]


def _candidate_summary(
    candidate: CandidateArtifact,
    *,
    include_thumbnail: bool = False,
) -> dict[str, Any]:
    summary = {
        "candidateKey": candidate.key,
        "deterministicScore": candidate.deterministic_score,
        "degradedReason": candidate.browser.degraded_reason,
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


def _candidate_from_row(row: dict[str, Any]) -> CandidateArtifact | None:
    html = row.get("artifact_html")
    key = row.get("candidate_key")
    if not isinstance(html, str) or len(html) < 500 or key not in {"a", "b"}:
        return None
    report = row.get("render_report") if isinstance(row.get("render_report"), dict) else {}
    return CandidateArtifact(
        browser=BrowserReport.model_validate(report),
        deterministic_score=float(row.get("deterministic_score") or 0),
        fallback_used=bool(row.get("fallback_used")),
        final_score=float(row.get("final_score") or 0),
        fingerprint=str(row.get("fingerprint") or "") or None,
        hard_blockers=[str(item) for item in row.get("hard_blockers") or []],
        html=html,
        key=key,
        model=str(row.get("model") or "unknown"),
        provider=str(row.get("provider") or "unknown"),
        recipe=str(row.get("recipe") or "estimate-led"),
        selected=row.get("status") == "selected",
        visual_score=float(row.get("visual_score") or 0),
        warnings=[str(item) for item in row.get("warnings") or []],
    )
