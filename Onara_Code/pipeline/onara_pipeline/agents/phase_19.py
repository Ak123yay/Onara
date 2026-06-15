from collections.abc import Awaitable, Callable
from typing import Any

from onara_pipeline.agents.agent_04_planner import run_planner
from onara_pipeline.agents.agent_05_prompt_engineer import run_prompt_engineer
from onara_pipeline.agents.contracts import AnalystOutput, ContentOutput, StyleOutput
from onara_pipeline.agents.supervisor import validate_planner_output, validate_prompt_output
from onara_pipeline.ai_client import build_ai_client
from onara_pipeline.config import Settings
from onara_pipeline.job_queue import PipelineJob

ProgressCallback = Callable[[str, str | None, str, dict[str, Any] | None], Awaitable[None]]


async def run_phase_19(job: PipelineJob, settings: Settings, progress: ProgressCallback) -> None:
    analyst = AnalystOutput.model_validate(job.blackboard.get("analyst_output"))
    content = ContentOutput.model_validate(job.blackboard.get("content_output"))
    style = StyleOutput.model_validate(job.blackboard.get("style_output"))
    ai_client = build_ai_client(settings)

    await progress("agent_started", "agent_04_planner", "Converting content and style into a component blueprint.", None)
    planner = await run_planner(job, ai_client, settings, analyst, content, style)
    validate_planner_output(planner)
    job.blackboard["planner_output"] = planner.model_dump()
    await progress(
        "agent_completed",
        "agent_04_planner",
        "Planner produced the component blueprint.",
        {"components": len(planner.components), "output_key": "planner_output"},
    )

    await progress("agent_started", "agent_05_prompt_engineer", "Preparing the code-generation prompt for Agent 6.", None)
    prompt = await run_prompt_engineer(job, ai_client, settings, analyst, content, style, planner)
    validate_prompt_output(prompt)
    job.blackboard["prompt_output"] = prompt.model_dump()
    await progress(
        "agent_completed",
        "agent_05_prompt_engineer",
        "Prompt Engineer produced the Agent 6 prompt.",
        {"output_key": "prompt_output", "prompt_chars": len(prompt.prompt)},
    )

    job.blackboard["phase_19"] = {
        "completed": True,
        "next_phase": "phase_20",
        "outputs": ["planner_output", "prompt_output"],
    }
