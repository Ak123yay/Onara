from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field

PlanType = Literal["free", "starter", "pro"]


class GenerateRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    agent_6_model: str | None = Field(default=None, max_length=80)
    is_trial: bool = False
    job_id: str | None = None
    project_id: str | None = None
    place_id: str | None = None
    user_id: str = Field(min_length=1)
    user_plan: PlanType = "free"
    business_data: dict[str, Any] = Field(default_factory=dict)
    style_preferences: dict[str, Any] = Field(default_factory=dict)


class JobEnqueueResponse(BaseModel):
    agent_6_model: str
    agent_6_model_reason: str | None = None
    agent_6_model_requested: str | None = None
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
    blackboard_keys: list[str]
    job_id: str
    status: str
    current_agent: str | None
    agents_completed: int
    agents_total: int
    queue_position: int | None
    created_at: datetime
    error_message: str | None = None
    updated_at: datetime
    progress_log: list[dict[str, Any]]

    @classmethod
    def from_job(cls, job: Any, queue_position: int | None) -> "JobStatusResponse":
        return cls(
            blackboard_keys=list(job.blackboard.keys()),
            job_id=job.job_id,
            status=job.status,
            current_agent=job.current_agent,
            agents_completed=job.agents_completed,
            agents_total=job.agents_total,
            queue_position=queue_position,
            created_at=job.created_at,
            error_message=job.error_message,
            updated_at=job.updated_at,
            progress_log=job.progress_log,
        )


class RAGSearchRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    query: str = Field(min_length=2)
    top_k: int = Field(default=5, ge=1, le=10)
    vertical: str | None = None
    pattern_type: str | None = None


class RAGSearchResult(BaseModel):
    id: str
    title: str
    vertical: str
    pattern_type: str
    tags: list[str]
    summary: str
    content: str
    score: float
    vector_score: float
    bm25_score: float


class RAGSearchResponse(BaseModel):
    query: str
    count: int
    results: list[RAGSearchResult]
