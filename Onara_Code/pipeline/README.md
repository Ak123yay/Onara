# Onara Pipeline

FastAPI server for the Onara generation pipeline.

## Local Run

```powershell
cd C:\Users\Aarush\Downloads\Onara\Onara_Code\pipeline
python -m pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

## Verify

```powershell
curl http://localhost:8000/health

$secret = (Select-String -Path .env -Pattern '^PIPELINE_API_SECRET=').Line.Split('=', 2)[1].Trim()

$body = @{
  user_id = "dev-user"
  user_plan = "pro"
  is_trial = $true
  agent_6_model = "onara-default"
  business_data = @{ name = "Demo Contractor" }
  style_preferences = @{ palette = "onara" }
} | ConvertTo-Json -Depth 5

$jobId = (curl -Method POST http://localhost:8000/generate `
  -Headers @{ "X-Pipeline-Secret" = $secret; "Content-Type" = "application/json" } `
  -Body $body).Content | ConvertFrom-Json | Select-Object -ExpandProperty job_id

Start-Sleep -Seconds 5

curl http://localhost:8000/pipeline/status/$jobId `
  -Headers @{ "X-Pipeline-Secret" = $secret } `
  -UseBasicParsing
```

Phase 18 now runs in the background after enqueue:

- Agent 1 Analyst: `z-ai/glm-5.1` through NIM, with NIM/local fallback and deterministic repair fallback.
- Agent 2 Content Writer: `qwen3.5:9b` through Ollama, runs in parallel with Agent 3.
- Agent 3 Style Agent: `qwen3.5:9b` through Ollama, runs in parallel with Agent 2.
- `/pipeline/status/{job_id}` exposes `current_agent`, `agents_completed`, `blackboard_keys`, and progress log entries.

## AI Client Smoke Test

```powershell
python -m compileall .

@'
import asyncio

from onara_pipeline.ai_client import AIMessage, AIRequest, build_ai_client, get_agent_model_route
from onara_pipeline.config import get_settings

async def main():
    settings = get_settings()
    client = build_ai_client(settings)
    route = get_agent_model_route(
        "agent_02_content",
        ollama_fallback_model=settings.ollama_fallback_model,
        ollama_primary_model=settings.ollama_primary_model,
    )
    response = await client.generate_text(
        route=route,
        request=AIRequest(messages=[AIMessage(role="user", content="Reply with exactly: ok")], max_tokens=8),
    )
    print(response.provider, response.model, response.content[:80])

asyncio.run(main())
'@ | python -
```

## NIM Model Benchmark

Run this when NVIDIA changes model availability or the pipeline feels slow:

```powershell
python benchmark_nim_models.py --ping-timeout 35 --task-timeout 60
```

Current active route:

- Main cloud model: `z-ai/glm-5.1`
- Cloud fallback: `meta/llama-4-maverick-17b-128e-instruct`
- Final fallback: local `gemma4:e4b`

Agent 6 selector:

- `onara-default`: executable today; uses `z-ai/glm-5.1 -> meta/llama-4-maverick-17b-128e-instruct -> gemma4:e4b`.
- `copilot-gemini-3.1-pro`, `copilot-gpt-5.4-mini`: Starter+ Copilot SDK options. Uses Copilot model IDs `gemini-3.1-pro-preview` and `gpt-5.4-mini`. Requires `COPILOT_GITHUB_TOKEN` and `github-copilot-sdk`; if Copilot is missing, unauthenticated, rate-limited, or unavailable, Agent 6 falls back to `z-ai/glm-5.1 -> meta/llama-4-maverick-17b-128e-instruct -> gemma4:e4b`.
- `openai-gpt-5.4`, `claude-sonnet-4`: Pro options, listed by the selector but disabled until user API-key storage and provider clients exist.
- Active trial users are treated as effective `pro` for Agent 6 gating.

Value score weighting: 55% task quality, 30% reliability, 15% speed.

Current value ranking from the local pipeline benchmark. Llama 4 Maverick scored slightly higher,
but GLM 5.1 is the active primary because it is close on value and preferred for main generation:

- `meta/llama-4-maverick-17b-128e-instruct`: best value overall, high quality and consistently fast enough.
- `z-ai/glm-5.1`: active primary, best quality-oriented alternate, nearly tied on value.
- `mistralai/mistral-nemotron`: best Nemotron-family result; close to GLM, but slower.
- `nvidia/nemotron-3-nano-30b-a3b`: very fast, useful for narrow debug/fix tasks, but weaker for structured analyst output.
- `nvidia/llama-3.3-nemotron-super-49b-v1.5`: slower and weaker on the benchmark than Llama 4, GLM, and Mistral Nemotron.

## RAG Smoke Test

The RAG store uses local persistent Chroma storage at `CHROMA_PERSIST_PATH`,
Chroma's local `all-MiniLM-L6-v2` embedder, and seeded reusable Onara
contractor site patterns. Chroma downloads the local ONNX embedding model on
first use.

```powershell
python -m onara_pipeline.rag.ingest

$secret = (Select-String -Path .env -Pattern '^PIPELINE_API_SECRET=').Line.Split('=', 2)[1].Trim()

$body = @{
  query = "license insurance review badge"
  top_k = 3
  pattern_type = "trust"
} | ConvertTo-Json

curl -Method POST http://localhost:8000/rag/search `
  -Headers @{ "X-Pipeline-Secret" = $secret; "Content-Type" = "application/json" } `
  -Body $body
```

## Mini PC PM2 Run

Stop any manual `uvicorn` window first, then run:

```powershell
cd "C:\Users\Aarush Katam\Downloads\Onara\Onara_Code\pipeline"
pm2 start ecosystem.config.cjs
pm2 status
curl http://localhost:8000/health -UseBasicParsing
```

Cloudflare Tunnel is handled separately by the named Cloudflare Tunnel service for
`https://pipeline.onara.tech`. Do not run the temporary `trycloudflare.com` tunnel
under PM2.

Persist the PM2 process list:

```powershell
pm2 save
```

Useful commands:

```powershell
pm2 logs onara-pipeline --lines 50
pm2 restart onara-pipeline
pm2 stop onara-pipeline
pm2 delete onara-pipeline
```
