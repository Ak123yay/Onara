# NVIDIA NIM Integration — Onara

_Free NIM API key, model access, rate limits, and fallback behavior._

---

## What Onara Uses NVIDIA NIM For

Agents 1, 4, 5, 6, 7, and 9 use NVIDIA NIM or NIM-compatible routing for higher-quality language model inference:
- Agent 1 — Business Analyst
- Agent 4 — Planner
- Agent 5 — Prompt Engineer
- Agent 6 — Code Generator (Free/Trial routing, plus fallback for paid tiers)
- Agent 7 — Debugger
- Agent 9 — QA Agent

NIM provides cloud model access for v1 while keeping the local machine focused on Ollama fallback and speed-critical agents.

---

## Required Env Vars

| Variable | Where | Value |
|----------|-------|-------|
| `NVIDIA_NIM_API_KEY` | FastAPI `.env` | `nvapi-...` |
| `NVIDIA_NIM_BASE_URL` | FastAPI `.env` | `https://integrate.api.nvidia.com/v1` |

`NVIDIA_NIM_BASE_URL` is fixed — do not change it.

---

## Getting a Free NIM API Key

1. Go to **build.nvidia.com**
2. Sign in or create an NVIDIA developer account
3. Navigate to "NIM APIs" or "API Catalog"
4. Select one of the models used in `wiki/ai_agents/models.md`
5. Click "Get API Key" → copy the `nvapi-...` key
6. Paste into FastAPI `.env` as `NVIDIA_NIM_API_KEY`

The key grants access to all NIM-hosted models under the free tier.

---

## Models Used

| Model | NIM ID | Use in Onara |
|-------|--------|-------------|
| GLM 5.1 | `z-ai/glm-5.1` | Main NIM model for Agents 1, 4, 5, 6, 7, and 9 |
| Llama 4 Maverick | `meta/llama-4-maverick-17b-128e-instruct` | Cloud fallback before local Gemma |

Benchmark note: On June 14, 2026, `meta/llama-4-maverick-17b-128e-instruct` scored slightly higher
on weighted value from the pipeline environment. The score weights task quality, reliability, and
speed. `z-ai/glm-5.1` is close enough on value and is the active primary route by user preference.
DeepSeek V4 Flash/Pro repeatedly timed out under the benchmark budget, and Kimi K2.6 was
inconsistent on the code-generation task.

---

## Free Tier Limits

| Limit | Value |
|-------|-------|
| Requests per minute (RPM) | 40 |
| Requests per day (RPD) | 1,000 |
| Tokens per minute | ~100,000 |
| Context window | 128K tokens |

**At local v1 dev scale** (1 concurrent job max, up to 6 cloud-primary agents per job):
- Max NIM calls per minute: 1 job x 6 agents = 6 calls before retries
- Max NIM calls per day: ~50 jobs x 6 agents = 300 calls before retries

---

## API Usage Pattern

NIM uses OpenAI-compatible API format:

```python
import httpx

response = await httpx.post(
    f"{NVIDIA_NIM_BASE_URL}/chat/completions",
    headers={"Authorization": f"Bearer {NVIDIA_NIM_API_KEY}"},
    json={
        "model": model_id,
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 4096,
        "temperature": 0.7
    }
)
```

---

## Rate Limit Handling

When NIM returns `429 Too Many Requests`:
1. FastAPI logs the rate limit event
2. Falls back to the agent-specific Ollama model from `wiki/ai_agents/models.md`
3. Job continues with fallback model output
4. Logged as warning (not error) — output quality may vary

If NIM returns `503 Service Unavailable`:
- Same fallback to Ollama applies

---

## When to Upgrade (Paid NIM)

Upgrade from free tier when:
- Daily job volume exceeds ~200 jobs/day
- Rate limit fallbacks occur frequently (check FastAPI logs)
- Agent output quality is noticeably degraded by frequent Ollama fallbacks

NVIDIA NIM paid tiers are available through the same portal.

---

## Related Files

- `wiki/ai_agents/models.md` — full model assignment per agent
- `wiki/integrations/ollama.md` — fallback model configuration
- `wiki/architecture/env-vars.md` — `NVIDIA_NIM_API_KEY`, `NVIDIA_NIM_BASE_URL`
