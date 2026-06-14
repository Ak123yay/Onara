import asyncio
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Literal
from uuid import uuid4

from onara_pipeline.schemas import GenerateRequest, QueueStats

JobStatus = Literal["queued", "running", "completed", "failed"]


@dataclass(slots=True)
class PipelineJob:
    job_id: str
    project_id: str
    user_id: str
    user_plan: str
    business_data: dict
    style_preferences: dict
    status: JobStatus = "queued"
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    progress_log: list[dict] = field(default_factory=list)


@dataclass(frozen=True, slots=True)
class EnqueueResult:
    job: PipelineJob
    deduped: bool


class JobQueue:
    def __init__(self) -> None:
        self._lock = asyncio.Lock()
        self._jobs: dict[str, PipelineJob] = {}
        self._queued_job_ids: list[str] = []
        self._project_to_job_id: dict[str, str] = {}

    async def enqueue(self, request: GenerateRequest) -> EnqueueResult:
        async with self._lock:
            project_id = request.project_id or f"pending:{request.user_id}:{request.place_id or uuid4()}"
            existing_id = self._project_to_job_id.get(project_id)

            if existing_id:
                existing_job = self._jobs[existing_id]

                if existing_job.status in {"queued", "running"}:
                    existing_job.updated_at = datetime.now(timezone.utc)
                    return EnqueueResult(job=existing_job, deduped=True)

            job_id = request.job_id or str(uuid4())
            job = PipelineJob(
                job_id=job_id,
                project_id=project_id,
                user_id=request.user_id,
                user_plan=request.user_plan,
                business_data=request.business_data,
                style_preferences=request.style_preferences,
            )

            self._jobs[job_id] = job
            self._queued_job_ids.append(job_id)
            self._project_to_job_id[project_id] = job_id
            return EnqueueResult(job=job, deduped=False)

    async def get(self, job_id: str) -> PipelineJob | None:
        async with self._lock:
            return self._jobs.get(job_id)

    async def position(self, job_id: str) -> int | None:
        async with self._lock:
            if job_id not in self._queued_job_ids:
                return None

            return self._queued_job_ids.index(job_id) + 1

    async def stats(self) -> QueueStats:
        async with self._lock:
            active_jobs = sum(1 for job in self._jobs.values() if job.status == "running")
            return QueueStats(queue_length=len(self._queued_job_ids), active_jobs=active_jobs)
