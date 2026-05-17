# compile-log.md — Compile History

---

## 2026-05-14 — First Full Compile

**Trigger**: User instruction "compile everything in raw"

**Raw files processed**:
- `raw/02_database_schema.md` → `wiki/data/models.md`
- `raw/03_agent_prompts.md` → `wiki/ai_agents/agents.md` + `wiki/ai_agents/workflows.md`
- `raw/Onara_Business_Plan_v12.md` → `wiki/research/notes.md`, `wiki/decisions/adr-001.md`, `wiki/decisions/adr-002.md`, `wiki/_decision-log.md`, `wiki/testing/test-strategy.md`
- `raw/Comprehensive 10-step plan...md` → key decisions extracted into `wiki/_decision-log.md`
- `raw/01_env_template.env` → noted; env var reference for dev setup
- `raw/04_api_contract.md` → informed features/api.md (already populated; not changed)
- `raw/inbox.md` → empty; skipped
- `raw/onara-credentials.md` → SKIPPED (sensitive credentials; never compiled into wiki)
- `raw/styles.jsx` → SKIPPED (code file; belongs in project-code when Phase 9 begins)
- `raw/Onara_30_Step_Roadmap.md` → too large to read; content already in TASKS.md
- `raw/05_terms_of_service.md`, `raw/06_privacy_policy.md` → legal docs; kept in raw/
- `raw/07_email_copy.md`, `raw/08_landing_page_copy.md`, `raw/09_outbound_scripts.md` → marketing copy; kept in raw/
- `raw/10_rag_seed_content.md` → RAG HTML patterns; noted in agent docs
- `raw/12_operations_runbook.md` → production runbook; kept in raw/ for now

**Files created this compile**:

| File | Source |
|------|--------|
| `wiki/ai_agents/_index.md` | New section index |
| `wiki/ai_agents/agents.md` | raw/03_agent_prompts.md |
| `wiki/ai_agents/workflows.md` | raw/03_agent_prompts.md + Business Plan |
| `wiki/data/_index.md` | New section index |
| `wiki/data/models.md` | raw/02_database_schema.md |
| `wiki/decisions/adr-001.md` | raw/Onara_Business_Plan_v12.md |
| `wiki/decisions/adr-002.md` | raw/Onara_Business_Plan_v12.md |
| `wiki/research/_index.md` | New section index |
| `wiki/research/notes.md` | raw/Onara_Business_Plan_v12.md |
| `wiki/testing/_index.md` | New section index |
| `wiki/testing/test-strategy.md` | Business Plan + raw/03_agent_prompts.md |
| `wiki/_decision-log.md` | Business Plan + conversation transcript |

**Files updated**: `wiki/_master-index.md` (all statuses → ✅ initialized, last compiled date set)

**Files unchanged** (already initialized): architecture/*, features/*, _code-map.md, _coding-rules.md, _structure-guide.md

**Result**: 12 stubs filled. Wiki fully initialized. No stubs remain.

**Notes for next session**:
- `raw/12_operations_runbook.md` — consider `wiki/operations/runbook.md` when ops processes needed
- `raw/styles.jsx` — move to project-code when Phase 9 (Design System) begins
- `raw/onara-credentials.md` — never compile; review if it should be moved out of vault entirely

---

## 2026-05-14 — Second Full Compile

**Trigger**: User instruction "add any other files to the wiki that are necessary this should be a lot of files"

**Raw files processed**:
- `raw/Onara_Business_Plan_v12.md` — further extracted into business/, integrations/, content/, legal/ sections
- `raw/05_terms_of_service.md` → `wiki/legal/terms-of-service.md`
- `raw/06_privacy_policy.md` → `wiki/legal/privacy-policy.md`
- `raw/07_email_copy.md` → `wiki/content/email-copy.md`
- `raw/08_landing_page_copy.md` → `wiki/content/landing-page.md`
- `raw/09_outbound_scripts.md` → `wiki/content/outbound-scripts.md`
- `raw/10_rag_seed_content.md` → `wiki/ai_agents/rag.md`
- `raw/12_operations_runbook.md` → `wiki/operations/runbook.md` + `wiki/operations/monitoring.md` + `wiki/operations/billing-ops.md`
- `raw/01_env_template.env` → `wiki/architecture/env-vars.md`
- `raw/onara-credentials.md` → SKIPPED (sensitive credentials; **never compiled into wiki**)
- `raw/styles.jsx` → SKIPPED (code file; belongs in project-code when Phase 9 begins)

**Files created this compile**:

| File | Source |
|------|--------|
| `wiki/architecture/deployment-pipeline.md` | Business Plan + agent workflows |
| `wiki/architecture/security.md` | Business Plan + database schema + env template |
| `wiki/architecture/env-vars.md` | raw/01_env_template.env |
| `wiki/features/build-flow.md` | Business Plan + raw/04_api_contract.md |
| `wiki/features/billing.md` | Business Plan + raw/02_database_schema.md |
| `wiki/features/google-places.md` | Business Plan + raw/03_agent_prompts.md |
| `wiki/features/revision-system.md` | raw/02_database_schema.md |
| `wiki/ai_agents/models.md` | Business Plan + raw/03_agent_prompts.md |
| `wiki/ai_agents/rag.md` | raw/10_rag_seed_content.md + raw/03_agent_prompts.md |
| `wiki/operations/_index.md` | New section index |
| `wiki/operations/runbook.md` | raw/12_operations_runbook.md |
| `wiki/operations/monitoring.md` | raw/12_operations_runbook.md + Business Plan |
| `wiki/operations/billing-ops.md` | raw/12_operations_runbook.md + raw/02_database_schema.md |
| `wiki/business/_index.md` | New section index |
| `wiki/business/pricing.md` | Business Plan |
| `wiki/business/icp.md` | Business Plan |
| `wiki/business/distribution.md` | Business Plan + raw/09_outbound_scripts.md |
| `wiki/business/roadmap.md` | Business Plan + TASKS.md |
| `wiki/integrations/_index.md` | New section index |
| `wiki/integrations/stripe.md` | Business Plan + raw/01_env_template.env |
| `wiki/integrations/github.md` | Business Plan + raw/01_env_template.env |
| `wiki/integrations/cloudflare.md` | Business Plan + raw/01_env_template.env |
| `wiki/integrations/google.md` | Business Plan + raw/01_env_template.env |
| `wiki/integrations/resend.md` | Business Plan + raw/07_email_copy.md |
| `wiki/integrations/supabase.md` | raw/02_database_schema.md + raw/01_env_template.env |
| `wiki/integrations/nvidia-nim.md` | raw/03_agent_prompts.md + Business Plan |
| `wiki/integrations/ollama.md` | raw/03_agent_prompts.md + Business Plan |
| `wiki/content/_index.md` | New section index |
| `wiki/content/email-copy.md` | raw/07_email_copy.md |
| `wiki/content/landing-page.md` | raw/08_landing_page_copy.md |
| `wiki/content/outbound-scripts.md` | raw/09_outbound_scripts.md |
| `wiki/legal/_index.md` | New section index |
| `wiki/legal/terms-of-service.md` | raw/05_terms_of_service.md |
| `wiki/legal/privacy-policy.md` | raw/06_privacy_policy.md |
| `wiki/decisions/_index.md` | New section index |
| `wiki/decisions/adr-003.md` | Business Plan (Supabase decision) |
| `wiki/decisions/adr-004.md` | Business Plan (Stripe decision) |
| `wiki/decisions/adr-005.md` | Business Plan (ChromaDB decision) |
| `wiki/decisions/adr-006.md` | Business Plan (reverse trial decision) |

**Files updated**: `wiki/_master-index.md` (5 new sections added; existing sections expanded), `wiki/architecture/_index.md`, `wiki/features/_index.md`, `wiki/ai_agents/_index.md`

**Result**: 39 new files created. 6 new wiki sections (Operations, Business, Integrations, Content, Legal, Decisions). Wiki now covers architecture, features, agents, data, decisions, operations, business, integrations, content, and legal. All raw/ files processed except permanent exclusions.

**Permanent exclusions (never compile)**:
- `raw/onara-credentials.md` — actual credentials; security risk
- `raw/styles.jsx` — code, not documentation

---

## 2026-05-15 — Third Compile

**Trigger**: User instruction "continue compiling there should be a lot of md files in the wiki"

**Source files deeply mined this compile**:
- `raw/04_api_contract.md` → `wiki/architecture/api-reference.md`
- `raw/03_agent_prompts.md` → `wiki/ai_agents/prompts.md`, `wiki/ai_agents/blackboard.md`
- `raw/02_database_schema.md` → `wiki/data/migrations.md`, `wiki/data/rls-policies.md`, `wiki/data/pg-cron-jobs.md`, `wiki/data/triggers.md`, `wiki/data/views.md`
- `TASKS.md` → `wiki/dev/setup.md`, `wiki/dev/phase-checklist.md`
- `PROJECT_CONTEXT.md` → informed `wiki/features/dashboard.md`, `wiki/research/competitors.md`
- `raw/Onara_Business_Plan_v12.md` → `wiki/business/metrics.md`, `wiki/business/gtm.md`, `wiki/features/retention.md`, `wiki/operations/scaling.md`
- `raw/onara-credentials.md` → SKIPPED (sensitive credentials; **never compiled into wiki**)

**Files created this compile**:

| File | Source |
|------|--------|
| `wiki/architecture/api-reference.md` | raw/04_api_contract.md |
| `wiki/ai_agents/prompts.md` | raw/03_agent_prompts.md |
| `wiki/ai_agents/blackboard.md` | raw/03_agent_prompts.md |
| `wiki/data/migrations.md` | raw/02_database_schema.md |
| `wiki/data/rls-policies.md` | raw/02_database_schema.md |
| `wiki/data/pg-cron-jobs.md` | raw/02_database_schema.md |
| `wiki/data/triggers.md` | raw/02_database_schema.md |
| `wiki/data/views.md` | raw/02_database_schema.md |
| `wiki/dev/_index.md` | New section index |
| `wiki/dev/setup.md` | TASKS.md + PROJECT_CONTEXT.md |
| `wiki/dev/phase-checklist.md` | TASKS.md (all 30 phases) |
| `wiki/dev/troubleshooting.md` | Synthesized from all raw files |
| `wiki/dev/commands.md` | Synthesized from stack documentation |
| `wiki/features/dashboard.md` | PROJECT_CONTEXT.md + TASKS.md + raw/04_api_contract.md |
| `wiki/features/retention.md` | Business Plan + TASKS.md |
| `wiki/testing/unit-tests.md` | raw/03_agent_prompts.md + raw/04_api_contract.md |
| `wiki/testing/e2e-tests.md` | raw/04_api_contract.md + raw/02_database_schema.md |
| `wiki/operations/scaling.md` | Business Plan + TASKS.md |
| `wiki/business/metrics.md` | Business Plan + raw/02_database_schema.md |
| `wiki/business/gtm.md` | Business Plan + raw/09_outbound_scripts.md |
| `wiki/research/competitors.md` | Business Plan + PROJECT_CONTEXT.md |

**Files updated**: All section indexes updated. `wiki/_master-index.md` updated with Dev section and all new files.

**Result**: 22 new files created. Wiki grew from 61 → 83 files. New section: Developer Guide (5 files). All raw source files fully mined.

**Total wiki state**: 83 files across 12 sections + 5 meta files.

**Permanent exclusions (never compile)**:
- `raw/onara-credentials.md` — actual credentials; security risk
- `raw/styles.jsx` — code, not documentation
