from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field

PlanType = Literal["free", "starter", "pro"]


class GenerateRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    job_id: str | None = None
    project_id: str | None = None
    place_id: str | None = None
    user_id: str = Field(min_length=1)
    user_plan: PlanType = "free"
    business_data: dict[str, Any] = Field(default_factory=dict)
    style_preferences: dict[str, Any] = Field(default_factory=dict)


class JobEnqueueResponse(BaseModel):
    job_id: str
    queued: bool
    deduped: bool
    queue_position: int | None
    status: str


class HealthResponse(BaseModel):
    status: Literal["ok", "degraded"]
    ollama: bool
    queue_length: int
    active_jobs: int
    uptime_seconds: int


class QueueStats(BaseModel):
    queue_length: int
    active_jobs: int


class JobStatusResponse(BaseModel):
    job_id: str
    status: str
    current_agent: str | None
    agents_completed: int
    agents_total: int
    queue_position: int | None
    created_at: datetime
    updated_at: datetime
    progress_log: list[dict[str, Any]]

    @classmethod
    def from_job(cls, job: Any, queue_position: int | None) -> "JobStatusResponse":
        return cls(
            job_id=job.job_id,
            status=job.status,
            current_agent=None,
            agents_completed=0,
            agents_total=10,
            queue_position=queue_position,
            created_at=job.created_at,
            updated_at=job.updated_at,
            progress_log=job.progress_log,
        )
