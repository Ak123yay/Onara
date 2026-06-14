from fastapi import Depends, FastAPI, Header, HTTPException, Response, status

from onara_pipeline.config import Settings, get_settings
from onara_pipeline.health import build_health_response
from onara_pipeline.job_queue import JobQueue
from onara_pipeline.schemas import (
    GenerateRequest,
    HealthResponse,
    JobEnqueueResponse,
    JobStatusResponse,
)

app = FastAPI(title="Onara Pipeline Server", version="0.1.0")
queue = JobQueue()


def verify_pipeline_secret(
    x_pipeline_secret: str | None = Header(default=None),
    settings: Settings = Depends(get_settings),
) -> None:
    if not settings.pipeline_api_secret:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="PIPELINE_API_SECRET is not configured",
        )

    if x_pipeline_secret != settings.pipeline_api_secret:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid pipeline secret",
        )


@app.get("/health", response_model=HealthResponse)
async def health(settings: Settings = Depends(get_settings)) -> HealthResponse:
    return await build_health_response(settings=settings, queue=queue)


@app.post(
    "/generate",
    response_model=JobEnqueueResponse,
    status_code=status.HTTP_202_ACCEPTED,
    dependencies=[Depends(verify_pipeline_secret)],
)
async def generate(body: GenerateRequest) -> JobEnqueueResponse:
    enqueue_result = await queue.enqueue(body)
    job = enqueue_result.job

    return JobEnqueueResponse(
        job_id=job.job_id,
        queued=job.status == "queued",
        deduped=enqueue_result.deduped,
        queue_position=await queue.position(job.job_id),
        status=job.status,
    )


@app.post(
    "/pipeline/start",
    response_model=JobEnqueueResponse,
    status_code=status.HTTP_202_ACCEPTED,
    dependencies=[Depends(verify_pipeline_secret)],
)
async def start_pipeline(body: GenerateRequest) -> JobEnqueueResponse:
    return await generate(body)


@app.get(
    "/pipeline/status/{job_id}",
    response_model=JobStatusResponse,
    dependencies=[Depends(verify_pipeline_secret)],
)
async def pipeline_status(job_id: str) -> JobStatusResponse:
    job = await queue.get(job_id)

    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

    return JobStatusResponse.from_job(job, queue_position=await queue.position(job_id))


@app.get("/")
async def root() -> Response:
    return Response(status_code=status.HTTP_204_NO_CONTENT)
