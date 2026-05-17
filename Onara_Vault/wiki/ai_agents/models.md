# AI Models — Onara

_Which models power each agent, why, fallback logic, and plan-gated model routing._

---

## Model Assignment by Agent

| Agent | Primary Model | Provider | Fallback | Notes |
|-------|--------------|----------|---------|-------|
| Agent 1 — GBP Fetcher | Google Places API | Google | None | API call, not LLM |
| Agent 2 — Content Writer | qwen3:8b | Ollama (local) | qwen3.5:9b (Ollama) | Local only |
| Agent 3 — Style Picker | qwen3:8b | Ollama (local) | qwen3.5:9b (Ollama) | Runs parallel with Agent 2 |
| Agent 4 — Brand Voice | meta/llama-3.3-70b-instruct | NVIDIA NIM | qwen3.5:9b (Ollama) | Cloud; free NIM tier |
| Agent 5 — SEO Specialist | meta/llama-3.3-70b-instruct | NVIDIA NIM | qwen3.5:9b (Ollama) | Cloud; free NIM tier |
| Agent 6 — Layout Selector | **Plan-gated** (see below) | — | qwen3.5:9b (Ollama) | Model varies by plan |
| Agent 7 — HTML Generator | meta/llama-3.3-70b-instruct | NVIDIA NIM | qwen3.5:9b (Ollama) | Largest output; most tokens |
| Agent 8 — Asset Optimizer | qwen3:8b | Ollama (local) | qwen3.5:9b (Ollama) | Local only |
| Agent 9 — QA Gate | meta/llama-3.3-70b-instruct | NVIDIA NIM | qwen3.5:9b (Ollama) | Must pass 10 checks |
| Agent 10 — Deployment | None | — | — | Pure API calls |
| Supervisor | qwen3.5:9b | Ollama (local) | qwen3:8b (Ollama) | Validates between steps |

---

## Model Details

### NVIDIA NIM (Cloud)

- **Endpoint**: `https://integrate.api.nvidia.com/v1` (`NVIDIA_NIM_BASE_URL`)
- **Auth**: `nvapi-...` key (`NVIDIA_NIM_API_KEY`)
- **Models used**: `meta/llama-3.3-70b-instruct`
- **Rate limit**: Free NIM tier — 40 RPM, 1000 RPD
- **Context window**: 128K tokens
- **When used**: Agents 4, 5, 7, 9 (higher-quality reasoning tasks)
- **Cost**: Free (NIM free tier covers all expected v1 traffic)
- **Fallback**: If NIM returns 429/503 → fallback to Ollama `qwen3:8b`

### Ollama (Local)

- **Primary model**: `qwen3:8b` (`OLLAMA_PRIMARY_MODEL`) — Agents 2, 3, 8; best under-8B instruction model
- **Supervisor / fallback model**: `qwen3.5:9b` (`OLLAMA_FALLBACK_MODEL`) — Supervisor + all NIM fallbacks; IFBench 76.5 (beats GPT-5.2 at 75.4)
- **Endpoint**: `http://localhost:11434` (dev) or DigitalOcean Droplet IP (prod)
- **Context window**: ~8K tokens (qwen3:8b), ~8K tokens (qwen3.5:9b)
- **When used**: Agents 2, 3, 8 on qwen3:8b; Supervisor + NIM fallback on qwen3.5:9b
- **Cost**: $0 — running on dev machine or same DO droplet as FastAPI
- **Fallback chain**: NIM → qwen3.5:9b → job fails with meaningful error; qwen3:8b → qwen3.5:9b → fail

---

## Agent 6 — Plan-Gated Model Routing

Agent 6 (Layout Selector) uses different models based on the user's subscription plan:

| Plan | Model | Provider | Rationale |
|------|-------|----------|-----------|
| Free / Trial | kimi-k2.6 | Kimi API | Free tier; good layout reasoning |
| Starter | kimi-k2.6 | Kimi API | Same as free |
| Pro | claude-sonnet-4-X | Anthropic | Better layout quality for paying users |
| Pro (user-provided key) | GPT-4o | OpenAI | User supplies their own OpenAI key |

- Plan read from `subscriptions` table before pipeline start
- Model selection passed into job config; Agent 6 reads from job config

---

## Fallback Logic

All agents follow the same fallback pattern:

```python
async def call_llm(prompt, primary_model, fallback_model):
    try:
        return await call_nim(prompt, primary_model)
    except (RateLimitError, ServiceUnavailableError):
        log.warning(f"NIM unavailable, falling back to {fallback_model}")
        return await call_ollama(prompt, fallback_model)
    except OllamaError:
        raise AgentError(f"Both primary and fallback models failed")
```

- Supervisor retries failed agents up to 3× before marking job failed
- Each retry uses the same fallback logic

---

## Why Two Providers

**NVIDIA NIM** for quality-critical agents (4, 5, 7, 9):
- 70B parameter model produces better copywriting, SEO tags, and HTML structure
- Free tier eliminates cost at v1 scale

**Ollama locally** for speed-critical agents (2, 3, 8, Supervisor):
- Sub-second latency (no network hop)
- Free
- Agents 2+3 run in parallel — local execution avoids NIM rate limit contention

See `wiki/decisions/adr-001.md` for why LangChain was excluded despite multi-model routing.

---

## Related Files

- `wiki/ai_agents/agents.md` — per-agent input/output/retry details
- `wiki/integrations/nvidia-nim.md` — NIM API setup and rate limit management
- `wiki/integrations/ollama.md` — Ollama setup and model management
- `wiki/architecture/env-vars.md` — all model-related env vars
