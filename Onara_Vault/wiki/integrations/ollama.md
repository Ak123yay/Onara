# Ollama Integration — Onara

_Installation, model downloads, dev and production configuration._

---

## What Onara Uses Ollama For

Local LLM inference for speed-critical agents (no network round-trip):
- Agent 2 — Content Writer (`qwen3:8b`)
- Agent 3 — Style Picker (`qwen3:8b`, parallel with Agent 2)
- Agent 8 — Asset Optimizer (`qwen3:8b`)
- Supervisor — validates between each agent step (`qwen3.5:9b`)
- NIM fallback — when cloud is rate limited, all NIM agents fall back to `qwen3.5:9b`

---

## Required Env Vars

| Variable | Where | Value |
|----------|-------|-------|
| `OLLAMA_BASE_URL` | FastAPI `.env` | `http://localhost:11434` (dev) or droplet IP (prod) |
| `OLLAMA_PRIMARY_MODEL` | FastAPI `.env` | `qwen3:8b` — Agents 2, 3, 8 |
| `OLLAMA_FALLBACK_MODEL` | FastAPI `.env` | `qwen3.5:9b` — Supervisor + all NIM cloud fallbacks |

---

## Installation

### macOS (Development)

```bash
# Install Ollama
brew install ollama

# Start Ollama server
ollama serve

# Pull required models (run in a new terminal)
ollama pull qwen3:8b      # Agents 2, 3, 8
ollama pull qwen3.5:9b    # Supervisor + NIM fallback
```

Ollama runs on `http://localhost:11434` by default.

### Linux (Production — DigitalOcean Droplet)

```bash
# Install
curl -fsSL https://ollama.com/install.sh | sh

# Start as a service
sudo systemctl enable ollama
sudo systemctl start ollama

# Pull models
ollama pull qwen3:8b      # Agents 2, 3, 8
ollama pull qwen3.5:9b    # Supervisor + NIM fallback
```

---

## Model Requirements

| Model | RAM Required | Disk | Notes |
|-------|-------------|------|-------|
| `qwen3:8b` | ~6 GB | ~5 GB | Primary — Agents 2, 3, 8; best under-8B instruction model |
| `qwen3.5:9b` | ~7 GB | ~6 GB | Supervisor + NIM fallback; IFBench 76.5 beats GPT-5.2 (75.4) |
| **Total** | ~9 GB (with both loaded) | ~11 GB | DigitalOcean: use 8 GB RAM droplet |

**Recommended DigitalOcean droplet**: 4 GB RAM, 2 vCPU, 80 GB SSD (~$24/month). FastAPI and Ollama run on the same droplet.

---

## Production Configuration

In production, FastAPI and Ollama run on the same DigitalOcean droplet:

```
# FastAPI .env (production)
OLLAMA_BASE_URL=http://localhost:11434
```

Ollama listens only on localhost — not exposed externally. FastAPI communicates with it over the local loopback interface.

**Do not expose port 11434 externally** — no auth, open to anyone.

---

## Verifying Ollama is Running

```bash
# Check models available
ollama list

# Test qwen3:8b
curl http://localhost:11434/api/generate -d '{
  "model": "qwen3:8b",
  "prompt": "Hello",
  "stream": false
}'
```

FastAPI's `GET /health` endpoint also checks Ollama connectivity.

---

## Common Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| `OllamaConnectionError` | Ollama not running | `ollama serve` or `systemctl start ollama` |
| Model not found | Model not pulled | `ollama pull qwen3:8b` |
| Out of memory | Insufficient RAM | Upgrade droplet or reduce concurrent jobs |
| Slow inference | CPU-only (no GPU) | Expected — qwen3:8b is 8B params, ~3–8s per request |

---

## GPU Acceleration (Optional)

If the DigitalOcean droplet has an NVIDIA GPU:
- Ollama auto-detects CUDA
- Inference drops from ~5s to ~0.5s per request
- Not required for v1 — CPU is acceptable at this scale

---

## Related Files

- `wiki/ai_agents/models.md` — which agents use Ollama and why
- `wiki/integrations/nvidia-nim.md` — NIM (cloud) for higher-quality agents
- `wiki/architecture/env-vars.md` — `OLLAMA_BASE_URL`, `OLLAMA_PRIMARY_MODEL`, `OLLAMA_FALLBACK_MODEL`
