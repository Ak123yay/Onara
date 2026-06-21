from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any

import httpx

from onara_pipeline.config import Settings


class DurableJobStoreError(RuntimeError):
    pass


@dataclass(frozen=True, slots=True)
class DurableClaim:
    row: dict[str, Any]


class DurableJobStore:
    """Small PostgREST adapter for Pipeline V2 lifecycle state."""

    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.base_url = (settings.supabase_url or "").rstrip("/")
        self.service_key = settings.supabase_service_role_key or settings.supabase_secret_key

    @property
    def enabled(self) -> bool:
        return bool(self.settings.pipeline_v2_enabled and self.base_url and self.service_key)

    def require_enabled(self) -> None:
        if not self.enabled:
            raise DurableJobStoreError(
                "Pipeline V2 requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
            )

    async def enqueue(self, job: Any) -> None:
        self.require_enabled()
        payload = {
            "agents_completed": job.agents_completed,
            "agents_total": job.agents_total,
            "attempt": 0,
            "id": job.job_id,
            "job_type": "initial_generation",
            "phase": "analyst",
            "pipeline_version": "v2",
            "project_id": job.project_id,
            "queued_at": job.created_at.isoformat(),
            "request_payload": {
                "agent_6_model": job.agent_6_model,
                "business_data": job.business_data,
                "is_trial": job.is_trial,
                "project_id": job.project_id,
                "style_preferences": job.style_preferences,
                "user_id": job.user_id,
                "user_plan": job.user_plan,
            },
            "request_signature": job.request_signature,
            "stage": "queued",
            "status": "queued",
            "updated_at": job.updated_at.isoformat(),
            "user_id": job.user_id,
        }
        async with self._client() as client:
            response = await client.post(
                f"{self.base_url}/rest/v1/pipeline_jobs",
                params={"on_conflict": "id"},
                headers=self._headers(prefer="resolution=merge-duplicates,return=minimal"),
                json=payload,
            )
        self._raise_for_status(response, expected={200, 201, 204})

    async def claim(self, *, job_id: str | None, worker_id: str) -> DurableClaim | None:
        self.require_enabled()
        async with self._client() as client:
            response = await client.post(
                f"{self.base_url}/rest/v1/rpc/claim_pipeline_job",
                headers=self._headers(),
                json={
                    "p_job_id": job_id,
                    "p_lease_seconds": self.settings.pipeline_v2_lease_seconds,
                    "p_worker_id": worker_id,
                },
            )
        self._raise_for_status(response, expected={200})
        rows = response.json()
        if not isinstance(rows, list) or not rows or not isinstance(rows[0], dict):
            return None
        return DurableClaim(row=rows[0])

    async def heartbeat(self, *, job_id: str, worker_id: str) -> bool:
        self.require_enabled()
        async with self._client() as client:
            response = await client.post(
                f"{self.base_url}/rest/v1/rpc/heartbeat_pipeline_job",
                headers=self._headers(),
                json={
                    "p_job_id": job_id,
                    "p_lease_seconds": self.settings.pipeline_v2_lease_seconds,
                    "p_worker_id": worker_id,
                },
            )
        self._raise_for_status(response, expected={200})
        return bool(response.json())

    async def recoverable(self, *, limit: int = 25) -> list[dict[str, Any]]:
        self.require_enabled()
        async with self._client() as client:
            response = await client.get(
                f"{self.base_url}/rest/v1/pipeline_jobs",
                params={
                    "limit": str(limit),
                    "order": "queued_at.asc",
                    "pipeline_version": "eq.v2",
                    "select": "*",
                    "status": "in.(queued,running)",
                },
                headers=self._headers(),
            )
        self._raise_for_status(response, expected={200})
        rows = response.json()
        return [row for row in rows if isinstance(row, dict)] if isinstance(rows, list) else []

    async def get(self, job_id: str) -> dict[str, Any] | None:
        self.require_enabled()
        async with self._client() as client:
            response = await client.get(
                f"{self.base_url}/rest/v1/pipeline_jobs",
                params={"id": f"eq.{job_id}", "limit": "1", "select": "*"},
                headers=self._headers(),
            )
        self._raise_for_status(response, expected={200})
        rows = response.json()
        if isinstance(rows, list) and rows and isinstance(rows[0], dict):
            return rows[0]
        return None

    async def find_active(self, *, request_signature: str, user_id: str) -> dict[str, Any] | None:
        self.require_enabled()
        async with self._client() as client:
            response = await client.get(
                f"{self.base_url}/rest/v1/pipeline_jobs",
                params={
                    "limit": "1",
                    "order": "queued_at.desc",
                    "pipeline_version": "eq.v2",
                    "request_signature": f"eq.{request_signature}",
                    "select": "*",
                    "status": "in.(queued,running)",
                    "user_id": f"eq.{user_id}",
                },
                headers=self._headers(),
            )
        self._raise_for_status(response, expected={200})
        rows = response.json()
        if isinstance(rows, list) and rows and isinstance(rows[0], dict):
            return rows[0]
        return None

    async def events(self, job_id: str) -> list[dict[str, Any]]:
        self.require_enabled()
        async with self._client() as client:
            response = await client.get(
                f"{self.base_url}/rest/v1/pipeline_job_events",
                params={
                    "job_id": f"eq.{job_id}",
                    "order": "sequence.asc",
                    "select": "agent_id,created_at,event,message,payload,sequence,stage",
                },
                headers=self._headers(),
            )
        self._raise_for_status(response, expected={200})
        rows = response.json()
        return [row for row in rows if isinstance(row, dict)] if isinstance(rows, list) else []

    async def candidates(self, job_id: str) -> list[dict[str, Any]]:
        self.require_enabled()
        async with self._client() as client:
            response = await client.get(
                f"{self.base_url}/rest/v1/pipeline_candidates",
                params={
                    "job_id": f"eq.{job_id}",
                    "order": "candidate_key.asc",
                    "select": "*",
                },
                headers=self._headers(),
            )
        self._raise_for_status(response, expected={200})
        rows = response.json()
        return [row for row in rows if isinstance(row, dict)] if isinstance(rows, list) else []

    async def append_event(
        self,
        *,
        agent_id: str | None,
        event: str,
        job_id: str,
        message: str,
        payload: dict[str, Any],
        sequence: int,
        stage: str | None,
    ) -> None:
        self.require_enabled()
        async with self._client() as client:
            response = await client.post(
                f"{self.base_url}/rest/v1/pipeline_job_events",
                headers=self._headers(prefer="return=minimal"),
                json={
                    "agent_id": agent_id,
                    "event": event,
                    "job_id": job_id,
                    "message": message,
                    "payload": payload,
                    "sequence": sequence,
                    "stage": stage,
                },
            )
        if response.status_code == 409:
            return
        self._raise_for_status(response, expected={200, 201, 204})

    async def update(
        self,
        job_id: str,
        *,
        fields: dict[str, Any],
    ) -> None:
        self.require_enabled()
        payload = {**fields, "updated_at": datetime.now(timezone.utc).isoformat()}
        async with self._client() as client:
            response = await client.patch(
                f"{self.base_url}/rest/v1/pipeline_jobs",
                params={"id": f"eq.{job_id}"},
                headers=self._headers(prefer="return=minimal"),
                json=payload,
            )
        self._raise_for_status(response, expected={200, 204})

    async def upsert_candidate(
        self,
        *,
        candidate_key: str,
        job_id: str,
        payload: dict[str, Any],
    ) -> None:
        self.require_enabled()
        row = {
            **payload,
            "candidate_key": candidate_key,
            "job_id": job_id,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        async with self._client() as client:
            response = await client.post(
                f"{self.base_url}/rest/v1/pipeline_candidates",
                params={"on_conflict": "job_id,candidate_key"},
                headers=self._headers(prefer="resolution=merge-duplicates,return=minimal"),
                json=row,
            )
        self._raise_for_status(response, expected={200, 201, 204})

    def _headers(self, *, prefer: str | None = None) -> dict[str, str]:
        if not self.service_key:
            raise DurableJobStoreError("Supabase service key is missing")
        headers = {
            "Authorization": f"Bearer {self.service_key}",
            "Content-Type": "application/json",
            "apikey": self.service_key,
        }
        if prefer:
            headers["Prefer"] = prefer
        return headers

    def _client(self) -> httpx.AsyncClient:
        return httpx.AsyncClient(timeout=min(self.settings.ai_request_timeout, 20.0))

    @staticmethod
    def _raise_for_status(response: httpx.Response, *, expected: set[int]) -> None:
        if response.status_code in expected:
            return
        detail = response.text[:1000].replace("\n", " ")
        raise DurableJobStoreError(
            f"Supabase durable-job request failed ({response.status_code}): {detail}"
        )
