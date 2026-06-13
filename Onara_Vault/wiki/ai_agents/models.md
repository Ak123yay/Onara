# AI Models — Onara

_Which models power each agent, why, fallback logic, and plan-gated model routing._

---

## Model Assignment by Agent

| Agent | Primary Model | Provider | Fallback | Notes |
|-------|--------------|----------|---------|-------|
| Agent 1 — Business Analyst | deepseek-ai/deepseek-v4-flash | NVIDIA NIM | gemma4:e4b (Ollama) | Turns GBP data into site requirements |
| Agent 2 — Content Writer | qwen3.5:9b | Ollama (local) | gemma4:e4b (Ollama) | Runs parallel with Agent 3 |
| Agent 3 — Style Agent | qwen3.5:9b | Ollama (local) | gemma4:e4b (Ollama) | Produces design tokens |
| Agent 4 — Planner | deepseek-ai/deepseek-v4-pro | NVIDIA NIM | gemma4:e4b (Ollama) | Creates component blueprint |
| Agent 5 — Prompt Engineer | moonshotai/kimi-k2.6 | NVIDIA NIM | gemma4:e4b (Ollama) | Builds Agent 6 prompt |
| Agent 6 — Code Generator | Plan-gated | NVIDIA NIM / direct API | deepseek-ai/deepseek-v4-flash, then gemma4:e4b | Generates complete index.html |
| Agent 7 — Debugger | moonshotai/kimi-k2.6 | NVIDIA NIM | gemma4:e4b (Ollama) | Fixes complete HTML or returns PASS |
| Agent 8 — SEO Agent | qwen3.5:9b | Ollama (local) | gemma4:e4b (Ollama) | Injects title, meta, OG, JSON-LD |
| Agent 9 — QA Agent | deepseek-ai/deepseek-v4-pro | NVIDIA NIM | gemma4:e4b (Ollama) | PASS/FAIL quality gate |
| Agent 10 — Mobile Agent | qwen3.5:9b | Ollama (local) | gemma4:e4b (Ollama) | Produces mobile-optimized full HTML |
| Supervisor | gemma4:e4b | Ollama (local) | qwen3.5:9b (Ollama) | Validates between steps; fallback uses primary local model only if Gemma fails |

---

## Model Details

### NVIDIA NIM (Cloud)

- **Endpoint**: `https://integrate.api.nvidia.com/v1` (`NVIDIA_NIM_BASE_URL`)
- **Auth**: `nvapi-...` key (`NVIDIA_NIM_API_KEY`)
- **Models used**: `deepseek-ai/deepseek-v4-flash`, `deepseek-ai/deepseek-v4-pro`, `moonshotai/kimi-k2.6`
- **Rate limit**: Free NIM tier — 40 RPM, 1000 RPD
- **Context window**: 128K tokens
- **When used**: Agents 1, 4, 5, 6, 7, 9
- **Cost**: Free (NIM free tier covers all expected v1 traffic)
- **Fallback**: If NIM returns 429/503, use the agent-specific Ollama fallback from the table above

### Ollama (Local)

- **Primary model**: `qwen3.5:9b` (`OLLAMA_PRIMARY_MODEL`) — Agents 2, 3, 8, and 10
- **Fallback / supervisor model**: `gemma4:e4b` (`OLLAMA_FALLBACK_MODEL`) — Supervisor and local fallback for cloud-primary agents
- **Reason for refresh**: User-directed June 2026 model update. Ollama lists `qwen3.5:9b` as a current 9.65B local model, and `gemma4:e4b` as an 8B Apache-licensed model suited for reasoning, coding, and agentic fallback work.
- **Endpoint**: `http://localhost:11434` when FastAPI and Ollama run on the same host
- **Context window**: depends on local Ollama model configuration
- **When used**: local agents, supervisor checks, and cloud fallback
- **Cost**: $0 when running on the dev PC, mini PC, or same server as FastAPI
- **Fallback chain**: Primary cloud model -> agent-specific Ollama fallback -> job fails with a meaningful error

---

## Agent 6 — Plan-Gated Model Routing

Agent 6 (Code Generator) uses different models based on the user's subscription plan:

| Plan | Model | Provider | Rationale |
|------|-------|----------|-----------|
| Free / Trial | moonshotai/kimi-k2.6 | NVIDIA NIM | Default code generation, no user key needed |
| Starter | GitHub Copilot SDK selectable models | Copilot SDK | Student-plan models such as gpt-5.2-codex, gpt-4.1, gpt-4o |
| Starter fallback | moonshotai/kimi-k2.6 | NVIDIA NIM | Used when Copilot SDK is unavailable or rate-limited |
| Pro | Claude or OpenAI model | User-provided API key | Better code quality for paying users; key stored encrypted |
| Pro fallback | moonshotai/kimi-k2.6 | NVIDIA NIM | Used when user key is missing, invalid, or rate-limited |

- Plan read from `users.plan` and `users.is_trial` before pipeline start
- Model selection passed into job config; Agent 6 reads from job config

---

## Fallback Logic

Cloud-primary agents follow this fallback pattern. Local-primary agents call Ollama first and fail with the same structured error shape if both local attempts fail.

```python
async def call_llm(prompt, primary_model, fallback_model):
    try:
        return await call_primary_provider(prompt, primary_model)
    except (RateLimitError, ServiceUnavailableError):
        log.warning(f"Primary provider unavailable, falling back to {fallback_model}")
        return await call_ollama(prompt, fallback_model)
    except OllamaError:
        raise AgentError(f"Both primary and fallback models failed")
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
