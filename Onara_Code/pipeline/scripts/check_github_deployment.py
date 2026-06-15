import argparse
import asyncio

import httpx

from onara_pipeline.config import get_settings
from onara_pipeline.deployment.github import (
    GitHubDeploymentClient,
    GitHubDeploymentError,
    generate_app_jwt,
    missing_github_settings,
)


async def main() -> int:
    parser = argparse.ArgumentParser(description="Check Onara GitHub deployment configuration without printing secrets.")
    parser.add_argument(
        "--write-check",
        action="store_true",
        help="Create a tiny diagnostic commit in the configured repo to verify Contents write access.",
    )
    args = parser.parse_args()

    settings = get_settings()
    missing = missing_github_settings(settings)
    print(f"missing_settings={missing}")
    if missing:
        return 1

    try:
        import jwt

        print(f"pyjwt_ok=True version={getattr(jwt, '__version__', 'unknown')}")
    except Exception as exc:
        print(f"pyjwt_ok=False error={type(exc).__name__}: {exc}")
        return 1

    try:
        token = generate_app_jwt(app_id=str(settings.github_app_id), private_key=str(settings.github_app_private_key))
        print(f"jwt_signing_ok={token.count('.') == 2}")
    except GitHubDeploymentError as exc:
        print(f"jwt_signing_ok=False error={exc}")
        return 1

    client = GitHubDeploymentClient(
        api_url=settings.github_api_url,
        app_id=str(settings.github_app_id),
        branch=settings.github_repo_branch,
        installation_id=str(settings.github_app_installation_id),
        private_key=str(settings.github_app_private_key),
        repo_name=settings.github_repo_name,
        repo_owner=str(settings.github_repo_owner),
        timeout=20,
    )

    try:
        async with httpx.AsyncClient(base_url=client.api_url, timeout=client.timeout) as http_client:
            token = await client._installation_token(http_client)
            ref = await client._request_json(
                http_client,
                "GET",
                f"/repos/{settings.github_repo_owner}/{settings.github_repo_name}/git/ref/heads/{settings.github_repo_branch}",
                auth_token=token,
            )
            base_commit_sha = ref.get("object", {}).get("sha")
            print("installation_token_ok=True")
            print(f"repo={settings.github_repo_owner}/{settings.github_repo_name}")
            print(f"branch={settings.github_repo_branch}")
            print(f"branch_ref_ok={bool(base_commit_sha)}")
    except Exception as exc:
        print(f"github_access_ok=False error={type(exc).__name__}: {exc}")
        return 1

    if not args.write_check:
        print("write_check=skipped")
        print("result=ok")
        return 0

    try:
        commit = await client.commit_files(
            business_name="Onara GitHub diagnostic",
            files={"diagnostics/github-deployment-check.txt": "GitHub deployment diagnostic commit.\n"},
            job_id="diagnostic-local",
            project_id="diagnostic-github-check",
        )
        print("write_check=ok")
        print(f"commit_sha={commit.commit_sha}")
        print(f"commit_url={commit.commit_url}")
        print("result=ok")
        return 0
    except Exception as exc:
        print(f"write_check=failed error={type(exc).__name__}: {exc}")
        return 1


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
