import asyncio
import json
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Literal
from uuid import UUID, uuid4

from onara_pipeline.config import Settings
from onara_pipeline.schemas import GenerateRequest, QueueStats

JobStatus = Literal["queued", "running", "completed", "failed"]


@dataclass(slots=True)
class PipelineJob:
    agent_6_model: str | None
    is_trial: bool
    job_id: str
    project_id: str
    user_id: str
    user_plan: str
    business_data: dict
    style_preferences: dict
    request_signature: str
    agents_completed: int = 0
    agents_total: int = 10
    blackboard: dict[str, Any] = field(default_factory=dict)
    completed_agent_ids: set[str] = field(default_factory=set)
    current_agent: str | None = None
    error_message: str | None = None
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
        self._worker_tasks: set[asyncio.Task[None]] = set()

    async def enqueue(self, request: GenerateRequest) -> EnqueueResult:
        async with self._lock:
            project_key = _project_key_for_request(request)
            project_id = _project_id_for_request(request)
            existing_id = self._project_to_job_id.get(project_key)

            if existing_id:
                existing_job = self._jobs[existing_id]

                if (
                    existing_job.status in {"queued", "running"}
                    and existing_job.request_signature == request_signature(request)
                ):
                    existing_job.updated_at = datetime.now(timezone.utc)
                    return EnqueueResult(job=existing_job, deduped=True)

            job_id = request.job_id or str(uuid4())
            job = PipelineJob(
                agent_6_model=request.agent_6_model,
                is_trial=request.is_trial,
                job_id=job_id,
                project_id=project_id,
                user_id=request.user_id,
                user_plan=request.user_plan,
                business_data=request.business_data,
                style_preferences=request.style_preferences,
                request_signature=request_signature(request),
            )

            self._jobs[job_id] = job
            self._queued_job_ids.append(job_id)
            self._project_to_job_id[project_key] = job_id
            return EnqueueResult(job=job, deduped=False)

    async def start_workers(self, settings: Settings) -> None:
        async with self._lock:
            self._worker_tasks = {task for task in self._worker_tasks if not task.done()}
            target_workers = max(1, settings.pipeline_max_concurrency)

            while self._queued_job_ids and len(self._worker_tasks) < target_workers:
                task = asyncio.create_task(self._worker_loop(settings))
                task.add_done_callback(self._consume_worker_exception)
                self._worker_tasks.add(task)

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

    async def _worker_loop(self, settings: Settings) -> None:
        while True:
            job = await self._claim_next_job()
            if not job:
                return

            try:
                from onara_pipeline.agents import run_phase_18, run_phase_19, run_phase_20, run_phase_21

                async def progress(
                    event: str,
                    agent_id: str | None,
                    message: str,
                    extra: dict[str, Any] | None = None,
                ) -> None:
                    await self.record_progress(job.job_id, event, agent_id, message, extra)

                await self._update_project_record_status(
                    job,
                    settings,
                    current_agent="analyst",
                    status="generating",
                )
                await self._enrich_business_photos(job, settings, progress)
                await self._run_supervised_phase(
                    job=job,
                    progress=progress,
                    runner=lambda: run_phase_18(job, settings, progress),
                    settings=settings,
                    stage="after_phase_18",
                )
                await self.record_progress(
                    job.job_id,
                    "phase_completed",
                    None,
                    "Phase 18 completed. Agents 1-3 outputs are ready.",
                    {"phase": "phase_18"},
                )
                await self._run_supervised_phase(
                    job=job,
                    progress=progress,
                    runner=lambda: run_phase_19(job, settings, progress),
                    settings=settings,
                    stage="after_phase_19",
                )
                await self.record_progress(
                    job.job_id,
                    "phase_completed",
                    None,
                    "Phase 19 completed. Agents 4-5 outputs are ready.",
                    {"phase": "phase_19"},
                )
                await self._run_supervised_phase(
                    job=job,
                    progress=progress,
                    runner=lambda: run_phase_20(job, settings, progress),
                    settings=settings,
                    stage="after_phase_20",
                )
                await self.record_progress(
                    job.job_id,
                    "phase_completed",
                    None,
                    "Phase 20 completed. Agent 6 draft is ready for debugging.",
                    {"phase": "phase_20"},
                )
                await run_phase_21(job, settings, progress)
                await self._prepare_deployment_artifact(job, progress)
                await self._update_project_record_status(
                    job,
                    settings,
                    current_agent="deploying",
                    status="deploying",
                )
                await self._commit_deployment_files_to_github(job, settings, progress)
                await self._deploy_to_cloudflare_pages(job, settings, progress)
                await self._store_project_record_in_supabase(job, settings, progress)
                await self.record_progress(
                    job.job_id,
                    "phase_completed",
                    None,
                    "Phase 22 deployment pipeline completed.",
                    {"phase": "phase_22"},
                )
                await self._mark_completed(job.job_id)
            except Exception as exc:
                await self._mark_failed(job.job_id, exc)
                await self._update_project_record_status(
                    job,
                    settings,
                    current_agent="error",
                    error_message=str(exc),
                    status="failed",
                )

    async def _prepare_deployment_artifact(self, job: PipelineJob, progress: Any) -> None:
        from onara_pipeline.agents.contracts import PlannerOutput
        from onara_pipeline.deployment import build_deployment_artifact

        planner = PlannerOutput.model_validate(job.blackboard.get("planner_output"))
        artifact = build_deployment_artifact(
            str(job.blackboard.get("generated_html") or ""),
            business_data=job.business_data,
            job_id=job.job_id,
            planner=planner,
            project_id=job.project_id,
            user_id=job.user_id,
        )

        job.blackboard["deployment_artifact"] = {
            "file_count": artifact.file_count,
            "manifest": artifact.manifest,
        }
        job.blackboard["deployment_files"] = artifact.files
        job.blackboard["final_html"] = artifact.index_html
        job.blackboard["generated_html"] = artifact.index_html
        job.blackboard["component_files"] = artifact.files

        await progress(
            "phase_completed",
            "deployment_parser",
            "Deployment parser extracted final HTML and atomic component files.",
            {
                "deployment_file_count": artifact.file_count,
                "manifest": artifact.manifest,
                "phase": "phase_22_parser",
            },
        )

    async def _commit_deployment_files_to_github(
        self,
        job: PipelineJob,
        settings: Settings,
        progress: Any,
    ) -> None:
        from onara_pipeline.deployment import (
            GitHubDeploymentError,
            commit_deployment_files,
            missing_github_settings,
            site_path_prefix,
        )

        files = job.blackboard.get("deployment_files")
        if not isinstance(files, dict) or not files:
            raise GitHubDeploymentError("Deployment files are missing; parser must run before GitHub commit")

        path_prefix = site_path_prefix(job.project_id)
        missing = missing_github_settings(settings)
        if missing:
            result = {
                "error": f"Missing GitHub deployment settings: {', '.join(missing)}",
                "file_count": len(files),
                "path_prefix": path_prefix,
                "repository": settings.github_repo_name,
                "status": "skipped",
            }
            job.blackboard["github_commit"] = result
            await progress(
                "deployment_skipped",
                "github",
                "GitHub commit skipped because deployment credentials are not configured.",
                {"github_commit": result, "phase": "phase_22_github"},
            )
            return

        try:
            commit = await commit_deployment_files(
                business_name=str(job.business_data.get("name") or "Unknown Business"),
                files={str(path): str(content) for path, content in files.items()},
                job_id=job.job_id,
                project_id=job.project_id,
                settings=settings,
            )
            result = {
                **commit.to_dict(),
                "status": "committed",
            }
            job.blackboard["github_commit"] = result
            await progress(
                "phase_completed",
                "github",
                "Committed deployment files to onara-sites.",
                {"github_commit": result, "phase": "phase_22_github"},
            )
        except GitHubDeploymentError as exc:
            result = {
                "error": str(exc),
                "file_count": len(files),
                "path_prefix": path_prefix,
                "repository": f"{settings.github_repo_owner}/{settings.github_repo_name}",
                "status": "failed",
            }
            job.blackboard["github_commit"] = result
            await progress(
                "deployment_warning",
                "github",
                "GitHub commit failed; continuing because GitHub backup is non-critical.",
                {"github_commit": result, "phase": "phase_22_github"},
            )

    async def _deploy_to_cloudflare_pages(
        self,
        job: PipelineJob,
        settings: Settings,
        progress: Any,
    ) -> None:
        from onara_pipeline.deployment import (
            CloudflarePagesDeploymentError,
            cloudflare_project_name,
            deploy_to_cloudflare_pages,
            missing_cloudflare_settings,
        )

        files = job.blackboard.get("deployment_files")
        if not isinstance(files, dict) or not files:
            raise CloudflarePagesDeploymentError("Deployment files are missing; parser must run before Cloudflare deploy")

        project_name = cloudflare_project_name(
            job.project_id,
            prefix=settings.cloudflare_pages_project_prefix,
        )
        missing = missing_cloudflare_settings(settings)
        if missing:
            result = {
                "error": f"Missing Cloudflare deployment settings: {', '.join(missing)}",
                "file_count": len(files),
                "project_name": project_name,
                "status": "skipped",
            }
            job.blackboard["cloudflare_deployment"] = result
            await progress(
                "deployment_skipped",
                "cloudflare",
                "Cloudflare Pages deployment skipped because credentials are not configured.",
                {"cloudflare_deployment": result, "phase": "phase_22_cloudflare"},
            )
            return

        try:
            deployment = await deploy_to_cloudflare_pages(
                files={str(path): str(content) for path, content in files.items()},
                project_id=job.project_id,
                settings=settings,
            )
            result = {
                **deployment.to_dict(),
                "status": "deployed",
            }
            job.blackboard["cloudflare_deployment"] = result
            job.blackboard["public_url"] = _public_job_url(settings.app_url, job.job_id)
            await progress(
                "phase_completed",
                "cloudflare",
                "Deployed generated site to Cloudflare Pages.",
                {"cloudflare_deployment": result, "phase": "phase_22_cloudflare"},
            )
        except CloudflarePagesDeploymentError as exc:
            result = {
                "error": str(exc),
                "file_count": len(files),
                "project_name": project_name,
                "status": "failed",
            }
            job.blackboard["cloudflare_deployment"] = result
            await progress(
                "deployment_failed",
                "cloudflare",
                "Cloudflare Pages deployment failed.",
                {"cloudflare_deployment": result, "phase": "phase_22_cloudflare"},
            )
            raise

    async def _store_project_record_in_supabase(
        self,
        job: PipelineJob,
        settings: Settings,
        progress: Any,
    ) -> None:
        from onara_pipeline.deployment import SupabaseProjectStoreError, upsert_project_record

        cloudflare_deployment = job.blackboard.get("cloudflare_deployment")
        github_commit = job.blackboard.get("github_commit")
        cloudflare = cloudflare_deployment if isinstance(cloudflare_deployment, dict) else {}
        github = github_commit if isinstance(github_commit, dict) else {}
        cloudflare_status = str(cloudflare.get("status") or "")
        site_status = "live" if cloudflare_status == "deployed" else "deploying"
        public_url = str(job.blackboard.get("public_url") or cloudflare.get("deployment_url") or "") or None
        generation_ms = max(0, int((datetime.now(timezone.utc) - job.created_at).total_seconds() * 1000))

        try:
            result = await upsert_project_record(
                business_data=job.business_data,
                cloudflare_project_name=str(cloudflare.get("project_name") or "") or None,
                current_agent="done" if site_status == "live" else "deploying",
                generation_ms=generation_ms,
                github_path=str(github.get("path_prefix") or "") or None,
                pipeline_job_id=job.job_id,
                project_id=job.project_id,
                public_url=public_url,
                settings=settings,
                status=site_status,
                style_preferences=job.style_preferences,
                user_id=job.user_id,
            )
            payload = result.to_dict()
            job.blackboard["supabase_project"] = payload

            if result.status == "skipped":
                await progress(
                    "deployment_skipped",
                    "supabase",
                    "Supabase project record store skipped because credentials are not configured.",
                    {"phase": "phase_22_supabase", "supabase_project": payload},
                )
                return

            await progress(
                "phase_completed",
                "supabase",
                "Stored generated project record in Supabase.",
                {"phase": "phase_22_supabase", "supabase_project": payload},
            )
        except SupabaseProjectStoreError as exc:
            payload = {
                "error": str(exc),
                "project_id": job.project_id,
                "status": "failed",
            }
            job.blackboard["supabase_project"] = payload
            await progress(
                "deployment_warning",
                "supabase",
                "Supabase project record store failed; deployment artifacts remain available.",
                {"phase": "phase_22_supabase", "supabase_project": payload},
            )

    async def _update_project_record_status(
        self,
        job: PipelineJob,
        settings: Settings,
        *,
        current_agent: str,
        error_message: str | None = None,
        status: str,
    ) -> None:
        from onara_pipeline.deployment import SupabaseProjectStoreError, upsert_project_record

        try:
            result = await upsert_project_record(
                business_data=job.business_data,
                cloudflare_project_name=None,
                current_agent=current_agent,
                error_message=error_message,
                generation_ms=_generation_ms(job),
                github_path=None,
                pipeline_job_id=job.job_id,
                project_id=job.project_id,
                public_url=_public_job_url(settings.app_url, job.job_id),
                settings=settings,
                status=status,
                style_preferences=job.style_preferences,
                user_id=job.user_id,
            )
            job.blackboard["supabase_project"] = result.to_dict()
        except SupabaseProjectStoreError as exc:
            job.blackboard["supabase_project"] = {
                "error": str(exc),
                "project_id": job.project_id,
                "status": "failed",
            }

    async def _run_supervised_phase(
        self,
        *,
        job: PipelineJob,
        progress: Any,
        runner: Any,
        settings: Settings,
        stage: str,
    ) -> None:
        from onara_pipeline.agents.blackboard_supervisor import (
            BlackboardSupervisorError,
            inspect_blackboard,
        )
        from onara_pipeline.agents.ai_blackboard_reviewer import review_blackboard_with_ai

        rerun_attempts = 0

        while True:
            await runner()
            decision = inspect_blackboard(
                job.blackboard,
                business_data=job.business_data,
                stage=stage,
            )
            await progress(
                "blackboard_supervisor",
                "blackboard_supervisor",
                decision.reason,
                {"supervisor_decision": decision.to_dict()},
            )
            ai_review = await review_blackboard_with_ai(
                job.blackboard,
                business_data=job.business_data,
                deterministic_decision=decision,
                settings=settings,
                stage=stage,
                style_preferences=job.style_preferences,
            )
            await progress(
                "ai_blackboard_reviewer",
                "ai_blackboard_reviewer",
                str(ai_review.get("summary") or "AI blackboard reviewer completed."),
                {"ai_blackboard_review": ai_review},
            )

            if decision.action in {"continue", "route_debugger"}:
                return

            if decision.action == "fail":
                raise BlackboardSupervisorError(decision.reason)

            if decision.action == "rerun_agent":
                rerun_attempts += 1
                if rerun_attempts > 1:
                    raise BlackboardSupervisorError(
                        f"Blackboard Supervisor requested repeated rerun for {decision.target_agent}: "
                        f"{decision.reason}"
                    )

                await progress(
                    "agent_retry",
                    decision.target_agent,
                    f"Blackboard Supervisor requested rerun: {decision.reason}",
                    {
                        "rerun_attempt": rerun_attempts,
                        "supervisor_decision": decision.to_dict(),
                    },
                )
                continue

            raise BlackboardSupervisorError(f"Unsupported Blackboard Supervisor action: {decision.action}")

    async def _claim_next_job(self) -> PipelineJob | None:
        async with self._lock:
            if not self._queued_job_ids:
                return None

            job_id = self._queued_job_ids.pop(0)
            job = self._jobs[job_id]
            job.status = "running"
            job.updated_at = datetime.now(timezone.utc)
            job.progress_log.append(
                {
                    "event": "pipeline_started",
                    "message": "Phase 18-21 worker started.",
                    "timestamp": job.updated_at.isoformat(),
                }
            )
            return job

    async def _enrich_business_photos(self, job: PipelineJob, settings: Settings, progress: Any) -> None:
        from onara_pipeline.agents.photos import enrich_business_photos

        original_status = str(job.business_data.get("photo_resolution_status") or "")
        job.business_data = await enrich_business_photos(job.business_data, settings)
        resolved = job.business_data.get("resolved_photos")
        status = str(job.business_data.get("photo_resolution_status") or "none")
        count = len(resolved) if isinstance(resolved, list) else 0

        job.blackboard["photo_assets"] = resolved if isinstance(resolved, list) else []
        if status != original_status or count:
            await progress(
                "business_data_enriched",
                "photo_resolver",
                f"Resolved {count} deploy-safe business photo{'s' if count != 1 else ''}.",
                {
                    "photo_count": count,
                    "photo_resolution_status": status,
                    "phase": "photo_resolution",
                },
            )

    async def record_progress(
        self,
        job_id: str,
        event: str,
        agent_id: str | None,
        message: str,
        extra: dict[str, Any] | None = None,
    ) -> None:
        async with self._lock:
            job = self._jobs.get(job_id)
            if not job:
                return

            now = datetime.now(timezone.utc)
            if event == "agent_started":
                job.current_agent = agent_id
            elif event == "agent_completed":
                job.current_agent = None
                if agent_id and agent_id not in job.completed_agent_ids:
                    job.completed_agent_ids.add(agent_id)
                    job.agents_completed = min(job.agents_completed + 1, job.agents_total)

            job.updated_at = now
            entry: dict[str, Any] = {
                "agent_id": agent_id,
                "event": event,
                "message": message,
                "timestamp": now.isoformat(),
            }
            if extra:
                entry.update(extra)
            job.progress_log.append(entry)

    async def _mark_completed(self, job_id: str) -> None:
        async with self._lock:
            job = self._jobs[job_id]
            now = datetime.now(timezone.utc)
            job.status = "completed"
            job.current_agent = None
            job.updated_at = now
            job.progress_log.append(
                {
                    "event": "pipeline_completed",
                    "message": "Phase 22 Cloudflare deployment step completed.",
                    "phase": "phase_22_cloudflare",
                    "timestamp": now.isoformat(),
                }
            )

    async def _mark_failed(self, job_id: str, exc: Exception) -> None:
        async with self._lock:
            job = self._jobs[job_id]
            now = datetime.now(timezone.utc)
            job.status = "failed"
            job.current_agent = None
            job.error_message = str(exc)
            job.updated_at = now
            job.progress_log.append(
                {
                    "event": "pipeline_failed",
                    "message": str(exc),
                    "phase": "phase_18_21",
                    "timestamp": now.isoformat(),
                }
            )

    @staticmethod
    def _consume_worker_exception(task: asyncio.Task[None]) -> None:
        try:
            task.result()
        except Exception:
            pass


def request_signature(request: GenerateRequest) -> str:
    """Identify jobs that are truly identical for queue dedupe."""
    return json.dumps(
        {
            "agent_6_model": request.agent_6_model,
            "business_data": request.business_data,
            "is_trial": request.is_trial,
            "style_preferences": request.style_preferences,
            "user_plan": request.user_plan,
        },
        default=str,
        separators=(",", ":"),
        sort_keys=True,
    )


def _project_key_for_request(request: GenerateRequest) -> str:
    if request.project_id:
        return request.project_id
    return f"pending:{request.user_id}:{request.place_id or request_signature(request)}"


def _project_id_for_request(request: GenerateRequest) -> str:
    if request.project_id:
        try:
            return str(UUID(request.project_id))
        except ValueError:
            pass
    return str(uuid4())


def _generation_ms(job: PipelineJob) -> int:
    return max(0, int((datetime.now(timezone.utc) - job.created_at).total_seconds() * 1000))


def _public_job_url(app_url: str, job_id: str) -> str:
    return f"{app_url.rstrip('/')}/{job_id}"
