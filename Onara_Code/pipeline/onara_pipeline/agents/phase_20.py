from collections.abc import Awaitable, Callable
from typing import Any

from onara_pipeline.agents.agent_06_codegen import run_codegen
from onara_pipeline.agents.contracts import (
    AnalystOutput,
    ContentOutput,
    PlannerOutput,
    PromptOutput,
    StyleOutput,
)
from onara_pipeline.agents.supervisor import (
    repairable_codegen_visual_issues,
    validate_codegen_output,
)
from onara_pipeline.agents.visual_quality import professional_visual_issues
from onara_pipeline.ai_client import build_ai_client
from onara_pipeline.config import Settings
from onara_pipeline.job_queue import PipelineJob

ProgressCallback = Callable[[str, str | None, str, dict[str, Any] | None], Awaitable[None]]


async def run_phase_20(job: PipelineJob, settings: Settings, progress: ProgressCallback) -> None:
    analyst = AnalystOutput.model_validate(job.blackboard.get("analyst_output"))
    content = ContentOutput.model_validate(job.blackboard.get("content_output"))
    style = StyleOutput.model_validate(job.blackboard.get("style_output"))
    planner = PlannerOutput.model_validate(job.blackboard.get("planner_output"))
    prompt = PromptOutput.model_validate(job.blackboard.get("prompt_output"))
    ai_client = build_ai_client(settings)

    await progress(
        "agent_started",
        "agent_06_codegen",
        "Generating the first self-contained website draft.",
        {"requested_model": job.agent_6_model or "onara-default"},
    )
    codegen = await run_codegen(job, ai_client, settings, analyst, content, style, planner, prompt)
    validate_codegen_output(codegen, allow_repairable_visual_issues=True)

    codegen_visual_repair_issues = repairable_codegen_visual_issues(
        professional_visual_issues(codegen.html)
    )

    job.blackboard["codegen_output"] = codegen.model_dump()
    job.blackboard["generated_html"] = codegen.html
    job.blackboard["component_files"] = codegen.component_files
    job.blackboard["raw_code"] = codegen.raw_output
    job.blackboard["codegen_visual_repair_issues"] = codegen_visual_repair_issues
    job.blackboard["phase_20"] = {
        "completed": True,
        "codegen_visual_repair_issues": codegen_visual_repair_issues,
        "model": codegen.model,
        "next_phase": "phase_21",
        "outputs": ["codegen_output", "generated_html", "component_files", "raw_code"],
        "provider": codegen.provider,
        "used_fallback_template": codegen.used_fallback_template,
    }

    await progress(
        "agent_completed",
        "agent_06_codegen",
        (
            "Code Generator produced the first draft with repairable visual cleanup queued for Debugger."
            if codegen_visual_repair_issues
            else "Code Generator produced the first website draft."
        ),
        {
            "component_count": max(0, len(codegen.component_files) - 1),
            "codegen_visual_repair_issues": codegen_visual_repair_issues,
            "html_chars": len(codegen.html),
            "model": codegen.model,
            "output_key": "generated_html",
            "provider": codegen.provider,
            "used_fallback_template": codegen.used_fallback_template,
        },
    )
