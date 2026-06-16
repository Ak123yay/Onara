from collections.abc import Awaitable, Callable
from typing import Any

from onara_pipeline.agents.agent_07_debugger import deterministic_debugger, run_debugger
from onara_pipeline.agents.agent_08_seo import run_seo_agent
from onara_pipeline.agents.agent_09_qa import deterministic_qa, run_qa_agent
from onara_pipeline.agents.agent_10_mobile import deterministic_mobile, run_mobile_agent
from onara_pipeline.agents.contracts import (
    AnalystOutput,
    ContentOutput,
    DebuggerOutput,
    MobileOutput,
    PlannerOutput,
    QAOutput,
    SEOOutput,
)
from onara_pipeline.agents.supervisor import (
    SupervisorValidationError,
    validate_debugger_output,
    validate_mobile_output,
    validate_qa_output,
    validate_seo_output,
)
from onara_pipeline.ai_client import AIClient, build_ai_client
from onara_pipeline.config import Settings
from onara_pipeline.job_queue import PipelineJob

ProgressCallback = Callable[[str, str | None, str, dict[str, Any] | None], Awaitable[None]]

MAX_QA_REPAIR_ATTEMPTS = 2
MAX_PRE_QA_HARDENING_ATTEMPTS = 3
MIN_PRE_QA_CHECK_PASS_RATE = 0.9


async def run_phase_21(job: PipelineJob, settings: Settings, progress: ProgressCallback) -> None:
    analyst = AnalystOutput.model_validate(job.blackboard.get("analyst_output"))
    content = ContentOutput.model_validate(job.blackboard.get("content_output"))
    planner = PlannerOutput.model_validate(job.blackboard.get("planner_output"))
    ai_client = build_ai_client(settings)
    codegen_visual_repair_issues = _list_blackboard_strings(job, "codegen_visual_repair_issues")

    await _run_debugger_step(
        job,
        ai_client,
        settings,
        planner,
        progress=progress,
        extra_issues=codegen_visual_repair_issues or None,
    )
    await _run_seo_step(job, ai_client, settings, analyst, content, planner, progress=progress)
    await _run_pre_qa_gate(job, ai_client, settings, analyst, content, planner, progress=progress)
    qa = await _run_qa_step(job, ai_client, settings, planner, progress=progress)

    repair_history: list[dict[str, Any]] = []
    for attempt in range(1, MAX_QA_REPAIR_ATTEMPTS + 1):
        if qa.status != "fail":
            break

        repair_history.append(
            {
                "attempt": attempt,
                "blocking_issues": qa.blocking_issues,
            }
        )
        job.blackboard["phase_21"] = {
            **job.blackboard.get("phase_21", {}),
            "next_agent": "agent_07_debugger",
            "qa_repair_attempts": repair_history,
        }

        await progress(
            "agent_retry",
            "agent_09_qa",
            f"QA found {len(qa.blocking_issues)} launch blocker(s); routing them back to Debugger.",
            {
                "blocking_issues": qa.blocking_issues,
                "qa_repair_attempt": attempt,
                "max_qa_repair_attempts": MAX_QA_REPAIR_ATTEMPTS,
            },
        )
        await _run_debugger_step(
            job,
            ai_client,
            settings,
            planner,
            progress=progress,
            extra_issues=qa.blocking_issues,
            repair_attempt=attempt,
        )
        await _run_seo_step(
            job,
            ai_client,
            settings,
            analyst,
            content,
            planner,
            progress=progress,
            repair_attempt=attempt,
        )
        qa = await _run_qa_step(
            job,
            ai_client,
            settings,
            planner,
            progress=progress,
            repair_attempt=attempt,
        )

    if qa.status == "fail":
        raise SupervisorValidationError(f"QA failed after repair attempts: {'; '.join(qa.blocking_issues)}")

    await _run_mobile_step(job, ai_client, settings, planner, progress=progress)


async def _run_pre_qa_gate(
    job: PipelineJob,
    ai_client: AIClient,
    settings: Settings,
    analyst: AnalystOutput,
    content: ContentOutput,
    planner: PlannerOutput,
    *,
    progress: ProgressCallback,
) -> QAOutput:
    await progress(
        "agent_started",
        "pre_qa_gate",
        "Running deterministic pre-QA hardening so Agent 9 only reviews a mostly clean site.",
        {
            "max_pre_qa_hardening_attempts": MAX_PRE_QA_HARDENING_ATTEMPTS,
            "min_pre_qa_check_pass_rate": MIN_PRE_QA_CHECK_PASS_RATE,
        },
    )

    history: list[dict[str, Any]] = []
    latest: QAOutput | None = None

    for attempt in range(1, MAX_PRE_QA_HARDENING_ATTEMPTS + 1):
        latest = _run_deterministic_pre_qa(job, planner)
        score = _qa_check_pass_rate(latest.checks)
        passed_threshold = score >= MIN_PRE_QA_CHECK_PASS_RATE
        passed_cleanly = latest.status == "pass"
        attempt_record = {
            "attempt": attempt,
            "blocking_issue_count": len(latest.blocking_issues),
            "check_count": len(latest.checks),
            "check_pass_rate": round(score, 4),
            "status": latest.status,
        }
        history.append(attempt_record)
        _store_pre_qa_result(job, latest, history, check_pass_rate=score)

        await progress(
            "pre_qa_check",
            "pre_qa_gate",
            (
                "Pre-QA deterministic checks passed cleanly."
                if passed_cleanly
                else f"Pre-QA deterministic checks are at {score:.0%}; applying hardening before Agent 9."
            ),
            {
                **attempt_record,
                "blocking_issues": latest.blocking_issues[:6],
                "min_pre_qa_check_pass_rate": MIN_PRE_QA_CHECK_PASS_RATE,
            },
        )

        if passed_cleanly:
            await progress(
                "agent_completed",
                "pre_qa_gate",
                "Pre-QA gate passed; activating QA agent.",
                {
                    "check_pass_rate": round(score, 4),
                    "pre_qa_status": latest.status,
                },
            )
            return latest

        if attempt == MAX_PRE_QA_HARDENING_ATTEMPTS:
            if passed_threshold:
                await progress(
                    "agent_completed",
                    "pre_qa_gate",
                    "Pre-QA gate met the 90% threshold; activating QA agent for final launch-blocker review.",
                    {
                        "blocking_issue_count": len(latest.blocking_issues),
                        "check_pass_rate": round(score, 4),
                        "pre_qa_status": latest.status,
                    },
                )
                return latest

            raise SupervisorValidationError(
                "Pre-QA gate failed below "
                f"{MIN_PRE_QA_CHECK_PASS_RATE:.0%} after {MAX_PRE_QA_HARDENING_ATTEMPTS} hardening attempts: "
                f"{'; '.join(latest.blocking_issues)}"
            )

        await _run_pre_qa_hardening_attempt(
            job,
            ai_client,
            settings,
            analyst,
            content,
            planner,
            progress=progress,
            attempt=attempt,
            issues=latest.blocking_issues,
        )

    raise SupervisorValidationError("Pre-QA gate exited unexpectedly")


def _run_deterministic_pre_qa(job: PipelineJob, planner: PlannerOutput) -> QAOutput:
    html = str(job.blackboard.get("seo_html") or job.blackboard.get("generated_html") or "")
    component_files = job.blackboard.get("component_files")
    qa = deterministic_qa(
        html,
        business_data=job.business_data,
        component_files=component_files,
        planner=planner,
        style_preferences=job.style_preferences,
    )
    validate_qa_output(qa)
    return qa


async def _run_pre_qa_hardening_attempt(
    job: PipelineJob,
    ai_client: AIClient,
    settings: Settings,
    analyst: AnalystOutput,
    content: ContentOutput,
    planner: PlannerOutput,
    *,
    progress: ProgressCallback,
    attempt: int,
    issues: list[str],
) -> None:
    await progress(
        "pre_qa_repair",
        "pre_qa_gate",
        "Applying deterministic debugger, mobile, and SEO repairs before QA.",
        {
            "blocking_issues": issues[:6],
            "pre_qa_hardening_attempt": attempt,
            "max_pre_qa_hardening_attempts": MAX_PRE_QA_HARDENING_ATTEMPTS,
        },
    )

    html = str(job.blackboard.get("seo_html") or job.blackboard.get("generated_html") or "")
    debugger = deterministic_debugger(
        html,
        business_data=job.business_data,
        issues=issues,
        planner=planner,
        style_preferences=job.style_preferences,
    )
    validate_debugger_output(debugger)

    job.blackboard["pre_qa_debugger_output"] = debugger.model_dump()
    job.blackboard["debugger_output"] = debugger.model_dump()
    job.blackboard["debugged_html"] = debugger.html
    job.blackboard["generated_html"] = debugger.html
    job.blackboard["component_files"] = debugger.component_files

    await _run_seo_step(
        job,
        ai_client,
        settings,
        analyst,
        content,
        planner,
        progress=progress,
        repair_attempt=attempt,
    )

    mobile_source = str(job.blackboard.get("seo_html") or job.blackboard.get("generated_html") or debugger.html)
    mobile = deterministic_mobile(
        mobile_source,
        business_data=job.business_data,
        planner=planner,
        style_preferences=job.style_preferences,
    )
    validate_mobile_output(mobile)

    job.blackboard["pre_qa_mobile_output"] = mobile.model_dump()
    job.blackboard["generated_html"] = mobile.html
    job.blackboard["seo_html"] = mobile.html
    job.blackboard["component_files"] = mobile.component_files

    phase = job.blackboard.get("phase_21", {})
    job.blackboard["phase_21"] = {
        **phase,
        "pre_qa_last_debugger_fixes": debugger.fixes,
        "pre_qa_last_mobile_fixes": mobile.fixes,
        "pre_qa_next_agent": "pre_qa_gate",
    }


async def _run_debugger_step(
    job: PipelineJob,
    ai_client: AIClient,
    settings: Settings,
    planner: PlannerOutput,
    *,
    progress: ProgressCallback,
    extra_issues: list[str] | None = None,
    repair_attempt: int = 0,
) -> DebuggerOutput:
    message = (
        "Repairing QA blockers in the generated HTML, CSS, content facts, and accessibility safeguards."
        if repair_attempt
        else "Debugging the generated HTML, CSS, motion, and accessibility safeguards."
    )
    await progress(
        "agent_started",
        "agent_07_debugger",
        message,
        _attempt_metadata(repair_attempt, extra_issues=extra_issues),
    )
    debugger = await run_debugger(
        job,
        ai_client,
        settings,
        planner,
        extra_issues=extra_issues,
    )
    validate_debugger_output(debugger)

    job.blackboard["debugger_output"] = debugger.model_dump()
    job.blackboard["debugged_html"] = debugger.html
    job.blackboard["generated_html"] = debugger.html
    job.blackboard["component_files"] = debugger.component_files
    job.blackboard["raw_debugger_output"] = debugger.raw_output
    job.blackboard["phase_21"] = {
        **job.blackboard.get("phase_21", {}),
        "agent_07_debugger": True,
        "agent_08_seo": False,
        "agent_09_qa": False,
        "agent_10_mobile": False,
        "completed_agents": _ordered_unique(
            [*job.blackboard.get("phase_21", {}).get("completed_agents", []), "agent_07_debugger"]
        ),
        "debugger_status": debugger.status,
        "fixes": debugger.fixes,
        "issues": debugger.issues,
        "next_agent": "agent_08_seo",
        "outputs": ["debugger_output", "debugged_html", "generated_html", "component_files"],
    }
    if repair_attempt:
        job.blackboard["phase_21"]["last_qa_repair_attempt"] = repair_attempt

    await progress(
        "agent_completed",
        "agent_07_debugger",
        "Debugger validated the generated site draft.",
        {
            "debugger_status": debugger.status,
            "fix_count": len(debugger.fixes),
            "issue_count": len(debugger.issues),
            "model": debugger.model,
            "output_key": "debugged_html",
            "provider": debugger.provider,
            "qa_repair_attempt": repair_attempt,
            "used_deterministic_fallback": debugger.used_deterministic_fallback,
        },
    )
    return debugger


async def _run_seo_step(
    job: PipelineJob,
    ai_client: AIClient,
    settings: Settings,
    analyst: AnalystOutput,
    content: ContentOutput,
    planner: PlannerOutput,
    *,
    progress: ProgressCallback,
    repair_attempt: int = 0,
) -> SEOOutput:
    await progress(
        "agent_started",
        "agent_08_seo",
        "Reapplying local SEO metadata and LocalBusiness schema after repair."
        if repair_attempt
        else "Adding local SEO metadata, Open Graph tags, and LocalBusiness schema.",
        _attempt_metadata(repair_attempt),
    )
    seo = await run_seo_agent(job, ai_client, settings, analyst, content, planner)
    validate_seo_output(seo)

    job.blackboard["seo_output"] = seo.model_dump()
    job.blackboard["seo_html"] = seo.html
    job.blackboard["generated_html"] = seo.html
    job.blackboard["component_files"] = seo.component_files
    job.blackboard["raw_seo_output"] = seo.raw_output
    job.blackboard["phase_21"] = {
        **job.blackboard.get("phase_21", {}),
        "agent_08_seo": True,
        "completed_agents": _ordered_unique(
            [*job.blackboard.get("phase_21", {}).get("completed_agents", []), "agent_08_seo"]
        ),
        "next_agent": "agent_09_qa",
        "outputs": [
            "debugger_output",
            "debugged_html",
            "seo_output",
            "seo_html",
            "generated_html",
            "component_files",
        ],
        "seo_meta_description": seo.meta_description,
        "seo_title": seo.title,
    }

    await progress(
        "agent_completed",
        "agent_08_seo",
        "SEO Agent added metadata and LocalBusiness schema.",
        {
            "meta_description_chars": len(seo.meta_description),
            "model": seo.model,
            "output_key": "seo_html",
            "provider": seo.provider,
            "qa_repair_attempt": repair_attempt,
            "title": seo.title,
            "used_deterministic_fallback": seo.used_deterministic_fallback,
        },
    )
    return seo


async def _run_qa_step(
    job: PipelineJob,
    ai_client: AIClient,
    settings: Settings,
    planner: PlannerOutput,
    *,
    progress: ProgressCallback,
    repair_attempt: int = 0,
) -> QAOutput:
    await progress(
        "agent_started",
        "agent_09_qa",
        "Re-running launch-blocker QA after debugger repair."
        if repair_attempt
        else "Running launch-blocker QA across HTML, mobile basics, SEO, schema, CTAs, and motion safety.",
        _attempt_metadata(repair_attempt),
    )
    qa = await run_qa_agent(job, ai_client, settings, planner)
    validate_qa_output(qa)

    job.blackboard["qa_output"] = qa.model_dump()
    job.blackboard["phase_21"] = {
        **job.blackboard.get("phase_21", {}),
        "agent_09_qa": True,
        "completed_agents": _ordered_unique(
            [*job.blackboard.get("phase_21", {}).get("completed_agents", []), "agent_09_qa"]
        ),
        "next_agent": "agent_10_mobile" if qa.status == "pass" else "agent_07_debugger",
        "outputs": [
            "debugger_output",
            "debugged_html",
            "seo_output",
            "seo_html",
            "qa_output",
            "generated_html",
            "component_files",
        ],
        "qa_blocking_issues": qa.blocking_issues,
        "qa_status": qa.status,
        "qa_warnings": qa.warnings,
    }

    await progress(
        "agent_completed",
        "agent_09_qa",
        "QA Agent completed launch-blocker checks.",
        {
            "blocking_issue_count": len(qa.blocking_issues),
            "check_count": len(qa.checks),
            "model": qa.model,
            "provider": qa.provider,
            "qa_repair_attempt": repair_attempt,
            "qa_status": qa.status,
            "used_deterministic_fallback": qa.used_deterministic_fallback,
            "warning_count": len(qa.warnings),
        },
    )
    return qa


async def _run_mobile_step(
    job: PipelineJob,
    ai_client: AIClient,
    settings: Settings,
    planner: PlannerOutput,
    *,
    progress: ProgressCallback,
) -> MobileOutput:
    await progress(
        "agent_started",
        "agent_10_mobile",
        "Hardening the generated site for mobile layout, tap targets, overflow, media, and reduced-motion safety.",
        None,
    )
    mobile = await run_mobile_agent(job, ai_client, settings, planner)
    validate_mobile_output(mobile)

    job.blackboard["mobile_output"] = mobile.model_dump()
    job.blackboard["mobile_html"] = mobile.html
    job.blackboard["generated_html"] = mobile.html
    job.blackboard["component_files"] = mobile.component_files
    job.blackboard["raw_mobile_output"] = mobile.raw_output
    job.blackboard["phase_21"] = {
        **job.blackboard.get("phase_21", {}),
        "agent_10_mobile": True,
        "completed_agents": _ordered_unique(
            [*job.blackboard.get("phase_21", {}).get("completed_agents", []), "agent_10_mobile"]
        ),
        "mobile_fixes": mobile.fixes,
        "mobile_issues": mobile.issues,
        "mobile_status": mobile.status,
        "next_agent": "phase_22_deployment",
        "outputs": [
            "debugger_output",
            "debugged_html",
            "seo_output",
            "seo_html",
            "qa_output",
            "mobile_output",
            "mobile_html",
            "generated_html",
            "component_files",
        ],
    }

    await progress(
        "agent_completed",
        "agent_10_mobile",
        "Mobile Agent completed responsive hardening.",
        {
            "check_count": len(mobile.checks),
            "fix_count": len(mobile.fixes),
            "issue_count": len(mobile.issues),
            "mobile_status": mobile.status,
            "model": mobile.model,
            "output_key": "mobile_html",
            "provider": mobile.provider,
            "used_deterministic_fallback": mobile.used_deterministic_fallback,
        },
    )
    return mobile


def _attempt_metadata(repair_attempt: int, *, extra_issues: list[str] | None = None) -> dict[str, Any] | None:
    if not repair_attempt and not extra_issues:
        return None

    return {
        "extra_issues": extra_issues or [],
        "qa_repair_attempt": repair_attempt,
        "max_qa_repair_attempts": MAX_QA_REPAIR_ATTEMPTS,
    }


def _store_pre_qa_result(
    job: PipelineJob,
    qa: QAOutput,
    history: list[dict[str, Any]],
    *,
    check_pass_rate: float,
) -> None:
    job.blackboard["pre_qa_output"] = qa.model_dump()
    job.blackboard["phase_21"] = {
        **job.blackboard.get("phase_21", {}),
        "next_agent": "agent_09_qa" if check_pass_rate >= MIN_PRE_QA_CHECK_PASS_RATE else "pre_qa_gate",
        "pre_qa_blocking_issues": qa.blocking_issues,
        "pre_qa_check_pass_rate": round(check_pass_rate, 4),
        "pre_qa_hardening_attempts": history,
        "pre_qa_min_check_pass_rate": MIN_PRE_QA_CHECK_PASS_RATE,
        "pre_qa_status": qa.status,
    }


def _qa_check_pass_rate(checks: dict[str, bool]) -> float:
    if not checks:
        return 0.0

    return sum(1 for passed in checks.values() if passed) / len(checks)


def _ordered_unique(values: list[str]) -> list[str]:
    seen: set[str] = set()
    output: list[str] = []
    for value in values:
        if value not in seen:
            seen.add(value)
            output.append(value)
    return output


def _list_blackboard_strings(job: PipelineJob, key: str) -> list[str]:
    value = job.blackboard.get(key)
    if not isinstance(value, list):
        return []
    return [item for item in value if isinstance(item, str) and item.strip()]
