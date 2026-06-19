# Onara

Onara is an AI website builder for local businesses. It turns a Google Business Profile, or manually entered business details, into a polished website with copy, design, SEO metadata, photos, contact forms, and a live public URL.

The first launch market is Washington DC and Northern Virginia contractors, especially plumbers, HVAC companies, electricians, roofers, landscapers, and other local service businesses that need a professional web presence without hiring a designer or learning a website builder.

## AI Usage Note

Only some parts of Onara's frontend UI and styling were generated or revised with AI assistance during development. The full codebase was not blindly AI-generated.

The core application logic is production code: auth, billing, Supabase access, RLS, deployment, webhooks, secrets, plan limits, and safety checks are implemented through normal application code and deterministic validation.

Onara also uses AI as a product feature. In the product itself, AI is used for:

- Understanding the business type, location, services, reviews, hours, and customer intent.
- Writing local-business website copy from Google Business Profile data or manual input.
- Choosing design direction, typography, colors, layout, and page structure.
- Planning site components like header, hero, services, trust proof, reviews, service area, contact, and footer.
- Generating the single-file HTML/CSS website.
- Debugging generated HTML, accessibility, motion, and layout issues.
- Adding SEO metadata and LocalBusiness JSON-LD.
- Running QA checks for missing sections, generic copy, unsafe claims, bad structure, and mobile issues.
- Improving future generations through approved, redacted training examples and curated RAG patterns.

In the product, AI is not used for:

- Stripe payment decisions.
- Supabase row-level security.
- Authentication or user permissions.
- Secret handling.
- Final billing status.
- Whether a site is allowed to deploy.
- Whether unsupported license, insurance, or certification claims are allowed.

Those parts are handled by normal application code, database policies, webhooks, and deterministic validation.

## Product Flow

1. The user signs in.
2. The user searches for a business on Google Maps or enters it manually.
3. Onara imports or collects business name, address, phone, hours, category, photos, reviews, and service details.
4. The user confirms details and selects style preferences.
5. The pipeline runs a 10-agent AI workflow.
6. Deterministic guardrails validate page structure, business facts, SEO, mobile behavior, and Onara design quality.
7. The site is deployed to Cloudflare Pages.
8. The project is stored in Supabase and backed up to GitHub.
9. The user can revise, rollback, download code if eligible, and manage billing.

## Main Features

- Google Business Profile import.
- Manual business entry when a company is not listed on Google Maps.
- AI-generated local-business websites.
- Cloudflare Pages deployment.
- GitHub backup for generated site files.
- Supabase auth, projects, billing state, revisions, and training-data consent.
- Stripe billing with Starter, Starter annual, and Pro plans.
- Reverse trial lifecycle.
- Revision studio with queued changes, work log, before/after diff, and rollback.
- Lead email notifications from generated site contact forms.
- Weekly Google Reviews badge refresh.
- Pro code download.
- Plan-gated Agent 6 model picker.
- Curated RAG learning loop for QA-approved patterns only.

## Repository Layout

```text
Onara/
  Onara_Code/
    app/        Next.js app, dashboard, billing, auth, build flow, revision UI
    pipeline/   FastAPI AI generation pipeline and deployment logic
    supabase/   migrations and Edge Functions
  Onara_Design/ Design reference for the Onara visual system
  Onara_Vault/  planning, wiki, tasks, architecture, runbooks, and product docs
```

## App Stack

- Frontend: Next.js, React, TypeScript, CSS.
- Auth and database: Supabase.
- Billing: Stripe Checkout, embedded Elements, webhooks.
- Pipeline server: FastAPI on the mini PC, managed by PM2.
- Public pipeline URL: Cloudflare Tunnel at `https://pipeline.onara.tech`.
- Generated site hosting: Cloudflare Pages.
- Generated site backup: GitHub App writing to the sites repository.
- Email: Resend / Supabase Edge Functions depending on feature.
- AI providers: NVIDIA NIM, Ollama, optional Copilot SDK routes.
- RAG: ChromaDB with curated Onara patterns.

## AI Pipeline Agents

```text
Agent 1  Analyst
Agent 2  Content Writer
Agent 3  Style Agent
Agent 4  Planner
Agent 5  Prompt Engineer
Agent 6  Code Generator
Agent 7  Debugger
Agent 8  SEO Agent
Agent 9  QA
Agent 10 Mobile Optimizer
```

The pipeline uses a blackboard pattern. Each agent writes structured output, the supervisor validates it, and later agents work from the latest validated state. If AI output is missing required structure or fails safety checks, deterministic fallback and repair logic take over.

## Local Development

### Next.js app

```powershell
cd C:\Users\Aarush\Downloads\Onara\Onara_Code\app
pnpm.cmd install
pnpm.cmd dev
```

Useful checks:

```powershell
pnpm.cmd type-check
pnpm.cmd build
```

### Pipeline server

```powershell
cd C:\Users\Aarush\Downloads\Onara\Onara_Code\pipeline
python -m pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

Health check:

```powershell
Invoke-WebRequest -Method GET http://localhost:8000/health -UseBasicParsing
```

### Mini PC / PM2

```powershell
cd "C:\Users\Aarush Katam\Downloads\Onara\Onara_Code\pipeline"
pm2 start ecosystem.config.cjs
pm2 status
pm2 logs onara-pipeline --lines 50
```

Restart after pipeline code changes:

```powershell
pm2 restart onara-pipeline
```

## Environment Files

Use the checked-in examples as references:

- `Onara_Code/app/.env.example`
- `Onara_Code/pipeline/.env.example`

Important environment groups:

- Supabase URL, anon key, and service role key.
- Stripe secret key, publishable key, webhook secret, and price IDs.
- Pipeline URL and pipeline API secret.
- Google Places API key.
- Cloudflare account, API token, Pages settings.
- GitHub App credentials for generated site backup.
- Resend/email settings.
- AI provider keys and local Ollama settings.

Do not commit real secrets.

## Production Notes

- Vercel hosts the main Onara app.
- `NEXT_PUBLIC_APP_URL` and `APP_URL` should point to the production app URL.
- Supabase Auth redirect URLs must include the production callback URL.
- The FastAPI pipeline runs separately from Vercel because generation jobs are long-running.
- UptimeRobot monitors `https://pipeline.onara.tech/health`.
- Generated customer sites deploy to Cloudflare Pages, not Vercel.

## Verification Checklist

Before shipping meaningful changes:

```powershell
cd C:\Users\Aarush\Downloads\Onara\Onara_Code\app
pnpm.cmd type-check
pnpm.cmd build
```

For pipeline changes:

```powershell
cd C:\Users\Aarush\Downloads\Onara\Onara_Code\pipeline
python -m compileall -q onara_pipeline
```

Then manually verify:

- Sign in works.
- Business search works.
- Manual business entry works.
- Generation starts and streams progress.
- Generated site deploys.
- Revision page loads.
- Billing page loads.
- Contact form emails are delivered.

## Support

For product and account support, use `support@onara.tech`.

## Status

Onara is in pre-launch development. Core app, generation pipeline, billing, revisions, deployment, and retention features exist, but production hardening and distribution work are still ongoing.
