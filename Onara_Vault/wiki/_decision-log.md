# _decision-log.md — Running Decision Log

_Chronological log of all decisions. Claude appends after each session._

---

## 2026-05-14 — Architecture (Pre-Development)

**Pipeline runtime: FastAPI on persistent server**
FastAPI on PC (Cloudflare Tunnel) at launch; migrate to DigitalOcean when needed. Serverless functions max out at 60s — pipeline runs 60–120s. See ADR-001.

**User site hosting: Cloudflare Pages Direct Upload**
All user sites on Cloudflare Pages. Free, unlimited sites, no DDoS billing risk, programmatic deployment. See ADR-002.

**No LangChain/LangGraph**
Plain Python + custom Blackboard pattern. LangChain adds abstraction overhead with no benefit since Onara controls all infrastructure.

**onara-sites repo: private**
Contains all users' generated code — must be private. GitHub Pages not used; Cloudflare handles hosting.

**GitHub App for deployment (not PAT)**
GitHub App uses hourly-expiring installation tokens. More secure than long-lived PATs. Permissions: `Contents R/W + Metadata R/O` only.

**Reverse trial, not freemium**
14 days full Pro access, no credit card. Core value (live URL) disappears on downgrade → loss aversion. Converts at 4–12% vs. 2–5% for standard freemium.

**Agent 6 model gated by plan**
Free uses NIM `kimi-k2.6`; Starter can use GitHub Copilot SDK models with NIM fallback; Pro can use customer-provided Claude/OpenAI keys with NIM fallback. Higher-quality code generation is a meaningful paid-plan differentiator.

**GitHub PAT scopes: Copilot read-only**
The Copilot PAT is for Copilot SDK access only. It must not be used for repository writes; deployment writes use the GitHub App.

---

## 2026-06-09 — Development Topology Clarification

**FastAPI and Ollama run on the same host for v1**
For local development, run Next.js, FastAPI, Ollama, ChromaDB, and `cloudflared` on the same PC until the pipeline works end to end. For server deployment, run FastAPI and Ollama on the same mini PC or cloud server. Only split FastAPI and Ollama across machines if `OLLAMA_BASE_URL` uses a private LAN URL and firewall rules restrict access.

**Onara_Design is the frontend design source**
When frontend docs conflict, follow `Onara_Design/` and `Onara_Vault/Onara_Design/`. The Next.js UI should closely match those references.

**Active schema names**
Use `users`, `projects`, `pipeline_jobs`, `revisions`, `pipeline_errors`, and `gbp_sync_log`. Older names such as `subscriptions`, `user_profiles`, `user_sites`, and `generation_jobs` are superseded.

---

## 2026-05-15 — Retention

**v1 retention mechanisms: Lead SMS + Reviews Badge Refresh**

Two mechanisms stay in v1 launch scope. Selection criteria: direct churn reduction + buildable in one sprint each. The earlier idea to pull GBP change-detection email into v1 is superseded; it remains post-v1 because it requires recurring Places polling, comparison storage, and user approval flow.

1. **Lead SMS Notification** (`FEATURE_LEAD_SMS`) — Contact form submit → Twilio SMS to business owner. The highest-impact retention mechanism: every lead is proof the site is generating business. Build: Supabase Edge Function + Twilio. ~1 day.

2. **Reviews Badge Weekly Refresh** (`FEATURE_REVIEWS_BADGE`) — pg_cron job pulls current Google rating + count weekly, updates the badge HTML on the live site. Makes the site feel alive and self-updating without a full regen. Build: one cron job + Places API call + targeted Cloudflare Pages HTML update. ~0.5 days.

Mechanisms NOT pulled into v1: GBP change-detection email, GBP auto-deploy sync (high complexity, low immediate impact at launch scale), seasonal SEO pages (requires new agent logic), custom domain (Cloudflare API + DNS polling, not a churn driver at launch).

---

## 2026-06-09 — Model Refresh and Scope Alignment

**Ollama local models**
Use `qwen3.5:9b` as the primary local Ollama model and `gemma4:e4b` as the local fallback/supervisor model. Older raw inputs that mention `qwen3:8b` or `llama3.3:8b` are superseded by this decision.

**Launch market**
Use Washington DC / Northern Virginia contractors and home-service businesses as the first wedge. Restaurants, salons, and broad SMB markets remain expansion targets after launch data proves the contractor motion.

**v1 scope guardrails**
Keep launch retention to lead SMS and weekly review badge refresh. Keep GBP polling, seasonal SEO pages, and custom domains post-v1 unless explicitly unlocked.

---

## Template for Future Entries

```
## YYYY-MM-DD — [Topic]

**[Decision name]**
[What was decided and why in 1–2 sentences. Link to ADR if formal.]
```
