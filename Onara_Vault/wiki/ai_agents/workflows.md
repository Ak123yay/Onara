# Generation Workflows - Onara Pipeline

_The model, deterministic, browser, and deployment work behind Pipeline V2._

## Core Principle

Models create content and complete website candidates. Deterministic code owns contracts,
fact safety, prompt assembly, browser gates, patch application, final SEO/mobile safeguards,
job state, and deployment.

This avoids two unreliable patterns from V1:

- Asking another model to translate good upstream work into a code prompt.
- Repeatedly rewriting the full HTML document after QA finds a local issue.

## V2 Sequence

```text
Durable claim + heartbeat
  |
  +-- Analyst
  |
  +-- Content Writer -----+
  |                       +-- parallel
  +-- Style Agent --------+
  |
  +-- Planner
  +-- deterministic prompt compiler
  |
  +-- Candidate A --------+
  |                       +-- parallel model routes
  +-- Candidate B --------+
  |
  +-- Playwright/Axe/Lighthouse audit for each
  +-- two independent visual reviews for each
  |
  +-- select strongest eligible candidate
  +-- optional one bounded component patch
  |
  +-- deterministic Debugger -> SEO -> Mobile -> QA
  +-- final browser release audit
  |
  +-- Cloudflare -> Supabase -> GitHub
```

## Typed Contracts

V2 uses Pydantic contracts in `onara_pipeline/v2/contracts.py`:

- `BusinessBrief`: normalized business identity, contact, services, hours, and proof.
- `FactEntry`: each usable fact plus its source (`google`, `manual`, `account`, `derived`).
- `AssetEntry`: exact photo URL, alt text, source, and attribution.
- `GenerationSpec`: immutable facts/assets/preferences plus two visual recipes.
- `CandidateArtifact`: HTML, route, browser report, scores, blockers, and selection state.
- `PatchSet`: document hash, component source hashes, replacements, and CSS append.

Business input is explicitly labeled untrusted content in the compiled prompt. It is data, not
an instruction channel.

## Model Use

- Analyst, Content Writer, Style Agent, and Planner keep their existing validated outputs.
- Content Writer and Style Agent run concurrently.
- Candidate A uses the user/plan-selected Agent 6 route.
- Candidate B uses a distinct benchmarked NIM route.
- Each candidate can fall back through its own route.
- Two visual reviews use the NIM vision model and reversed rubric order.
- Provider semaphores prevent accidental local Ollama overload.
- One shared HTTP client is reused for the whole job.

If both candidate model routes fail, the deterministic fallback template remains an emergency
path. It is labeled in job state and must still pass the same browser release gates.

## Prompt Compiler

`v2/prompt_compiler.py` combines:

- Verified business brief and fact ledger.
- Exact deploy-safe photo assets.
- Validated content, style tokens, and planner blueprint.
- Onara generation/theme contracts.
- One controlled visual recipe.
- Structural, responsive, accessibility, contact, and security rules.

Prompt output is capped at 40,000 characters. Candidate A and B always use different recipes.

## Browser and Visual Evaluation

`browser_audit.mjs` hosts each candidate on an isolated localhost server and checks:

- 1440x1000 desktop.
- 390x844 mobile.
- 320x800 reflow.
- Console/page errors and failed requests.
- Document/header/hero/CTA structure.
- Images, labels, control sizes, overflow, scripts, forms, and URLs.
- WCAG A/AA findings through `@axe-core/playwright`.
- Lighthouse performance, accessibility, best-practices, SEO, LCP, CLS, and TBT.

The evaluator never tells a visual reviewer which model produced the candidate and never asks
it to compare A against B. This reduces ordering and model-identity bias.

## Durable Recovery

Every customer stage emits an ordered event to `pipeline_job_events`. Candidate HTML and score
metadata live in `pipeline_candidates`. Safe stage outputs live in `pipeline_jobs.stage_state`.

The queue uses a lease:

- `claim_pipeline_job` locks one row with `FOR UPDATE SKIP LOCKED`.
- The worker renews the lease every quarter of the lease duration.
- Another worker can recover a running job after lease expiry.
- Active request signatures deduplicate repeated submits.
- Recovery is capped by `PIPELINE_V2_MAX_ATTEMPTS`.

## Customer Progress Contract

The UI exposes seven product stages rather than internal model names:

1. Understanding your business
2. Writing your content
3. Designing two concepts
4. Building your websites
5. Testing desktop and mobile
6. Polishing the strongest version
7. Publishing your site

It also receives server ETA, concept readiness/score events, selected candidate, fallback state,
and release badges. The last valid preview remains visible through reconnects.
