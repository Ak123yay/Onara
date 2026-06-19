# Production Hardening

_Phase 27 status for the 11 production-grade reliability fixes from the roadmap._

## Summary

The 11 hardening fixes are not one UI feature. They are the reliability layer around the FastAPI
pipeline, AI providers, deployment backups, and production debugging.

Current launch posture:
- Launch-blocking fixes are implemented or covered by the current v1 architecture.
- Scale-dependent fixes are documented and intentionally deferred until multi-worker or higher-volume usage.
- Any pipeline failure now writes a sanitized `pipeline_errors` row when Supabase is configured.

## Status Table

| # | Fix | Status | Current implementation |
|---|-----|--------|------------------------|
| 1 | Redis job queue crash recovery | Deferred | PM2 restarts FastAPI for v1. Redis/RQ is still needed before multi-worker or paid-volume launch because the current queue is in memory. |
| 2 | Copilot SDK timeout | Done | `CopilotSDKClient.generate()` wraps `session.send_and_wait()` in `asyncio.wait_for(...)`. |
| 3 | Blackboard memory pruning | Partially covered | Large raw/code fields are omitted from error snapshots and AI review snapshots. Full in-job pruning is deferred because downstream status/preview still reads generated HTML. |
| 4 | Global 5-minute job timeout | Done | `JobQueue._worker_loop()` wraps each full job in `asyncio.wait_for(..., timeout=settings.pipeline_job_timeout)`. |
| 5 | Smarter cloud exceptions | Done | NIM returns separate `AIRateLimitError`, `AIServiceUnavailableError`, and `AIProviderError`; the shared AI client retries 429s after 15 seconds and falls back immediately on 5xx/timeouts. |
| 6 | ChromaDB persistent file path | Done | RAG uses `chromadb.PersistentClient(path=settings.chroma_persist_path)`. |
| 7 | Request deduplication | Done | `JobQueue.enqueue()` returns an existing queued/running job for matching project/request signatures. |
| 8 | GitHub App token caching | Done | `GitHubDeploymentClient` caches installation tokens in memory for 50 minutes. |
| 9 | Move prompts to files | Deferred | Still useful once prompts are changing daily. Not launch-blocking while prompt edits are code-reviewed with the agents. |
| 10 | Structured error logging to Supabase | Done | Pipeline failures call `insert_pipeline_error()` and store sanitized blackboard snapshots in `public.pipeline_errors`. |
| 11 | Per-user pipeline rate limiting | Covered at app layer for v1 | Site limits, billing gates, revision limits, and request dedupe block the main abuse paths. Add Redis-backed FastAPI per-user limits before public paid volume. |

## Implemented In This Pass

### Global Pipeline Timeout

The worker now applies `PIPELINE_JOB_TIMEOUT` to the whole generation job. If any agent or deploy step
hangs, the job fails, the project is marked failed, and the failure is logged.

Relevant files:
- `Onara_Code/pipeline/onara_pipeline/job_queue.py`
- `Onara_Code/pipeline/onara_pipeline/config.py`

### Structured Error Logging

On failure, FastAPI writes:
- `job_id`
- `project_id`
- `user_id`
- active agent phase when known
- error type
- error message
- sanitized blackboard snapshot
- recent progress log tail

Large generated-code fields are not stored directly. The snapshot records their type/size instead.

Relevant files:
- `Onara_Code/pipeline/onara_pipeline/job_queue.py`
- `Onara_Code/pipeline/onara_pipeline/deployment/supabase.py`
- `Onara_Code/supabase/migrations/016_detach_pipeline_errors_job_fk.sql`

### GitHub App Token Caching

GitHub installation tokens are valid for 60 minutes. The pipeline now caches them for 50 minutes,
which avoids an extra GitHub API round trip on every deployment and site-file fetch.

Relevant file:
- `Onara_Code/pipeline/onara_pipeline/deployment/github.py`

### Smarter AI Provider Retry Policy

The pipeline now treats provider failures differently:
- 429 rate limits wait at least 15 seconds and retry.
- 5xx provider failures and transport timeouts fall back immediately to the next model route.
- Configuration errors fail/fallback without retry loops.

Relevant files:
- `Onara_Code/pipeline/onara_pipeline/ai_client/client.py`
- `Onara_Code/pipeline/onara_pipeline/ai_client/nim.py`
- `Onara_Code/pipeline/onara_pipeline/ai_client/copilot.py`

## Deferred Items

### Redis/RQ Queue

Do this when Onara moves beyond the mini-PC single-worker launch setup.

Reason:
- Redis adds operational complexity.
- PM2 plus in-memory queue is acceptable for the current v1 private/early launch.
- Before real paid volume, queued jobs should survive FastAPI restarts.

### Prompt Files

Move prompts into `prompts/*.txt` when prompt iteration becomes frequent.

Reason:
- Current prompt changes are still code-reviewed with agent code.
- Prompt hot-reload is useful, but not a reliability blocker.

### Full FastAPI Per-User Rate Limiting

Add Redis-backed user limits before broad public traffic.

Reason:
- Current app-layer gates already enforce site limits, revision limits, checkout gating, and queue dedupe.
- True per-user FastAPI limits need shared state if multiple workers/servers run.

## Verification

Run:

```powershell
cd C:\Users\Aarush\Downloads\Onara\Onara_Code\app
pnpm.cmd type-check
pnpm.cmd build

cd C:\Users\Aarush\Downloads\Onara
python -m compileall Onara_Code\pipeline\onara_pipeline
```

After pushing migrations:

```powershell
supabase db push --linked
```

Then force a pipeline failure in a test project and verify:

```sql
select job_id, project_id, active_agent, error_type, left(error_message, 120), created_at
from public.pipeline_errors
order by created_at desc
limit 5;
```
