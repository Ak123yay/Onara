from collections.abc import Awaitable, Callable
from typing import Any

from onara_pipeline.agents.agent_07_debugger import run_debugger
from onara_pipeline.agents.agent_08_seo import run_seo_agent
from onara_pipeline.agents.agent_09_qa import run_qa_agent
from onara_pipeline.agents.agent_10_mobile import run_mobile_agent
from onara_pipeline.agents.contracts import AnalystOutput, ContentOutput, PlannerOutput
from onara_pipeline.agents.supervisor import (
    SupervisorValidationError,
    validate_debugger_output,
    validate_mobile_output,
    validate_qa_output,
    validate_seo_output,
)
from onara_pipeline.ai_client import build_ai_client
from onara_pipeline.config import Settings
from onara_pipeline.job_queue import PipelineJob

ProgressCallback = Callable[[str, str | None, str, dict[str, Any] | None], Awaitable[None]]


async def run_phase_21(job: PipelineJob, settings: Settings, progress: ProgressCallback) -> None:
    analyst = AnalystOutput.model_validate(job.blackboard.get("analyst_output"))
    content = ContentOutput.model_validate(job.blackboard.get("content_output"))
    planner = PlannerOutput.model_validate(job.blackboard.get("planner_output"))
    ai_client = build_ai_client(settings)

    await progress(
        "agent_started",
        "agent_07_debugger",
        "Debugging the generated HTML, CSS, motion, and accessibility safeguards.",
        None,
    )
    debugger = await run_debugger(job, ai_client, settings, planner)
    validate_debugger_output(debugger)

    job.blackboard["debugger_output"] = debugger.model_dump()
    job.blackboard["debugged_html"] = debugger.html
    job.blackboard["generated_html"] = debugger.html
    job.blackboard["component_files"] = debugger.component_files
    job.blackboard["raw_debugger_output"] = debugger.raw_output
    job.blackboard["phase_21"] = {
        "agent_07_debugger": True,
        "agent_08_seo": False,
        "agent_09_qa": False,
        "agent_10_mobile": False,
        "completed_agents": ["agent_07_debugger"],
        "debugger_status": debugger.status,
        "issues": debugger.issues,
        "fixes": debugger.fixes,
        "next_agent": "agent_08_seo",
        "outputs": ["debugger_output", "debugged_html", "generated_html", "component_files"],
    }

    await progress(
        "agent_completed",
        "agent_07_debugger",
        "Debugger validated the generated site draft.",
        {
            "debugger_status": debugger.status,
            "fix_count": len(debugger.fixes),
            "issue_count": len(debugger.issues),
            "output_key": "debugged_html",
            "provider": debugger.provider,
            "model": debugger.model,
            "used_deterministic_fallback": debugger.used_deterministic_fallback,
        },
    )

    await progress(
        "agent_started",
        "agent_08_seo",
        "Adding local SEO metadata, Open Graph tags, and LocalBusiness schema.",
        None,
    )
    seo = await run_seo_agent(job, ai_client, settings, analyst, content, planner)
    validate_seo_output(seo)

    job.blackboard["seo_output"] = seo.model_dump()
    job.blackboard["seo_html"] = seo.html
    job.blackboard["generated_html"] = seo.html
    job.blackboard["component_files"] = seo.component_files
    job.blackboard["raw_seo_output"] = seo.raw_output
    job.blackboard["phase_21"] = {
        **job.blackboard["phase_21"],
        "agent_08_seo": True,
        "completed_agents": ["agent_07_debugger", "agent_08_seo"],
        "next_agent": "agent_09_qa",
        "seo_title": seo.title,
        "seo_meta_description": seo.meta_description,
        "outputs": [
            "debugger_output",
            "debugged_html",
            "seo_output",
            "seo_html",
            "generated_html",
            "component_files",
        ],
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
            "title": seo.title,
            "used_deterministic_fallback": seo.used_deterministic_fallback,
        },
    )

    await progress(
        "agent_started",
        "agent_09_qa",
        "Running launch-blocker QA across HTML, mobile basics, SEO, schema, CTAs, and motion safety.",
        None,
    )
    qa = await run_qa_agent(job, ai_client, settings, planner)
    validate_qa_output(qa)

    job.blackboard["qa_output"] = qa.model_dump()
    job.blackboard["phase_21"] = {
        **job.blackboard["phase_21"],
        "agent_09_qa": True,
        "completed_agents": ["agent_07_debugger", "agent_08_seo", "agent_09_qa"],
        "next_agent": "agent_10_mobile",
        "qa_blocking_issues": qa.blocking_issues,
        "qa_status": qa.status,
        "qa_warnings": qa.warnings,
        "outputs": [
            "debugger_output",
            "debugged_html",
            "seo_output",
            "seo_html",
            "qa_output",
            "generated_html",
            "component_files",
        ],
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
            "qa_status": qa.status,
            "used_deterministic_fallback": qa.used_deterministic_fallback,
            "warning_count": len(qa.warnings),
        },
    )

    if qa.status == "fail":
        raise SupervisorValidationError(f"QA failed: {'; '.join(qa.blocking_issues)}")

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
        **job.blackboard["phase_21"],
        "agent_10_mobile": True,
        "completed_agents": ["agent_07_debugger", "agent_08_seo", "agent_09_qa", "agent_10_mobile"],
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
