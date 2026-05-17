# NVIDIA NIM Integration — Onara

_Free NIM API key, model access, rate limits, and fallback behavior._

---

## What Onara Uses NVIDIA NIM For

Agents 4, 5, 7, and 9 use NVIDIA NIM for higher-quality language model inference:
- Agent 4 — Brand Voice (copy tone adjustment)
- Agent 5 — SEO Specialist (meta tags, structured data)
- Agent 7 — HTML Generator (full site HTML)
- Agent 9 — QA Gate (10-check validation)

NIM provides access to large models (70B+) for free, making it ideal for v1 where cost must be near zero.

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
4. Select `meta/llama-3.3-70b-instruct`
5. Click "Get API Key" → copy the `nvapi-...` key
6. Paste into FastAPI `.env` as `NVIDIA_NIM_API_KEY`

The key grants access to all NIM-hosted models under the free tier.

---

## Model Used

| Model | NIM ID | Use in Onara |
|-------|--------|-------------|
| Meta LLaMA 3.3 70B Instruct | `meta/llama-3.3-70b-instruct` | Agents 4, 5, 7, 9 |

---

## Free Tier Limits

| Limit | Value |
|-------|-------|
| Requests per minute (RPM) | 40 |
| Requests per day (RPD) | 1,000 |
| Tokens per minute | ~100,000 |
| Context window | 128K tokens |

**At v1 scale** (3 concurrent jobs max, 4 NIM agents per job):
- Max NIM calls per minute: 3 jobs × 4 agents = 12 calls → well under 40 RPM
- Max NIM calls per day: ~50 jobs × 4 agents = 200 calls → well under 1,000 RPD

---

## API Usage Pattern

NIM uses OpenAI-compatible API format:

```python
import httpx

response = await httpx.post(
    f"{NVIDIA_NIM_BASE_URL}/chat/completions",
    headers={"Authorization": f"Bearer {NVIDIA_NIM_API_KEY}"},
    json={
        "model": "meta/llama-3.3-70b-instruct",
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
2. Falls back to Ollama `qwen3:8b` for the current agent
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
