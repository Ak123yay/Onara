from time import monotonic

import httpx

from onara_pipeline.config import Settings
from onara_pipeline.job_queue import JobQueue
from onara_pipeline.schemas import HealthResponse

STARTED_AT = monotonic()


async def ollama_is_reachable(settings: Settings) -> bool:
    try:
        async with httpx.AsyncClient(timeout=1.5) as client:
            response = await client.get(f"{settings.ollama_base_url}/api/tags")
        return response.status_code == 200
    except httpx.HTTPError:
        return False


async def build_health_response(settings: Settings, queue: JobQueue) -> HealthResponse:
    ollama = await ollama_is_reachable(settings)
    queue_stats = await queue.stats()

    return HealthResponse(
        status="ok" if ollama else "degraded",
        ollama=ollama,
        queue_length=queue_stats.queue_length,
        active_jobs=queue_stats.active_jobs,
        uptime_seconds=int(monotonic() - STARTED_AT),
    )
