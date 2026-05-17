# CONTEXT_INDEX.md — Onara Navigation Map

_Claude reads this first to know where things live before navigating the wiki._

---

## Root Control Files

|File|Purpose|
|---|---|
|CLAUDE.md|How Claude behaves, workflow rules, coding standards|
|PROJECT_CONTEXT.md|What Onara is, full stack, agents, pricing, goals|
|TASKS.md|All work state — active, backlog, done, ideas|
|CONTEXT_LOCK.md|Hard structural rules and v1 scope boundaries|

---

## Wiki Sections

### `wiki/architecture/`

System-level design decisions.

- `system-design.md` → 3-layer stack (Vercel + FastAPI + Supabase), request flow, infrastructure overview
- `modules.md` → how the major modules interact (frontend ↔ API routes ↔ pipeline ↔ Supabase)

### `wiki/features/`

Product features, one article per feature area.

- `auth.md` → Google OAuth flow, email/password fallback, session handling, middleware
- `api.md` → all Next.js API routes: places search, pipeline proxy, Stripe, preview
- `ui.md` → design system, component library, build flow UX, dashboard UX

### `wiki/ai-agents/`

Everything about the 10-agent pipeline.

- `agents.md` → all 10 agents: name, model, job, input, output, retry logic
- `workflows.md` → Blackboard pattern, agent sequencing, parallel execution (agents 2+3), SSE streaming

### `wiki/data/`

Database and storage layer.

- `models.md` → Supabase schema: users, projects, revisions tables; RLS policies; edge functions

### `wiki/decisions/`

Architecture Decision Records (ADRs) — one file per major decision.

- `adr-001.md` → Why FastAPI over serverless for the pipeline
- `adr-002.md` → Why Cloudflare Pages over Vercel for user sites
- _(Claude adds new ADRs here as decisions are made)_

### `wiki/research/`

Competitive research, market notes, anything from raw/ that becomes reference material.

- `notes.md` → compiled research notes (converted from raw/ by Claude on compile)

### `wiki/testing/`

Test strategy and verification checklists.

- `test-strategy.md` → step verification checklists (from 30-step roadmap), QA approach, Agent 9 logic

---

## Wiki Meta Files

|File|Purpose|
|---|---|
|`wiki/_master-index.md`|Complete map of all wiki articles with one-line descriptions|
|`wiki/_code-map.md`|Maps every feature/concept to its exact code folder path|
|`wiki/_coding-rules.md`|Coding constraints, architecture rules, safety rules|
|`wiki/_decision-log.md`|Running log of decisions made during development|

---

## Working Directories

| Directory  | Purpose                                                                   |
| ---------- | ------------------------------------------------------------------------- |
| `raw/`     | Drop zone — notes, research, copied text, ideas. Claude reads on compile. |
| `output/`  | Claude writes summaries, reports, generated artifacts here                |
| `logs/`    | Claude writes compile logs, audit logs, code change history here          |
| `archive/` | Old versions of articles and decisions. Never delete — archive instead.   |