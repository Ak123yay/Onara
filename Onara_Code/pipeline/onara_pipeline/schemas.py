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


class RevisionStartRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    business_data: dict[str, Any] = Field(default_factory=dict)
    cloudflare_project_name: str | None = None
    component_selection: list[str] = Field(default_factory=list, max_length=16)
    github_path: str | None = None
    instruction: str = Field(min_length=3, max_length=4000)
    is_trial: bool = False
    parent_revision_id: str | None = None
    project_id: str = Field(min_length=1)
    public_url: str | None = None
    revision_id: str = Field(min_length=1)
    revision_kind: Literal["edit", "rollback"] = "edit"
    source_files: dict[str, str] | None = None
    source_public_url: str | None = None
    style_preferences: dict[str, Any] = Field(default_factory=dict)
    user_id: str = Field(min_length=1)
    user_plan: PlanType = "free"


class JobEnqueueResponse(BaseModel):
    agent_6_model: str
    agent_6_model_reason: str | None = None
    agent_6_model_requested: str | None = None
    job_id: str
    project_id: str
    queued: bool
    deduped: bool
    queue_position: int | None
    status: str


class RevisionEnqueueResponse(BaseModel):
    job_id: str
    queue_position: int | None
    revision_id: str
    status: str


class RevisionStatusResponse(BaseModel):
    affected_components: list[str] = Field(default_factory=list)
    agent_summary: str | None = None
    before_public_url: str | None = None
    changed_files: list[dict[str, Any]] = Field(default_factory=list)
    cloudflare_deployment_url: str | None = None
    created_at: datetime
    current_step: str | None = None
    error_message: str | None = None
    github_commit_sha: str | None = None
    job_id: str
    progress_log: list[dict[str, Any]] = Field(default_factory=list)
    public_url: str | None = None
    result_public_url: str | None = None
    revision_id: str
    revision_kind: str = "edit"
    status: str
    updated_at: datetime


class HealthResponse(BaseModel):
    status: Literal["ok", "degraded"]
    ollama: bool
    queue_length: int
    active_jobs: int
    uptime_seconds: int


class DashboardBriefProject(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    business_name: str = Field(min_length=1, max_length=180)
    business_category: str | None = Field(default=None, max_length=120)
    custom_domain: str | None = Field(default=None, max_length=240)
    error_message: str | None = Field(default=None, max_length=500)
    google_rating: float | str | None = None
    google_review_count: int | None = Field(default=None, ge=0)
    last_deployed_at: str | None = Field(default=None, max_length=80)
    public_url: str | None = Field(default=None, max_length=500)
    status: str = Field(min_length=1, max_length=40)
    updated_at: str | None = Field(default=None, max_length=80)


class DashboardBriefRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    active_build_count: int = Field(default=0, ge=0)
    failed_count: int = Field(default=0, ge=0)
    is_trial: bool = False
    live_count: int = Field(default=0, ge=0)
    projects: list[DashboardBriefProject] = Field(default_factory=list, max_length=25)
    revisions_label: str = Field(default="0/3", max_length=40)
    today: str = Field(min_length=8, max_length=20)
    total_count: int = Field(default=0, ge=0)
    user_plan: PlanType = "free"


class DashboardBriefResponse(BaseModel):
    generated_on: str
    headline: str = Field(min_length=1, max_length=120)
    model: str | None = None
    provider: str | None = None
    recommendations: list[str] = Field(default_factory=list, max_length=4)
    source: Literal["ai", "fallback"] = "fallback"
    summary: str = Field(min_length=1, max_length=500)


class QueueStats(BaseModel):
    queue_length: int
    active_jobs: int


class JobStatusResponse(BaseModel):
    ai_blackboard_review: dict[str, Any] | None = None
    ai_blackboard_warnings: list[str] = Field(default_factory=list)
    blackboard_keys: list[str]
    candidates: list[dict[str, Any]] = Field(default_factory=list)
    diagnostic_code: str | None = None
    degraded_services: list[str] = Field(default_factory=list)
    eta_seconds: int | None = None
    fallback_used: bool = False
    job_id: str
    last_valid_preview_url: str | None = None
    pipeline_version: str = "v1"
    quality_badges: list[str] = Field(default_factory=list)
    quality_mode: str | None = None
    selected_candidate_id: str | None = None
    stage: str | None = None
    status: str
    current_agent: str | None
    agents_completed: int
    agents_total: int
    completed_agent_ids: list[str] = Field(default_factory=list)
    component_file_count: int = 0
    cloudflare_deployment_error: str | None = None
    cloudflare_deployment_status: str | None = None
    cloudflare_deployment_url: str | None = None
    cloudflare_file_count: int = 0
    cloudflare_project_name: str | None = None
    cloudflare_project_url: str | None = None
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
    photo_count: int = 0
    photo_resolution_status: str | None = None
    pre_qa_blocking_issues: list[str] = Field(default_factory=list)
    pre_qa_check_pass_rate: float | None = None
    pre_qa_hardening_attempts: list[dict[str, Any]] = Field(default_factory=list)
    pre_qa_min_check_pass_rate: float | None = None
    pre_qa_status: str | None = None
    public_url: str | None = None
    queue_position: int | None
    preview_html: str | None = None
    qa_blocking_issues: list[str] = Field(default_factory=list)
    qa_checks: dict[str, bool] = Field(default_factory=dict)
    qa_status: str | None = None
    qa_warnings: list[str] = Field(default_factory=list)
    site_id: str | None = None
    supervisor_decision: dict[str, Any] | None = None
    supabase_project_error: str | None = None
    supabase_project_id: str | None = None
    supabase_project_status: str | None = None
    created_at: datetime
    error_message: str | None = None
    updated_at: datetime
    progress_log: list[dict[str, Any]]

    @classmethod
    def from_job(cls, job: Any, queue_position: int | None) -> "JobStatusResponse":
        preview_html = job.blackboard.get("generated_html")
        component_files = job.blackboard.get("component_files")
        cloudflare_deployment = job.blackboard.get("cloudflare_deployment")
        deployment_artifact = job.blackboard.get("deployment_artifact")
        github_commit = job.blackboard.get("github_commit")
        ai_blackboard_review = job.blackboard.get("latest_ai_blackboard_review")
        mobile_output = job.blackboard.get("mobile_output")
        qa_output = job.blackboard.get("qa_output")
        project_id = str(job.project_id)
        deployment_file_count = 0
        deployment_manifest = None
        cloudflare_deployment_error = None
        cloudflare_deployment_status = None
        cloudflare_deployment_url = None
        cloudflare_file_count = 0
        cloudflare_project_name = None
        cloudflare_project_url = None
        github_commit_error = None
        github_commit_file_count = 0
        github_commit_path = None
        github_commit_sha = None
        github_commit_status = None
        github_commit_url = None
        github_repository = None
        ai_blackboard_warnings: list[str] = []
        mobile_checks: dict[str, bool] = {}
        mobile_fixes: list[str] = []
        mobile_issues: list[str] = []
        mobile_status = None
        qa_blocking_issues: list[str] = []
        qa_checks: dict[str, bool] = {}
        qa_status = None
        qa_warnings: list[str] = []
        phase_21 = job.blackboard.get("phase_21")
        supabase_project = job.blackboard.get("supabase_project")
        pre_qa_blocking_issues: list[str] = []
        pre_qa_check_pass_rate = None
        pre_qa_hardening_attempts: list[dict[str, Any]] = []
        pre_qa_min_check_pass_rate = None
        pre_qa_status = None
        photo_assets = job.blackboard.get("photo_assets")
        photo_count = len(photo_assets) if isinstance(photo_assets, list) else 0
        photo_resolution_status = _optional_str(job.business_data.get("photo_resolution_status"))
        public_url = _optional_str(job.blackboard.get("public_url"))
        candidates = job.blackboard.get("candidate_summaries")
        quality_badges = job.blackboard.get("quality_badges")

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

        if isinstance(cloudflare_deployment, dict):
            raw_file_count = cloudflare_deployment.get("file_count")
            cloudflare_deployment_error = _optional_str(cloudflare_deployment.get("error"))
            cloudflare_deployment_status = _optional_str(cloudflare_deployment.get("status"))
            cloudflare_deployment_url = _optional_str(cloudflare_deployment.get("deployment_url"))
            cloudflare_file_count = raw_file_count if isinstance(raw_file_count, int) else 0
            cloudflare_project_name = _optional_str(cloudflare_deployment.get("project_name"))
            cloudflare_project_url = _optional_str(cloudflare_deployment.get("project_url"))

        if isinstance(github_commit, dict):
            raw_file_count = github_commit.get("file_count")
            github_commit_error = _optional_str(github_commit.get("error"))
            github_commit_file_count = raw_file_count if isinstance(raw_file_count, int) else 0
            github_commit_path = _optional_str(github_commit.get("path_prefix"))
            github_commit_sha = _optional_str(github_commit.get("commit_sha"))
            github_commit_status = _optional_str(github_commit.get("status"))
            github_commit_url = _optional_str(github_commit.get("commit_url"))
            github_repository = _optional_str(github_commit.get("repository"))

        if isinstance(ai_blackboard_review, dict):
            raw_warnings = ai_blackboard_review.get("warnings")
            ai_blackboard_warnings = [str(warning) for warning in raw_warnings] if isinstance(raw_warnings, list) else []

        if isinstance(qa_output, dict):
            raw_blocking = qa_output.get("blocking_issues")
            raw_checks = qa_output.get("checks")
            raw_status = qa_output.get("status")
            raw_warnings = qa_output.get("warnings")
            qa_blocking_issues = [str(issue) for issue in raw_blocking] if isinstance(raw_blocking, list) else []
            qa_checks = raw_checks if isinstance(raw_checks, dict) else {}
            qa_status = str(raw_status) if raw_status else None
            qa_warnings = [str(warning) for warning in raw_warnings] if isinstance(raw_warnings, list) else []

        if isinstance(phase_21, dict):
            raw_pre_qa_blocking = phase_21.get("pre_qa_blocking_issues")
            raw_pre_qa_history = phase_21.get("pre_qa_hardening_attempts")
            raw_pre_qa_score = phase_21.get("pre_qa_check_pass_rate")
            raw_pre_qa_min_score = phase_21.get("pre_qa_min_check_pass_rate")
            pre_qa_blocking_issues = (
                [str(issue) for issue in raw_pre_qa_blocking]
                if isinstance(raw_pre_qa_blocking, list)
                else []
            )
            pre_qa_hardening_attempts = (
                [attempt for attempt in raw_pre_qa_history if isinstance(attempt, dict)]
                if isinstance(raw_pre_qa_history, list)
                else []
            )
            pre_qa_check_pass_rate = (
                float(raw_pre_qa_score)
                if isinstance(raw_pre_qa_score, int | float)
                else None
            )
            pre_qa_min_check_pass_rate = (
                float(raw_pre_qa_min_score)
                if isinstance(raw_pre_qa_min_score, int | float)
                else None
            )
            pre_qa_status = _optional_str(phase_21.get("pre_qa_status"))

        supabase_project_error = None
        supabase_project_id = project_id
        supabase_project_status = None
        if isinstance(supabase_project, dict):
            supabase_project_error = _optional_str(supabase_project.get("error"))
            supabase_project_id = _optional_str(supabase_project.get("project_id")) or project_id
            supabase_project_status = _optional_str(supabase_project.get("status"))

        return cls(
            ai_blackboard_review=ai_blackboard_review if isinstance(ai_blackboard_review, dict) else None,
            ai_blackboard_warnings=ai_blackboard_warnings,
            blackboard_keys=list(job.blackboard.keys()),
            candidates=[item for item in candidates if isinstance(item, dict)]
            if isinstance(candidates, list)
            else [],
            diagnostic_code=_optional_str(job.blackboard.get("diagnostic_code")),
            degraded_services=[
                str(item)
                for item in job.blackboard.get("degraded_services", [])
                if isinstance(item, str)
            ],
            eta_seconds=job.eta_seconds,
            fallback_used=bool(job.blackboard.get("fallback_used")),
            job_id=job.job_id,
            last_valid_preview_url=public_url,
            pipeline_version=job.pipeline_version,
            quality_badges=[str(item) for item in quality_badges]
            if isinstance(quality_badges, list)
            else [],
            quality_mode=_optional_str(job.blackboard.get("quality_mode")),
            selected_candidate_id=_optional_str(job.blackboard.get("selected_candidate_id")),
            stage=job.stage,
            status=job.status,
            current_agent=job.current_agent,
            agents_completed=job.agents_completed,
            agents_total=job.agents_total,
            completed_agent_ids=sorted(job.completed_agent_ids),
            component_file_count=len(component_files) if isinstance(component_files, dict) else 0,
            cloudflare_deployment_error=cloudflare_deployment_error,
            cloudflare_deployment_status=cloudflare_deployment_status,
            cloudflare_deployment_url=cloudflare_deployment_url,
            cloudflare_file_count=cloudflare_file_count,
            cloudflare_project_name=cloudflare_project_name,
            cloudflare_project_url=cloudflare_project_url,
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
            photo_count=photo_count,
            photo_resolution_status=photo_resolution_status,
            pre_qa_blocking_issues=pre_qa_blocking_issues,
            pre_qa_check_pass_rate=pre_qa_check_pass_rate,
            pre_qa_hardening_attempts=pre_qa_hardening_attempts,
            pre_qa_min_check_pass_rate=pre_qa_min_check_pass_rate,
            pre_qa_status=pre_qa_status,
            public_url=public_url,
            queue_position=queue_position,
            preview_html=preview_html if isinstance(preview_html, str) else None,
            qa_blocking_issues=qa_blocking_issues,
            qa_checks=qa_checks,
            qa_status=qa_status,
            qa_warnings=qa_warnings,
            site_id=project_id,
            supervisor_decision=job.blackboard.get("latest_blackboard_decision"),
            supabase_project_error=supabase_project_error,
            supabase_project_id=supabase_project_id,
            supabase_project_status=supabase_project_status,
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
