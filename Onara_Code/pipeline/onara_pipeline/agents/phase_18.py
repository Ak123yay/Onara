import asyncio
from collections.abc import Awaitable, Callable
from typing import Any

from onara_pipeline.agents.agent_01_analyst import run_analyst
from onara_pipeline.agents.agent_02_content import run_content_writer
from onara_pipeline.agents.agent_03_style import run_style_agent
from onara_pipeline.agents.supervisor import (
    validate_analyst_output,
    validate_content_output,
    validate_style_output,
)
from onara_pipeline.ai_client import build_ai_client
from onara_pipeline.config import Settings
from onara_pipeline.job_queue import PipelineJob

ProgressCallback = Callable[[str, str | None, str, dict[str, Any] | None], Awaitable[None]]


async def run_phase_18(job: PipelineJob, settings: Settings, progress: ProgressCallback) -> None:
    ai_client = build_ai_client(settings)

    await progress("agent_started", "agent_01_analyst", "Analyzing business facts and conversion requirements.", None)
    analyst = await run_analyst(job, ai_client, settings)
    validate_analyst_output(analyst)
    job.blackboard["analyst_output"] = analyst.model_dump()
    await progress(
        "agent_completed",
        "agent_01_analyst",
        "Analyst produced the site requirements.",
        {"output_key": "analyst_output", "industry": analyst.industryType},
    )

    await progress("agent_started", "agent_02_content", "Drafting contractor-specific website copy.", None)
    await progress("agent_started", "agent_03_style", "Defining design tokens and visual direction.", None)

    content_task = asyncio.create_task(run_content_writer(job, ai_client, settings, analyst))
    style_task = asyncio.create_task(run_style_agent(job, ai_client, settings, analyst))

    content, style = await asyncio.gather(content_task, style_task)

    validate_content_output(content)
    job.blackboard["content_output"] = content.model_dump()
    await progress(
        "agent_completed",
        "agent_02_content",
        "Content Writer produced the page copy.",
        {"output_key": "content_output", "hero": content.hero.headline},
    )

    validate_style_output(style)
    job.blackboard["style_output"] = style.model_dump()
    await progress(
        "agent_completed",
        "agent_03_style",
        "Style Agent produced the design system.",
        {"output_key": "style_output", "primary_color": style.colors.primary},
    )

    job.blackboard["phase_18"] = {
        "completed": True,
        "next_phase": "phase_19",
        "outputs": ["analyst_output", "content_output", "style_output"],
    }
