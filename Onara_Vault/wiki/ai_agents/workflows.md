# Agent Workflows — Onara Pipeline

_Pipeline sequencing, Blackboard pattern, parallel execution, SSE streaming, retry logic. Source: raw/03_agent_prompts.md + raw/Onara_Business_Plan_v12.md._

---

## Execution Model

The pipeline uses a **Blackboard pattern** — a shared Python dict passed between agents. The Supervisor validates output between every step. No LangChain/LangGraph (see ADR-001).

---

## Pipeline Sequence

```
Job received by FastAPI
    │
    ▼
[QUEUE MANAGER] — dedup by project_id, assign position
    │
    ▼
[AGENT 1 — Analyst]          z-ai/glm-5.1 (NIM)
    │ → blackboard.analyst_output
    ▼
┌──── PARALLEL ────┐
│                  │
[AGENT 2]       [AGENT 3]
Content Writer  Style Agent
qwen3.5:9b        qwen3.5:9b
    │                │
    └───────┬─────────┘
            ▼
[AGENT 4 — Planner]          z-ai/glm-5.1 (NIM)
    │ → blackboard.planner_output
    ▼
[AGENT 5 — Prompt Engineer]  z-ai/glm-5.1 (NIM)
    │ → blackboard.prompt_output
    ▼
[AGENT 6 — Code Generator]   z-ai/glm-5.1 / Claude (Pro)
    │ → blackboard.raw_code
    ▼
[AGENT 7 — Debugger]         z-ai/glm-5.1 (NIM)
    │ → blackboard.debugged_code
    ▼
[AGENT 8 — SEO Agent]        qwen3.5:9b (Ollama)
    │ → blackboard.seo_code
    ▼
[AGENT 9 — QA Agent]         z-ai/glm-5.1 (NIM)
    │ FAIL → retry from Agent 6 (max 2)
    │ PASS → blackboard.qa_result
    ▼
[AGENT 10 — Mobile Agent]    qwen3.5:9b (Ollama)
    │ → blackboard.final_html
    ▼
[DEPLOYMENT]
  1. Cloudflare Pages Direct Upload → {id}.pages.dev
  2. GitHub commit → onara-sites/{projectId}/index.html
  3. Supabase storage backup
  4. Update project: status='live', public_url
  5. Resend email: "Your site is live"
```

---

## Parallelism

Agents 2 and 3 run concurrently — independent inputs, both write to blackboard before Agent 4 starts. All other agents are strictly sequential.

---

## Retry Logic

| Attempt | Action |
|---------|--------|
| 1st failure | Retry same agent, same prompt |
| 2nd failure | Retry with fallback model |
| 3rd failure | Job marked `failed`; `error_agent` set; `pipeline_failed` SSE event |

Failed retries do not deduct a user revision. QA failures retry from Agent 6 only — not from Agent 1.

---

## SSE Progress Stream

Client opens `GET /api/stream/:job_id` immediately after receiving `job_id`.

```
event: agent_started
data: {"agent": "analyst", "started_at": "..."}

event: agent_completed
data: {"agent": "analyst", "duration_ms": 3200, "agents_completed": 1}

event: pipeline_done
data: {"job_id": "...", "preview_url": "...", "public_url": "...", "total_ms": 54000}

event: pipeline_failed
data: {"job_id": "...", "failed_agent": "code_generator", "error": "Timeout"}

event: heartbeat
data: {"timestamp": "..."}
```

Heartbeat every 30s prevents proxy timeouts. Reconnect: 2s wait → reconnect → server sends current state. Max 5 reconnects; then fall back to polling `/api/status/:job_id` every 5s.

---

## Queue

In-memory, deduplication by `project_id`. Max concurrency via `PIPELINE_MAX_CONCURRENCY` (default: 1 for local Ollama development; raise only after server load testing). v1.5: BullMQ + Redis when avg wait > 5 minutes.

---

## Memory Management

Large intermediate outputs set to `None` after consumption:
- `raw_code` → `None` after Agent 7 consumes
- `debugged_code` → `None` after Agent 8 consumes
- `seo_code` → `None` after Agent 9 consumes

Only `final_html` retained for deployment.
