# devlog 002 - the fake flow became the real app

Date: 2026-06-18

This update was big because Onara moved from a frontend prototype into a real working product system.

Devlog 001 ended with the app shell, Supabase setup, and a mock agent progress screen. Since then, the missing backend got built. The app now has a real FastAPI pipeline, real AI agents, real deployment, revisions, billing, and account gating.

The biggest change is this:

```text
Find -> Confirm -> Style -> Generate
```

now connects to the actual pipeline instead of only feeling real in the UI.

## what I built

```text
FastAPI pipeline
/generate endpoint
/health endpoint
in-memory job queue
job deduplication
pipeline status endpoint
SSE progress connection
resume-from-dashboard build status
Cloudflare Tunnel setup
PM2 setup for the mini PC server
```

The pipeline now runs as its own backend instead of trying to live inside Next.js. That matters because the agents can take longer than a Vercel serverless route allows.

## AI pipeline

```text
Agent 1 - Analyst
Agent 2 - Content Writer
Agent 3 - Style Agent
Agent 4 - Planner
Agent 5 - Prompt Engineer
Agent 6 - Code Generator
Agent 7 - Debugger
Agent 8 - SEO Agent
Agent 9 - QA
Agent 10 - Mobile / responsive check
```

Agents 2 and 3 run in parallel. Agent 6 now has a model picker, and that picker is plan-gated. Free users only get the Onara default route. Starter users get the executable Copilot options. Trial users count as Pro. Locked or unavailable models are blocked in the UI and sanitized again on the server before FastAPI sees the request.

## AI clients

```text
NVIDIA NIM
Ollama
GitHub Copilot SDK
```

The model route now has fallback logic:

```text
z-ai/glm-5.1 -> meta/llama-4-maverick-17b-128e-instruct -> gemma4:e4b
```

The local model setup also changed to `qwen3.5:9b` as primary and `gemma4:e4b` as fallback / supervisor.

## RAG

```text
ChromaDB
BM25 hybrid search
seeded HTML/CSS/JS patterns
motion-safe pattern guidance
contractor site layout patterns
```

Agent 6 can use these patterns so generated sites are not starting from nothing.

## deployment

```text
HTML parser
atomic component file splitting
deployment manifest
GitHub backup into onara-sites/sites/{projectId}/
Cloudflare Pages deployment
Supabase project record update
```

The pipeline stores the public URL, Cloudflare project name, GitHub commit info, deployment metadata, and status back into Supabase.

## site quality

I added stronger quality rules because the first generated sites looked too generic.

```text
professional local-business composition
Onara paper / ink / terracotta theme
Fraunces / Inter / mono typography
low-radius panels
mobile layout
tap-to-call behavior
SEO tags
LocalBusiness schema
safe lightweight motion
prefers-reduced-motion support
```

There is also a photo resolver so Google Places photos can be turned into deploy-safe images when the pipeline has the API key.

## revision system

The revision page became a real workflow instead of just a page.

```text
revision threads
multi-message back-and-forth
queued work log
component auto-pick
manual component selection
revision counter handling
changed-file summaries
before-file snapshots
rollback UI
retry on failed builds without charging a revision
visual review layout cleanup
Onara-themed revision workspace styling
```

The revision UI also went through a lot of design cleanup. The chat became denser, the work log got moved into the right spot, the composer became flatter, and the page stopped looking like a generic chatbot.

## billing

I added real billing: Stripe checkout sessions, Starter monthly, Starter annual at `$99/year`, Pro checkout, subscription webhooks, payment failure/success handling, reverse trials, trial downgrade, and revision resets.

I also switched checkout to embedded Stripe Elements with `PaymentElement`, `ExpressCheckoutElement`, wallet buttons when available, and an Onara-styled checkout page.

## account page

I added the billing page with plan display, trial state, usage stats, public URL visibility, upgrade CTAs, Starter / Pro cards, annual Starter, and centered checkout layout.

Active site limits are now enforced before generation and in Supabase: Free and Starter get 1 active site, while Pro and Trial get 3.

## cancellation flow

I added the cancellation and failed-payment flow for `customer.subscription.deleted` and `invoice.payment_failed`.

Onara now marks the account correctly, sets `show_url=false`, deploys a Cloudflare placeholder, suspends live projects, and keeps both the Supabase record and GitHub backup for later restore.

## deleting sites

I added dashboard deletion for finished or failed sites. It frees the active site slot and cleans up Cloudflare when configured, but blocks deletion while a build is still active.

## what changed from devlog 001

Before, the app had pages, a realistic build flow, and mock progress, but the backend, billing, and revisions were still incomplete.

Now the pipeline runs, agents generate sites, previews stream real status, sites deploy to Cloudflare, code backs up to GitHub, projects persist in Supabase, revisions work, billing is wired, trials downgrade, plan limits are enforced, and canceled or past-due sites get suspended.

## what is still missing

Next is Phase 26 and launch hardening: lead SMS, Pro code download, weekly Google Reviews badge refresh, GBP sync kept disabled for v1, production fixes, monitoring, legal/support surfaces, training-data consent, Google OAuth production publishing, and launch outreach assets.

## verification

```powershell
pnpm.cmd type-check
pnpm.cmd build
```

Both passed for the Next.js app. I could not run:

```powershell
deno check
```

because Deno is not installed locally, so the Supabase Edge Function still needs a Deno/Supabase check.

## current next step

Build Phase 26: lead SMS, Pro code download, and weekly reviews badge refresh.
