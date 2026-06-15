import inspect
import re
import time
from collections.abc import Awaitable, Callable
from dataclasses import dataclass
from typing import Any

import httpx

from onara_pipeline.config import Settings

GITHUB_API_VERSION = "2022-11-28"
TokenProvider = Callable[[], str | Awaitable[str]]


class GitHubDeploymentError(RuntimeError):
    pass


@dataclass(frozen=True, slots=True)
class GitHubCommitResult:
    branch: str
    commit_sha: str
    commit_url: str | None
    file_count: int
    path_prefix: str
    repository: str

    def to_dict(self) -> dict[str, Any]:
        return {
            "branch": self.branch,
            "commit_sha": self.commit_sha,
            "commit_url": self.commit_url,
            "file_count": self.file_count,
            "path_prefix": self.path_prefix,
            "repository": self.repository,
        }


class GitHubDeploymentClient:
    def __init__(
        self,
        *,
        api_url: str,
        app_id: str,
        branch: str,
        installation_id: str,
        private_key: str,
        repo_name: str,
        repo_owner: str,
        timeout: float = 30.0,
        http_client: httpx.AsyncClient | None = None,
        token_provider: TokenProvider | None = None,
    ) -> None:
        self.api_url = api_url.rstrip("/")
        self.app_id = app_id
        self.branch = branch
        self.installation_id = installation_id
        self.private_key = private_key
        self.repo_name = repo_name
        self.repo_owner = repo_owner
        self.timeout = timeout
        self._http_client = http_client
        self._token_provider = token_provider

    async def commit_files(
        self,
        *,
        business_name: str,
        files: dict[str, str],
        job_id: str,
        project_id: str,
    ) -> GitHubCommitResult:
        if not files:
            raise GitHubDeploymentError("No deployment files were provided for GitHub commit")

        path_prefix = site_path_prefix(project_id)
        message = commit_message(business_name=business_name, job_id=job_id, project_id=project_id)
        close_client = self._http_client is None
        client = self._http_client or httpx.AsyncClient(base_url=self.api_url, timeout=self.timeout)

        try:
            token = await self._installation_token(client)
            ref = await self._request_json(
                client,
                "GET",
                f"/repos/{self.repo_owner}/{self.repo_name}/git/ref/heads/{self.branch}",
                auth_token=token,
            )
            base_commit_sha = _nested(ref, "object", "sha")
            if not isinstance(base_commit_sha, str) or not base_commit_sha:
                raise GitHubDeploymentError("GitHub ref response did not include a base commit SHA")

            base_commit = await self._request_json(
                client,
                "GET",
                f"/repos/{self.repo_owner}/{self.repo_name}/git/commits/{base_commit_sha}",
                auth_token=token,
            )
            base_tree_sha = _nested(base_commit, "tree", "sha")
            if not isinstance(base_tree_sha, str) or not base_tree_sha:
                raise GitHubDeploymentError("GitHub commit response did not include a base tree SHA")

            tree = await self._request_json(
                client,
                "POST",
                f"/repos/{self.repo_owner}/{self.repo_name}/git/trees",
                auth_token=token,
                json={
                    "base_tree": base_tree_sha,
                    "tree": [
                        {
                            "content": content,
                            "mode": "100644",
                            "path": f"{path_prefix}/{normalize_artifact_path(path)}",
                            "type": "blob",
                        }
                        for path, content in sorted(files.items())
                    ],
                },
            )
            tree_sha = tree.get("sha")
            if not isinstance(tree_sha, str) or not tree_sha:
                raise GitHubDeploymentError("GitHub tree response did not include a tree SHA")

            commit = await self._request_json(
                client,
                "POST",
                f"/repos/{self.repo_owner}/{self.repo_name}/git/commits",
                auth_token=token,
                json={"message": message, "parents": [base_commit_sha], "tree": tree_sha},
            )
            commit_sha = commit.get("sha")
            if not isinstance(commit_sha, str) or not commit_sha:
                raise GitHubDeploymentError("GitHub commit response did not include a commit SHA")

            await self._request_json(
                client,
                "PATCH",
                f"/repos/{self.repo_owner}/{self.repo_name}/git/refs/heads/{self.branch}",
                auth_token=token,
                json={"sha": commit_sha},
            )

            return GitHubCommitResult(
                branch=self.branch,
                commit_sha=commit_sha,
                commit_url=commit.get("html_url"),
                file_count=len(files),
                path_prefix=path_prefix,
                repository=f"{self.repo_owner}/{self.repo_name}",
            )
        finally:
            if close_client:
                await client.aclose()

    async def _installation_token(self, client: httpx.AsyncClient) -> str:
        if self._token_provider:
            token = self._token_provider()
            if inspect.isawaitable(token):
                token = await token
            if not isinstance(token, str) or not token:
                raise GitHubDeploymentError("Injected GitHub token provider returned an invalid token")
            return token

        app_jwt = generate_app_jwt(app_id=self.app_id, private_key=self.private_key)
        response = await self._request_json(
            client,
            "POST",
            f"/app/installations/{self.installation_id}/access_tokens",
            auth_token=app_jwt,
        )
        token = response.get("token")
        if not isinstance(token, str) or not token:
            raise GitHubDeploymentError("GitHub installation token response did not include a token")
        return token

    async def _request_json(
        self,
        client: httpx.AsyncClient,
        method: str,
        path: str,
        *,
        auth_token: str,
        json: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        try:
            response = await client.request(
                method,
                path,
                headers={
                    "Accept": "application/vnd.github+json",
                    "Authorization": f"Bearer {auth_token}",
                    "X-GitHub-Api-Version": GITHUB_API_VERSION,
                },
                json=json,
            )
        except httpx.HTTPError as exc:
            raise GitHubDeploymentError(f"GitHub API request failed: {exc}") from exc

        if response.status_code >= 400:
            raise GitHubDeploymentError(_github_error_message(response))

        if not response.content:
            return {}

        try:
            payload = response.json()
        except ValueError as exc:
            raise GitHubDeploymentError("GitHub API returned non-JSON response") from exc

        if not isinstance(payload, dict):
            raise GitHubDeploymentError("GitHub API returned an unexpected JSON payload")

        return payload


async def commit_deployment_files(
    *,
    business_name: str,
    files: dict[str, str],
    job_id: str,
    project_id: str,
    settings: Settings,
) -> GitHubCommitResult:
    missing = missing_github_settings(settings)
    if missing:
        raise GitHubDeploymentError(f"Missing GitHub deployment settings: {', '.join(missing)}")

    client = GitHubDeploymentClient(
        api_url=settings.github_api_url,
        app_id=str(settings.github_app_id),
        branch=settings.github_repo_branch,
        installation_id=str(settings.github_app_installation_id),
        private_key=str(settings.github_app_private_key),
        repo_name=settings.github_repo_name,
        repo_owner=str(settings.github_repo_owner),
        timeout=settings.ai_request_timeout,
    )
    return await client.commit_files(
        business_name=business_name,
        files=files,
        job_id=job_id,
        project_id=project_id,
    )


def missing_github_settings(settings: Settings) -> list[str]:
    values = {
        "GITHUB_APP_ID": settings.github_app_id,
        "GITHUB_APP_INSTALLATION_ID": settings.github_app_installation_id,
        "GITHUB_APP_PRIVATE_KEY": settings.github_app_private_key,
        "GITHUB_REPO_NAME": settings.github_repo_name,
        "GITHUB_REPO_OWNER": settings.github_repo_owner,
    }
    return [key for key, value in values.items() if not str(value or "").strip()]


def generate_app_jwt(*, app_id: str, private_key: str) -> str:
    try:
        import jwt
    except ImportError as exc:
        raise GitHubDeploymentError(
            "PyJWT[crypto] is required for GitHub App authentication. "
            "Run: python -m pip install -r requirements.txt"
        ) from exc

    now = int(time.time())
    payload = {
        "exp": now + 540,
        "iat": now - 60,
        "iss": str(app_id),
    }
    try:
        token = jwt.encode(payload, private_key, algorithm="RS256")
    except Exception as exc:
        raise GitHubDeploymentError(
            "GitHub App private key could not sign a JWT. Check GITHUB_APP_PRIVATE_KEY formatting "
            "and make sure PyJWT[crypto] is installed."
        ) from exc
    return token.decode("utf-8") if isinstance(token, bytes) else token


def site_path_prefix(project_id: str) -> str:
    normalized = re.sub(r"[^A-Za-z0-9._-]+", "-", str(project_id).strip()).strip(".-_")
    if not normalized:
        raise GitHubDeploymentError("Project ID cannot be converted to a safe GitHub path")
    return f"sites/{normalized}"


def normalize_artifact_path(path: str) -> str:
    normalized = str(path).replace("\\", "/").strip("/")
    parts = [part for part in normalized.split("/") if part]
    if not parts or any(part in {".", ".."} for part in parts):
        raise GitHubDeploymentError(f"Invalid deployment artifact path: {path}")
    return "/".join(parts)


def commit_message(*, business_name: str, job_id: str, project_id: str) -> str:
    name = business_name.strip() or "generated site"
    return f"Deploy {name} ({project_id}) from job {job_id}"


def _github_error_message(response: httpx.Response) -> str:
    detail = response.text[:500]
    try:
        payload = response.json()
        if isinstance(payload, dict) and payload.get("message"):
            detail = str(payload["message"])
    except ValueError:
        pass
    return f"GitHub API returned {response.status_code}: {detail}"


def _nested(value: dict[str, Any], *keys: str) -> Any:
    current: Any = value
    for key in keys:
        if not isinstance(current, dict):
            return None
        current = current.get(key)
    return current
