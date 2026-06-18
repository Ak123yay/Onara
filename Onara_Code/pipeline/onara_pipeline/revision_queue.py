import asyncio
import json
import re
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Literal
from uuid import uuid4

import httpx
from pydantic import ValidationError

from onara_pipeline.agents.contracts import ComponentSpec, PlannerOutput
from onara_pipeline.ai_client import AIClientError, AIMessage, AIRequest, build_ai_client, get_agent_model_route
from onara_pipeline.config import Settings
from onara_pipeline.deployment import (
    GitHubDeploymentError,
    build_deployment_artifact,
    commit_deployment_files,
    consume_revision_credit,
    deploy_to_cloudflare_pages,
    extract_final_html,
    fetch_site_files,
    lead_capture_endpoint,
    site_path_prefix,
    update_revision_record,
    upsert_project_record,
)
from onara_pipeline.schemas import RevisionStartRequest, RevisionStatusResponse

RevisionJobStatus = Literal["queued", "running", "completed", "failed"]

REVISION_SYSTEM_PROMPT = """You are Onara's revision agent.

Patch the existing generated website according to the owner's instruction.

Rules:
- Return one complete self-contained index.html document only.
- Preserve the Onara design language: warm paper background, Fraunces-like expressive serif headings, crisp low-radius panels, mono labels, and practical local CTAs.
- Keep unrelated sections and copy as unchanged as possible.
- Change only the affected components plus shared CSS when needed.
- Do not invent credentials, licenses, insurance claims, awards, testimonials, or guarantees.
- If no license or credential data is supplied, remove license-proof claims instead of showing placeholders or internal notes.
- Keep Google rating/review counts factual if supplied.
- Keep all CSS inside <style> in <head>.
- Do not add external JavaScript, frameworks, tracking scripts, unsafe URLs, or script tags except application/ld+json structured data.
- Preserve lightweight animations using transform and opacity only.
- Keep responsive behavior and mobile readability.
- Make the requested change visible and useful.
"""


@dataclass(slots=True)
class RevisionJob:
    business_data: dict[str, Any]
    cloudflare_project_name: str | None
    component_selection: list[str]
    github_path: str | None
    instruction: str
    is_trial: bool
    job_id: str
    parent_revision_id: str | None
    project_id: str
    public_url: str | None
    revision_kind: Literal["edit", "rollback"]
    revision_id: str
    source_files: dict[str, str] | None
    source_public_url: str | None
    style_preferences: dict[str, Any]
    user_id: str
    user_plan: str
    affected_components: list[str] = field(default_factory=list)
    after_files: dict[str, str] | None = None
    agent_summary: str | None = None
    before_files: dict[str, str] | None = None
    before_public_url: str | None = None
    changed_files: list[dict[str, Any]] = field(default_factory=list)
    cloudflare_deployment_url: str | None = None
    current_step: str | None = None
    error_message: str | None = None
    github_commit_sha: str | None = None
    progress_log: list[dict[str, Any]] = field(default_factory=list)
    result_public_url: str | None = None
    status: RevisionJobStatus = "queued"
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))


class RevisionQueue:
    def __init__(self) -> None:
        self._lock = asyncio.Lock()
        self._jobs: dict[str, RevisionJob] = {}
        self._queued_job_ids: list[str] = []
        self._worker_tasks: set[asyncio.Task[None]] = set()

    async def enqueue(self, request: RevisionStartRequest) -> RevisionJob:
        async with self._lock:
            job = RevisionJob(
                business_data=request.business_data,
                cloudflare_project_name=request.cloudflare_project_name,
                component_selection=request.component_selection,
                github_path=request.github_path,
                instruction=request.instruction,
                is_trial=request.is_trial,
                job_id=str(uuid4()),
                parent_revision_id=request.parent_revision_id,
                project_id=request.project_id,
                public_url=request.public_url,
                revision_kind=request.revision_kind,
                revision_id=request.revision_id,
                source_files=request.source_files,
                source_public_url=request.source_public_url,
                style_preferences=request.style_preferences,
                user_id=request.user_id,
                user_plan=request.user_plan,
            )
            self._jobs[job.job_id] = job
            self._queued_job_ids.append(job.job_id)
            return job

    async def start_workers(self, settings: Settings) -> None:
        async with self._lock:
            self._worker_tasks = {task for task in self._worker_tasks if not task.done()}
            target_workers = max(1, settings.pipeline_max_concurrency)

            while self._queued_job_ids and len(self._worker_tasks) < target_workers:
                task = asyncio.create_task(self._worker_loop(settings))
                task.add_done_callback(self._consume_worker_exception)
                self._worker_tasks.add(task)

    async def get(self, job_id: str) -> RevisionJob | None:
        async with self._lock:
            return self._jobs.get(job_id)

    async def position(self, job_id: str) -> int | None:
        async with self._lock:
            if job_id not in self._queued_job_ids:
                return None
            return self._queued_job_ids.index(job_id) + 1

    async def status(self, job_id: str) -> RevisionStatusResponse | None:
        job = await self.get(job_id)
        if not job:
            return None

        return RevisionStatusResponse(
            affected_components=job.affected_components,
            agent_summary=job.agent_summary,
            before_public_url=job.before_public_url,
            changed_files=job.changed_files,
            cloudflare_deployment_url=job.cloudflare_deployment_url,
            created_at=job.created_at,
            current_step=job.current_step,
            error_message=job.error_message,
            github_commit_sha=job.github_commit_sha,
            job_id=job.job_id,
            progress_log=job.progress_log,
            public_url=job.result_public_url,
            result_public_url=job.result_public_url,
            revision_id=job.revision_id,
            revision_kind=job.revision_kind,
            status=job.status,
            updated_at=job.updated_at,
        )

    async def _worker_loop(self, settings: Settings) -> None:
        while True:
            job = await self._claim_next_job(settings)
            if not job:
                return

            try:
                await self._run_revision(job, settings)
                await self._mark_completed(job, settings)
            except Exception as exc:
                await self._mark_failed(job, settings, exc)

    async def _claim_next_job(self, settings: Settings) -> RevisionJob | None:
        async with self._lock:
            if not self._queued_job_ids:
                return None

            job_id = self._queued_job_ids.pop(0)
            job = self._jobs[job_id]
            job.status = "running"
            job.updated_at = datetime.now(timezone.utc)

        await self.record_progress(job, "revision_started", "Reading current site files")
        await self._sync_revision(job, settings, started_at=job.updated_at.isoformat())
        return job

    async def _run_revision(self, job: RevisionJob, settings: Settings) -> None:
        files, source = await self._load_source_files(job, settings)
        job.before_files = dict(files)
        job.before_public_url = job.public_url
        await self.record_progress(job, "revision_source_loaded", f"Loaded current site files from {source}.")

        current_html = files.get("index.html")
        if not current_html:
            raise RuntimeError("Current site source does not include index.html")

        await self.record_progress(job, "revision_planning", "Planning affected components")
        job.affected_components = selected_components_or_plan(job.component_selection, job.instruction, files)
        await self._sync_revision(job, settings)

        if job.revision_kind == "rollback":
            await self.record_progress(
                job,
                "revision_rollback",
                "Restoring the selected previous version",
                {"affected_components": job.affected_components},
            )
            updated_files = rollback_files(job)
            updated_html = updated_files.get("index.html") or ""
        else:
            await self.record_progress(
                job,
                "revision_patching",
                "Updating selected components and shared CSS",
                {"affected_components": job.affected_components},
            )
            updated_html = await generate_revised_html(job, settings, current_html, files)
            updated_files = {}

        hard_issues, warnings = revision_quality_review(updated_html, business_data=job.business_data)
        if hard_issues:
            if job.revision_kind == "rollback":
                raise RuntimeError("; ".join(hard_issues))
            await self.record_progress(
                job,
                "revision_repair",
                "Repairing hard revision blockers",
                {"blocking_issues": hard_issues},
            )
            updated_html = await generate_revised_html(job, settings, current_html, files, hard_issues=hard_issues)
            hard_issues, warnings = revision_quality_review(updated_html, business_data=job.business_data)

        for warning in warnings[:4]:
            await self.record_progress(job, "revision_warning", warning)

        if hard_issues:
            raise RuntimeError("; ".join(hard_issues))

        await self.record_progress(job, "revision_checking", "Checking safe HTML and deployment files")
        planner = planner_from_files(files, updated_html)
        if updated_files:
            artifact_files = normalize_deployment_files(updated_files)
            artifact_files["deployment-manifest.json"] = json.dumps(
                {
                    "business_name": str(job.business_data.get("name") or "Unknown Business"),
                    "component_order": component_ids_from_files(artifact_files),
                    "created_at": datetime.now(timezone.utc).isoformat(),
                    "file_paths": sorted(path for path in artifact_files if path != "deployment-manifest.json"),
                    "job_id": job.job_id,
                    "project_id": job.project_id,
                    "revision_kind": "rollback",
                    "user_id": job.user_id,
                },
                ensure_ascii=False,
                indent=2,
                sort_keys=True,
            )
        else:
            artifact = build_deployment_artifact(
                updated_html,
                business_data=job.business_data,
                job_id=job.job_id,
                lead_capture_endpoint=lead_capture_endpoint(
                    enabled=settings.feature_lead_email,
                    supabase_url=settings.supabase_url,
                ),
                planner=planner,
                project_id=job.project_id,
                user_id=job.user_id,
            )
            artifact_files = artifact.files
        job.after_files = dict(artifact_files)
        job.changed_files = summarize_changed_files(job.before_files or {}, artifact_files)
        job.agent_summary = summarize_revision(job)
        await self.record_progress(
            job,
            "revision_summary",
            job.agent_summary,
            {"changed_files": job.changed_files},
        )

        await self.record_progress(job, "revision_committing", "Committing updated site files")
        commit = await commit_deployment_files(
            business_name=str(job.business_data.get("name") or "Unknown Business"),
            files=artifact_files,
            job_id=job.job_id,
            project_id=job.project_id,
            settings=settings,
        )
        job.github_commit_sha = commit.commit_sha

        await self.record_progress(job, "revision_deploying", "Deploying revision")
        deployment = await deploy_to_cloudflare_pages(
            files=artifact_files,
            project_id=job.project_id,
            settings=settings,
        )
        job.cloudflare_deployment_url = deployment.deployment_url
        job.result_public_url = deployment.deployment_url

        await consume_revision_credit(settings=settings, user_id=job.user_id)
        charged_at = datetime.now(timezone.utc).isoformat()

        await upsert_project_record(
            business_data=job.business_data,
            cloudflare_project_name=deployment.project_name,
            current_agent="done",
            generation_ms=None,
            github_path=commit.path_prefix,
            pipeline_job_id=job.job_id,
            project_id=job.project_id,
            public_url=job.result_public_url,
            settings=settings,
            status="live",
            style_preferences=job.style_preferences,
            user_id=job.user_id,
        )
        await self._sync_revision(
            job,
            settings,
            charged_at=charged_at,
            completed_at=charged_at,
            status="done",
        )
        await self.record_progress(job, "revision_deployed", "Revision deployed")

    async def _load_source_files(self, job: RevisionJob, settings: Settings) -> tuple[dict[str, str], str]:
        try:
            result = await fetch_site_files(project_id=job.project_id, settings=settings)
            return result.files, "GitHub"
        except GitHubDeploymentError as exc:
            await self.record_progress(
                job,
                "revision_warning",
                f"GitHub source unavailable; falling back to deployed HTML. {exc}",
            )

        html = await fetch_deployed_html(job.public_url, settings=settings)
        return {"index.html": html}, "deployed HTML"

    async def record_progress(
        self,
        job: RevisionJob,
        event: str,
        message: str,
        extra: dict[str, Any] | None = None,
    ) -> None:
        async with self._lock:
            now = datetime.now(timezone.utc)
            job.current_step = message
            job.updated_at = now
            entry: dict[str, Any] = {
                "event": event,
                "message": message,
                "timestamp": now.isoformat(),
            }
            if extra:
                entry.update(extra)
            job.progress_log.append(entry)

    async def _sync_revision(
        self,
        job: RevisionJob,
        settings: Settings,
        *,
        charged_at: str | None = None,
        completed_at: str | None = None,
        started_at: str | None = None,
        status: str | None = None,
    ) -> None:
        await update_revision_record(
            revision_id=job.revision_id,
            settings=settings,
            status=status or ("done" if job.status == "completed" else job.status),
            user_id=job.user_id,
            affected_components=job.affected_components,
            after_files=job.after_files,
            agent_summary=job.agent_summary,
            before_files=job.before_files,
            before_public_url=job.before_public_url,
            charged_at=charged_at,
            changed_files=job.changed_files,
            cloudflare_deployment_url=job.cloudflare_deployment_url,
            component_selection=job.component_selection,
            completed_at=completed_at,
            error_message=job.error_message,
            github_commit_sha=job.github_commit_sha,
            pipeline_job_id=job.job_id,
            progress_log=job.progress_log,
            result_public_url=job.result_public_url,
            started_at=started_at,
        )

    async def _mark_completed(self, job: RevisionJob, settings: Settings) -> None:
        async with self._lock:
            now = datetime.now(timezone.utc)
            job.status = "completed"
            job.current_step = None
            job.updated_at = now
            job.progress_log.append(
                {
                    "event": "revision_completed",
                    "message": "Revision completed successfully.",
                    "timestamp": now.isoformat(),
                }
            )

        await self._sync_revision(job, settings, completed_at=job.updated_at.isoformat(), status="done")

    async def _mark_failed(self, job: RevisionJob, settings: Settings, exc: Exception) -> None:
        async with self._lock:
            now = datetime.now(timezone.utc)
            job.status = "failed"
            job.current_step = None
            job.error_message = str(exc)
            job.updated_at = now
            job.progress_log.append(
                {
                    "event": "revision_failed",
                    "message": str(exc),
                    "timestamp": now.isoformat(),
                }
            )

        await self._sync_revision(job, settings, completed_at=job.updated_at.isoformat(), status="failed")

    @staticmethod
    def _consume_worker_exception(task: asyncio.Task[None]) -> None:
        try:
            task.result()
        except Exception:
            pass


async def generate_revised_html(
    job: RevisionJob,
    settings: Settings,
    current_html: str,
    files: dict[str, str],
    *,
    hard_issues: list[str] | None = None,
) -> str:
    ai_client = build_ai_client(settings)
    route = get_agent_model_route(
        "agent_07_debugger",
        is_trial=job.is_trial,
        ollama_fallback_model=settings.ollama_fallback_model,
        ollama_primary_model=settings.ollama_primary_model,
        user_plan=job.user_plan,  # type: ignore[arg-type]
    )
    affected_snippets = affected_component_snippets(files, job.affected_components)
    blocking_text = "\n".join(f"- {issue}" for issue in hard_issues or [])
    prompt = f"""Owner revision request:
{job.instruction}

Business facts:
{json.dumps(job.business_data, ensure_ascii=False, indent=2, default=str)}

Style choices:
{json.dumps(job.style_preferences, ensure_ascii=False, indent=2, default=str)}

Affected components to patch:
{", ".join(job.affected_components) or "index"}

Affected component source snippets:
{affected_snippets}

Hard blockers to repair before deployment:
{blocking_text or "- none"}

Current full index.html:
{current_html[:70000]}
"""
    try:
        response = await ai_client.generate_text(
            route=route,
            request=AIRequest(
                max_tokens=16000,
                messages=[
                    AIMessage(role="system", content=REVISION_SYSTEM_PROMPT),
                    AIMessage(role="user", content=prompt),
                ],
                metadata={
                    "agent_id": "revision_agent",
                    "job_id": job.job_id,
                    "project_id": job.project_id,
                    "revision_id": job.revision_id,
                },
                temperature=0.14,
            ),
        )
    except AIClientError as exc:
        raise RuntimeError(f"Revision model failed: {exc}") from exc

    try:
        return extract_final_html(response.content)
    except (ValueError, ValidationError) as exc:
        raise RuntimeError(f"Revision model did not return deployable HTML: {exc}") from exc


def selected_components_or_plan(
    component_selection: list[str],
    instruction: str,
    files: dict[str, str],
) -> list[str]:
    available = set(component_ids_from_files(files))
    clean_selection = [
        component
        for component in dict.fromkeys(component_selection)
        if re.fullmatch(r"[a-z][a-z0-9_]*", component)
    ]
    if clean_selection:
        if not available:
            return clean_selection
        return [component for component in clean_selection if component in available or component == "shared_styles"] or clean_selection

    return select_affected_components(instruction, files)


def select_affected_components(instruction: str, files: dict[str, str]) -> list[str]:
    lower = instruction.lower()
    component_ids = component_ids_from_files(files)
    if not component_ids:
        return ["index"]

    broad_terms = ("whole site", "entire site", "redesign", "make it better", "overall", "everything")
    if any(term in lower for term in broad_terms):
        return component_ids

    keyword_map = {
        "contact": ("contact", "phone", "email", "form", "call"),
        "hero": ("hero", "headline", "cta", "above the fold", "top"),
        "reviews": ("review", "testimonial", "rating", "stars"),
        "service_area": ("area", "city", "local", "map", "nearby"),
        "services": ("service", "card", "menu", "offer"),
        "site_footer": ("footer", "bottom"),
        "site_header": ("header", "nav", "navigation", "logo"),
        "trust": ("trust", "proof", "credential", "license", "insurance"),
    }
    selected: list[str] = []
    for component_id in component_ids:
        direct_name = component_id.replace("_", " ")
        keywords = keyword_map.get(component_id, (direct_name,))
        if direct_name in lower or any(keyword in lower for keyword in keywords):
            selected.append(component_id)

    if "style" in lower or "color" in lower or "font" in lower or "spacing" in lower:
        selected.extend(["site_header", "hero", "services"])

    return sorted(dict.fromkeys(selected or ["hero", "services"]))


def rollback_files(job: RevisionJob) -> dict[str, str]:
    if not job.source_files:
        raise RuntimeError("Rollback snapshot is missing source files")

    files = normalize_deployment_files(job.source_files)
    if "index.html" not in files:
        raise RuntimeError("Rollback snapshot does not include index.html")
    return files


def normalize_deployment_files(files: dict[str, str]) -> dict[str, str]:
    normalized: dict[str, str] = {}
    for raw_path, content in files.items():
        path = str(raw_path).replace("\\", "/").strip("/")
        if not path or ".." in path.split("/"):
            continue
        if not isinstance(content, str):
            continue
        normalized[path] = content
    return normalized


def summarize_changed_files(before: dict[str, str], after: dict[str, str]) -> list[dict[str, Any]]:
    paths = sorted(set(before) | set(after))
    changes: list[dict[str, Any]] = []
    for path in paths:
        old = before.get(path)
        new = after.get(path)
        if old == new:
            continue
        if old is None:
            status = "added"
        elif new is None:
            status = "removed"
        else:
            status = "changed"
        changes.append(
            {
                "path": path,
                "status": status,
                "summary": file_change_summary(path, old, new),
            }
        )
    return changes


def file_change_summary(path: str, old: str | None, new: str | None) -> str:
    if old is None:
        return "Added as part of this revision."
    if new is None:
        return "Removed because it is no longer needed."
    if path == "index.html":
        return "Updated the assembled page HTML."
    if path.endswith(".metadata.json"):
        return "Updated component metadata generated from the revised HTML."
    if path.startswith("components/"):
        component = path.removeprefix("components/").removesuffix(".html").replace("_", " ")
        return f"Updated the {component} component."
    if path == "deployment-manifest.json":
        return "Updated deployment manifest metadata."
    return "Updated generated site artifact."


def summarize_revision(job: RevisionJob) -> str:
    changed = len(job.changed_files)
    components = ", ".join(component.replace("_", " ") for component in job.affected_components[:5])
    if job.revision_kind == "rollback":
        return f"Restored the previous deployed snapshot and changed {changed} file{'s' if changed != 1 else ''}."
    if components:
        return f"Applied the requested change to {components}; changed {changed} file{'s' if changed != 1 else ''}."
    return f"Applied the requested revision; changed {changed} file{'s' if changed != 1 else ''}."


def planner_from_files(files: dict[str, str], html: str) -> PlannerOutput:
    component_ids = component_ids_from_files(files)
    if not component_ids:
        component_ids = component_ids_from_html(html)
    if not component_ids:
        component_ids = ["hero", "services", "contact", "site_footer"]

    components = [
        ComponentSpec(
            content_mapping={},
            css_classes=["revision-component"],
            html_structure=(files.get(f"components/{component_id}.html") or f"Generated {component_id} section")[:500],
            id=component_id,
            interactive=None,
            order=index + 1,
            responsive_changes="Preserve responsive layout and mobile readability.",
            type=component_type(component_id),
        )
        for index, component_id in enumerate(component_ids)
    ]

    return PlannerOutput(
        component_order=component_ids,
        components=components,
        css_variables={"revision": "true"},
        special_notes="Synthetic planner generated from committed revision component files.",
    )


def revision_quality_review(html: str, *, business_data: dict[str, Any]) -> tuple[list[str], list[str]]:
    hard_issues: list[str] = []
    warnings: list[str] = []
    lower = html.lower()

    try:
        extract_final_html(html)
    except Exception as exc:
        hard_issues.append(f"Broken HTML document: {exc}")

    body_text = re.sub(r"<[^>]+>", " ", body_html(html), flags=re.DOTALL)
    if len(re.sub(r"\s+", "", body_text)) < 300:
        hard_issues.append("Missing meaningful body content")

    if re.search(r"\bjavascript\s*:", lower) or "data:text/html" in lower or "http://localhost" in lower:
        hard_issues.append("Unsafe URL found in generated HTML")
    if "/api/places/photo" in lower:
        hard_issues.append("Non-deployable internal photo URL found")

    for attrs in re.findall(r"<script\b([^>]*)>", html, flags=re.IGNORECASE):
        if "application/ld+json" not in attrs.lower():
            hard_issues.append("Unsafe script tag found")
            break

    if not has_supplied_credential(business_data) and re.search(
        r"\b(licensed|license number|license proof|insured|bonded|credential)\b",
        lower,
    ):
        hard_issues.append("Generated trust or license proof claims credentials that were not supplied")

    if "no review quotes supplied" in lower or "proof omitted" in lower or "pending owner input" in lower:
        hard_issues.append("Internal placeholder or instruction text leaked into the page")

    if "aria-label" not in lower:
        warnings.append("Accessibility warning: page has few explicit aria labels.")
    if "@media" not in lower:
        warnings.append("Responsive warning: page has no visible media query.")
    if "prefers-reduced-motion" not in lower:
        warnings.append("Motion warning: prefers-reduced-motion rule was not found.")

    return hard_issues, warnings


async def fetch_deployed_html(public_url: str | None, *, settings: Settings) -> str:
    if not public_url:
        raise RuntimeError("No public URL is available for deployed HTML fallback")
    try:
        url = public_url if public_url.startswith("http") else f"{settings.app_url.rstrip('/')}/{public_url.lstrip('/')}"
        async with httpx.AsyncClient(timeout=min(settings.ai_request_timeout, 30.0), follow_redirects=True) as client:
            response = await client.get(url)
        response.raise_for_status()
    except httpx.HTTPError as exc:
        raise RuntimeError(f"Could not fetch deployed HTML fallback: {exc}") from exc

    html = response.text
    extract_final_html(html)
    return html


def affected_component_snippets(files: dict[str, str], affected: list[str]) -> str:
    snippets: list[str] = []
    for component_id in affected:
        path = f"components/{component_id}.html"
        content = files.get(path)
        if content:
            snippets.append(f"--- {path} ---\n{content[:5000]}")
    return "\n\n".join(snippets) or "No atomic component snippets were available."


def component_ids_from_files(files: dict[str, str]) -> list[str]:
    ids: list[str] = []
    for path in sorted(files):
        match = re.fullmatch(r"components/([a-z][a-z0-9_]*)\.html", path)
        if match:
            ids.append(match.group(1))
    return ids


def component_ids_from_html(html: str) -> list[str]:
    return sorted(dict.fromkeys(re.findall(r'data-component=["\']([a-z][a-z0-9_]*)["\']', html)))


def component_type(component_id: str) -> Literal["section", "header", "footer", "nav"]:
    if "header" in component_id:
        return "header"
    if "footer" in component_id:
        return "footer"
    if component_id == "nav":
        return "nav"
    return "section"


def body_html(html: str) -> str:
    match = re.search(r"<body\b[^>]*>(?P<body>.*?)</body>", html, flags=re.IGNORECASE | re.DOTALL)
    return match.group("body") if match else ""


def has_supplied_credential(business_data: dict[str, Any]) -> bool:
    credential_keys = (
        "credential",
        "credentials",
        "license",
        "license_number",
        "licenseNumber",
        "insurance",
        "insured",
        "bonded",
    )
    return any(bool(business_data.get(key)) for key in credential_keys)
