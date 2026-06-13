# Ollama Integration — Onara

_Installation, model downloads, dev and production configuration._

---

## What Onara Uses Ollama For

Local LLM inference for speed-critical agents and local fallback:
- Agent 2 — Content Writer (`qwen3.5:9b`)
- Agent 3 — Style Picker (`qwen3.5:9b`, parallel with Agent 2)
- Agent 8 — SEO Agent (`qwen3.5:9b`)
- Agent 10 — Mobile Agent (`qwen3.5:9b`)
- Supervisor — validates between each agent step (`gemma4:e4b`)
- NIM fallback — when cloud is rate limited, most NIM agents fall back to `gemma4:e4b`

---

## Required Env Vars

| Variable | Where | Value |
|----------|-------|-------|
| `OLLAMA_BASE_URL` | FastAPI `.env` | `http://localhost:11434` when FastAPI and Ollama run on the same host |
| `OLLAMA_PRIMARY_MODEL` | FastAPI `.env` | `qwen3.5:9b` — Agents 2, 3, 8, 10 |
| `OLLAMA_FALLBACK_MODEL` | FastAPI `.env` | `gemma4:e4b` — Supervisor + NIM/cloud fallback |

---

## Installation

### macOS (Development)

```bash
# Install Ollama
brew install ollama

# Start Ollama server
ollama serve

# Pull required models (run in a new terminal)
ollama pull qwen3.5:9b       # Agents 2, 3, 8, 10
ollama pull gemma4:e4b       # Supervisor + NIM fallback
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
ollama pull qwen3.5:9b       # Agents 2, 3, 8, 10
ollama pull gemma4:e4b       # Supervisor + NIM fallback
```

---

## Model Requirements

| Model | RAM Required | Disk | Notes |
|-------|-------------|------|-------|
| `qwen3.5:9b` | ~8–10 GB | 6.6 GB | Primary — Agents 2, 3, 8, 10 |
| `gemma4:e4b` | ~10–12 GB | 9.6 GB | Supervisor + local fallback |
| **Total** | 16 GB minimum, 24 GB recommended | ~17 GB+ | Keep pipeline concurrency at 1 on smaller machines |

**Recommended server rule**: FastAPI and Ollama should run on the same PC, mini PC, or DigitalOcean Droplet. Pick a machine with 24 GB+ RAM when possible; 16 GB can work at concurrency 1 if only one model is hot at a time.

---

## Production Configuration

In production, FastAPI and Ollama run on the same server:

```
# FastAPI .env (production)
OLLAMA_BASE_URL=http://localhost:11434
```

Ollama listens only on localhost — not exposed externally. FastAPI communicates with it over the local loopback interface.

**Do not expose port 11434 externally** — no auth, open to anyone.

If FastAPI and Ollama are intentionally split across two private machines, set `OLLAMA_BASE_URL` to the model host's private LAN URL and restrict access by firewall. Do not use this as the default development path.

---

## Verifying Ollama is Running

```bash
# Check models available
ollama list

# Test qwen3.5:9b
curl http://localhost:11434/api/generate -d '{
  "model": "qwen3.5:9b",
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
| Model not found | Model not pulled | `ollama pull qwen3.5:9b` |
| Out of memory | Insufficient RAM | Upgrade droplet or reduce concurrent jobs |
| Slow inference | CPU-only (no GPU) | Expected — `qwen3.5:9b` is ~9.65B params; keep concurrency at 1 and benchmark before launch |

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
