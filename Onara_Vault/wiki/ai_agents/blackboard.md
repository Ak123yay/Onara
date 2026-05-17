# Blackboard — Shared Pipeline State

The blackboard is a Python dict passed between all 10 agents. It is the single source of truth for a generation job's in-progress state. Source: `raw/03_agent_prompts.md`.

---

## Schema

```python
blackboard = {
    # Immutable inputs — set at job start, never changed
    "job_id":        str,           # UUID — matches pipeline_jobs.id in Supabase
    "user_id":       str,           # UUID — matches users.id
    "project_id":    str,           # UUID — matches projects.id
    "business_data": dict,          # raw Google Places API response

    # Agent outputs
    # Set to None after the downstream consumer reads them to free RAM
    "analyst_output":  dict | None, # Agent 1 → read by Agents 2, 3, 4
    "content_output":  dict | None, # Agent 2 → read by Agents 4, 5
    "style_output":    dict | None, # Agent 3 → read by Agents 4, 5
    "planner_output":  dict | None, # Agent 4 → read by Agent 5
    "prompt_output":   str  | None, # Agent 5 → read by Agent 6; set to None after
    "raw_code":        str  | None, # Agent 6 → read by Agent 7; set to None after
    "debugged_code":   str  | None, # Agent 7 → read by Agent 8; set to None after
    "seo_code":        str  | None, # Agent 8 → read by Agent 9; set to None after
    "qa_result":       dict | None, # Agent 9 → read by Supervisor
    "final_html":      str,         # Agent 10 output — sent to deployment

    # Pipeline state
    "current_agent":  str,          # agent name currently running
    "retry_count":    int,          # retries for the current agent (reset per agent)
    "started_at":     float,        # time.time() at job start
    "completed_at":   float | None, # time.time() when done, None until then
}
```

---

## Field Lifetimes

| Field | Set by | Read by | Cleared after |
|-------|--------|---------|---------------|
| `business_data` | Job start | Agents 1, 2, 3, 8 | Never cleared |
| `analyst_output` | Agent 1 | Agents 2, 3, 4 | After Agent 4 reads |
| `content_output` | Agent 2 | Agents 4, 5 | After Agent 5 reads |
| `style_output` | Agent 3 | Agents 4, 5 | After Agent 5 reads |
| `planner_output` | Agent 4 | Agent 5 | After Agent 5 reads |
| `prompt_output` | Agent 5 | Agent 6 | After Agent 6 reads |
| `raw_code` | Agent 6 | Agent 7 | After Agent 7 reads |
| `debugged_code` | Agent 7 | Agent 8 | After Agent 8 reads |
| `seo_code` | Agent 8 | Agent 9 | After Agent 9 reads |
| `qa_result` | Agent 9 | Supervisor | Never cleared |
| `final_html` | Agent 10 | Deployment | Never cleared |

---

## Parallel Execution (Agents 2 + 3)

Agents 2 and 3 both read `analyst_output` and `business_data`. They run concurrently via `asyncio.gather()`. The Supervisor waits for both to complete before allowing Agent 4 to start.

```python
content_task = asyncio.create_task(run_agent_2(blackboard))
style_task   = asyncio.create_task(run_agent_3(blackboard))
await asyncio.gather(content_task, style_task)
# Both outputs now on blackboard — Agent 4 can proceed
```

---

## Memory Management

The pipeline server runs on a machine with limited RAM (8–16 GB shared with Ollama models). Large intermediates — particularly `raw_code`, `debugged_code`, and `seo_code` — can each be 20–80 KB. Setting them to `None` immediately after the downstream agent reads them keeps peak memory low.

`final_html` is never cleared — it's needed by the deployment step after the pipeline completes.

---

## Blackboard and Supabase

The blackboard lives in-process in FastAPI RAM. It is **not** persisted to Supabase during the pipeline run — only the `pipeline_jobs.progress_log` array is written incrementally (one entry per completed agent). The full blackboard is never stored.

If the FastAPI server restarts mid-job, the job is marked `failed` in Supabase and the user sees a retry button. There is no checkpoint/resume.

---

## Error Snapshot

When an agent fails and the Supervisor records the failure, it writes a `pipeline_errors` row to Supabase including a `blackboard_snapshot`. The snapshot **excludes** the large code fields (`raw_code`, `debugged_code`, `seo_code`, `final_html`) to keep the row size reasonable for production debugging.

```python
snapshot = {k: v for k, v in blackboard.items()
            if k not in ("raw_code", "debugged_code", "seo_code", "final_html")}
```
