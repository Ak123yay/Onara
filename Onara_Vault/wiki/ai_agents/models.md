# AI Models — Onara

_Which models power each agent, why, fallback logic, and plan-gated model routing._

---

## Model Assignment by Agent

| Agent | Primary Model | Provider | Fallback | Notes |
|-------|--------------|----------|---------|-------|
| Agent 1 — Business Analyst | z-ai/glm-5.1 | NVIDIA NIM | meta/llama-4-maverick-17b-128e-instruct, then gemma4:e4b | Turns GBP data into site requirements |
| Agent 2 — Content Writer | qwen3.5:9b | Ollama (local) | gemma4:e4b (Ollama) | Runs parallel with Agent 3 |
| Agent 3 — Style Agent | qwen3.5:9b | Ollama (local) | gemma4:e4b (Ollama) | Produces design tokens |
| Agent 4 — Planner | z-ai/glm-5.1 | NVIDIA NIM | meta/llama-4-maverick-17b-128e-instruct, then gemma4:e4b | Creates component blueprint |
| Agent 5 — Prompt Engineer | z-ai/glm-5.1 | NVIDIA NIM | meta/llama-4-maverick-17b-128e-instruct, then gemma4:e4b | Builds Agent 6 prompt |
| Agent 6 — Code Generator | Plan-gated | NVIDIA NIM / direct API | meta/llama-4-maverick-17b-128e-instruct, then gemma4:e4b | Generates complete index.html |
| Agent 7 — Debugger | z-ai/glm-5.1 | NVIDIA NIM | meta/llama-4-maverick-17b-128e-instruct, then gemma4:e4b | Fixes complete HTML or returns PASS |
| Agent 8 — SEO Agent | qwen3.5:9b | Ollama (local) | gemma4:e4b (Ollama) | Injects title, meta, OG, JSON-LD |
| Agent 9 — QA Agent | z-ai/glm-5.1 | NVIDIA NIM | meta/llama-4-maverick-17b-128e-instruct, then gemma4:e4b | PASS/FAIL quality gate |
| Agent 10 — Mobile Agent | qwen3.5:9b | Ollama (local) | gemma4:e4b (Ollama) | Produces mobile-optimized full HTML |
| Supervisor | gemma4:e4b | Ollama (local) | qwen3.5:9b (Ollama) | Validates between steps; fallback uses primary local model only if Gemma fails |

---

## Model Details

### NVIDIA NIM (Cloud)

- **Endpoint**: `https://integrate.api.nvidia.com/v1` (`NVIDIA_NIM_BASE_URL`)
- **Auth**: `nvapi-...` key (`NVIDIA_NIM_API_KEY`)
- **Models used**: `z-ai/glm-5.1`, `meta/llama-4-maverick-17b-128e-instruct`
- **Rate limit**: Free NIM tier — 40 RPM, 1000 RPD
- **Context window**: 128K tokens
- **When used**: Agents 1, 4, 5, 6, 7, 9
- **Cost**: Free (NIM free tier covers all expected v1 traffic)
- **Fallback**: If GLM 5.1 returns 429/503, try Llama 4 Maverick, then use the agent-specific Ollama fallback from the table above

### Ollama (Local)

- **Primary model**: `qwen3.5:9b` (`OLLAMA_PRIMARY_MODEL`) — Agents 2, 3, 8, and 10
- **Fallback / supervisor model**: `gemma4:e4b` (`OLLAMA_FALLBACK_MODEL`) — Supervisor and local fallback for cloud-primary agents
- **Reason for refresh**: User-directed June 2026 model update. Ollama lists `qwen3.5:9b` as a current 9.65B local model, and `gemma4:e4b` as an 8B Apache-licensed model suited for reasoning, coding, and agentic fallback work.
- **Endpoint**: `http://localhost:11434` when FastAPI and Ollama run on the same host
- **Context window**: depends on local Ollama model configuration
- **When used**: local agents, supervisor checks, and cloud fallback
- **Cost**: $0 when running on the dev PC, mini PC, or same server as FastAPI
- **Fallback chain**: GLM 5.1 -> Llama 4 Maverick -> agent-specific Ollama fallback -> job fails with a meaningful error

---

## Agent 6 — Plan-Gated Model Routing

Agent 6 (Code Generator) uses different models based on the user's subscription plan:

| Plan | Model | Provider | Rationale |
|------|-------|----------|-----------|
| Free | `onara-default` | NVIDIA NIM | Executable today: `z-ai/glm-5.1` -> `meta/llama-4-maverick-17b-128e-instruct` -> `gemma4:e4b` |
| Starter | `copilot-gemini-3.1-pro`, `copilot-gpt-5.4-mini` | GitHub Copilot SDK | Executable when `github-copilot-sdk` and `COPILOT_GITHUB_TOKEN` are configured; actual SDK IDs are `gemini-3.1-pro-preview` and `gpt-5.4-mini`; otherwise falls back to Onara default |
| Starter fallback | `onara-default` | NVIDIA NIM / Ollama | Used when Copilot routing is unavailable, locked, or not executable |
| Pro | `openai-gpt-5.4`, `claude-sonnet-4` | User-provided API key | Listed by the selector but disabled until user API-key storage and provider clients exist |
| Pro fallback | `onara-default` | NVIDIA NIM / Ollama | Used when user key routing is unavailable, locked, or not executable |
| Trial | Same as Pro | Same as Pro | The 14-day trial is full Pro access; `users.is_trial=true` maps to effective plan `pro` |

Benchmark note: On June 14, 2026, local NIM benchmarking from the pipeline environment selected
`meta/llama-4-maverick-17b-128e-instruct` as the slightly higher weighted-value model across task
quality, reliability, and speed. `z-ai/glm-5.1` is the active primary route by user preference,
with Llama 4 Maverick as the cloud fallback and `gemma4:e4b` as the local fallback. Older DeepSeek
and Kimi routes were removed from the active default path because they timed out or produced
inconsistent code-task output under the benchmark budget.

- Plan read from `users.plan` and `users.is_trial` before pipeline start; active trials are sent to FastAPI as effective `pro`.
- Optional request field: `agent_6_model`.
- Invalid, locked, unavailable, or failing options fall back server-side to `onara-default`.
- `COPILOT_GITHUB_TOKEN` is loaded from FastAPI `.env`; Copilot runs in restricted SDK mode with no Agent 6 tool/file permissions.
- Model selection is preserved on the queued job; Agent 6 reads from job config once code generation is implemented.

---

## Fallback Logic

Cloud-primary agents follow this fallback pattern. Local-primary agents call Ollama first and fail with the same structured error shape if both local attempts fail.

```python
async def call_llm(prompt, route):
    for candidate in route.candidates():
        try:
            return await call_provider(candidate.provider, candidate.model, prompt)
        except (RateLimitError, ServiceUnavailableError):
            log.warning("Model unavailable, trying next fallback candidate")
    raise AgentError("All primary and fallback models failed")
```

- Supervisor retries failed agents up to 3× before marking job failed
- Each retry uses the same fallback logic

---

## Why Two Providers

**NVIDIA NIM** for quality-critical agents (1, 4, 5, 6, 7, 9):
- Larger cloud models produce better planning, prompting, code generation, debugging, and QA
- Free tier eliminates cost at v1 scale

**Ollama locally** for speed-critical agents (2, 3, 8, 10, Supervisor):
- No network hop
- Free
- Agents 2+3 run in parallel — local execution avoids NIM rate limit contention
- `qwen3.5:9b` is the local primary; `gemma4:e4b` is the independent under-10B fallback

See `wiki/decisions/adr-001.md` for why LangChain was excluded despite multi-model routing.

---

## Related Files

- `wiki/ai_agents/agents.md` — per-agent input/output/retry details
- `wiki/integrations/nvidia-nim.md` — NIM API setup and rate limit management
- `wiki/integrations/ollama.md` — Ollama setup and model management
- `wiki/architecture/env-vars.md` — all model-related env vars
