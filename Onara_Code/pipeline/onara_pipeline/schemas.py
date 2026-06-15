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
    completed_agent_ids: list[str] = Field(default_factory=list)
    component_file_count: int = 0
    deployment_file_count: int = 0
    deployment_manifest: dict[str, Any] | None = None
    github_commit_error: str | None = None
    github_commit_file_count: int = 0
    github_commit_path: str | None = None
    github_commit_sha: str | None = None
    github_commit_status: str | None = None
    github_commit_url: str | None = None
    github_repository: str | None = None
    mobile_checks: dict[str, bool] = Field(default_factory=dict)
    mobile_fixes: list[str] = Field(default_factory=list)
    mobile_issues: list[str] = Field(default_factory=list)
    mobile_status: str | None = None
    queue_position: int | None
    preview_html: str | None = None
    qa_blocking_issues: list[str] = Field(default_factory=list)
    qa_checks: dict[str, bool] = Field(default_factory=dict)
    qa_status: str | None = None
    qa_warnings: list[str] = Field(default_factory=list)
    site_id: str | None = None
    supervisor_decision: dict[str, Any] | None = None
    created_at: datetime
    error_message: str | None = None
    updated_at: datetime
    progress_log: list[dict[str, Any]]

    @classmethod
    def from_job(cls, job: Any, queue_position: int | None) -> "JobStatusResponse":
        preview_html = job.blackboard.get("generated_html")
        component_files = job.blackboard.get("component_files")
        deployment_artifact = job.blackboard.get("deployment_artifact")
        github_commit = job.blackboard.get("github_commit")
        mobile_output = job.blackboard.get("mobile_output")
        qa_output = job.blackboard.get("qa_output")
        project_id = str(job.project_id)
        deployment_file_count = 0
        deployment_manifest = None
        github_commit_error = None
        github_commit_file_count = 0
        github_commit_path = None
        github_commit_sha = None
        github_commit_status = None
        github_commit_url = None
        github_repository = None
        mobile_checks: dict[str, bool] = {}
        mobile_fixes: list[str] = []
        mobile_issues: list[str] = []
        mobile_status = None
        qa_blocking_issues: list[str] = []
        qa_checks: dict[str, bool] = {}
        qa_status = None
        qa_warnings: list[str] = []

        if isinstance(mobile_output, dict):
            raw_checks = mobile_output.get("checks")
            raw_fixes = mobile_output.get("fixes")
            raw_issues = mobile_output.get("issues")
            raw_status = mobile_output.get("status")
            mobile_checks = raw_checks if isinstance(raw_checks, dict) else {}
            mobile_fixes = [str(fix) for fix in raw_fixes] if isinstance(raw_fixes, list) else []
            mobile_issues = [str(issue) for issue in raw_issues] if isinstance(raw_issues, list) else []
            mobile_status = str(raw_status) if raw_status else None

        if isinstance(deployment_artifact, dict):
            raw_file_count = deployment_artifact.get("file_count")
            raw_manifest = deployment_artifact.get("manifest")
            deployment_file_count = raw_file_count if isinstance(raw_file_count, int) else 0
            deployment_manifest = raw_manifest if isinstance(raw_manifest, dict) else None

        if isinstance(github_commit, dict):
            raw_file_count = github_commit.get("file_count")
            github_commit_error = _optional_str(github_commit.get("error"))
            github_commit_file_count = raw_file_count if isinstance(raw_file_count, int) else 0
            github_commit_path = _optional_str(github_commit.get("path_prefix"))
            github_commit_sha = _optional_str(github_commit.get("commit_sha"))
            github_commit_status = _optional_str(github_commit.get("status"))
            github_commit_url = _optional_str(github_commit.get("commit_url"))
            github_repository = _optional_str(github_commit.get("repository"))

        if isinstance(qa_output, dict):
            raw_blocking = qa_output.get("blocking_issues")
            raw_checks = qa_output.get("checks")
            raw_status = qa_output.get("status")
            raw_warnings = qa_output.get("warnings")
            qa_blocking_issues = [str(issue) for issue in raw_blocking] if isinstance(raw_blocking, list) else []
            qa_checks = raw_checks if isinstance(raw_checks, dict) else {}
            qa_status = str(raw_status) if raw_status else None
            qa_warnings = [str(warning) for warning in raw_warnings] if isinstance(raw_warnings, list) else []

        return cls(
            blackboard_keys=list(job.blackboard.keys()),
            job_id=job.job_id,
            status=job.status,
            current_agent=job.current_agent,
            agents_completed=job.agents_completed,
            agents_total=job.agents_total,
            completed_agent_ids=sorted(job.completed_agent_ids),
            component_file_count=len(component_files) if isinstance(component_files, dict) else 0,
            deployment_file_count=deployment_file_count,
            deployment_manifest=deployment_manifest,
            github_commit_error=github_commit_error,
            github_commit_file_count=github_commit_file_count,
            github_commit_path=github_commit_path,
            github_commit_sha=github_commit_sha,
            github_commit_status=github_commit_status,
            github_commit_url=github_commit_url,
            github_repository=github_repository,
            mobile_checks=mobile_checks,
            mobile_fixes=mobile_fixes,
            mobile_issues=mobile_issues,
            mobile_status=mobile_status,
            queue_position=queue_position,
            preview_html=preview_html if isinstance(preview_html, str) else None,
            qa_blocking_issues=qa_blocking_issues,
            qa_checks=qa_checks,
            qa_status=qa_status,
            qa_warnings=qa_warnings,
            site_id=project_id if not project_id.startswith("pending:") else f"draft-{job.job_id[:8]}",
            supervisor_decision=job.blackboard.get("latest_blackboard_decision"),
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


def _optional_str(value: Any) -> str | None:
    return str(value) if value not in (None, "") else None


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
