import re
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any

import httpx

from onara_pipeline.config import Settings


class SupabaseProjectStoreError(RuntimeError):
    pass


@dataclass(frozen=True, slots=True)
class SupabaseProjectStoreResult:
    project_id: str
    status: str
    error: str | None = None

    def to_dict(self) -> dict[str, Any]:
        return {
            "error": self.error,
            "project_id": self.project_id,
            "status": self.status,
        }


@dataclass(frozen=True, slots=True)
class SupabaseRevisionStoreResult:
    revision_id: str
    status: str
    error: str | None = None

    def to_dict(self) -> dict[str, Any]:
        return {
            "error": self.error,
            "revision_id": self.revision_id,
            "status": self.status,
        }


def missing_supabase_project_settings(settings: Settings) -> list[str]:
    missing: list[str] = []
    if not settings.supabase_url:
        missing.append("SUPABASE_URL")
    if not _service_role_key(settings):
        missing.append("SUPABASE_SERVICE_ROLE_KEY")
    return missing


async def update_revision_record(
    *,
    revision_id: str,
    settings: Settings,
    status: str,
    user_id: str,
    affected_components: list[str] | None = None,
    after_files: dict[str, str] | None = None,
    agent_summary: str | None = None,
    before_cloudflare_deployment_url: str | None = None,
    before_files: dict[str, str] | None = None,
    before_github_commit_sha: str | None = None,
    before_public_url: str | None = None,
    charged_at: str | None = None,
    changed_files: list[dict[str, Any]] | None = None,
    cloudflare_deployment_url: str | None = None,
    component_selection: list[str] | None = None,
    completed_at: str | None = None,
    error_message: str | None = None,
    github_commit_sha: str | None = None,
    pipeline_job_id: str | None = None,
    progress_log: list[dict[str, Any]] | None = None,
    result_public_url: str | None = None,
    started_at: str | None = None,
    http_client: httpx.AsyncClient | None = None,
) -> SupabaseRevisionStoreResult:
    missing = missing_supabase_project_settings(settings)
    if missing:
        return SupabaseRevisionStoreResult(
            error=f"Missing Supabase revision settings: {', '.join(missing)}",
            revision_id=revision_id,
            status="skipped",
        )

    payload: dict[str, Any] = {
        "status": status,
    }
    optional_values = {
        "affected_components": affected_components,
        "after_files": after_files,
        "agent_summary": agent_summary,
        "before_cloudflare_deployment_url": before_cloudflare_deployment_url,
        "before_files": before_files,
        "before_github_commit_sha": before_github_commit_sha,
        "before_public_url": before_public_url,
        "charged_at": charged_at,
        "changed_files": changed_files,
        "cloudflare_deployment_url": cloudflare_deployment_url,
        "component_selection": component_selection,
        "completed_at": completed_at,
        "error_message": error_message,
        "github_commit_sha": github_commit_sha,
        "pipeline_job_id": pipeline_job_id,
        "progress_log": progress_log,
        "result_public_url": result_public_url,
        "started_at": started_at,
    }
    payload.update({key: value for key, value in optional_values.items() if value is not None})

    service_role_key = _service_role_key(settings)
    if not settings.supabase_url or not service_role_key:
        raise SupabaseProjectStoreError("Supabase settings unexpectedly missing after validation")

    close_client = http_client is None
    client = http_client or httpx.AsyncClient(timeout=min(settings.ai_request_timeout, 20.0))
    try:
        response = await client.patch(
            f"{settings.supabase_url}/rest/v1/revisions",
            params={"id": f"eq.{revision_id}", "user_id": f"eq.{user_id}"},
            headers={
                "Authorization": f"Bearer {service_role_key}",
                "Content-Type": "application/json",
                "Prefer": "return=minimal",
                "apikey": service_role_key,
            },
            json=payload,
        )
        if response.status_code not in {200, 204}:
            raise SupabaseProjectStoreError(_supabase_error_message(response))
    finally:
        if close_client:
            await client.aclose()

    return SupabaseRevisionStoreResult(revision_id=revision_id, status="stored")


async def consume_revision_credit(
    *,
    settings: Settings,
    user_id: str,
    http_client: httpx.AsyncClient | None = None,
) -> dict[str, Any] | None:
    missing = missing_supabase_project_settings(settings)
    if missing:
        return None

    service_role_key = _service_role_key(settings)
    if not settings.supabase_url or not service_role_key:
        raise SupabaseProjectStoreError("Supabase settings unexpectedly missing after validation")

    close_client = http_client is None
    client = http_client or httpx.AsyncClient(timeout=min(settings.ai_request_timeout, 20.0))
    try:
        response = await client.post(
            f"{settings.supabase_url}/rest/v1/rpc/consume_revision_credit",
            headers={
                "Authorization": f"Bearer {service_role_key}",
                "Content-Type": "application/json",
                "apikey": service_role_key,
            },
            json={"p_user_id": user_id},
        )
        if response.status_code not in {200, 204}:
            raise SupabaseProjectStoreError(_supabase_error_message(response))
        if not response.content:
            return None
        payload = response.json()
        if isinstance(payload, list) and payload and isinstance(payload[0], dict):
            return payload[0]
        return payload if isinstance(payload, dict) else None
    finally:
        if close_client:
            await client.aclose()


async def upsert_project_record(
    *,
    business_data: dict[str, Any],
    cloudflare_project_name: str | None,
    current_agent: str,
    generation_ms: int | None,
    github_path: str | None,
    project_id: str,
    public_url: str | None,
    settings: Settings,
    status: str,
    style_preferences: dict[str, Any],
    user_id: str,
    error_message: str | None = None,
    pipeline_job_id: str | None = None,
    http_client: httpx.AsyncClient | None = None,
) -> SupabaseProjectStoreResult:
    missing = missing_supabase_project_settings(settings)
    if missing:
        return SupabaseProjectStoreResult(
            error=f"Missing Supabase project-store settings: {', '.join(missing)}",
            project_id=project_id,
            status="skipped",
        )

    payload = project_record_payload(
        business_data=business_data,
        cloudflare_project_name=cloudflare_project_name,
        current_agent=current_agent,
        error_message=error_message,
        generation_ms=generation_ms,
        github_path=github_path,
        pipeline_job_id=pipeline_job_id,
        project_id=project_id,
        public_url=public_url,
        status=status,
        style_preferences=style_preferences,
        user_id=user_id,
    )
    service_role_key = _service_role_key(settings)
    if not settings.supabase_url or not service_role_key:
        raise SupabaseProjectStoreError("Supabase settings unexpectedly missing after validation")

    close_client = http_client is None
    client = http_client or httpx.AsyncClient(timeout=min(settings.ai_request_timeout, 20.0))
    try:
        response = await client.post(
            f"{settings.supabase_url}/rest/v1/projects",
            params={"on_conflict": "id"},
            headers={
                "Authorization": f"Bearer {service_role_key}",
                "Content-Type": "application/json",
                "Prefer": "resolution=merge-duplicates,return=minimal",
                "apikey": service_role_key,
            },
            json=payload,
        )
        if response.status_code not in {200, 201, 204}:
            raise SupabaseProjectStoreError(_supabase_error_message(response))
    finally:
        if close_client:
            await client.aclose()

    return SupabaseProjectStoreResult(project_id=project_id, status="stored")


def project_record_payload(
    *,
    business_data: dict[str, Any],
    cloudflare_project_name: str | None,
    current_agent: str,
    generation_ms: int | None,
    github_path: str | None,
    project_id: str,
    public_url: str | None,
    status: str,
    style_preferences: dict[str, Any],
    user_id: str,
    error_message: str | None = None,
    pipeline_job_id: str | None = None,
) -> dict[str, Any]:
    now = datetime.now(timezone.utc).isoformat()
    payload = {
        "business_address": _optional_str(business_data.get("address")),
        "business_category": _optional_str(business_data.get("category")),
        "business_email": _optional_str(business_data.get("email")),
        "business_hours": _json_value(business_data.get("hours")),
        "business_name": _required_business_name(business_data),
        "business_phone": _optional_str(business_data.get("phone")),
        "business_photos": _photo_sources(business_data),
        "business_website": _optional_str(business_data.get("website")),
        "cloudflare_project_name": cloudflare_project_name,
        "current_agent": current_agent,
        "error_message": error_message,
        "generation_ms": generation_ms,
        "github_path": github_path,
        "google_place_id": _optional_str(business_data.get("place_id")),
        "google_rating": _rating_value(business_data.get("rating")),
        "google_review_count": _int_value(business_data.get("review_count")),
        "id": project_id,
        "pipeline_job_id": pipeline_job_id,
        "public_url": public_url,
        "seo_description": _meta_description(business_data),
        "seo_keywords": _seo_keywords(business_data),
        "seo_title": _seo_title(business_data),
        "status": status,
        "style_preferences": style_preferences or {},
        "updated_at": now,
        "user_id": user_id,
    }
    if status == "live":
        payload["last_deployed_at"] = now
    return payload


def _service_role_key(settings: Settings) -> str | None:
    return settings.supabase_service_role_key or settings.supabase_secret_key


def _required_business_name(business_data: dict[str, Any]) -> str:
    name = _optional_str(business_data.get("name"))
    return name or "Generated Business"


def _optional_str(value: Any) -> str | None:
    if value in (None, ""):
        return None
    text = str(value).strip()
    return text or None


def _json_value(value: Any) -> Any:
    return value if isinstance(value, (dict, list, str, int, float, bool)) or value is None else str(value)


def _rating_value(value: Any) -> float | None:
    try:
        rating = float(value)
    except (TypeError, ValueError):
        return None
    if rating < 0 or rating > 5:
        return None
    return round(rating, 1)


def _int_value(value: Any) -> int | None:
    try:
        number = int(value)
    except (TypeError, ValueError):
        return None
    return number if number >= 0 else None


def _photo_sources(business_data: dict[str, Any]) -> list[str]:
    sources: list[str] = []
    for collection_name in ("resolved_photos", "photos"):
        collection = business_data.get(collection_name)
        if not isinstance(collection, list):
            continue
        for item in collection:
            src = _photo_source(item)
            if src and src not in sources:
                sources.append(src)
    return sources


def _photo_source(value: Any) -> str | None:
    if isinstance(value, str):
        return value if value.startswith(("https://", "data:image/")) else None
    if not isinstance(value, dict):
        return None
    for key in ("src", "url", "photo_url", "photoUrl", "preview_url"):
        text = _optional_str(value.get(key))
        if text and text.startswith(("https://", "data:image/")):
            return text
    return None


def _seo_title(business_data: dict[str, Any]) -> str:
    name = _required_business_name(business_data)
    service_area = _optional_str(business_data.get("service_area")) or _city_from_address(business_data)
    return f"{name} | {service_area}" if service_area else name


def _meta_description(business_data: dict[str, Any]) -> str:
    name = _required_business_name(business_data)
    category = _optional_str(business_data.get("category")) or "local service"
    service_area = _optional_str(business_data.get("service_area")) or _city_from_address(business_data)
    area_text = f" in {service_area}" if service_area else ""
    return f"{name} provides {category}{area_text}. View hours, contact details, services, and local proof."


def _seo_keywords(business_data: dict[str, Any]) -> list[str]:
    keywords = [
        _optional_str(business_data.get("name")),
        _optional_str(business_data.get("category")),
        _optional_str(business_data.get("service_area")),
        _city_from_address(business_data),
    ]
    return [keyword for keyword in keywords if keyword]


def _city_from_address(business_data: dict[str, Any]) -> str | None:
    address = _optional_str(business_data.get("address"))
    if not address:
        return None
    parts = [part.strip() for part in address.split(",") if part.strip()]
    return parts[-2] if len(parts) >= 2 else None


def _supabase_error_message(response: httpx.Response) -> str:
    detail = response.text[:500]
    try:
        payload = response.json()
        if isinstance(payload, dict):
            message = payload.get("message") or payload.get("hint") or payload.get("details")
            if message:
                detail = str(message)
    except ValueError:
        pass
    return f"Supabase project record upsert failed ({response.status_code}): {re.sub(r'\\s+', ' ', detail).strip()}"
