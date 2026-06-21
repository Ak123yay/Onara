import asyncio
import hashlib
import json
import socket
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Literal
from uuid import UUID, uuid4

from onara_pipeline.config import Settings
from onara_pipeline.durable_jobs import DurableJobStoreError
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
    pipeline_version: str = "v1"
    stage: str = "queued"
    eta_seconds: int | None = None
    attempt: int = 0
    event_sequence: int = 0
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
        self._settings: Settings | None = None
        self._durable_store = None
        self._worker_id = f"{socket.gethostname()}:{uuid4().hex[:8]}"

    async def enqueue(self, request: GenerateRequest, settings: Settings) -> EnqueueResult:
        signature = request_signature(request)
        if settings.pipeline_v2_enabled:
            existing_row = await self._store(settings).find_active(
                request_signature=signature,
                user_id=request.user_id,
            )
            if existing_row:
                return EnqueueResult(
                    job=await self._hydrate_durable_job(existing_row, settings),
                    deduped=True,
                )

        async with self._lock:
            project_key = _project_key_for_request(request)
            project_id = _project_id_for_request(request)
            existing_id = self._project_to_job_id.get(project_key)

            if existing_id:
                existing_job = self._jobs[existing_id]

                if (
                    existing_job.status in {"queued", "running"}
                    and existing_job.request_signature == signature
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
                request_signature=signature,
                agents_total=7 if settings.pipeline_v2_enabled else 10,
                pipeline_version="v2" if settings.pipeline_v2_enabled else "v1",
            )

            self._jobs[job_id] = job
            self._queued_job_ids.append(job_id)
            self._project_to_job_id[project_key] = job_id

        if settings.pipeline_v2_enabled:
            try:
                await self._store(settings).enqueue(job)
            except Exception:
                try:
                    existing_row = await self._store(settings).find_active(
                        request_signature=signature,
                        user_id=request.user_id,
                    )
                except Exception:
                    existing_row = None
                async with self._lock:
                    self._jobs.pop(job_id, None)
                    if job_id in self._queued_job_ids:
                        self._queued_job_ids.remove(job_id)
                    if self._project_to_job_id.get(project_key) == job_id:
                        self._project_to_job_id.pop(project_key, None)
                if existing_row:
                    return EnqueueResult(
                        job=await self._hydrate_durable_job(existing_row, settings),
                        deduped=True,
                    )
                raise
        return EnqueueResult(job=job, deduped=False)

    async def start_workers(self, settings: Settings) -> None:
        self._settings = settings
        if settings.pipeline_v2_enabled:
            await self._recover_durable_jobs(settings)
        async with self._lock:
            self._worker_tasks = {task for task in self._worker_tasks if not task.done()}
            target_workers = max(1, settings.pipeline_max_concurrency)

            while self._queued_job_ids and len(self._worker_tasks) < target_workers:
                task = asyncio.create_task(self._worker_loop(settings))
                task.add_done_callback(self._consume_worker_exception)
                self._worker_tasks.add(task)

    async def get(self, job_id: str, settings: Settings | None = None) -> PipelineJob | None:
        async with self._lock:
            job = self._jobs.get(job_id)
        if job or not settings or not settings.pipeline_v2_enabled:
            return job

        row = await self._store(settings).get(job_id)
        if not row:
            return None
        return await self._hydrate_durable_job(row, settings)

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
            job = await self._claim_next_job(settings)
            if not job:
                return

            heartbeat_task = None
            if job.pipeline_version == "v2":
                heartbeat_task = asyncio.create_task(self._heartbeat_loop(job, settings))
            try:
                await asyncio.wait_for(
                    self._run_job(job, settings),
                    timeout=float(settings.pipeline_job_timeout),
                )
            except TimeoutError:
                await self._handle_job_failure(
                    job,
                    settings,
                    TimeoutError(f"Pipeline job timed out after {settings.pipeline_job_timeout}s"),
                )
            except Exception as exc:
                await self._handle_job_failure(job, settings, exc)
            finally:
                if heartbeat_task:
                    heartbeat_task.cancel()
                    try:
                        await heartbeat_task
                    except asyncio.CancelledError:
                        pass

    async def _run_job(self, job: PipelineJob, settings: Settings) -> None:
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
        if job.pipeline_version == "v2":
            from onara_pipeline.v2 import run_pipeline_v2

            await run_pipeline_v2(
                job,
                settings,
                progress,
                lambda candidate: self._persist_candidate(job, candidate, settings),
            )
        else:
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

        await self._prepare_deployment_artifact(job, settings, progress)
        await self._update_project_record_status(
            job,
            settings,
            current_agent="deploying",
            status="deploying",
        )
        if job.pipeline_version == "v2":
            await self.record_progress(
                job.job_id,
                "stage_started",
                "publishing",
                "Publishing the tested website.",
                {"eta_seconds": 15, "stage": "publishing"},
            )
        await self._deploy_to_cloudflare_pages(job, settings, progress)
        await self._store_project_record_in_supabase(job, settings, progress)
        await self._commit_deployment_files_to_github(job, settings, progress)
        if job.pipeline_version == "v2":
            await self.record_progress(
                job.job_id,
                "stage_completed",
                "publishing",
                "Your website is live.",
                {"eta_seconds": 0, "stage": "publishing"},
            )
        await self._mark_completed(job.job_id)

        try:
            training_consent = await self._load_training_data_consent(job, settings, progress)
            await self._save_curated_rag_patterns(job, settings, progress, training_consent=training_consent)
            await self._store_training_example(job, settings, progress, training_consent=training_consent)
        except Exception as exc:
            await self.record_progress(
                job.job_id,
                "learning_warning",
                None,
                "The live site is safe; the optional learning record could not be saved.",
                {"error": str(exc)[:500], "phase": "training_data"},
            )
        await self.record_progress(
            job.job_id,
            "phase_completed",
            None,
            "Phase 22 deployment pipeline completed.",
            {"phase": "phase_22"},
        )

    async def _handle_job_failure(self, job: PipelineJob, settings: Settings, exc: Exception) -> None:
        active_agent = _agent_phase_for_error(job)
        await self._mark_failed(job.job_id, exc)
        await self._record_pipeline_error(job, settings, exc, active_agent=active_agent)
        await self._update_project_record_status(
            job,
            settings,
            current_agent="error",
            error_message=str(exc),
            status="failed",
        )

    async def _prepare_deployment_artifact(self, job: PipelineJob, settings: Settings, progress: Any) -> None:
        from onara_pipeline.agents.contracts import PlannerOutput
        from onara_pipeline.deployment import build_deployment_artifact, lead_capture_endpoint

        planner = PlannerOutput.model_validate(job.blackboard.get("planner_output"))
        artifact = build_deployment_artifact(
            str(job.blackboard.get("generated_html") or ""),
            business_data=job.business_data,
            job_id=job.job_id,
            lead_capture_endpoint=lead_capture_endpoint(
                enabled=settings.feature_lead_email,
                supabase_url=settings.supabase_url,
            ),
            planner=planner,
            project_id=job.project_id,
            user_plan=job.user_plan,
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
            if job.pipeline_version == "v2":
                raise

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

    async def _save_curated_rag_patterns(
        self,
        job: PipelineJob,
        settings: Settings,
        progress: Any,
        *,
        training_consent: dict[str, Any],
    ) -> None:
        from onara_pipeline.rag.learning import save_qa_approved_patterns

        if not training_consent.get("enabled"):
            payload = {
                "reason": "training data consent is not enabled",
                "status": "skipped",
                "stored_count": 0,
            }
            job.blackboard["rag_learning"] = payload
            await progress(
                "rag_learning",
                "rag_learning",
                "RAG learning skipped: training data consent is not enabled.",
                {"phase": "phase_22_rag_learning", "rag_learning": payload},
            )
            return

        try:
            result = save_qa_approved_patterns(
                blackboard=job.blackboard,
                business_data=job.business_data,
                job_id=job.job_id,
                project_id=job.project_id,
                settings=settings,
                style_preferences=job.style_preferences,
            )
            payload = result.to_dict()
            job.blackboard["rag_learning"] = payload
            await progress(
                "rag_learning",
                "rag_learning",
                (
                    f"Stored {result.stored_count} QA-approved component pattern(s) in RAG."
                    if result.status == "stored"
                    else f"RAG learning skipped: {result.reason}."
                ),
                {"phase": "phase_22_rag_learning", "rag_learning": payload},
            )
        except Exception as exc:
            payload = {
                "error": str(exc)[:500],
                "status": "failed",
            }
            job.blackboard["rag_learning"] = payload
            await progress(
                "deployment_warning",
                "rag_learning",
                "RAG learning failed; continuing because site deployment is already complete.",
                {"phase": "phase_22_rag_learning", "rag_learning": payload},
            )

    async def _load_training_data_consent(
        self,
        job: PipelineJob,
        settings: Settings,
        progress: Any,
    ) -> dict[str, Any]:
        from onara_pipeline.deployment import fetch_training_data_consent

        result = await fetch_training_data_consent(settings=settings, user_id=job.user_id)
        payload = result.to_dict()
        job.blackboard["training_data_consent"] = payload

        if result.status == "failed":
            await progress(
                "deployment_warning",
                "training_data",
                "Training consent check failed; skipping learning and training storage.",
                {"phase": "phase_22_training_data", "training_data_consent": payload},
            )

        return payload

    async def _store_training_example(
        self,
        job: PipelineJob,
        settings: Settings,
        progress: Any,
        *,
        training_consent: dict[str, Any],
    ) -> None:
        from onara_pipeline.deployment import insert_training_example
        from onara_pipeline.training_examples import build_qa_approved_training_example

        if not training_consent.get("enabled"):
            payload = {
                "reason": "training data consent is not enabled",
                "status": "skipped",
            }
            job.blackboard["training_example"] = payload
            await progress(
                "training_data",
                "training_data",
                "Training example storage skipped because the user has not opted in.",
                {"phase": "phase_22_training_data", "training_example": payload},
            )
            return

        try:
            candidate = build_qa_approved_training_example(
                agent_6_model=job.agent_6_model,
                blackboard=job.blackboard,
                business_data=job.business_data,
                job_id=job.job_id,
                project_id=job.project_id,
                style_preferences=job.style_preferences,
                user_plan=job.user_plan,
            )
            if candidate.status != "ready" or not candidate.payload:
                payload = candidate.to_dict()
                job.blackboard["training_example"] = payload
                await progress(
                    "training_data",
                    "training_data",
                    f"Training example storage skipped: {candidate.reason}.",
                    {"phase": "phase_22_training_data", "training_example": payload},
                )
                return

            result = await insert_training_example(
                consent_version=str(training_consent.get("consent_version") or "unknown"),
                example_payload=candidate.payload,
                project_id=job.project_id,
                settings=settings,
                user_id=job.user_id,
            )
            payload = {**candidate.to_dict(), **result.to_dict()}
            job.blackboard["training_example"] = payload
            await progress(
                "training_data",
                "training_data",
                (
                    "Stored QA-approved redacted training example."
                    if result.status == "stored"
                    else f"Training example storage skipped: {result.status}."
                ),
                {"phase": "phase_22_training_data", "training_example": payload},
            )
        except Exception as exc:
            payload = {
                "error": str(exc)[:500],
                "status": "failed",
            }
            job.blackboard["training_example"] = payload
            await progress(
                "deployment_warning",
                "training_data",
                "Training example storage failed; continuing because site deployment is already complete.",
                {"phase": "phase_22_training_data", "training_example": payload},
            )

    async def _record_pipeline_error(
        self,
        job: PipelineJob,
        settings: Settings,
        exc: Exception,
        *,
        active_agent: str | None,
    ) -> None:
        from onara_pipeline.deployment import insert_pipeline_error

        try:
            result = await insert_pipeline_error(
                active_agent=active_agent,
                blackboard_snapshot=_blackboard_error_snapshot(job),
                error_message=str(exc),
                error_type=type(exc).__name__,
                job_id=job.job_id,
                project_id=job.project_id,
                settings=settings,
                user_id=job.user_id,
            )
            job.blackboard["pipeline_error_log"] = result.to_dict()
        except Exception as log_error:
            job.blackboard["pipeline_error_log"] = {
                "error": str(log_error)[:500],
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
                "blackboard_notice",
                None,
                str(ai_review.get("notice") or ai_review.get("summary") or "AI build note completed."),
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

    async def _claim_next_job(self, settings: Settings) -> PipelineJob | None:
        while True:
            async with self._lock:
                if not self._queued_job_ids:
                    return None

                job_id = self._queued_job_ids.pop(0)
                job = self._jobs[job_id]

            if job.pipeline_version == "v2":
                try:
                    claim = await self._store(settings).claim(
                        job_id=job.job_id,
                        worker_id=self._effective_worker_id(settings),
                    )
                except DurableJobStoreError:
                    await self._requeue_durable_job(job.job_id)
                    await asyncio.sleep(2)
                    continue
                if not claim:
                    try:
                        row = await self._store(settings).get(job.job_id)
                    except DurableJobStoreError:
                        await self._requeue_durable_job(job.job_id)
                        await asyncio.sleep(2)
                        continue
                    if row and str(row.get("status") or "") in {"queued", "running"}:
                        await self._requeue_durable_job(job.job_id)
                        await asyncio.sleep(_lease_retry_delay(row.get("lease_expires_at")))
                    elif row:
                        async with self._lock:
                            job.status = (
                                "completed"
                                if str(row.get("status")) in {"done", "completed"}
                                else "failed"
                            )
                            job.stage = str(row.get("stage") or job.stage)
                            job.error_message = _optional_string(row.get("error_message"))
                    continue
                job.attempt = int(claim.row.get("attempt") or job.attempt + 1)
                job.stage = str(claim.row.get("stage") or "normalizing")

            async with self._lock:
                job.status = "running"
                job.updated_at = datetime.now(timezone.utc)
                job.progress_log.append(
                    {
                        "event": "pipeline_started",
                        "message": (
                            "Pipeline V2 durable worker started."
                            if job.pipeline_version == "v2"
                            else "Phase 18-21 worker started."
                        ),
                        "stage": job.stage,
                        "timestamp": job.updated_at.isoformat(),
                    }
                )
            return job

    async def _requeue_durable_job(self, job_id: str) -> None:
        async with self._lock:
            if job_id in self._jobs and job_id not in self._queued_job_ids:
                self._queued_job_ids.append(job_id)

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
        durable_payload: dict[str, Any] | None = None
        async with self._lock:
            job = self._jobs.get(job_id)
            if not job:
                return

            now = datetime.now(timezone.utc)
            if event in {"agent_started", "stage_started"}:
                job.current_agent = agent_id
            elif event in {"agent_completed", "stage_completed"}:
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
                if isinstance(extra.get("stage"), str):
                    job.stage = str(extra["stage"])
                if isinstance(extra.get("eta_seconds"), int):
                    job.eta_seconds = max(0, int(extra["eta_seconds"]))
                if isinstance(extra.get("candidate"), dict):
                    _merge_candidate_summary(job, extra["candidate"])
            job.progress_log.append(entry)
            job.event_sequence += 1
            durable_payload = {
                "agent_id": agent_id,
                "event": event,
                "job_id": job_id,
                "message": message,
                "payload": _durable_event_payload(extra or {}),
                "sequence": job.event_sequence,
                "stage": job.stage,
            }

        if job.pipeline_version == "v2" and self._settings and durable_payload:
            store = self._store(self._settings)
            await store.append_event(**durable_payload)
            await store.update(
                job_id,
                fields={
                    "agents_completed": job.agents_completed,
                    "agents_total": job.agents_total,
                    "eta_seconds": job.eta_seconds,
                    "phase": _legacy_phase_for_stage(job.stage),
                    "stage": job.stage,
                    "stage_state": _stage_state_snapshot(job),
                },
            )

    async def _mark_completed(self, job_id: str) -> None:
        async with self._lock:
            job = self._jobs[job_id]
            now = datetime.now(timezone.utc)
            job.status = "completed"
            job.stage = "completed"
            job.eta_seconds = 0
            job.agents_completed = job.agents_total
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
        if job.pipeline_version == "v2" and self._settings:
            await self._store(self._settings).update(
                job_id,
                fields={
                    "agents_completed": job.agents_total,
                    "completed_at": now.isoformat(),
                    "duration_ms": _generation_ms(job),
                    "eta_seconds": 0,
                    "lease_expires_at": None,
                    "lease_owner": None,
                    "result_summary": {
                        "degraded_services": job.blackboard.get("degraded_services", []),
                        "fallback_used": bool(job.blackboard.get("fallback_used")),
                        "public_url": job.blackboard.get("public_url"),
                        "quality_badges": job.blackboard.get("quality_badges", []),
                        "quality_mode": job.blackboard.get("quality_mode"),
                        "selected_candidate_id": job.blackboard.get("selected_candidate_id"),
                    },
                    "stage": "completed",
                    "status": "completed",
                },
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
        if job.pipeline_version == "v2" and self._settings:
            await self._store(self._settings).update(
                job_id,
                fields={
                    "error_agent": _legacy_phase_for_stage(job.stage),
                    "error_message": str(exc)[:4000],
                    "lease_expires_at": None,
                    "lease_owner": None,
                    "stage": "failed",
                    "status": "failed",
                },
            )

    def _store(self, settings: Settings):
        from onara_pipeline.durable_jobs import DurableJobStore

        if self._durable_store is None or self._durable_store.settings is not settings:
            self._durable_store = DurableJobStore(settings)
        self._durable_store.require_enabled()
        return self._durable_store

    async def _recover_durable_jobs(self, settings: Settings) -> None:
        rows = await self._store(settings).recoverable()
        for row in rows:
            if int(row.get("attempt") or 0) >= settings.pipeline_v2_max_attempts:
                await self._store(settings).update(
                    str(row["id"]),
                    fields={
                        "error_message": "Pipeline V2 exhausted its durable retry attempts",
                        "stage": "failed",
                        "status": "failed",
                    },
                )
                continue
            await self._hydrate_durable_job(row, settings, enqueue=True)

    async def _hydrate_durable_job(
        self,
        row: dict[str, Any],
        settings: Settings,
        *,
        enqueue: bool = False,
    ) -> PipelineJob:
        job_id = str(row.get("id") or "")
        async with self._lock:
            existing = self._jobs.get(job_id)
            if existing:
                if enqueue and existing.status in {"queued", "running"} and job_id not in self._queued_job_ids:
                    self._queued_job_ids.append(job_id)
                return existing

        payload = row.get("request_payload") if isinstance(row.get("request_payload"), dict) else {}
        events = await self._store(settings).events(job_id)
        candidate_rows = await self._store(settings).candidates(job_id)
        progress_log = []
        completed_agent_ids: set[str] = set()
        event_sequence = 0
        for event in events:
            extra = event.get("payload") if isinstance(event.get("payload"), dict) else {}
            event_sequence = max(event_sequence, int(event.get("sequence") or 0))
            if event.get("event") in {"agent_completed", "stage_completed"} and event.get("agent_id"):
                completed_agent_ids.add(str(event["agent_id"]))
            progress_log.append(
                {
                    "agent_id": event.get("agent_id"),
                    "event": event.get("event"),
                    "message": event.get("message"),
                    "timestamp": event.get("created_at"),
                    **extra,
                }
            )
        status = str(row.get("status") or "queued")
        normalized_status: JobStatus = "completed" if status in {"done", "completed"} else status  # type: ignore[assignment]
        job = PipelineJob(
            agent_6_model=_optional_string(payload.get("agent_6_model")),
            agents_completed=int(row.get("agents_completed") or 0),
            agents_total=int(row.get("agents_total") or 7),
            attempt=int(row.get("attempt") or 0),
            business_data=payload.get("business_data") if isinstance(payload.get("business_data"), dict) else {},
            created_at=_parse_datetime(row.get("created_at") or row.get("queued_at")),
            error_message=_optional_string(row.get("error_message")),
            eta_seconds=_optional_int(row.get("eta_seconds")),
            event_sequence=event_sequence,
            is_trial=bool(payload.get("is_trial")),
            job_id=job_id,
            pipeline_version="v2",
            progress_log=progress_log,
            project_id=str(row.get("project_id") or payload.get("project_id") or ""),
            request_signature=str(row.get("request_signature") or ""),
            stage=str(row.get("stage") or "queued"),
            status=normalized_status,
            style_preferences=payload.get("style_preferences")
            if isinstance(payload.get("style_preferences"), dict)
            else {},
            updated_at=_parse_datetime(row.get("updated_at")),
            user_id=str(row.get("user_id") or payload.get("user_id") or ""),
            user_plan=str(payload.get("user_plan") or "free"),
        )
        job.completed_agent_ids = completed_agent_ids
        stage_state = row.get("stage_state") if isinstance(row.get("stage_state"), dict) else {}
        checkpoint = stage_state.get("blackboard") if isinstance(stage_state.get("blackboard"), dict) else {}
        job.blackboard.update(checkpoint)
        job.blackboard["recovered_candidate_rows"] = candidate_rows
        job.blackboard["candidate_summaries"] = [
            {
                "candidateKey": row.get("candidate_key"),
                "degradedReason": (
                    row.get("render_report", {}).get("degraded_reason")
                    if isinstance(row.get("render_report"), dict)
                    else None
                ),
                "deterministicScore": row.get("deterministic_score"),
                "fallbackUsed": row.get("fallback_used"),
                "finalScore": row.get("final_score"),
                "hardBlockers": row.get("hard_blockers") or [],
                "model": row.get("model"),
                "provider": row.get("provider"),
                "qualityMode": (
                    row.get("render_report", {}).get("mode")
                    if isinstance(row.get("render_report"), dict)
                    else None
                ),
                "recipe": row.get("recipe"),
                "selected": row.get("status") == "selected",
                "visualScore": row.get("visual_score"),
                "warnings": row.get("warnings") or [],
            }
            for row in candidate_rows
        ]
        result_summary = row.get("result_summary") if isinstance(row.get("result_summary"), dict) else {}
        job.blackboard.update(
            {
                "fallback_used": result_summary.get("fallback_used"),
                "degraded_services": result_summary.get("degraded_services", []),
                "public_url": result_summary.get("public_url"),
                "quality_badges": result_summary.get("quality_badges", []),
                "quality_mode": result_summary.get("quality_mode"),
                "selected_candidate_id": result_summary.get("selected_candidate_id"),
            }
        )
        async with self._lock:
            self._jobs[job.job_id] = job
            self._project_to_job_id[job.project_id] = job.job_id
            if enqueue and job.status in {"queued", "running"} and job.job_id not in self._queued_job_ids:
                self._queued_job_ids.append(job.job_id)
        return job

    async def _heartbeat_loop(self, job: PipelineJob, settings: Settings) -> None:
        interval = max(5, settings.pipeline_v2_lease_seconds // 4)
        while True:
            await asyncio.sleep(interval)
            try:
                alive = await self._store(settings).heartbeat(
                    job_id=job.job_id,
                    worker_id=self._effective_worker_id(settings),
                )
            except Exception:
                continue
            if not alive:
                return

    async def _persist_candidate(self, job: PipelineJob, candidate: Any, settings: Settings) -> None:
        if job.pipeline_version != "v2":
            return
        browser = candidate.browser.model_dump(
            exclude={"mobile_thumbnail_data_url", "thumbnail_data_url"}
        )
        status = (
            "selected"
            if candidate.selected
            else "rejected"
            if candidate.hard_blockers
            else "eligible"
            if candidate.final_score >= settings.pipeline_v2_min_score
            else "validating"
        )
        await self._store(settings).upsert_candidate(
            candidate_key=candidate.key,
            job_id=job.job_id,
            payload={
                "artifact_html": candidate.html,
                "deterministic_score": candidate.deterministic_score,
                "error_message": "; ".join(candidate.hard_blockers[:6]) or None,
                "fallback_used": candidate.fallback_used or candidate.used_fallback_template,
                "final_score": candidate.final_score,
                "fingerprint": candidate.fingerprint,
                "hard_blockers": candidate.hard_blockers,
                "model": candidate.model,
                "provider": candidate.provider,
                "recipe": candidate.recipe,
                "render_report": browser,
                "screenshot_hash": candidate.browser.screenshot_hash,
                "status": status,
                "visual_score": candidate.visual_score,
                "warnings": candidate.warnings,
            },
        )

    def _effective_worker_id(self, settings: Settings) -> str:
        return settings.pipeline_v2_worker_id or self._worker_id

    @staticmethod
    def _consume_worker_exception(task: asyncio.Task[None]) -> None:
        try:
            task.result()
        except Exception:
            pass


AGENT_PHASE_BY_ID = {
    "agent_01_analyst": "analyst",
    "analyst": "analyst",
    "photo_resolver": "analyst",
    "agent_02_content": "content_writer",
    "content_writer": "content_writer",
    "agent_03_style": "style_agent",
    "style_agent": "style_agent",
    "agent_04_planner": "planner",
    "planner": "planner",
    "agent_05_prompt_engineer": "prompt_engineer",
    "prompt_engineer": "prompt_engineer",
    "agent_06_codegen": "code_generator",
    "code_generator": "code_generator",
    "agent_07_debugger": "debugger",
    "debugger": "debugger",
    "agent_08_seo": "seo_agent",
    "seo_agent": "seo_agent",
    "agent_09_qa": "qa_agent",
    "qa_agent": "qa_agent",
    "agent_10_mobile": "mobile_agent",
    "mobile_agent": "mobile_agent",
    "deployment_parser": "deploying",
    "github": "deploying",
    "cloudflare": "deploying",
    "supabase": "deploying",
    "rag_learning": "deploying",
    "training_data": "deploying",
    "deploying": "deploying",
}
LARGE_BLACKBOARD_KEYS = {
    "component_files",
    "debugged_html",
    "deployment_files",
    "final_html",
    "generated_html",
    "mobile_html",
    "raw_code",
    "raw_debugger_output",
    "raw_mobile_output",
    "raw_seo_output",
    "seo_html",
    "training_example",
}
MAX_SNAPSHOT_VALUE_CHARS = 3000


def _agent_phase_for_error(job: PipelineJob) -> str | None:
    candidates = [job.current_agent]
    candidates.extend(
        str(entry.get("agent_id"))
        for entry in reversed(job.progress_log[-10:])
        if isinstance(entry, dict) and entry.get("agent_id")
    )

    for candidate in candidates:
        if not candidate:
            continue
        phase = AGENT_PHASE_BY_ID.get(str(candidate))
        if phase:
            return phase
    return None


def _blackboard_error_snapshot(job: PipelineJob) -> dict[str, Any]:
    snapshot: dict[str, Any] = {
        "available_keys": sorted(job.blackboard.keys()),
        "business": _safe_business_snapshot(job.business_data),
        "omitted_large_fields": {},
        "progress_log_tail": job.progress_log[-8:],
        "style_preferences": _truncate_snapshot_value(job.style_preferences),
    }

    for key in sorted(job.blackboard.keys()):
        value = job.blackboard[key]
        if key in LARGE_BLACKBOARD_KEYS:
            snapshot["omitted_large_fields"][key] = _large_value_summary(value)
            continue
        snapshot[key] = _truncate_snapshot_value(value)

    return snapshot


def _safe_business_snapshot(business_data: dict[str, Any]) -> dict[str, Any]:
    allowed_keys = (
        "category",
        "manual_entry",
        "name",
        "place_id",
        "review_count",
        "service_area",
        "services",
    )
    return {key: business_data.get(key) for key in allowed_keys if key in business_data}


def _large_value_summary(value: Any) -> dict[str, Any]:
    if isinstance(value, str):
        return {"chars": len(value), "type": "str"}
    if isinstance(value, dict):
        return {"items": len(value), "type": "dict"}
    if isinstance(value, list):
        return {"items": len(value), "type": "list"}
    return {"type": type(value).__name__}


def _truncate_snapshot_value(value: Any) -> Any:
    if isinstance(value, str):
        if len(value) <= MAX_SNAPSHOT_VALUE_CHARS:
            return value
        return f"{value[:MAX_SNAPSHOT_VALUE_CHARS]}...[truncated {len(value) - MAX_SNAPSHOT_VALUE_CHARS} chars]"
    if isinstance(value, dict):
        return {
            str(key): _truncate_snapshot_value(item)
            for key, item in list(value.items())[:40]
            if str(key) not in LARGE_BLACKBOARD_KEYS
        }
    if isinstance(value, list):
        return [_truncate_snapshot_value(item) for item in value[:20]]
    if value is None or isinstance(value, (bool, int, float)):
        return value
    return str(value)[:MAX_SNAPSHOT_VALUE_CHARS]


def request_signature(request: GenerateRequest) -> str:
    """Identify jobs that are truly identical for queue dedupe."""
    canonical = json.dumps(
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
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


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


def _parse_datetime(value: Any) -> datetime:
    if isinstance(value, datetime):
        return value
    if isinstance(value, str) and value:
        try:
            return datetime.fromisoformat(value.replace("Z", "+00:00"))
        except ValueError:
            pass
    return datetime.now(timezone.utc)


def _lease_retry_delay(value: Any) -> float:
    remaining = (_parse_datetime(value) - datetime.now(timezone.utc)).total_seconds()
    return max(0.25, min(5.0, remaining if remaining > 0 else 0.25))


def _optional_string(value: Any) -> str | None:
    if value in (None, ""):
        return None
    return str(value)


def _optional_int(value: Any) -> int | None:
    try:
        return int(value) if value not in (None, "") else None
    except (TypeError, ValueError):
        return None


def _legacy_phase_for_stage(stage: str) -> str:
    return {
        "queued": "analyst",
        "normalizing": "analyst",
        "understanding_business": "analyst",
        "writing_content": "content_writer",
        "designing_concepts": "planner",
        "building_candidates": "code_generator",
        "testing_candidates": "qa_agent",
        "polishing": "mobile_agent",
        "publishing": "deploying",
        "completed": "deploying",
        "failed": "deploying",
    }.get(stage, "analyst")


def _stage_state_snapshot(job: PipelineJob) -> dict[str, Any]:
    checkpoint_keys = (
        "analyst_output",
        "content_output",
        "style_output",
        "planner_output",
        "prompt_output",
        "prompt_b_output",
        "selected_candidate_id",
        "quality_mode",
        "degraded_services",
        "quality_badges",
    )
    checkpoint = {
        key: job.blackboard[key]
        for key in checkpoint_keys
        if key in job.blackboard
    }
    return {
        "blackboard": checkpoint,
        "completed_stage_ids": sorted(job.completed_agent_ids),
        "current_stage": job.stage,
        "eta_seconds": job.eta_seconds,
        "quality_badges": job.blackboard.get("quality_badges", []),
        "selected_candidate_id": job.blackboard.get("selected_candidate_id"),
    }


def _durable_event_payload(payload: dict[str, Any]) -> dict[str, Any]:
    """Persist recovery metadata without storing large screenshot data URLs."""
    sanitized = dict(payload)
    candidate = sanitized.get("candidate")
    if isinstance(candidate, dict) and "thumbnailDataUrl" in candidate:
        sanitized["candidate"] = {
            key: value
            for key, value in candidate.items()
            if key != "thumbnailDataUrl"
        }
    return sanitized


def _merge_candidate_summary(job: PipelineJob, candidate: dict[str, Any]) -> None:
    candidate_key = candidate.get("candidateKey")
    if not candidate_key:
        return
    summaries = job.blackboard.get("candidate_summaries")
    current = [item for item in summaries if isinstance(item, dict)] if isinstance(summaries, list) else []
    merged = []
    replaced = False
    for item in current:
        if item.get("candidateKey") == candidate_key:
            merged.append({**item, **candidate})
            replaced = True
        else:
            merged.append(item)
    if not replaced:
        merged.append(candidate)
    job.blackboard["candidate_summaries"] = sorted(
        merged,
        key=lambda item: str(item.get("candidateKey") or ""),
    )
