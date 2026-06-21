from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, Header, HTTPException, Response, status

from onara_pipeline.ai_client import get_agent_6_model_selection
from onara_pipeline.config import Settings, get_settings
from onara_pipeline.dashboard_brief import build_dashboard_brief
from onara_pipeline.health import build_health_response
from onara_pipeline.job_queue import JobQueue
from onara_pipeline.revision_queue import RevisionQueue
from onara_pipeline.schemas import (
    DashboardBriefRequest,
    DashboardBriefResponse,
    GenerateRequest,
    HealthResponse,
    JobEnqueueResponse,
    JobStatusResponse,
    RAGSearchRequest,
    RAGSearchResponse,
    RAGSearchResult,
    RevisionEnqueueResponse,
    RevisionStartRequest,
    RevisionStatusResponse,
)

queue = JobQueue()
revision_queue = RevisionQueue()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    settings = get_settings()
    await queue.start_workers(settings)
    yield


app = FastAPI(title="Onara Pipeline Server", version="0.2.0", lifespan=lifespan)


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


@app.api_route("/health", methods=["GET", "HEAD"], response_model=HealthResponse)
async def health(settings: Settings = Depends(get_settings)) -> HealthResponse:
    return await build_health_response(settings=settings, queue=queue)


@app.post(
    "/dashboard/brief",
    response_model=DashboardBriefResponse,
    dependencies=[Depends(verify_pipeline_secret)],
)
async def dashboard_brief(
    body: DashboardBriefRequest,
    settings: Settings = Depends(get_settings),
) -> DashboardBriefResponse:
    return await build_dashboard_brief(body=body, settings=settings)


@app.post(
    "/generate",
    response_model=JobEnqueueResponse,
    status_code=status.HTTP_202_ACCEPTED,
    dependencies=[Depends(verify_pipeline_secret)],
)
async def generate(body: GenerateRequest) -> JobEnqueueResponse:
    settings = get_settings()
    enqueue_result = await queue.enqueue(body, settings)
    job = enqueue_result.job
    await queue.start_workers(settings)
    agent_6_selection = get_agent_6_model_selection(
        requested_option_id=job.agent_6_model,
        is_trial=job.is_trial,
        ollama_fallback_model=settings.ollama_fallback_model,
        user_plan=job.user_plan,
    )

    return JobEnqueueResponse(
        agent_6_model=agent_6_selection.selected_option_id,
        agent_6_model_reason=agent_6_selection.selection_reason,
        agent_6_model_requested=agent_6_selection.requested_option_id,
        job_id=job.job_id,
        project_id=job.project_id,
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
    settings = get_settings()
    job = await queue.get(job_id, settings)

    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

    return JobStatusResponse.from_job(job, queue_position=await queue.position(job_id))


@app.post(
    "/pipeline/revisions/start",
    response_model=RevisionEnqueueResponse,
    status_code=status.HTTP_202_ACCEPTED,
    dependencies=[Depends(verify_pipeline_secret)],
)
async def start_revision(body: RevisionStartRequest) -> RevisionEnqueueResponse:
    settings = get_settings()
    job = await revision_queue.enqueue(body)
    await revision_queue.start_workers(settings)

    return RevisionEnqueueResponse(
        job_id=job.job_id,
        queue_position=await revision_queue.position(job.job_id),
        revision_id=job.revision_id,
        status=job.status,
    )


@app.get(
    "/pipeline/revisions/status/{job_id}",
    response_model=RevisionStatusResponse,
    dependencies=[Depends(verify_pipeline_secret)],
)
async def revision_status(job_id: str) -> RevisionStatusResponse:
    revision = await revision_queue.status(job_id)

    if not revision:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Revision job not found")

    return revision


@app.post(
    "/rag/search",
    response_model=RAGSearchResponse,
    dependencies=[Depends(verify_pipeline_secret)],
)
async def rag_search(
    body: RAGSearchRequest,
    settings: Settings = Depends(get_settings),
) -> RAGSearchResponse:
    try:
        from onara_pipeline.rag import build_pattern_store

        store = build_pattern_store(settings)
        results = store.search(
            query=body.query,
            top_k=body.top_k,
            vertical=body.vertical,
            pattern_type=body.pattern_type,
        )
    except ImportError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="RAG dependency is not installed. Run: python -m pip install -r requirements.txt",
        ) from exc

    return RAGSearchResponse(
        query=body.query,
        count=len(results),
        results=[RAGSearchResult(**result.model_dump()) for result in results],
    )


@app.get("/")
async def root() -> Response:
    return Response(status_code=status.HTTP_204_NO_CONTENT)
