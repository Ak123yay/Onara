import asyncio
import os
import re
import shutil
import tempfile
from collections.abc import Awaitable, Callable
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import httpx

from onara_pipeline.config import Settings
from onara_pipeline.deployment.github import normalize_artifact_path

CommandRunner = Callable[[list[str], dict[str, str], Path], Awaitable["CommandResult"]]


class CloudflarePagesDeploymentError(RuntimeError):
    pass


@dataclass(frozen=True, slots=True)
class CommandResult:
    returncode: int
    stderr: str
    stdout: str


@dataclass(frozen=True, slots=True)
class CloudflarePagesDeploymentResult:
    deployment_url: str
    file_count: int
    project_name: str
    project_url: str
    public_files: tuple[str, ...]
    wrangler_output: str

    def to_dict(self) -> dict[str, Any]:
        return {
            "deployment_url": self.deployment_url,
            "file_count": self.file_count,
            "project_name": self.project_name,
            "project_url": self.project_url,
            "public_files": list(self.public_files),
            "wrangler_output": self.wrangler_output[-4000:],
        }


class CloudflarePagesClient:
    def __init__(
        self,
        *,
        account_id: str,
        api_token: str,
        api_url: str,
        branch: str,
        project_prefix: str,
        timeout: float = 60.0,
        wrangler_command: str = "npx wrangler",
        command_runner: CommandRunner | None = None,
        http_client: httpx.AsyncClient | None = None,
    ) -> None:
        self.account_id = account_id
        self.api_token = api_token
        self.api_url = api_url.rstrip("/")
        self.branch = branch
        self.project_prefix = project_prefix
        self.timeout = timeout
        self.wrangler_command = wrangler_command
        self._command_runner = command_runner or _run_command
        self._http_client = http_client

    async def deploy_files(
        self,
        *,
        files: dict[str, str],
        project_id: str,
    ) -> CloudflarePagesDeploymentResult:
        public_files = public_files_for_cloudflare(files)
        if not public_files:
            raise CloudflarePagesDeploymentError("No public files were available for Cloudflare Pages deployment")

        project_name = cloudflare_project_name(project_id, prefix=self.project_prefix)
        project = await self.ensure_project(project_name)
        project_url = _project_url(project, project_name)

        with tempfile.TemporaryDirectory(prefix="onara-pages-") as temp_dir:
            output_dir = Path(temp_dir)
            _write_public_files(output_dir, public_files)
            command = [
                *_wrangler_command_parts(self.wrangler_command),
                "pages",
                "deploy",
                str(output_dir),
                f"--project-name={project_name}",
                f"--branch={self.branch}",
            ]
            result = await self._command_runner(command, self._wrangler_env(), output_dir)

        combined_output = "\n".join(part for part in (result.stdout, result.stderr) if part)
        if result.returncode != 0:
            raise CloudflarePagesDeploymentError(
                f"Wrangler Pages deploy failed with exit code {result.returncode}: {combined_output[-4000:]}"
            )

        deployment_url = _deployment_url(combined_output, project_url)
        return CloudflarePagesDeploymentResult(
            deployment_url=deployment_url,
            file_count=len(public_files),
            project_name=project_name,
            project_url=project_url,
            public_files=tuple(sorted(public_files.keys())),
            wrangler_output=combined_output,
        )

    async def ensure_project(self, project_name: str) -> dict[str, Any]:
        close_client = self._http_client is None
        client = self._http_client or httpx.AsyncClient(base_url=self.api_url, timeout=self.timeout)

        try:
            existing = await self._request_json(
                client,
                "GET",
                f"/accounts/{self.account_id}/pages/projects/{project_name}",
                allow_not_found=True,
            )
            if existing is not None:
                return existing

            return await self._request_json(
                client,
                "POST",
                f"/accounts/{self.account_id}/pages/projects",
                json={
                    "name": project_name,
                    "production_branch": self.branch,
                },
            )
        finally:
            if close_client:
                await client.aclose()

    async def _request_json(
        self,
        client: httpx.AsyncClient,
        method: str,
        path: str,
        *,
        allow_not_found: bool = False,
        json: dict[str, Any] | None = None,
    ) -> dict[str, Any] | None:
        try:
            response = await client.request(
                method,
                path,
                headers={
                    "Authorization": f"Bearer {self.api_token}",
                    "Content-Type": "application/json",
                },
                json=json,
            )
        except httpx.HTTPError as exc:
            raise CloudflarePagesDeploymentError(f"Cloudflare API request failed: {exc}") from exc

        if allow_not_found and response.status_code == 404:
            return None
        if response.status_code >= 400:
            raise CloudflarePagesDeploymentError(_cloudflare_error_message(response))

        try:
            payload = response.json()
        except ValueError as exc:
            raise CloudflarePagesDeploymentError("Cloudflare API returned non-JSON response") from exc

        if not isinstance(payload, dict) or payload.get("success") is False:
            raise CloudflarePagesDeploymentError(f"Cloudflare API returned an unsuccessful response: {payload}")

        result = payload.get("result")
        return result if isinstance(result, dict) else {}

    def _wrangler_env(self) -> dict[str, str]:
        env = dict(os.environ)
        env["CLOUDFLARE_ACCOUNT_ID"] = self.account_id
        env["CLOUDFLARE_API_TOKEN"] = self.api_token
        env["CI"] = "1"
        return env


async def deploy_to_cloudflare_pages(
    *,
    files: dict[str, str],
    project_id: str,
    settings: Settings,
) -> CloudflarePagesDeploymentResult:
    missing = missing_cloudflare_settings(settings)
    if missing:
        raise CloudflarePagesDeploymentError(f"Missing Cloudflare deployment settings: {', '.join(missing)}")

    client = CloudflarePagesClient(
        account_id=str(settings.cloudflare_account_id),
        api_token=str(settings.cloudflare_api_token),
        api_url=settings.cloudflare_api_url,
        branch=settings.cloudflare_pages_branch,
        project_prefix=settings.cloudflare_pages_project_prefix,
        timeout=settings.ai_request_timeout,
        wrangler_command=settings.cloudflare_wrangler_command,
    )
    return await client.deploy_files(files=files, project_id=project_id)


def missing_cloudflare_settings(settings: Settings) -> list[str]:
    values = {
        "CLOUDFLARE_ACCOUNT_ID": settings.cloudflare_account_id,
        "CLOUDFLARE_API_TOKEN": settings.cloudflare_api_token,
    }
    return [key for key, value in values.items() if not str(value or "").strip()]


def cloudflare_project_name(project_id: str, *, prefix: str = "onara-site") -> str:
    clean_prefix = _safe_slug(prefix, fallback="onara-site")
    clean_id = _safe_slug(project_id, fallback="site")
    max_length = 28
    suffix_length = max(1, max_length - len(clean_prefix) - 1)
    return f"{clean_prefix}-{clean_id[:suffix_length]}".strip("-")[:max_length]


def public_files_for_cloudflare(files: dict[str, str]) -> dict[str, str]:
    public: dict[str, str] = {}
    for raw_path, content in files.items():
        path = normalize_artifact_path(raw_path)
        if path.startswith("components/") or path == "deployment-manifest.json":
            continue
        public[path] = content

    if "index.html" not in public and "index.html" in files:
        public["index.html"] = files["index.html"]

    return public


async def _run_command(command: list[str], env: dict[str, str], cwd: Path) -> CommandResult:
    process = await asyncio.create_subprocess_exec(
        *command,
        cwd=str(cwd),
        env=env,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    stdout_bytes, stderr_bytes = await process.communicate()
    return CommandResult(
        returncode=process.returncode,
        stderr=stderr_bytes.decode("utf-8", errors="replace"),
        stdout=stdout_bytes.decode("utf-8", errors="replace"),
    )


def _write_public_files(output_dir: Path, files: dict[str, str]) -> None:
    for raw_path, content in files.items():
        relative_path = Path(normalize_artifact_path(raw_path))
        target = output_dir / relative_path
        if not target.resolve().is_relative_to(output_dir.resolve()):
            raise CloudflarePagesDeploymentError(f"Invalid public file path: {raw_path}")
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(content, encoding="utf-8")


def _wrangler_command_parts(value: str) -> list[str]:
    parts = [part for part in value.split() if part]
    if not parts:
        raise CloudflarePagesDeploymentError("CLOUDFLARE_WRANGLER_COMMAND cannot be empty")

    executable = parts[0]
    if executable.lower() == "npx":
        parts[0] = shutil.which("npx.cmd") or shutil.which("npx") or executable
    else:
        parts[0] = shutil.which(executable) or executable

    return parts


def _deployment_url(output: str, fallback: str) -> str:
    urls = [url.rstrip(").,") for url in re.findall(r"https://[^\s]+", output)]
    return next((url for url in urls if "pages.dev" in url), fallback)


def _project_url(project: dict[str, Any], project_name: str) -> str:
    for key in ("subdomain", "canonical_deployment_url"):
        value = project.get(key)
        if isinstance(value, str) and value.startswith("https://"):
            return value
    return f"https://{project_name}.pages.dev"


def _safe_slug(value: str, *, fallback: str) -> str:
    slug = re.sub(r"[^a-z0-9-]+", "-", str(value).lower()).strip("-")
    slug = re.sub(r"-{2,}", "-", slug)
    return slug or fallback


def _cloudflare_error_message(response: httpx.Response) -> str:
    detail = response.text[:500]
    try:
        payload = response.json()
        if isinstance(payload, dict) and payload.get("errors"):
            detail = "; ".join(str(error.get("message") or error) for error in payload["errors"])
    except ValueError:
        pass
    return f"Cloudflare API returned {response.status_code}: {detail}"
