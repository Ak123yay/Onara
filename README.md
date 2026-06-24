<div align="center">

# Onara 

[![Try Live Demo](https://img.shields.io/badge/Try%20Live%20Demo-onara.tech-6366f1?style=for-the-badge)](https://onara.tech)
[![Status](https://img.shields.io/badge/Status-Pre--launch-yellow?style=for-the-badge)](https://onara.tech)
[![License](https://img.shields.io/badge/License-Proprietary-blue?style=for-the-badge)](LICENSE)
[![Pipeline](https://img.shields.io/badge/Pipeline-Healthy-success?style=for-the-badge)](https://pipeline.onara.tech/health)
<br />
![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19-20232A?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5+-3178C6?style=flat-square&logo=typescript&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=flat-square&logo=fastapi&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white)
![Cloudflare](https://img.shields.io/badge/Cloudflare-F38020?style=flat-square&logo=cloudflare&logoColor=white)
![Stripe](https://img.shields.io/badge/Stripe-008CDD?style=flat-square&logo=stripe&logoColor=white)

</div>

<p align="center">
  <img width="100%" alt="Onara AI Website Builder Dashboard" src="https://github.com/user-attachments/assets/207074fe-684f-48d7-b7e1-413dc9df7d8c" />
</p>

Onara is a website builder I am building for small local businesses.

The idea is simple: a plumber, HVAC company, landscaper, roofer, or other local service business should be able to turn their basic business information into a usable website without hiring a designer or learning a website builder.

Right now, Onara can use a Google Business Profile or manually entered business details, generate a website with AI, run checks on the result, and deploy the finished site to Cloudflare Pages.

Live app: https://onara.tech  
Pipeline health check: https://pipeline.onara.tech/health  
Support: support@onara.tech

## Why I built this

A lot of local businesses either have no website or have one that looks outdated. Many of them rely only on Google Maps, reviews, phone calls, and word of mouth.

Onara is meant to give those businesses a faster starting point. It is not trying to replace a full design agency. The goal is to generate a clean first version of a website, make sure the important business details are correct, and give the owner a public URL they can actually use.

My first launch area is Washington, DC and Northern Virginia.

## Current status

Onara is still in pre-launch development.

The main pieces are built, but I am still testing, fixing edge cases, and hardening the production setup before treating it as a finished product.

Working areas include:

- account creation and login
- business search and manual business entry
- AI website generation
- Cloudflare Pages deployment
- Supabase project storage
- GitHub backup for generated site files
- Stripe billing setup
- revision and rollback tools
- contact form handling
- pipeline health checks

## What Onara does

A user can:

1. Sign in.
2. Search for a business from Google Maps or enter the business manually.
3. Review the business information.
4. Choose a style direction.
5. Start the website build.
6. Wait while the pipeline generates and checks the website.
7. Deploy the site.
8. Make revisions or roll back to an older version.

The generated website usually includes sections like:

- hero section
- services
- reviews or proof
- contact information
- business hours
- location
- footer
- basic SEO metadata
- LocalBusiness JSON-LD

## How the build pipeline works

The pipeline takes verified business facts and turns them into a website.

At a high level:

```text
Business details
  -> copy and style planning
  -> website generation
  -> quality checks
  -> repair if needed
  -> Cloudflare Pages deployment
  -> Supabase + GitHub backup
```

The project currently has three pipeline versions.

### Pipeline V1

This is the original pipeline. It uses separate agents for:

- business analysis
- copywriting
- style planning
- page planning
- code generation
- debugging
- SEO
- QA
- mobile cleanup

V1 is kept as the safest rollback path.

### Pipeline V2

V2 is more durable. Instead of keeping everything only in memory, it stores jobs, checkpoints, events, leases, and candidate results in Supabase.

That matters because the pipeline runs on a mini PC. If the process restarts, V2 can recover more cleanly instead of losing the whole build.

V2 also generates multiple candidates, tests them, scores them, and tries one bounded repair before deployment.

### Pipeline V3

V3 breaks the website into components.

Instead of generating one whole site and throwing it away if one part fails, V3 generates and validates pieces like:

- header
- hero
- services
- proof/reviews
- contact
- footer

If one component fails, only that part needs to be retried or replaced with a fallback component.

## AI use

Onara uses AI inside the product, but I try not to trust AI blindly.

AI is used for:

- reading business details
- writing first-draft website copy
- choosing layout and style directions
- generating site HTML and CSS
- fixing broken generated code
- adding SEO metadata
- checking for missing or weak sections
- improving mobile layout
- saving approved examples for later generation

Regular code handles the important account, billing, and permission logic, including:

- Supabase row-level security
- user login and project ownership
- Stripe payment status
- plan limits
- webhook handling
- secrets
- deployment approval
- blocking fake license, insurance, or certification claims

## Tech stack

### App

- Next.js
- React
- TypeScript
- CSS
- Vercel

### Backend and data

- FastAPI
- Python
- Supabase
- PostgreSQL
- Supabase Edge Functions

### Deployment and services

- Cloudflare Pages
- GitHub App backups
- Stripe
- Resend
- Google Places API

### AI and evaluation

- NVIDIA NIM
- Ollama
- optional Copilot SDK routes
- ChromaDB
- Playwright checks
- Lighthouse checks
- Axe accessibility checks

## Repository layout

```text
Onara/
  Onara_Code/
    app/        Next.js app, dashboard, billing, auth, build flow, revision UI
    pipeline/   FastAPI generation pipeline and deployment logic
    supabase/   migrations and Edge Functions

  Onara_Design/
    design reference and visual system notes

  Onara_Vault/
    planning notes, wiki pages, tasks, runbooks, and product docs
```

## Running the app locally

These commands match my Windows development setup.

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

## Running the pipeline locally

```powershell
cd C:\Users\Aarush\Downloads\Onara\Onara_Code\pipeline
python -m pip install -r requirements.txt
npm install
npm run install-browser
python -m uvicorn main:app --reload --port 8000
```

Local health check:

```powershell
Invoke-WebRequest -Method GET http://localhost:8000/health -UseBasicParsing
```

## Running the pipeline on the mini PC

```powershell
cd "C:\Users\Aarush Katam\Downloads\Onara\Onara_Code\pipeline"
pm2 start ecosystem.config.cjs
pm2 status
pm2 logs onara-pipeline --lines 50
```

Restart after pipeline changes:

```powershell
pm2 restart onara-pipeline
```

## Enabling Pipeline V3

Apply the database migrations first:

```powershell
cd "C:\Users\Aarush\Downloads\Onara\Onara_Code"
supabase db push --linked
```

Install browser tooling and run tests:

```powershell
cd ".\pipeline"
npm install
npm run install-browser
python -m unittest discover -s tests -p "test_*.py"
```

Set these flags in `Onara_Code/pipeline/.env`:

```dotenv
PIPELINE_V2_ENABLED=true
PIPELINE_V3_ENABLED=true
PIPELINE_V3_CANARY_PERCENT=100
```

Restart and check logs:

```powershell
pm2 restart onara-pipeline
pm2 logs onara-pipeline --lines 50
Invoke-WebRequest -Method GET https://pipeline.onara.tech/health -UseBasicParsing
```

To roll back from V3 to V2:

```dotenv
PIPELINE_V2_ENABLED=true
PIPELINE_V3_ENABLED=false
```

To roll back to V1:

```dotenv
PIPELINE_V2_ENABLED=false
PIPELINE_V3_ENABLED=false
```

Migrations `022` and `023` can stay applied.

## Environment variables

Use the example files instead of committing real secrets:

- `Onara_Code/app/.env.example`
- `Onara_Code/pipeline/.env.example`

The main environment groups are:

- Supabase URL, anon key, and service role key
- Stripe keys, webhook secret, and price IDs
- pipeline URL and pipeline API secret
- Google Places API key
- Cloudflare account, API token, and Pages settings
- GitHub App credentials
- Resend and email settings
- AI provider keys
- Ollama settings

Do not commit real keys or secrets.

## Production notes

- The main app runs on Vercel.
- The pipeline runs outside Vercel because generation can take longer than a normal serverless request.
- Customer sites deploy to Cloudflare Pages.
- UptimeRobot checks the pipeline health endpoint.
- Supabase Auth redirect URLs must include the production callback URL.
- `NEXT_PUBLIC_APP_URL` and `APP_URL` should point to the production app URL.

## Failure handling

Onara is supposed to keep the user from losing progress when something fails.

Examples:

- If Google Places fails, the user can enter the business manually.
- If a Google photo is missing, Onara can use a placeholder.
- If generation times out, the app should preserve the form input.
- Stripe errors should not change a user's plan state.
- Lead forms store the lead before trying to send the email.
- Dashboard and account routes use error boundaries instead of showing a blank page.

The app health route reports whether major services are configured without exposing secret values:

```text
GET /api/health
```

## Checks before shipping changes

For app changes:

```powershell
cd C:\Users\Aarush\Downloads\Onara\Onara_Code\app
pnpm.cmd type-check
pnpm.cmd build
```

For pipeline changes:

```powershell
cd C:\Users\Aarush\Downloads\Onara\Onara_Code\pipeline
python -m compileall onara_pipeline main.py
python -m unittest discover -s tests -p "test_*.py"
node --check browser_audit.mjs
```

Manual checks I usually run:

- sign in
- business search
- manual business entry
- generation start
- progress streaming
- deployed website
- revision page
- billing page
- contact form email

## License

Open-source with MIT liscence.

## Contact

For product or account support, email:

```text
support@onara.tech
```
