# Onara Documentation

Last updated: 2026-06-24

This document is a broad record of what Onara is, what has been built, how the system works, what is AI-assisted, what is deterministic production code, and what remains before launch.

## Short Description

Onara builds AI-generated websites for local businesses.

## Product Summary

Onara is an AI website builder for local businesses. It turns a Google Business Profile, or manually entered business information, into a polished website with copy, design, SEO metadata, photos, contact forms, and a live public URL.

The first launch focus is Washington DC and Northern Virginia contractors, especially plumbers, HVAC companies, electricians, roofers, landscapers, handymen, and other local service businesses that need a web presence without hiring a designer or learning a website builder.

The product flow is:

1. The user signs in.
2. The user searches for a business on Google Maps or manually enters business details.
3. Onara collects business name, address, phone, hours, category, photos, reviews, and service context.
4. The user confirms details and style choices.
5. The AI pipeline builds the website.
6. Deterministic QA and safety gates validate the result.
7. The site deploys to Cloudflare Pages.
8. The project is saved in Supabase and backed up to GitHub.
9. The user can revise, rollback, download, manage billing, and receive lead emails.

## AI Usage Note

Only some parts of Onara's frontend UI and styling were generated or revised with AI assistance during development. The full codebase was not blindly AI-generated.

The core app is normal production code:

- Authentication.
- Supabase data access.
- Row-level security.
- Stripe billing.
- Webhooks.
- Plan limits.
- Secret handling.
- Deployment controls.
- Safety checks.
- Deterministic validators.

Onara also uses AI as a product feature. In the product itself, AI is used to:

- Analyze business type, service area, hours, reviews, and customer intent.
- Write local-business copy from Google Business Profile data or manual input.
- Choose visual direction, colors, typography, and layout.
- Plan website sections and component order.
- Generate a single-file HTML/CSS website.
- Debug generated HTML, CSS, accessibility, and motion issues.
- Add SEO metadata and LocalBusiness JSON-LD.
- Review launch blockers through QA.
- Harden mobile layout and tap targets.
- Suggest dashboard recommendations.
- Produce first support replies for inbound support email.
- Improve future generations through approved, redacted training examples.

AI is not trusted for final authority over:

- Payments.
- Billing status.
- User authentication.
- Database authorization.
- Row-level security.
- Secret management.
- Whether a generated site may deploy.
- Unsupported claims such as licensing, insurance, bonding, or certification.

Those are controlled by deterministic code, Supabase policies, Stripe webhooks, and validation logic.

## Repository Structure

```text
Onara/
  README.md
  documentation.md
  AGENTS.md
  Onara_Code/
    app/
    pipeline/
    supabase/
    config/
  Onara_Design/
  Onara_Vault/
```

### `Onara_Code/app`

The Next.js application. It contains:

- Landing page.
- Auth pages.
- Dashboard.
- Business search and generation flow.
- Build progress page.
- Revision studio.
- Account settings.
- Billing page.
- Embedded checkout page.
- Help page.
- Privacy policy.
- Terms of service.
- API routes.
- Supabase browser and server clients.
- Stripe checkout helpers.
- SEO metadata, manifest, robots, sitemap, and social cards.

### `Onara_Code/pipeline`

The FastAPI generation pipeline. It contains:

- `/health` endpoint.
- `/generate` endpoint.
- Pipeline status endpoints.
- Pipeline V1 in-memory job queue.
- Pipeline V2 durable Supabase queue, leases, heartbeats, events, and checkpoints.
- Parallel website candidate generation.
- Playwright, Axe, Lighthouse, responsive, and visual quality evaluation.
- Bounded component repair and deterministic release safeguards.
- Revision queue.
- AI client abstraction.
- Agent pipeline.
- Blackboard supervisor.
- RAG system.
- ChromaDB persistence.
- Deployment helpers.
- GitHub backup logic.
- Cloudflare Pages upload logic.
- Supabase persistence logic.
- Training example storage.
- Dashboard AI brief generation.

### `Onara_Code/supabase`

The Supabase project layer. It contains:

- SQL migrations.
- RLS policies.
- Auth trigger.
- pg_cron jobs.
- Edge Functions.
- Auth email templates.
- Stripe webhook handling.
- Trial downgrade function.
- Revision reset function.
- Lead email function.
- Google reviews refresh function.
- Support email AI responder.

### `Onara_Design`

The visual design reference for the Onara UI. The app is expected to follow this design language:

- Warm paper background.
- Ink text.
- Terracotta accents.
- Fraunces headings.
- Inter body text.
- JetBrains Mono labels.
- Low-radius cards.
- Tool-like, dense workflow screens.

### `Onara_Vault`

The knowledge and planning system. It contains:

- `TASKS.md` as the work-state source of truth.
- Wiki architecture docs.
- Feature docs.
- AI agent docs.
- Data model docs.
- Operations docs.
- Legal docs.
- Business docs.
- Developer commands and troubleshooting.

## App Stack

- Frontend: Next.js 15, React 19, TypeScript, CSS.
- UI libraries: Lucide icons, GSAP for some landing animations.
- Auth: Supabase Auth.
- Database: Supabase Postgres.
- Billing: Stripe Checkout, Stripe Elements, Stripe webhooks.
- Main app hosting: Vercel.
- Generated site hosting: Cloudflare Pages.
- Pipeline server: FastAPI on the mini PC.
- Pipeline process manager: PM2.
- Pipeline public access: Cloudflare Tunnel at `https://pipeline.onara.tech`.
- AI providers: NVIDIA NIM, Ollama, optional Copilot SDK routes.
- RAG: ChromaDB with curated Onara patterns.
- Email: Resend and Supabase Edge Functions.
- Monitoring: UptimeRobot for pipeline health.
- Backup: GitHub App writing generated site files to the sites repository.

## Main User-Facing Features

### Landing Page

The landing page explains Onara for local contractors. It includes:

- Hero section.
- Search CTA.
- How-it-works section.
- Pricing section.
- Social proof placeholder.
- Support/footer copy.
- SEO metadata.
- Social sharing image generation.
- Favicon and manifest.

### Authentication

Authentication includes:

- Google OAuth through Supabase.
- Email/password login.
- Signup.
- Password reset/update flow.
- Google-created account guidance when a user tries password login.
- Protected dashboard and account routes.
- Middleware route protection for `/dashboard` and `/account`.

### Business Search

The build flow starts with Google Places search. It supports:

- Google Places Text Search.
- Business result cards.
- Business name, address, phone, hours, category, rating, reviews, and photos.
- Missing-field highlighting.
- DC / Northern Virginia area filtering for launch focus.
- Manual business entry if the business is not listed on Google Maps.

### Manual Business Entry

Manual entry exists for businesses not listed on Google Maps. It allows Onara to still build a site when there is no Google listing.

The manual path captures user-provided business facts rather than relying on Places data.

### Build Flow

The build flow is:

1. Find.
2. Confirm.
3. Style.
4. Generate.

The user can confirm imported business data, adjust missing details, pick style preferences, and start generation.

### Build Progress Page

The build progress UI includes:

- Live agent status.
- SSE stream support.
- Status fallback route for non-SSE browsers.
- Current agent state.
- Progress percentage.
- Preview iframe.
- Resume-from-dashboard support.
- Retry button on safe failures.
- Saved generation package.

### Generated Sites

Generated sites are contractor/local-business pages. They include:

- Header.
- Hero.
- Services.
- Trust proof.
- Reviews or aggregate Google proof.
- Service area.
- Contact form.
- Footer.
- LocalBusiness schema.
- SEO metadata.
- Tap-to-call links.
- Mobile-first responsive behavior.
- Safe CSS motion.
- Onara visual theme enforcement.
- Google Places photos when available.

Generated sites are deployed to Cloudflare Pages and backed up to GitHub.

### Dashboard

The dashboard includes:

- User site list.
- Live, queued, generating, deploying, failed, and suspended states.
- Public URL visibility.
- Copy link controls.
- Delete site controls for finished/failed sites.
- Retry controls.
- Daily AI brief with site summary and recommendations.
- Plan-aware state.
- Active site limit awareness.

### Revision Studio

The revision system includes:

- Multi-message revision threads.
- User revision requests.
- Work log.
- Queued revision display.
- Manual component selection.
- Auto-pick component mode.
- Visual before/after diff.
- Changed-file explanation.
- Rollback controls using stored before-file snapshots.
- Revision counter decrement.
- Monthly revision reset.
- No revision deducted for failed retries.

### Billing

Billing includes:

- Stripe checkout session creation.
- Starter monthly plan.
- Starter annual plan at `$99/year`.
- Pro monthly plan.
- Embedded Stripe Elements checkout.
- Express Checkout wallet buttons where Stripe/browser allow it.
- Apple Pay / Google Pay / Link support through Stripe Express Checkout Element.
- Stripe webhook handler.
- Subscription created handling.
- Subscription updated handling.
- Subscription deleted handling.
- Payment failed handling.
- Payment succeeded handling.
- Billing page subscription cancellation action.
- Reverse trial support.
- Subscription period tracking.

### Account Page

The account page includes:

- Profile display.
- Email display.
- Created date.
- Current access state.
- Trial status.
- Public URL visibility status.
- Training-data consent controls.
- Training-data opt-out/delete handling.
- Account action cards.
- Separate billing link.
- Separate dashboard link.
- Support link.

### Plan Gating

Plan gating includes:

- Free active site limit.
- Starter active site limit.
- Pro/trial active site limit.
- Revision limits.
- Public URL visibility rules.
- Code download only for Pro users.
- Agent 6 model picker gated by user plan.
- Trial users treated as effective Pro for some generation/model access.

### Cancellation and Suspension

Cancellation and failed-payment handling includes:

- Stripe subscription deletion handling.
- Stripe invoice payment failed handling.
- Downgrade or account state update.
- `show_url=false` when public access should be hidden.
- Live project lookup.
- Placeholder deployment to Cloudflare Pages.
- Project marked suspended.
- Supabase project record retained.
- GitHub backup retained.

### Lead Email Notifications

Generated site contact forms submit leads to Onara backend/Edge Function flow. Lead email notification sends the contact message to the email associated with the generated site/project.

The email HTML is styled to match Onara's visual system instead of using a plain default template.

### Google Reviews Badge Refresh

The reviews badge refresh feature:

- Pulls updated review/rating data weekly.
- Uses Google Places API.
- Updates stored review badge data.
- Can redeploy affected site assets when configured.
- Is gated by `FEATURE_REVIEWS_BADGE`.

### GBP Sync Disabled For V1

Continuous Google Business Profile polling/change detection is intentionally disabled for v1 with `FEATURE_GBP_SYNC=false`.

This avoids accidental background edits before the product is ready for automatic maintenance.

### Code Download

Pro users can download generated site code as a folder. The download route pulls from the backed-up generated site source and packages it for the user.

### Help Page

The help page explains how to use Onara and where to get support. Support email is surfaced as `support@onara.tech`.

### Support Email AI Responder

The support email system:

- Keeps `support@onara.tech` forwarding to Aarush.
- Adds an inbound email worker/webhook.
- Uses an NVIDIA NIM model for the first support reply.
- Logs support threads.
- Escalates billing, security, and account issues for human review.

### Privacy Policy and Terms

The app includes:

- Public privacy policy page.
- Public terms page.
- Training-data disclosure.
- User data usage explanations.
- Billing and third-party service disclosure.
- Support and legal surfaces required for Google OAuth verification.

### SEO Metadata

Launch SEO work includes:

- Root metadata.
- Open Graph image.
- Twitter image.
- Robots route.
- Sitemap route.
- Web manifest.
- Favicon/icon.
- Canonical URL configuration.

## AI Pipeline Details

Onara keeps three generation paths available during rollout:

- `PIPELINE_V2_ENABLED=false` runs Pipeline V1. This is the default and rollback path.
- `PIPELINE_V2_ENABLED=true` runs Pipeline V2 for new initial-generation jobs.
- `PIPELINE_V3_ENABLED=true` plus `PIPELINE_V3_CANARY_PERCENT=1..100` routes a stable
  percentage of new jobs to Pipeline V3. Non-canary jobs fall back to V2 when V2 is enabled.

Pipeline V1 uses 10 agents:

1. Analyst.
2. Content Writer.
3. Style Agent.
4. Planner.
5. Prompt Engineer.
6. Code Generator.
7. Debugger.
8. SEO Agent.
9. QA.
10. Mobile Optimizer.

Pipeline V2 preserves the useful analysis, content, style, deployment, and safety logic but
changes the orchestration:

```text
trusted business brief
  -> content and style in parallel
  -> deterministic concept recipes and prompts
  -> two AI-generated websites in parallel
  -> browser and visual evaluation
  -> at most one targeted repair
  -> final deterministic safeguards
  -> deploy
```

V2 stores unfinished jobs in Supabase, so PM2 or mini-PC restarts do not automatically lose
the build. It also prevents duplicate active requests using a fixed request signature.

Before enabling V2:

1. Apply migration `022_pipeline_v2_durable_jobs.sql`.
2. Run `npm install` from `Onara_Code/pipeline`.
3. Install Chromium with `npm run install-browser`.
4. Run the pipeline unit tests.
5. Set `PIPELINE_V2_ENABLED=true` in the FastAPI `.env`.
6. Restart `onara-pipeline` in PM2.

Rollback is setting the flag to `false` and restarting PM2. Migration `022` does not need to
be reverted.

Pipeline V3 keeps the durable V2 queue but changes generation from two monolithic documents
to bounded components:

```text
three design directions
  -> select two
  -> parallel component generation
  -> component validation and checkpoint
  -> assemble two complete candidates
  -> desktop, tablet, mobile, Axe, Lighthouse, and visual checks
  -> targeted repair
  -> deploy
```

Migration `023_pipeline_v3_components.sql` stores completed component artifacts. If the
worker restarts, V3 reuses valid completed components and generates only unfinished ones.
Critical structural, security, broken-asset, overflow, undersized-control, and serious Axe
issues block release. Lower scores and non-critical guidance remain visible warnings.

### Agent 1: Analyst

Analyzes business type, customer intent, CTA type, service priority, target keyword, trust signals, and required sections.

### Agent 2: Content Writer

Writes website copy such as hero copy, service descriptions, social proof framing, contact copy, and footer tagline.

### Agent 3: Style Agent

Creates visual direction, typography tokens, color tokens, spacing tokens, and style notes.

### Agent 4: Planner

Turns analyst, copy, and style output into a component blueprint. It decides component IDs, order, HTML structure, CSS class expectations, and responsive notes.

### Agent 5: Prompt Engineer

Builds the final prompt that Agent 6 uses to create the site.

### Agent 6: Code Generator

Generates the website HTML/CSS. It supports a plan-gated model picker. It produces a self-contained `index.html` and splits component files by planner markers.

### Agent 7: Debugger

Reviews generated HTML/CSS for broken structure, accessibility issues, motion issues, unsupported claims, generic text, missing components, and repairable defects.

### Agent 8: SEO Agent

Adds or validates:

- Title.
- Meta description.
- Open Graph tags.
- Twitter card tags.
- Canonical placeholder.
- LocalBusiness JSON-LD.

### Agent 9: QA

Runs launch-blocker QA. It checks:

- HTML structure.
- Component files.
- Component markers.
- Professional visual system.
- Composition depth.
- Onara theme.
- Typography.
- Spacing.
- Motion safety.
- SEO metadata.
- LocalBusiness schema.
- Tap-to-call.
- Photo usage.
- Service richness.
- Hours rendering.
- Local details.
- Review integrity.
- Section dedupe.
- Service menu integrity.
- License honesty.
- Mobile basics.
- Prompt artifacts.

### Agent 10: Mobile Optimizer

Hardens the site for:

- Viewport.
- Responsive media queries.
- Overflow guards.
- Flexible media.
- Tap targets.
- Fluid type.
- Reduced-motion safety.
- Safe motion.
- SEO preservation.

It is also guarded so it cannot replace the full site with a broken fragment.

## Deterministic Guardrails

The deterministic supervisor and validators ensure AI output cannot silently ship unsafe or broken work.

Guardrails include:

- Required full HTML document structure.
- Required `site_header` and `hero` components.
- Required component order.
- Required `index.html`.
- No markdown fences in generated HTML.
- No file marker leaks.
- Required safe CSS animation.
- Required `prefers-reduced-motion`.
- No JavaScript animation loops.
- No infinite animation loops.
- Professional visual quality gate.
- Onara theme variables.
- Review and license honesty checks.
- Service menu integrity checks.
- Photo resolver checks.
- Mobile output validation.

## RAG and Training Loop

The RAG system uses ChromaDB to store reusable Onara site patterns.

Current RAG behavior:

- ChromaDB is local/persistent.
- Patterns are seeded from approved HTML/CSS/JS guidance.
- Agents can search patterns for design, QA, mobile, trust, and conversion guidance.
- Only QA-approved generated components/patterns should be saved back into RAG.
- Bad or duplicate sites should not be stored.

Training-data behavior:

- Users can consent to training data usage.
- Users can opt out.
- Users can request/delete stored training examples.
- Training examples are redacted and QA-approved before use.
- The goal is to support both current RAG improvement and future fine-tuning.

## Data and Database Work Done

Supabase work includes:

- Initial schema.
- RLS policies.
- Auth trigger.
- pg_cron jobs.
- Project resume jobs.
- Site limit enforcement.
- Dashboard brief cache.
- Public API hardening.
- Revision runtime.
- Revision threads and snapshots.
- Revision pipeline foreign-key cleanup.
- Billing subscription period.
- Reverse trial lifecycle.
- Lead email notifications.
- Google reviews badge refresh.
- Pipeline error foreign-key cleanup.
- Training examples.
- Support email AI responder.
- Hardened training example access.

Important tables/features include:

- Users/profiles.
- Projects.
- Pipeline jobs.
- Revisions.
- Revision messages.
- Revision snapshots.
- Billing fields.
- Training data consent fields.
- Training examples.
- Support email thread data.
- Review badge data.

## Supabase Edge Functions

Edge Functions include:

- `downgrade-trials`.
- `reset-revisions`.
- `stripe-webhook`.
- `lead-email`.
- `lead-sms` exists historically, but the active retention path moved to email.
- `refresh-reviews`.
- `support-email`.

## Deployment Pipeline

Generated site deployment includes:

1. AI pipeline produces validated HTML.
2. Parser normalizes the final document.
3. Component files are split.
4. Deployment manifest is created.
5. GitHub App backs up generated source files.
6. Cloudflare Pages Direct Upload publishes the site.
7. Supabase project record is updated.
8. Dashboard receives public URL and deployment state.

## GitHub Backup

Generated site files are backed up to a private GitHub repository under a project-specific path. This allows:

- Later code download.
- Project recovery.
- Auditing generated output.
- Rollback support.
- Separation between Onara app code and generated customer site code.

## Cloudflare Pages

Cloudflare Pages is used for customer-generated sites because those sites are static deployable artifacts.

Cloudflare is also used for the named tunnel that exposes the FastAPI pipeline server at `https://pipeline.onara.tech`.

## Vercel

Vercel hosts the main Onara Next.js application. The main app is separate from generated customer sites.

Production app URL should be configured through:

- `NEXT_PUBLIC_APP_URL`.
- `APP_URL`.

## Billing and Plan Details

Plans implemented or represented:

- Free/trial.
- Starter monthly.
- Starter annual at `$99/year`.
- Pro monthly.

Plan behavior includes:

- Reverse trial starts on signup.
- Trial has Pro-like access while active.
- Trial downgrade happens through scheduled Supabase function.
- Starter keeps one live site.
- Pro supports more active sites and code download.
- Failed payments and cancellations hide/suspend public URLs as needed.

## Completed Work By Phase

This section mirrors the completed and remaining work from `Onara_Vault/TASKS.md` in a readable form. `TASKS.md` remains the execution-state source of truth; this document explains what the completed work means, how the features fit together, and what still remains.

### Foundation and Research

Completed:

- ICP document.
- GBP lead research with 50+ leads.
- Contractor Facebook group research.
- Niche-specific feature list.
- v1 retention mechanism decision.
- DC / Northern Virginia launch focus.
- GitHub account setup.
- GitHub Education verification submission.
- Fine-grained PAT for Copilot SDK.
- GitHub App for deployment.
- Private generated-sites repository.
- Google Cloud project.
- Places API enablement.
- Google OAuth client.
- Supabase project.
- Cloudflare account and Pages setup.
- Resend account and domain verification.
- Stripe account.
- Stripe test products.

### Phase 2: Remaining / Deferred Setup

Completed:

- Stripe webhook endpoint placeholder.
- Ollama installation.
- Initial Ollama model pulls.
- Stripe price ID credentials.

Deferred:

- Stripe live-mode payout setup.

### Phase 3: Dev Environment On PC

Completed:

- Current Ollama models pulled and verified.
- Node.js confirmed.
- Python confirmed.
- pnpm installed.
- Cloudflare Tunnel set up.
- `.env` created with required keys from setup phases.

### Phase 4: Mini PC / Server

Completed:

- Mini PC FastAPI environment.
- cloudflared setup.
- PM2 setup.
- Ollama remains on main PC over LAN.
- FastAPI managed by PM2.

### Phase 5: Database

Completed:

- Supabase schema for users, projects, revisions, and related records.
- Column types and indexes.
- Migrations.

### Phase 6: Database Security

Completed:

- RLS policies.
- Auth trigger.
- Edge functions for revision reset, trial downgrade, and Stripe webhook.
- pg_cron daily trial check.

### Phase 7: Auth and Google Places

Completed:

- Google OAuth in Supabase.
- OAuth test users.
- Google OAuth sign-in flow.

### Phase 8: Google Places Route

Completed:

- `/api/places/search`.
- Business confirmation card UI.
- Missing-field handling.

### Phase 9: Design System

Completed:

- Tailwind/CSS design tokens.
- Base components: button, card, input, badge.
- Onara visual language grounded in the design folder.

### Phase 10: Landing Page

Completed:

- Contractor-focused landing page.
- Pricing section.
- Social proof placeholder.
- Demo video placeholder.

### Phase 11: Auth Pages

Completed:

- Signup page.
- Login page.
- Middleware route protection.

### Phase 12: Dashboard Shell

Completed:

- Dashboard layout.
- Sidebar.
- My Sites list view.

### Phase 13: Build Flow

Completed:

- Search to Confirm to Style to Generate flow.
- Style preference UI.

### Phase 14: Agent Progress UI

Completed:

- SSE status stream.
- Ten-step agent progress component.
- Preview iframe.
- Status fallback route.

### Phase 15: FastAPI Server

Completed:

- FastAPI scaffold.
- In-memory queue.
- Deduplication.
- `/generate`.
- `/health`.
- Cloudflare Tunnel test.

### Phase 16: AI Client Library

Completed:

- Unified AI client.
- NIM support.
- Kimi/DeepSeek/Ollama routing concepts.
- Agent 6 model picker.
- 429 retry logic.
- Local fallback.

### Phase 17: RAG System

Completed:

- ChromaDB setup.
- BM25 hybrid search layer.
- Seeded HTML/CSS/JS patterns.

### Phase 18: Agents 1-3

Completed:

- Analyst agent.
- Content Writer agent.
- Style Agent.
- Parallel Agent 2 and Agent 3 execution.

### Phase 19: Agents 4-5

Completed:

- Planner agent.
- Prompt Engineer agent.

### Phase 20: Agent 6

Completed:

- Code Generator.
- Model picker.
- Atomic component generation.
- Stream output to preview iframe.

### Phase 21: Agents 7-10

Completed:

- Blackboard Supervisor.
- Agent 6 animation pass.
- RAG animation patterns.
- Debugger agent.
- SEO agent.
- QA agent.
- Mobile/responsive agent.

### Phase 22: Deployment Pipeline

Completed:

- HTML parser.
- Atomic component file splitting.
- GitHub commit backup.
- Cloudflare Pages Direct Upload.
- Supabase project persistence.

### Phase 23: Revision System

Completed:

- Resume generation after leaving progress page.
- Incremental component update logic.
- Revision counter decrement.
- Monthly reset.
- Retry button on agent failure.
- Multi-message revision threads.
- Visual before/after diff.
- Manual component selection.
- Rollback UI.
- Changed-file explanation view.

### Phase 24: Stripe Billing

Completed:

- Checkout session creation.
- Starter annual checkout support.
- Webhook handler for subscription created/updated/deleted.
- Payment failed handling.
- Reverse trial signup lifecycle.
- Daily downgrade function.

### Phase 25: Account Page

Completed:

- Plan display.
- Upgrade CTA.
- Embedded Stripe Elements checkout.
- Express Checkout wallet buttons.
- Daily dashboard AI brief.
- Active site limit enforcement.
- Delete finished/failed sites.
- Plan-gated Agent 6 model picker.
- Cancellation placeholder deployment flow.
- Billing page subscription cancellation action.

### Phase 26: Retention Features

Completed:

- Lead email notification.
- Pro code download.
- Help page.
- Google Reviews badge refresh.
- GBP sync disabled for v1.

### Phase 27: Architecture Hardening

Completed:

- Generated-site visual quality gate.
- Style Agent moved to GLM.
- Generic centered brochure layout rejection.
- Google Places photo resolver.
- Deploy-safe photo URLs.
- Required photo usage when photos are available.
- Onara generated-site theme enforcement.
- Build progress page redesign.
- Manual business creation if not listed on Google Maps.
- Onara favicon.
- Production fixes documentation.
- PM2 setup.
- UptimeRobot monitoring.
- AI blackboard reviewer.
- Curated RAG learning loop.
- Training data pipeline.

### Phase 28: Pre-Launch

Completed:

- Privacy policy.
- Terms of service.
- `.env.example` updates.
- Launch SEO metadata.
- Robots.
- Sitemap.
- Manifest.
- Social cards.
- `support@onara.tech` across app surfaces.
- Support email AI responder.
- Training-data consent copy.
- Opt-out/delete handling.
- Privacy-policy disclosure.
- Security review.
- RLS audit.
- API key rotation checklist.
- Vulnerability audit.
- Google OAuth app publishing.

Not complete:

- Error monitoring such as Sentry.

### Phase 29: Distribution

Not complete:

- Cold outbound sequence.
- Contractor Facebook group outreach plan.
- Trade association partnership email.
- Accountant referral program.

### Phase 30: Launch

Not complete:

- Soft launch to warm list.
- Product Hunt launch assets.
- Metrics dashboard for signups, trials, conversions, MRR.
- Day 11 and Day 13 trial expiry emails.

## Security Work

Security work includes:

- Supabase RLS.
- Public API hardening.
- Service-role server-side separation.
- Stripe webhook HMAC handling.
- Pipeline secret.
- Auth route protection.
- OAuth production publishing.
- Training examples access hardening.
- Security review report.
- API key rotation checklist.
- Vulnerability audit.

Important remaining security/ops item:

- Provider-dashboard key rotation still needs manual completion before launch.

## Monitoring and Operations

### Graceful degradation

Onara degrades by capability instead of turning one provider outage into a blank or frozen
app.

- Google Places failure opens manual business entry.
- Missing Places photos use an Onara placeholder.
- Pipeline, Cloudflare, GitHub, billing, revision, and account requests use bounded timeouts.
- Dashboard, account, route, and root failures render recoverable Onara error pages.
- Billing, authorization, destructive actions, and deployment approval always fail closed.
- Pipeline V2 can use a strict static release gate when browser tooling is unavailable.
- `GET /api/health` reports service readiness without returning secrets.

The static pipeline fallback still requires complete HTML, a header, hero, primary CTA,
contact form, labels, safe links/forms, and deployable images. It never claims that desktop or
mobile browser testing ran when it did not.

Implemented operations work:

- PM2 for pipeline server.
- `/health` endpoint.
- UptimeRobot monitor on `https://pipeline.onara.tech/health`.
- HEAD support for health checks.
- Cloudflare Tunnel for public pipeline URL.
- Runbook/wiki operations docs.
- Supabase cron functions.
- Billing ops documentation.

Useful commands:

```powershell
cd C:\Users\Aarush\Downloads\Onara\Onara_Code\app
pnpm.cmd type-check
pnpm.cmd build
```

```powershell
cd C:\Users\Aarush\Downloads\Onara\Onara_Code\pipeline
python -m compileall -q onara_pipeline
python -m uvicorn main:app --reload --port 8000
```

```powershell
cd "C:\Users\Aarush Katam\Downloads\Onara\Onara_Code\pipeline"
pm2 status
pm2 logs onara-pipeline --lines 50
pm2 restart onara-pipeline
```

## Environment Areas

The environment is split across:

- App environment.
- Pipeline environment.
- Supabase secrets.
- Vercel variables.
- Cloudflare credentials.
- Stripe dashboard/config.
- Google Cloud credentials.
- Resend/email credentials.
- GitHub App credentials.
- Local Ollama/AI model configuration.

Do not commit real secrets.

Primary example files:

- `Onara_Code/app/.env.example`.
- `Onara_Code/pipeline/.env.example`.
- `Onara_Code/config/.env.template`.

## Known Performance Notes

The public landing page is static but can feel heavier because it uses a client-side landing component with GSAP and animation code.

Dashboard and account pages are dynamic because they depend on auth, Supabase data, billing state, project state, and sometimes backend/pipeline data.

Known optimization opportunities:

- Move more landing page content to server-rendered components.
- Lazy-load animation-heavy code.
- Fetch dashboard AI brief after initial dashboard render instead of blocking the page.
- Add stronger route-level loading skeletons.
- Optimize generated-site photos.

## Known Product Limits

Current v1 constraints:

- Launch market is DC / Northern Virginia first.
- GBP change detection is disabled.
- Custom domains are not fully launched.
- Error monitoring is not installed yet.
- Distribution and launch workflows are still not complete.
- Live Stripe payout setup is deferred.
- Google reviews refresh requires proper Google/Cloudflare/Supabase configuration.
- Some advanced model-picker options are listed but disabled until provider clients/user API key storage exist.

## Verification Checklist

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

For Supabase changes:

```powershell
cd C:\Users\Aarush\Downloads\Onara\Onara_Code
supabase db push --linked
supabase functions deploy <function-name>
```

Manual checks:

- Sign in.
- Build from Google Places search.
- Build from manual business entry.
- Watch progress stream.
- Confirm generated site deploys.
- Confirm generated site has photos when source photos are available.
- Confirm contact form sends email.
- Confirm billing checkout loads.
- Confirm webhook changes plan state.
- Confirm revision page can submit a change.
- Confirm rollback UI works.
- Confirm public URL visibility follows plan state.

## Support

Support email: `support@onara.tech`.

Support surfaces were added across:

- Footer.
- Account/help areas.
- Billing/contact copy.
- Auth email-related copy where relevant.
- Help page.
- Privacy/terms surfaces.

## Current Status

Onara is in pre-launch development.

Core product systems are built:

- App shell.
- Auth.
- Dashboard.
- Google Places flow.
- Manual entry flow.
- AI generation pipeline.
- Generated site deployment.
- Revision system.
- Billing.
- Account page.
- Retention features.
- Legal pages.
- SEO setup.
- Monitoring.
- Security review.

Remaining work is mainly launch and operations:

- Error monitoring.
- Distribution assets.
- Warm-list soft launch.
- Product Hunt assets.
- Metrics dashboard.
- Trial expiry emails.
- Live Stripe payout readiness.
- Manual provider key rotation before launch.

---

# API Reference

## App API Routes

### Authentication Routes

#### POST /api/auth/signup

Creates a new user account.

Request body:
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "fullName": "John Doe"
}
```

Response:
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  }
}
```

Error responses:
- 400: Invalid email format
- 409: Email already exists
- 500: Server error

#### POST /api/auth/login

Authenticates a user.

Request body:
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

Response:
```json
{
  "success": true,
  "session": {
    "access_token": "jwt_token",
    "refresh_token": "refresh_token"
  }
}
```

Error responses:
- 401: Invalid credentials
- 403: Account suspended
- 500: Server error

#### POST /api/auth/logout

Logs out the current user.

Headers:
```
Authorization: Bearer <access_token>
```

Response:
```json
{
  "success": true
}
```

#### POST /api/auth/reset-password

Initiates password reset flow.

Request body:
```json
{
  "email": "user@example.com"
}
```

Response:
```json
{
  "success": true,
  "message": "Password reset email sent"
}
```

#### POST /api/auth/update-password

Updates user password.

Request body:
```json
{
  "newPassword": "newsecurepassword123",
  "confirmPassword": "newsecurepassword123"
}
```

Response:
```json
{
  "success": true
}
```

### Business Search Routes

#### GET /api/places/search

Searches for businesses using Google Places API.

Query parameters:
- query: Business name or search term (required)
- location: Location bias (optional, default: "Washington DC")

Example:
```
GET /api/places/search?query=Joe%27s+Plumbing&location=Arlington+VA
```

Response:
```json
{
  "results": [
    {
      "place_id": "ChIJ...",
      "name": "Joe's Plumbing",
      "formatted_address": "123 Main St, Arlington, VA 22201",
      "formatted_phone_number": "(703) 555-1234",
      "rating": 4.5,
      "user_ratings_total": 42,
      "types": ["plumber", "point_of_interest"],
      "opening_hours": {
        "weekday_text": [
          "Monday: 8:00 AM - 5:00 PM",
          "Tuesday: 8:00 AM - 5:00 PM"
        ]
      },
      "photos": [
        {
          "photo_reference": "...",
          "height": 1000,
          "width": 1000
        }
      ]
    }
  ]
}
```

Error responses:
- 400: Missing query parameter
- 429: Rate limit exceeded
- 500: Google Places API error

#### GET /api/places/details

Gets detailed information for a specific place.

Query parameters:
- place_id: Google Places ID (required)

Response:
```json
{
  "result": {
    "place_id": "ChIJ...",
    "name": "Joe's Plumbing",
    "formatted_address": "123 Main St, Arlington, VA 22201",
    "geometry": {
      "location": {
        "lat": 38.8816,
        "lng": -77.0910
      }
    },
    "website": "https://joesplumbing.com",
    "reviews": [
      {
        "author_name": "Jane Smith",
        "rating": 5,
        "text": "Great service!",
        "time": 1234567890
      }
    ]
  }
}
```

#### GET /api/places/photo

Proxies Google Places photo requests.

Query parameters:
- photo_reference: Photo reference from Places API (required)
- maxwidth: Maximum width (optional, default: 1600)

Response:
- Image binary data with appropriate Content-Type header

Error responses:
- 400: Missing photo_reference
- 404: Photo not found
- 500: Proxy error

### Project Routes

#### POST /api/projects/create

Creates a new website project.

Request body:
```json
{
  "businessName": "Joe's Plumbing",
  "address": "123 Main St, Arlington, VA 22201",
  "phone": "(703) 555-1234",
  "email": "joe@joesplumbing.com",
  "category": "plumber",
  "hours": {
    "monday": "8:00 AM - 5:00 PM",
    "tuesday": "8:00 AM - 5:00 PM"
  },
  "services": ["Leak Repair", "Drain Cleaning", "Water Heater"],
  "photos": ["photo_ref_1", "photo_ref_2"],
  "place_id": "ChIJ...",
  "rating": 4.5,
  "review_count": 42,
  "style_preferences": {
    "color_scheme": "professional",
    "layout": "modern"
  }
}
```

Response:
```json
{
  "success": true,
  "project_id": "uuid",
  "generation_started": true
}
```

Error responses:
- 400: Invalid business data
- 402: Plan limit reached
- 500: Server error

#### GET /api/projects/list

Lists all projects for the authenticated user.

Query parameters:
- status: Filter by status (optional: "live", "generating", "failed")
- limit: Number of results (optional, default: 50)
- offset: Pagination offset (optional, default: 0)

Response:
```json
{
  "projects": [
    {
      "id": "uuid",
      "business_name": "Joe's Plumbing",
      "status": "live",
      "public_url": "https://joes-plumbing.pages.dev",
      "created_at": "2026-06-20T10:30:00Z",
      "updated_at": "2026-06-20T11:15:00Z",
      "show_url": true
    }
  ],
  "total": 1,
  "limit": 50,
  "offset": 0
}
```

#### GET /api/projects/[id]

Gets details for a specific project.

Response:
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "business_name": "Joe's Plumbing",
  "address": "123 Main St, Arlington, VA 22201",
  "phone": "(703) 555-1234",
  "status": "live",
  "public_url": "https://joes-plumbing.pages.dev",
  "generation_started_at": "2026-06-20T10:30:00Z",
  "generation_completed_at": "2026-06-20T11:15:00Z",
  "revision_count": 2,
  "style_preferences": {},
  "show_url": true
}
```

Error responses:
- 403: Not authorized to view this project
- 404: Project not found

#### DELETE /api/projects/[id]

Deletes a project.

Response:
```json
{
  "success": true
}
```

Error responses:
- 403: Cannot delete project in generating state
- 404: Project not found

#### POST /api/projects/[id]/retry

Retries a failed generation.

Response:
```json
{
  "success": true,
  "generation_started": true
}
```

### Generation Routes

#### POST /api/generate/start

Starts the AI generation process.

Request body:
```json
{
  "project_id": "uuid"
}
```

Response:
```json
{
  "success": true,
  "job_id": "uuid",
  "status_url": "/api/generate/status?job_id=uuid"
}
```

#### GET /api/generate/status

Gets generation status via SSE stream.

Query parameters:
- job_id: Generation job ID (required)

Response (Server-Sent Events):
```
event: status
data: {"agent": 1, "status": "running", "progress": 10}

event: status
data: {"agent": 2, "status": "running", "progress": 20}

event: preview
data: {"html": "<html>...</html>"}

event: complete
data: {"success": true, "public_url": "https://..."}
```

#### GET /api/generate/status-poll

Polling fallback for browsers without SSE support.

Query parameters:
- job_id: Generation job ID (required)

Response:
```json
{
  "job_id": "uuid",
  "status": "running",
  "current_agent": 3,
  "progress": 30,
  "preview_html": "<html>...</html>",
  "error": null
}
```

### Revision Routes

#### POST /api/revisions/create

Creates a revision request.

Request body:
```json
{
  "project_id": "uuid",
  "message": "Change the hero background color to blue",
  "components": ["hero", "site_header"]
}
```

Response:
```json
{
  "success": true,
  "revision_id": "uuid",
  "queued": true
}
```

Error responses:
- 402: No revisions remaining
- 404: Project not found

#### GET /api/revisions/[id]

Gets revision details and thread.

Response:
```json
{
  "id": "uuid",
  "project_id": "uuid",
  "status": "completed",
  "messages": [
    {
      "role": "user",
      "content": "Change the hero background",
      "created_at": "2026-06-20T12:00:00Z"
    },
    {
      "role": "assistant",
      "content": "Updated hero background color",
      "created_at": "2026-06-20T12:05:00Z"
    }
  ],
  "snapshots": [
    {
      "component": "hero",
      "before": "<section>...</section>",
      "after": "<section class='blue'>...</section>"
    }
  ]
}
```

#### POST /api/revisions/[id]/rollback

Rolls back a revision.

Response:
```json
{
  "success": true,
  "deployed": true
}
```

### Billing Routes

#### POST /api/billing/create-checkout

Creates a Stripe checkout session.

Request body:
```json
{
  "plan": "starter_monthly",
  "return_url": "/dashboard"
}
```

Response:
```json
{
  "client_secret": "cs_test_...",
  "publishable_key": "pk_test_..."
}
```

#### POST /api/billing/portal

Creates a Stripe customer portal session.

Response:
```json
{
  "url": "https://billing.stripe.com/session/..."
}
```

#### POST /api/billing/webhook

Handles Stripe webhooks.

Headers:
```
stripe-signature: signature_string
```

Request body: Stripe event object

Response:
```json
{
  "received": true
}
```

Handled events:
- customer.subscription.created
- customer.subscription.updated
- customer.subscription.deleted
- invoice.payment_succeeded
- invoice.payment_failed

#### GET /api/billing/subscription

Gets current subscription details.

Response:
```json
{
  "plan": "starter_monthly",
  "status": "active",
  "current_period_end": "2026-07-20T00:00:00Z",
  "cancel_at_period_end": false
}
```

#### POST /api/billing/cancel

Cancels the current subscription.

Response:
```json
{
  "success": true,
  "cancel_at": "2026-07-20T00:00:00Z"
}
```

### Account Routes

#### GET /api/account/profile

Gets user profile information.

Response:
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "full_name": "John Doe",
  "created_at": "2026-06-01T00:00:00Z",
  "plan": "pro",
  "trial_ends_at": null,
  "training_consent": true
}
```

#### PATCH /api/account/profile

Updates user profile.

Request body:
```json
{
  "full_name": "John Smith",
  "training_consent": false
}
```

Response:
```json
{
  "success": true
}
```

#### POST /api/account/training-data/delete

Deletes user's training data.

Response:
```json
{
  "success": true,
  "deleted_count": 5
}
```

#### GET /api/account/usage

Gets account usage statistics.

Response:
```json
{
  "active_sites": 3,
  "active_sites_limit": 5,
  "revisions_used": 8,
  "revisions_limit": 10,
  "revisions_reset_at": "2026-07-01T00:00:00Z"
}
```

### Health Routes

#### GET /api/health

System health check.

Response:
```json
{
  "status": "healthy",
  "services": {
    "supabase": "healthy",
    "pipeline": "healthy",
    "stripe": "healthy",
    "google_places": "healthy"
  },
  "timestamp": "2026-06-23T23:44:05Z"
}
```

#### HEAD /api/health

Lightweight health check for monitoring.

Response: 200 OK (no body)

### Download Routes

#### GET /api/download/[project_id]

Downloads project source code (Pro only).

Response:
- ZIP file containing site source code

Error responses:
- 402: Pro plan required
- 403: Not authorized
- 404: Project not found



## Pipeline API Routes

### Health Routes

#### GET /health

Pipeline health check endpoint.

Response:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "pipeline_version": "v2",
  "services": {
    "supabase": true,
    "chromadb": true,
    "ai_providers": {
      "nvidia_nim": true,
      "ollama": true
    }
  },
  "active_jobs": 2,
  "queue_size": 5
}
```

#### HEAD /health

Lightweight health check for monitoring systems.

Response: 200 OK

### Generation Routes

#### POST /generate

Starts a new website generation job.

Headers:
```
Authorization: Bearer <pipeline_secret>
Content-Type: application/json
```

Request body:
```json
{
  "project_id": "uuid",
  "user_id": "uuid",
  "business_data": {
    "name": "Joe's Plumbing",
    "address": "123 Main St, Arlington, VA 22201",
    "phone": "(703) 555-1234",
    "email": "joe@joesplumbing.com",
    "category": "plumber",
    "services": ["Leak Repair", "Drain Cleaning"],
    "hours": {},
    "photos": [],
    "rating": 4.5,
    "review_count": 42,
    "reviews": []
  },
  "style_preferences": {
    "color_scheme": "professional",
    "layout": "modern"
  },
  "user_plan": "pro"
}
```

Response:
```json
{
  "job_id": "uuid",
  "status": "queued",
  "estimated_duration_seconds": 180
}
```

Error responses:
- 400: Invalid business data
- 401: Unauthorized
- 409: Duplicate job
- 503: Queue full

#### GET /generate/status/{job_id}

Gets generation job status.

Headers:
```
Authorization: Bearer <pipeline_secret>
```

Response:
```json
{
  "job_id": "uuid",
  "status": "running",
  "current_agent": 3,
  "agent_name": "Style Agent",
  "progress_percent": 30,
  "started_at": "2026-06-23T10:00:00Z",
  "estimated_completion": "2026-06-23T10:05:00Z",
  "preview_html": "<html>...</html>",
  "error": null
}
```

Status values:
- queued: Waiting to start
- running: Currently generating
- completed: Successfully finished
- failed: Generation failed
- cancelled: Job was cancelled

#### POST /generate/cancel/{job_id}

Cancels a running generation job.

Headers:
```
Authorization: Bearer <pipeline_secret>
```

Response:
```json
{
  "success": true,
  "job_id": "uuid",
  "status": "cancelled"
}
```

### Revision Routes

#### POST /revise

Starts a revision job.

Headers:
```
Authorization: Bearer <pipeline_secret>
Content-Type: application/json
```

Request body:
```json
{
  "project_id": "uuid",
  "revision_id": "uuid",
  "current_html": "<html>...</html>",
  "components": ["hero", "services"],
  "user_message": "Change hero background to blue",
  "context": {
    "business_name": "Joe's Plumbing",
    "previous_revisions": []
  }
}
```

Response:
```json
{
  "job_id": "uuid",
  "status": "queued"
}
```

#### GET /revise/status/{job_id}

Gets revision job status.

Response:
```json
{
  "job_id": "uuid",
  "status": "completed",
  "updated_html": "<html>...</html>",
  "changed_components": ["hero"],
  "explanation": "Updated hero background color to blue",
  "snapshots": [
    {
      "component": "hero",
      "before": "<section>...</section>",
      "after": "<section style='background: blue'>...</section>"
    }
  ]
}
```

### RAG Routes

#### POST /rag/search

Searches the RAG knowledge base.

Headers:
```
Authorization: Bearer <pipeline_secret>
```

Request body:
```json
{
  "query": "professional plumber hero section",
  "limit": 5,
  "filters": {
    "component_type": "hero",
    "business_category": "plumber"
  }
}
```

Response:
```json
{
  "results": [
    {
      "content": "<section class='hero'>...</section>",
      "metadata": {
        "component_type": "hero",
        "quality_score": 0.95,
        "business_category": "plumber"
      },
      "similarity": 0.87
    }
  ]
}
```

#### POST /rag/add

Adds approved patterns to RAG.

Request body:
```json
{
  "content": "<section>...</section>",
  "metadata": {
    "component_type": "hero",
    "business_category": "plumber",
    "quality_score": 0.95,
    "approved_by": "qa"
  }
}
```

Response:
```json
{
  "success": true,
  "id": "uuid"
}
```

### Dashboard Routes

#### POST /dashboard/brief

Generates AI dashboard brief.

Request body:
```json
{
  "project_id": "uuid",
  "business_name": "Joe's Plumbing",
  "site_metrics": {
    "performance_score": 95,
    "accessibility_score": 100
  }
}
```

Response:
```json
{
  "brief": "Your site is performing well with strong accessibility...",
  "recommendations": [
    "Consider adding more service details",
    "Upload additional photos"
  ]
}
```

### Deployment Routes

#### POST /deploy

Deploys a generated site.

Request body:
```json
{
  "project_id": "uuid",
  "html": "<html>...</html>",
  "metadata": {
    "business_name": "Joe's Plumbing"
  }
}
```

Response:
```json
{
  "success": true,
  "public_url": "https://joes-plumbing.pages.dev",
  "deployment_id": "uuid",
  "github_commit": "abc123",
  "cloudflare_deployment": "def456"
}
```

Error responses:
- 400: Invalid HTML
- 500: Deployment failed

#### GET /deploy/status/{deployment_id}

Gets deployment status.

Response:
```json
{
  "deployment_id": "uuid",
  "status": "completed",
  "public_url": "https://joes-plumbing.pages.dev",
  "github_status": "committed",
  "cloudflare_status": "deployed"
}
```

### Metrics Routes

#### GET /metrics

Gets pipeline metrics.

Headers:
```
Authorization: Bearer <pipeline_secret>
```

Response:
```json
{
  "jobs": {
    "total": 1250,
    "completed": 1100,
    "failed": 50,
    "cancelled": 20,
    "active": 5
  },
  "performance": {
    "avg_generation_time_seconds": 180,
    "avg_revision_time_seconds": 45,
    "success_rate": 0.96
  },
  "queue": {
    "size": 10,
    "oldest_job_age_seconds": 30
  }
}
```

### Admin Routes

#### POST /admin/cleanup

Cleans up old jobs and artifacts.

Request body:
```json
{
  "older_than_days": 30,
  "dry_run": true
}
```

Response:
```json
{
  "jobs_deleted": 150,
  "artifacts_deleted": 300,
  "space_freed_mb": 250
}
```

#### POST /admin/restart-worker

Restarts a specific worker.

Request body:
```json
{
  "worker_id": "worker-1"
}
```

Response:
```json
{
  "success": true,
  "worker_id": "worker-1",
  "status": "restarting"
}
```




---

# Database Schema

## Tables

### users (Supabase Auth)

Managed by Supabase Auth. Referenced by profiles table.

Columns:
- id: UUID (primary key)
- email: TEXT
- encrypted_password: TEXT
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
- confirmed_at: TIMESTAMP
- last_sign_in_at: TIMESTAMP

### profiles

User profile and plan information.

Columns:
- id: UUID (primary key, references auth.users.id)
- email: TEXT (not null)
- full_name: TEXT
- plan: TEXT (default: 'free')
- trial_started_at: TIMESTAMP
- trial_ends_at: TIMESTAMP
- subscription_id: TEXT
- stripe_customer_id: TEXT
- subscription_status: TEXT
- subscription_period_start: TIMESTAMP
- subscription_period_end: TIMESTAMP
- show_url: BOOLEAN (default: true)
- training_consent: BOOLEAN (default: false)
- created_at: TIMESTAMP (default: now())
- updated_at: TIMESTAMP (default: now())

Indexes:
- profiles_pkey (id)
- profiles_email_idx (email)
- profiles_stripe_customer_id_idx (stripe_customer_id)
- profiles_plan_idx (plan)

RLS Policies:
- Users can read their own profile
- Users can update their own profile
- Service role has full access

Plan values:
- free
- trial
- starter_monthly
- starter_annual
- pro_monthly

### projects

Website projects.

Columns:
- id: UUID (primary key, default: gen_random_uuid())
- user_id: UUID (references profiles.id, not null)
- business_name: TEXT (not null)
- address: TEXT
- phone: TEXT
- email: TEXT
- category: TEXT
- services: TEXT[]
- hours: JSONB
- photos: TEXT[]
- place_id: TEXT
- rating: NUMERIC
- review_count: INTEGER
- reviews: JSONB
- style_preferences: JSONB
- status: TEXT (default: 'pending')
- public_url: TEXT
- generation_started_at: TIMESTAMP
- generation_completed_at: TIMESTAMP
- revision_count: INTEGER (default: 0)
- show_url: BOOLEAN (default: true)
- suspended: BOOLEAN (default: false)
- github_repo_path: TEXT
- cloudflare_deployment_id: TEXT
- created_at: TIMESTAMP (default: now())
- updated_at: TIMESTAMP (default: now())

Indexes:
- projects_pkey (id)
- projects_user_id_idx (user_id)
- projects_status_idx (status)
- projects_place_id_idx (place_id)

RLS Policies:
- Users can read their own projects
- Users can create projects (within plan limits)
- Users can update their own projects
- Users can delete their own finished/failed projects

Status values:
- pending: Not started
- queued: Waiting in queue
- generating: Currently generating
- deploying: Deploying to Cloudflare
- live: Successfully deployed
- failed: Generation failed
- suspended: Account suspended

Constraints:
- business_name must not be empty
- status must be valid enum value

### pipeline_jobs

Pipeline V2/V3 durable job queue.

Columns:
- id: UUID (primary key, default: gen_random_uuid())
- project_id: UUID (references projects.id, not null)
- user_id: UUID (references profiles.id, not null)
- job_type: TEXT (not null)
- status: TEXT (default: 'queued')
- priority: INTEGER (default: 0)
- request_signature: TEXT (unique)
- business_data: JSONB
- style_preferences: JSONB
- current_stage: TEXT
- progress_percent: INTEGER (default: 0)
- preview_html: TEXT
- error_message: TEXT
- error_details: JSONB
- retry_count: INTEGER (default: 0)
- max_retries: INTEGER (default: 3)
- lease_id: TEXT
- lease_expires_at: TIMESTAMP
- started_at: TIMESTAMP
- completed_at: TIMESTAMP
- created_at: TIMESTAMP (default: now())
- updated_at: TIMESTAMP (default: now())

Indexes:
- pipeline_jobs_pkey (id)
- pipeline_jobs_project_id_idx (project_id)
- pipeline_jobs_status_idx (status)
- pipeline_jobs_request_signature_idx (request_signature)
- pipeline_jobs_lease_expires_idx (lease_expires_at)

RLS Policies:
- Users can read jobs for their own projects
- Service role can manage all jobs

Job types:
- initial_generation
- revision

Status values:
- queued
- running
- completed
- failed
- cancelled

### pipeline_events

Event log for pipeline jobs.

Columns:
- id: UUID (primary key, default: gen_random_uuid())
- job_id: UUID (references pipeline_jobs.id, on delete cascade)
- event_type: TEXT (not null)
- agent_name: TEXT
- message: TEXT
- data: JSONB
- created_at: TIMESTAMP (default: now())

Indexes:
- pipeline_events_pkey (id)
- pipeline_events_job_id_idx (job_id)
- pipeline_events_created_at_idx (created_at)

Event types:
- job_queued
- job_started
- agent_started
- agent_completed
- agent_failed
- preview_updated
- job_completed
- job_failed

### pipeline_checkpoints

Pipeline V2/V3 agent checkpoints for resume capability.

Columns:
- id: UUID (primary key, default: gen_random_uuid())
- job_id: UUID (references pipeline_jobs.id, on delete cascade)
- agent_name: TEXT (not null)
- checkpoint_data: JSONB
- created_at: TIMESTAMP (default: now())

Indexes:
- pipeline_checkpoints_pkey (id)
- pipeline_checkpoints_job_id_agent_idx (job_id, agent_name)

Unique constraint:
- (job_id, agent_name)

### pipeline_components

Pipeline V3 component artifacts.

Columns:
- id: UUID (primary key, default: gen_random_uuid())
- job_id: UUID (references pipeline_jobs.id, on delete cascade)
- component_type: TEXT (not null)
- component_html: TEXT
- validation_status: TEXT
- validation_errors: JSONB
- quality_score: NUMERIC
- created_at: TIMESTAMP (default: now())

Indexes:
- pipeline_components_pkey (id)
- pipeline_components_job_id_idx (job_id)
- pipeline_components_job_component_idx (job_id, component_type)

Component types:
- site_header
- hero
- services
- trust_proof
- reviews
- service_area
- contact
- footer

Validation status:
- valid
- invalid
- needs_repair

### pipeline_candidates

Pipeline V2/V3 website candidates before final selection.

Columns:
- id: UUID (primary key, default: gen_random_uuid())
- job_id: UUID (references pipeline_jobs.id, on delete cascade)
- candidate_number: INTEGER (not null)
- html: TEXT
- design_direction: JSONB
- lighthouse_score: JSONB
- axe_results: JSONB
- visual_score: NUMERIC
- responsive_tests: JSONB
- selected: BOOLEAN (default: false)
- created_at: TIMESTAMP (default: now())

Indexes:
- pipeline_candidates_pkey (id)
- pipeline_candidates_job_id_idx (job_id)

### revisions

Website revision requests.

Columns:
- id: UUID (primary key, default: gen_random_uuid())
- project_id: UUID (references projects.id, not null)
- user_id: UUID (references profiles.id, not null)
- status: TEXT (default: 'pending')
- components: TEXT[]
- started_at: TIMESTAMP
- completed_at: TIMESTAMP
- error_message: TEXT
- created_at: TIMESTAMP (default: now())
- updated_at: TIMESTAMP (default: now())

Indexes:
- revisions_pkey (id)
- revisions_project_id_idx (project_id)
- revisions_status_idx (status)

RLS Policies:
- Users can read revisions for their own projects
- Users can create revisions (within plan limits)

Status values:
- pending
- queued
- running
- completed
- failed

### revision_messages

Revision conversation thread.

Columns:
- id: UUID (primary key, default: gen_random_uuid())
- revision_id: UUID (references revisions.id, on delete cascade)
- role: TEXT (not null)
- content: TEXT (not null)
- created_at: TIMESTAMP (default: now())

Indexes:
- revision_messages_pkey (id)
- revision_messages_revision_id_idx (revision_id)
- revision_messages_created_at_idx (created_at)

Role values:
- user
- assistant

### revision_snapshots

Before/after snapshots for rollback.

Columns:
- id: UUID (primary key, default: gen_random_uuid())
- revision_id: UUID (references revisions.id, on delete cascade)
- component: TEXT (not null)
- before_html: TEXT
- after_html: TEXT
- explanation: TEXT
- created_at: TIMESTAMP (default: now())

Indexes:
- revision_snapshots_pkey (id)
- revision_snapshots_revision_id_idx (revision_id)

### leads

Contact form submissions from generated sites.

Columns:
- id: UUID (primary key, default: gen_random_uuid())
- project_id: UUID (references projects.id, not null)
- name: TEXT (not null)
- email: TEXT (not null)
- phone: TEXT
- message: TEXT (not null)
- status: TEXT (default: 'new')
- email_sent: BOOLEAN (default: false)
- email_sent_at: TIMESTAMP
- created_at: TIMESTAMP (default: now())

Indexes:
- leads_pkey (id)
- leads_project_id_idx (project_id)
- leads_status_idx (status)
- leads_created_at_idx (created_at)

RLS Policies:
- Project owners can read leads for their projects
- Service role can create leads

Status values:
- new
- viewed
- contacted
- converted

### review_badges

Google Reviews badge data for weekly refresh.

Columns:
- id: UUID (primary key, default: gen_random_uuid())
- project_id: UUID (references projects.id, unique, not null)
- place_id: TEXT
- rating: NUMERIC
- review_count: INTEGER
- review_snapshot: JSONB
- last_refreshed_at: TIMESTAMP
- created_at: TIMESTAMP (default: now())
- updated_at: TIMESTAMP (default: now())

Indexes:
- review_badges_pkey (id)
- review_badges_project_id_idx (project_id)
- review_badges_last_refreshed_idx (last_refreshed_at)

### training_examples

Approved patterns for RAG and future fine-tuning.

Columns:
- id: UUID (primary key, default: gen_random_uuid())
- user_id: UUID (references profiles.id)
- project_id: UUID (references projects.id)
- example_type: TEXT (not null)
- content: TEXT (not null)
- metadata: JSONB
- quality_score: NUMERIC
- approved: BOOLEAN (default: false)
- approved_by: TEXT
- approved_at: TIMESTAMP
- redacted: BOOLEAN (default: false)
- created_at: TIMESTAMP (default: now())

Indexes:
- training_examples_pkey (id)
- training_examples_user_id_idx (user_id)
- training_examples_project_id_idx (project_id)
- training_examples_approved_idx (approved)
- training_examples_example_type_idx (example_type)

RLS Policies:
- Users can read their own examples
- Users can request deletion of their examples
- Service role can manage all examples

Example types:
- full_site
- component
- copy
- style

### support_threads

Support email threads.

Columns:
- id: UUID (primary key, default: gen_random_uuid())
- user_id: UUID (references profiles.id)
- email: TEXT (not null)
- subject: TEXT
- status: TEXT (default: 'open')
- priority: TEXT (default: 'normal')
- first_message: TEXT
- ai_response: TEXT
- ai_response_sent_at: TIMESTAMP
- escalated: BOOLEAN (default: false)
- escalated_at: TIMESTAMP
- resolved_at: TIMESTAMP
- created_at: TIMESTAMP (default: now())
- updated_at: TIMESTAMP (default: now())

Indexes:
- support_threads_pkey (id)
- support_threads_user_id_idx (user_id)
- support_threads_email_idx (email)
- support_threads_status_idx (status)
- support_threads_escalated_idx (escalated)

Status values:
- open
- ai_replied
- escalated
- resolved
- closed

Priority values:
- low
- normal
- high
- urgent

### dashboard_briefs

Cached AI dashboard briefs.

Columns:
- id: UUID (primary key, default: gen_random_uuid())
- user_id: UUID (references profiles.id, unique, not null)
- brief: TEXT
- recommendations: TEXT[]
- generated_at: TIMESTAMP (default: now())
- expires_at: TIMESTAMP

Indexes:
- dashboard_briefs_pkey (id)
- dashboard_briefs_user_id_idx (user_id)
- dashboard_briefs_expires_at_idx (expires_at)

## Views

### active_projects_count

Counts live projects per user for plan limit enforcement.

Definition:
```sql
CREATE VIEW active_projects_count AS
SELECT 
  user_id,
  COUNT(*) as active_count
FROM projects
WHERE status = 'live' AND suspended = false
GROUP BY user_id;
```

### user_plan_limits

Combines user plan with usage for limit checks.

Definition:
```sql
CREATE VIEW user_plan_limits AS
SELECT 
  p.id as user_id,
  p.plan,
  COALESCE(apc.active_count, 0) as active_sites,
  CASE 
    WHEN p.plan = 'free' THEN 1
    WHEN p.plan = 'trial' THEN 5
    WHEN p.plan LIKE 'starter%' THEN 1
    WHEN p.plan LIKE 'pro%' THEN 5
    ELSE 1
  END as site_limit
FROM profiles p
LEFT JOIN active_projects_count apc ON p.id = apc.user_id;
```

## Functions

### handle_new_user()

Trigger function that creates profile on auth user creation.

Returns: TRIGGER

### check_project_limit()

Trigger function that prevents project creation beyond plan limit.

Returns: TRIGGER

### cleanup_old_jobs()

Deletes completed/failed jobs older than 30 days.

Returns: INTEGER (number of deleted rows)

### refresh_reviews_for_project(project_id UUID)

Refreshes Google Reviews data for a specific project.

Parameters:
- project_id: Project UUID

Returns: BOOLEAN (success status)

## Triggers

### on_auth_user_created

Fires after INSERT on auth.users
Calls: handle_new_user()

### on_project_create

Fires before INSERT on projects
Calls: check_project_limit()

### update_profiles_updated_at

Fires before UPDATE on profiles
Sets updated_at to now()

### update_projects_updated_at

Fires before UPDATE on projects
Sets updated_at to now()

## Row Level Security

### Enabled Tables

All tables have RLS enabled except:
- pipeline_events (read-only via jobs)
- pipeline_checkpoints (internal)
- pipeline_components (internal)
- pipeline_candidates (internal)

### Common Policy Patterns

User owns record:
```sql
user_id = auth.uid()
```

User owns parent record:
```sql
EXISTS (
  SELECT 1 FROM projects 
  WHERE projects.id = [table].project_id 
  AND projects.user_id = auth.uid()
)
```

Service role bypass:
```sql
auth.role() = 'service_role'
```




---

# Supabase Edge Functions

## stripe-webhook

Handles Stripe webhook events.

Location: `supabase/functions/stripe-webhook/index.ts`

Deployment:
```powershell
supabase functions deploy stripe-webhook
```

Environment variables:
- STRIPE_WEBHOOK_SECRET
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY

Handled events:

### customer.subscription.created

Creates or updates subscription in profiles table.

Logic:
1. Extract customer ID from event
2. Find user by stripe_customer_id
3. Update profile with:
   - plan (from price ID)
   - subscription_id
   - subscription_status: 'active'
   - subscription_period_start
   - subscription_period_end
   - trial_ends_at: null (clear trial)

### customer.subscription.updated

Updates subscription status and period.

Logic:
1. Find user by subscription_id
2. Update profile with new:
   - subscription_status
   - subscription_period_start
   - subscription_period_end
   - plan (if price changed)

Status mapping:
- active -> active
- past_due -> past_due
- canceled -> canceled
- unpaid -> unpaid

### customer.subscription.deleted

Handles cancellation and downgrades.

Logic:
1. Find user by subscription_id
2. Downgrade plan to 'free'
3. Set show_url to false
4. Find all live projects for user
5. For each project:
   - Set show_url to false
   - Set suspended to true
   - Deploy placeholder to Cloudflare

Placeholder deployment:
```html
<!DOCTYPE html>
<html>
<head>
  <title>Site Temporarily Unavailable</title>
</head>
<body>
  <h1>This site is temporarily unavailable</h1>
  <p>Please contact the site owner.</p>
</body>
</html>
```

### invoice.payment_succeeded

Logs successful payment.

Logic:
1. Record payment in logs
2. Ensure subscription status is 'active'

### invoice.payment_failed

Handles failed payments.

Logic:
1. Find user by customer_id
2. Update subscription_status to 'past_due'
3. Send payment failed email
4. After 3 failures, suspend account

## downgrade-trials

Scheduled function to downgrade expired trials.

Location: `supabase/functions/downgrade-trials/index.ts`

Schedule: Daily at 00:00 UTC (via pg_cron)

Deployment:
```powershell
supabase functions deploy downgrade-trials
```

Logic:
1. Find all users where:
   - plan = 'trial'
   - trial_ends_at < now()
   - subscription_status is null or not 'active'
2. For each user:
   - Set plan to 'free'
   - Set show_url to false
   - Find live projects
   - Set project show_url to false
   - Optional: Deploy placeholder

Query:
```sql
SELECT id, email, trial_ends_at
FROM profiles
WHERE plan = 'trial'
  AND trial_ends_at < NOW()
  AND (subscription_status IS NULL OR subscription_status != 'active')
```

## reset-revisions

Scheduled function to reset monthly revision counts.

Location: `supabase/functions/reset-revisions/index.ts`

Schedule: Monthly on 1st at 00:00 UTC (via pg_cron)

Deployment:
```powershell
supabase functions deploy reset-revisions
```

Logic:
1. Update all profiles:
   - Set revision_count to 0
2. Log reset event

Query:
```sql
UPDATE profiles
SET revision_count = 0,
    updated_at = NOW()
WHERE revision_count > 0
```

## lead-email

Sends contact form submissions to project owners.

Location: `supabase/functions/lead-email/index.ts`

Triggered by: Contact form POST from generated sites

Deployment:
```powershell
supabase functions deploy lead-email
```

Environment variables:
- RESEND_API_KEY
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY

Request body:
```json
{
  "project_id": "uuid",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "(555) 123-4567",
  "message": "I need a plumber"
}
```

Logic:
1. Validate input
2. Insert lead into leads table
3. Get project details and owner email
4. Send email via Resend
5. Update lead.email_sent = true
6. Return success

Email template:
```
Subject: New Lead from [Business Name]

You have a new contact form submission:

Name: [name]
Email: [email]
Phone: [phone]

Message:
[message]

Submitted: [timestamp]
```

Styling matches Onara design system.

Error handling:
- Lead always saved even if email fails
- Email failure logged but doesn't return error to user
- Retry logic for transient Resend failures

## refresh-reviews

Updates Google Reviews data for projects.

Location: `supabase/functions/refresh-reviews/index.ts`

Schedule: Weekly (via pg_cron)

Deployment:
```powershell
supabase functions deploy refresh-reviews
```

Environment variables:
- GOOGLE_PLACES_API_KEY
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- FEATURE_REVIEWS_BADGE (must be 'true')

Logic:
1. Find all projects with place_id
2. For each project:
   - Call Google Places API
   - Get current rating and review_count
   - Compare with stored review_badges data
   - If changed:
     - Update review_badges table
     - Update projects.rating and projects.review_count
     - Optional: Trigger redeploy
3. Log results

Query:
```sql
SELECT id, place_id, business_name
FROM projects
WHERE place_id IS NOT NULL
  AND status = 'live'
  AND suspended = false
```

Google Places API call:
```typescript
const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=rating,user_ratings_total,reviews&key=${apiKey}`;
```

Feature flag check:
```typescript
if (process.env.FEATURE_REVIEWS_BADGE !== 'true') {
  return new Response('Feature disabled', { status: 200 });
}
```

## support-email

AI-powered support email responder.

Location: `supabase/functions/support-email/index.ts`

Triggered by: Inbound email to support@onara.tech

Deployment:
```powershell
supabase functions deploy support-email
```

Environment variables:
- NVIDIA_NIM_API_KEY or OLLAMA_BASE_URL
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- RESEND_API_KEY

Request body (from email webhook):
```json
{
  "from": "user@example.com",
  "subject": "How do I edit my site?",
  "text": "I need help editing...",
  "html": "<p>I need help editing...</p>"
}
```

Logic:
1. Parse inbound email
2. Look up user by email
3. Create support_threads record
4. Generate AI response using NIM or Ollama
5. Check for escalation keywords:
   - "billing"
   - "charge"
   - "refund"
   - "cancel subscription"
   - "delete account"
   - "security"
   - "unauthorized"
6. If escalation needed:
   - Set escalated = true
   - Forward to human
7. Else:
   - Send AI response via Resend
   - Update thread with ai_response

AI prompt:
```
You are a support agent for Onara, an AI website builder for local businesses.

User question: [user message]

Provide a helpful, concise response. Reference these resources:
- Dashboard: https://onara.tech/dashboard
- Help page: https://onara.tech/help
- Support email: support@onara.tech

Do not make promises about billing, refunds, or account actions.
```

Escalation logic:
```typescript
const escalationKeywords = [
  'billing', 'charge', 'refund', 'cancel',
  'delete account', 'security', 'unauthorized',
  'breach', 'hack', 'fraud'
];

const needsEscalation = escalationKeywords.some(kw => 
  message.toLowerCase().includes(kw)
);
```

Response template:
```
Subject: Re: [original subject]

Hi [name or "there"],

[AI response]

If you need further assistance, reply to this email or visit https://onara.tech/help.

Best,
Onara Support Team
```

## Database Triggers for Edge Functions

### pg_cron jobs

Configured in migration files:

Daily trial downgrade:
```sql
SELECT cron.schedule(
  'downgrade-trials',
  '0 0 * * *',
  $$
  SELECT net.http_post(
    url := 'https://[project-ref].supabase.co/functions/v1/downgrade-trials',
    headers := '{"Authorization": "Bearer [anon-key]"}'::jsonb
  )
  $$
);
```

Monthly revision reset:
```sql
SELECT cron.schedule(
  'reset-revisions',
  '0 0 1 * *',
  $$
  SELECT net.http_post(
    url := 'https://[project-ref].supabase.co/functions/v1/reset-revisions',
    headers := '{"Authorization": "Bearer [anon-key]"}'::jsonb
  )
  $$
);
```

Weekly reviews refresh:
```sql
SELECT cron.schedule(
  'refresh-reviews',
  '0 2 * * 0',
  $$
  SELECT net.http_post(
    url := 'https://[project-ref].supabase.co/functions/v1/refresh-reviews',
    headers := '{"Authorization": "Bearer [anon-key]"}'::jsonb
  )
  $$
);
```

## Edge Function Utilities

### Shared utilities

Location: `supabase/functions/_shared/`

#### supabase.ts

Creates authenticated Supabase client:
```typescript
import { createClient } from '@supabase/supabase-js';

export const getSupabaseClient = () => {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
};
```

#### resend.ts

Resend email helper:
```typescript
export const sendEmail = async (params: {
  to: string;
  subject: string;
  html: string;
}) => {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'Onara <support@onara.tech>',
      ...params
    })
  });
  
  return response.json();
};
```

#### cors.ts

CORS headers for Edge Functions:
```typescript
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
```

## Testing Edge Functions

### Local testing

Start Supabase locally:
```powershell
supabase start
supabase functions serve
```

Invoke function:
```powershell
curl -i --location --request POST "http://localhost:54321/functions/v1/lead-email" `
  --header "Authorization: Bearer [anon-key]" `
  --header "Content-Type: application/json" `
  --data '{"project_id":"...","name":"Test","email":"test@example.com","message":"Test message"}'
```

### Remote testing

Invoke deployed function:
```powershell
curl -i --location --request POST "https://[project-ref].supabase.co/functions/v1/lead-email" `
  --header "Authorization: Bearer [anon-key]" `
  --header "Content-Type: application/json" `
  --data '{"project_id":"...","name":"Test","email":"test@example.com","message":"Test message"}'
```

### View logs

```powershell
supabase functions logs lead-email --limit 50
```

## Edge Function Error Handling

Standard error response:
```typescript
return new Response(
  JSON.stringify({ error: 'Error message' }),
  {
    status: 400,
    headers: { 'Content-Type': 'application/json', ...corsHeaders }
  }
);
```

Common error codes:
- 400: Bad request / invalid input
- 401: Unauthorized
- 403: Forbidden
- 404: Not found
- 500: Internal server error
- 503: Service unavailable

Logging:
```typescript
console.error('[function-name] Error:', error.message);
```




---

# Troubleshooting Guide

## Common Issues and Solutions

### App Won't Start

#### Next.js dev server fails

Symptoms:
- Error: "Module not found"
- Port already in use
- TypeScript errors

Solutions:

1. Clean install dependencies:
```powershell
cd C:\Users\Aarush\Downloads\Onara\Onara_Code\app
Remove-Item -Recurse -Force node_modules
Remove-Item -Force pnpm-lock.yaml
pnpm.cmd install
```

2. Check port availability:
```powershell
netstat -ano | findstr :3000
# Kill process if needed
taskkill /PID [pid] /F
```

3. Type check first:
```powershell
pnpm.cmd type-check
```

4. Clear Next.js cache:
```powershell
Remove-Item -Recurse -Force .next
pnpm.cmd dev
```

#### Environment variables missing

Symptoms:
- "NEXT_PUBLIC_SUPABASE_URL is not defined"
- 500 errors on API routes
- Blank pages

Solutions:

1. Verify .env.local exists:
```powershell
Test-Path .env.local
```

2. Check required variables:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
PIPELINE_URL=
PIPELINE_API_SECRET=
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
NEXT_PUBLIC_APP_URL=
APP_URL=
```

3. Restart dev server after env changes

4. Check Vercel environment variables match local

### Pipeline Server Issues

#### FastAPI won't start

Symptoms:
- Port 8000 already in use
- Module import errors
- Missing dependencies

Solutions:

1. Check if running:
```powershell
netstat -ano | findstr :8000
```

2. Stop existing process:
```powershell
cd "C:\Users\Aarush Katam\Downloads\Onara\Onara_Code\pipeline"
pm2 stop onara-pipeline
pm2 delete onara-pipeline
```

3. Reinstall dependencies:
```powershell
python -m pip install -r requirements.txt --upgrade
npm install
```

4. Check Python version:
```powershell
python --version  # Should be 3.11+
```

5. Test imports:
```powershell
python -c "import fastapi; import chromadb; print('OK')"
```

#### Pipeline health check fails

Symptoms:
- /health returns 404 or 500
- Cannot reach https://pipeline.onara.tech

Solutions:

1. Check PM2 status:
```powershell
cd "C:\Users\Aarush Katam\Downloads\Onara\Onara_Code\pipeline"
pm2 status
pm2 logs onara-pipeline --lines 50
```

2. Check Cloudflare Tunnel:
```powershell
cloudflared tunnel list
cloudflared tunnel info onara-pipeline
```

3. Restart tunnel:
```powershell
# Find cloudflared process
tasklist | findstr cloudflared
# Kill and restart
pm2 restart cloudflared
```

4. Test local health:
```powershell
Invoke-WebRequest -Uri http://localhost:8000/health -UseBasicParsing
```

5. Check firewall rules allow port 8000

#### Jobs stuck in queue

Symptoms:
- Generation never starts
- Status stuck at "queued"
- Queue size keeps growing

Solutions:

1. Check active jobs:
```powershell
Invoke-WebRequest -Uri https://pipeline.onara.tech/metrics `
  -Headers @{"Authorization"="Bearer $env:PIPELINE_API_SECRET"} `
  -UseBasicParsing
```

2. Check database leases:
```sql
SELECT id, status, lease_expires_at
FROM pipeline_jobs
WHERE status = 'running'
  AND lease_expires_at < NOW();
```

3. Release expired leases:
```sql
UPDATE pipeline_jobs
SET status = 'queued', lease_id = NULL, lease_expires_at = NULL
WHERE status = 'running'
  AND lease_expires_at < NOW();
```

4. Restart pipeline worker:
```powershell
pm2 restart onara-pipeline
```

5. Check logs for errors:
```powershell
pm2 logs onara-pipeline --lines 100 --err
```

### Database Issues

#### Connection timeouts

Symptoms:
- "Connection timeout" errors
- Supabase client hangs
- API routes return 500

Solutions:

1. Check Supabase project status at dashboard

2. Verify connection string:
```powershell
$env:SUPABASE_URL  # Should be https://[ref].supabase.co
```

3. Test connection:
```powershell
curl https://[ref].supabase.co/rest/v1/ `
  -H "apikey: $env:SUPABASE_ANON_KEY"
```

4. Check connection pooler settings in Supabase dashboard

5. Restart app server

#### RLS policy errors

Symptoms:
- "permission denied for table"
- Empty results when data exists
- 403 errors on authenticated requests

Solutions:

1. Check user is authenticated:
```typescript
const { data: { user } } = await supabase.auth.getUser();
console.log('User:', user?.id);
```

2. Verify policy allows operation:
```sql
SELECT * FROM pg_policies
WHERE tablename = 'projects';
```

3. Test with service role (bypasses RLS):
```typescript
const { data, error } = await supabaseAdmin
  .from('projects')
  .select('*')
  .eq('id', projectId);
```

4. Check user_id matches auth.uid():
```sql
SELECT id, user_id FROM projects WHERE id = '[project-id]';
SELECT auth.uid();
```

5. Apply pending migrations:
```powershell
cd C:\Users\Aarush\Downloads\Onara\Onara_Code
supabase db push --linked
```

#### Migration conflicts

Symptoms:
- "migration already applied"
- "schema out of sync"
- Different schema locally vs remote

Solutions:

1. Check migration status:
```powershell
supabase migration list
```

2. Reset local database:
```powershell
supabase db reset
```

3. Pull remote schema:
```powershell
supabase db pull
```

4. Fix conflicts manually then:
```powershell
supabase db push --linked
```

### Authentication Issues

#### OAuth not working

Symptoms:
- Redirect loop after Google sign-in
- "invalid_request" error
- User created but profile missing

Solutions:

1. Check redirect URLs in Google Cloud Console:
   - Add: https://[ref].supabase.co/auth/v1/callback
   - Add: http://localhost:3000/auth/callback (dev)

2. Verify Supabase Auth URLs:
   - Site URL: https://onara.tech
   - Redirect URLs include app URL

3. Check profile trigger exists:
```sql
SELECT * FROM pg_trigger
WHERE tgname = 'on_auth_user_created';
```

4. Manually create missing profile:
```sql
INSERT INTO profiles (id, email, plan, created_at)
VALUES ('[user-id]', '[email]', 'free', NOW());
```

#### Session expires immediately

Symptoms:
- User logged out after refresh
- "invalid_token" errors
- Auth state doesn't persist

Solutions:

1. Check cookie settings in Supabase Auth config

2. Verify server/client separation:
```typescript
// Server: createServerClient
// Client: createBrowserClient
```

3. Check middleware isn't clearing session:
```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  const { supabase, response } = createServerClient(request);
  await supabase.auth.getSession(); // Refresh session
  return response;
}
```

4. Check for conflicting auth state:
```powershell
# Clear browser storage and cookies
```

#### Email verification issues

Symptoms:
- Verification email not received
- Link expired
- Link doesn't work

Solutions:

1. Check Resend domain verification

2. Check spam folder

3. Manually confirm user:
```sql
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = '[user-email]';
```

4. Resend verification:
```typescript
await supabase.auth.resend({
  type: 'signup',
  email: 'user@example.com'
});
```

### Billing Issues

#### Checkout session fails

Symptoms:
- Stripe checkout doesn't load
- "publishable_key invalid"
- Payment Element blank

Solutions:

1. Verify Stripe keys:
```powershell
echo $env:STRIPE_PUBLISHABLE_KEY  # Should start with pk_
echo $env:STRIPE_SECRET_KEY       # Should start with sk_
```

2. Check price IDs in .env match Stripe dashboard

3. Test checkout creation:
```powershell
curl -X POST http://localhost:3000/api/billing/create-checkout `
  -H "Content-Type: application/json" `
  -d '{"plan":"starter_monthly"}'
```

4. Check customer creation:
```powershell
stripe customers list --limit 1
```

5. Verify webhook endpoint in Stripe dashboard

#### Webhook not received

Symptoms:
- Payment succeeds but plan doesn't update
- subscription_status remains null
- User still on trial after payment

Solutions:

1. Check webhook endpoint URL in Stripe:
   - Should be: https://[ref].supabase.co/functions/v1/stripe-webhook

2. Check webhook signing secret:
```powershell
stripe webhooks list
```

3. Test webhook locally:
```powershell
stripe listen --forward-to http://localhost:54321/functions/v1/stripe-webhook
```

4. Check Edge Function logs:
```powershell
supabase functions logs stripe-webhook --limit 50
```

5. Manually trigger webhook event in Stripe dashboard

6. Check event in Stripe dashboard shows delivery success

#### Plan limits not enforced

Symptoms:
- Can create more sites than plan allows
- Revisions don't decrement
- Show URL visible after cancellation

Solutions:

1. Check plan value in profiles:
```sql
SELECT id, email, plan, subscription_status
FROM profiles
WHERE email = '[user-email]';
```

2. Verify trigger function:
```sql
SELECT * FROM pg_trigger
WHERE tgname = 'on_project_create';
```

3. Check user_plan_limits view:
```sql
SELECT * FROM user_plan_limits
WHERE user_id = '[user-id]';
```

4. Manually fix:
```sql
UPDATE profiles
SET plan = 'starter_monthly',
    subscription_status = 'active'
WHERE id = '[user-id]';
```

### Generation Issues

#### Generation fails immediately

Symptoms:
- Status goes directly to "failed"
- No preview HTML
- Error message is generic

Solutions:

1. Check pipeline logs:
```powershell
pm2 logs onara-pipeline --lines 100
```

2. Check AI provider connectivity:
```powershell
# Test NVIDIA NIM
curl https://integrate.api.nvidia.com/v1/models `
  -H "Authorization: Bearer $env:NVIDIA_API_KEY"

# Test Ollama
curl http://localhost:11434/api/tags
```

3. Check business data validity:
```sql
SELECT business_name, address, category
FROM projects
WHERE id = '[project-id]';
```

4. Check pipeline job record:
```sql
SELECT id, status, error_message, error_details
FROM pipeline_jobs
WHERE project_id = '[project-id]'
ORDER BY created_at DESC
LIMIT 1;
```

5. Retry with different business:
```powershell
# Simpler business data may succeed
```

#### Generation hangs at specific agent

Symptoms:
- Progress stuck at Agent 3, 6, etc.
- No timeout
- Job status "running" but no progress

Solutions:

1. Check which agent is stuck:
```sql
SELECT current_stage, progress_percent, started_at
FROM pipeline_jobs
WHERE id = '[job-id]';
```

2. Check agent timeout config:
```python
# onara_pipeline/config.py
AGENT_TIMEOUT_SECONDS = 300
```

3. Check model rate limits:
```powershell
# NVIDIA NIM has rate limits
# Wait and retry
```

4. Check Ollama model loaded:
```powershell
curl http://localhost:11434/api/ps
```

5. Force timeout and retry:
```sql
UPDATE pipeline_jobs
SET status = 'failed',
    error_message = 'Agent timeout'
WHERE id = '[job-id]';
```

#### Generated site has issues

Symptoms:
- Missing components
- Broken layout
- Photos not loading
- JavaScript errors in generated site

Solutions:

1. Check QA agent output in logs

2. Validate HTML structure:
```powershell
# Download and validate
curl https://[site-url] -o site.html
# Check for required components
```

3. Check photo URLs:
```sql
SELECT photos FROM projects WHERE id = '[project-id]';
```

4. Trigger revision to fix:
```powershell
# Use revision system to repair issues
```

5. Check Cloudflare Pages deployment:
```powershell
# Login to Cloudflare dashboard
# Check deployment logs
```

### Deployment Issues

#### Cloudflare Pages deployment fails

Symptoms:
- Status stuck at "deploying"
- "deployment failed" error
- Site not accessible after deploy

Solutions:

1. Check Cloudflare API token:
```powershell
echo $env:CLOUDFLARE_API_TOKEN
```

2. Check account ID and project name:
```powershell
echo $env:CLOUDFLARE_ACCOUNT_ID
echo $env:CLOUDFLARE_PAGES_PROJECT
```

3. Test API access:
```powershell
curl "https://api.cloudflare.com/client/v4/accounts/$env:CLOUDFLARE_ACCOUNT_ID/pages/projects" `
  -H "Authorization: Bearer $env:CLOUDFLARE_API_TOKEN"
```

4. Check deployment logs in Cloudflare dashboard

5. Retry deployment:
```sql
UPDATE projects
SET status = 'pending'
WHERE id = '[project-id]';
```

#### GitHub backup fails

Symptoms:
- No commit in sites repository
- "GitHub API error"
- Missing files in backup

Solutions:

1. Check GitHub App credentials:
```powershell
echo $env:GITHUB_APP_ID
echo $env:GITHUB_PRIVATE_KEY
```

2. Check repository exists:
```powershell
gh repo view [owner]/[repo]
```

3. Check App permissions:
   - Contents: Read & Write
   - Metadata: Read

4. Generate new private key if needed

5. Manual backup:
```powershell
# Clone sites repo
git clone https://github.com/[owner]/[repo]
# Add generated files
# Commit and push
```

### Revision Issues

#### Revisions don't apply

Symptoms:
- Revision completes but site unchanged
- "No changes detected"
- Component not updated

Solutions:

1. Check revision snapshots:
```sql
SELECT component, before_html, after_html
FROM revision_snapshots
WHERE revision_id = '[revision-id]';
```

2. Check component markers in HTML:
```html
<!-- FILE_MARKER: hero -->
<section>...</section>
<!-- END_FILE_MARKER: hero -->
```

3. Verify deployment after revision:
```sql
SELECT status, public_url, updated_at
FROM projects
WHERE id = '[project-id]';
```

4. Check revision was deployed:
```powershell
# View site source
curl https://[site-url]
# Check for changes
```

5. Trigger manual redeploy

#### Revision count incorrect

Symptoms:
- Shows 0 revisions remaining when should have more
- Counter doesn't reset monthly
- Counter decrements on failed revision

Solutions:

1. Check current count:
```sql
SELECT revision_count, plan, updated_at
FROM profiles
WHERE id = '[user-id]';
```

2. Check revision limit for plan:
```typescript
const limits = {
  free: 0,
  trial: 10,
  starter_monthly: 5,
  starter_annual: 5,
  pro_monthly: 20
};
```

3. Manually reset:
```sql
UPDATE profiles
SET revision_count = 0
WHERE id = '[user-id]';
```

4. Check cron job for monthly reset:
```sql
SELECT * FROM cron.job
WHERE jobname = 'reset-revisions';
```

5. Verify revision wasn't counted twice:
```sql
SELECT COUNT(*) as actual_revisions
FROM revisions
WHERE user_id = '[user-id]'
  AND created_at > date_trunc('month', NOW());
```

### Performance Issues

#### Slow page loads

Symptoms:
- Dashboard takes 5+ seconds
- API routes timeout
- Database queries slow

Solutions:

1. Check query performance:
```sql
EXPLAIN ANALYZE
SELECT * FROM projects
WHERE user_id = '[user-id]';
```

2. Add missing indexes:
```sql
CREATE INDEX IF NOT EXISTS idx_projects_user_status
ON projects(user_id, status);
```

3. Enable query logging in Supabase dashboard

4. Check API route caching:
```typescript
export const revalidate = 60; // Next.js 15 cache
```

5. Optimize data fetching:
```typescript
// Fetch only needed fields
.select('id,business_name,status,public_url')
```

#### High memory usage

Symptoms:
- Pipeline server crashes
- PM2 restarts process
- System slowdown

Solutions:

1. Check PM2 memory:
```powershell
pm2 info onara-pipeline
```

2. Check Python memory:
```powershell
tasklist | findstr python
```

3. Clear ChromaDB periodically:
```python
# Add cleanup job
```

4. Limit concurrent jobs:
```python
# onara_pipeline/config.py
MAX_CONCURRENT_JOBS = 2
```

5. Restart PM2 process:
```powershell
pm2 restart onara-pipeline
```

### Email Issues

#### Emails not sending

Symptoms:
- Lead emails not received
- Welcome emails missing
- Support responses not sent

Solutions:

1. Check Resend API key:
```powershell
curl https://api.resend.com/emails `
  -H "Authorization: Bearer $env:RESEND_API_KEY"
```

2. Verify domain verification in Resend dashboard

3. Check from address:
   - Must be: support@onara.tech or verified domain

4. Check Edge Function logs:
```powershell
supabase functions logs lead-email
```

5. Test send manually:
```powershell
curl -X POST "https://api.resend.com/emails" `
  -H "Authorization: Bearer $env:RESEND_API_KEY" `
  -H "Content-Type: application/json" `
  -d '{"from":"support@onara.tech","to":"test@example.com","subject":"Test","html":"<p>Test</p>"}'
```

#### Emails in spam

Symptoms:
- Emails arrive in spam/junk
- Low delivery rate
- Bounce notifications

Solutions:

1. Check SPF record:
```powershell
nslookup -type=TXT onara.tech
```

2. Check DKIM in Resend dashboard

3. Check DMARC record

4. Improve email content:
   - Avoid spam trigger words
   - Include unsubscribe link
   - Use proper HTML structure

5. Verify sender reputation in Resend dashboard




---

# Testing Guide

## Unit Testing

### Pipeline Tests

Location: `Onara_Code/pipeline/tests/`

Run all tests:
```powershell
cd C:\Users\Aarush\Downloads\Onara\Onara_Code\pipeline
python -m unittest discover -s tests -p "test_*.py"
```

Run specific test file:
```powershell
python -m unittest tests.test_agents
```

Run specific test:
```powershell
python -m unittest tests.test_agents.TestAgents.test_analyst_agent
```

### Test Structure

#### test_agents.py

Tests individual agent logic.

```python
import unittest
from onara_pipeline.agents import Agent1Analyst

class TestAgents(unittest.TestCase):
    def setUp(self):
        self.business_data = {
            "name": "Joe's Plumbing",
            "category": "plumber",
            "services": ["Leak Repair", "Drain Cleaning"]
        }
    
    def test_analyst_agent(self):
        agent = Agent1Analyst()
        result = agent.analyze(self.business_data)
        
        self.assertIn("business_type", result)
        self.assertIn("target_keywords", result)
        self.assertEqual(result["business_type"], "plumber")
    
    def test_content_writer(self):
        # Test content generation
        pass
```

#### test_deployment.py

Tests deployment logic.

```python
import unittest
from unittest.mock import Mock, patch
from onara_pipeline.deployment import CloudflareDeployer

class TestDeployment(unittest.TestCase):
    @patch('requests.post')
    def test_cloudflare_deploy(self, mock_post):
        mock_post.return_value.status_code = 200
        mock_post.return_value.json.return_value = {
            "result": {"url": "https://test.pages.dev"}
        }
        
        deployer = CloudflareDeployer()
        result = deployer.deploy("<html>test</html>", "test-project")
        
        self.assertEqual(result["url"], "https://test.pages.dev")
        mock_post.assert_called_once()
```

#### test_rag.py

Tests RAG search and storage.

```python
import unittest
from onara_pipeline.rag import RAGSystem

class TestRAG(unittest.TestCase):
    def setUp(self):
        self.rag = RAGSystem()
    
    def test_search(self):
        results = self.rag.search("plumber hero section")
        
        self.assertIsInstance(results, list)
        self.assertTrue(len(results) > 0)
    
    def test_add_pattern(self):
        pattern = {
            "content": "<section>test</section>",
            "metadata": {"type": "hero"}
        }
        
        result = self.rag.add(pattern)
        self.assertTrue(result["success"])
```

#### test_validators.py

Tests validation and safety guards.

```python
import unittest
from onara_pipeline.validators import HTMLValidator

class TestValidators(unittest.TestCase):
    def test_valid_html(self):
        html = """
        <!DOCTYPE html>
        <html><head><title>Test</title></head>
        <body><!-- FILE_MARKER: hero --><section>Hero</section><!-- END_FILE_MARKER: hero --></body>
        </html>
        """
        
        validator = HTMLValidator()
        result = validator.validate(html)
        
        self.assertTrue(result["valid"])
        self.assertEqual(len(result["errors"]), 0)
    
    def test_missing_components(self):
        html = "<!DOCTYPE html><html><body></body></html>"
        
        validator = HTMLValidator()
        result = validator.validate(html)
        
        self.assertFalse(result["valid"])
        self.assertIn("missing_hero", result["errors"])
```

### Running Tests in CI

GitHub Actions workflow example:

```yaml
name: Pipeline Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.11'
    
    - name: Install dependencies
      run: |
        cd Onara_Code/pipeline
        python -m pip install -r requirements.txt
    
    - name: Run tests
      run: |
        cd Onara_Code/pipeline
        python -m unittest discover -s tests -p "test_*.py"
```

## Integration Testing

### Manual Test Scenarios

#### Complete Generation Flow

1. Start fresh:
```powershell
# Clear test data
# Delete test projects from dashboard
```

2. Sign in as test user

3. Search for business:
   - Query: "Joe's Plumbing Arlington VA"
   - Verify results appear
   - Verify photos load

4. Confirm business details:
   - Check all fields populated
   - Verify no missing required data

5. Pick style preferences:
   - Select color scheme
   - Select layout preference

6. Start generation:
   - Click "Generate Website"
   - Verify progress page loads
   - Verify SSE stream connects

7. Monitor progress:
   - Watch agent progression
   - Verify preview updates
   - Check for errors

8. Verify completion:
   - Status shows "live"
   - Public URL accessible
   - Site displays correctly

9. Check generated site:
   - All components present
   - Photos display
   - Contact form works
   - Mobile responsive
   - No console errors

Expected duration: 2-5 minutes

#### Revision Flow

1. From dashboard, click "Edit" on live site

2. Enter revision request:
   - "Change hero background to blue"

3. Select components or use auto-pick

4. Submit revision

5. Monitor revision progress

6. Verify changes:
   - Check before/after diff
   - Verify hero background changed
   - Verify site redeployed

7. Test rollback:
   - Click "Rollback"
   - Verify previous version restored
   - Check site reflects rollback

Expected duration: 30-90 seconds

#### Billing Flow

1. Start as free/trial user

2. Navigate to billing page

3. Select plan:
   - Choose "Starter Monthly"

4. Enter test card:
   - Card: 4242 4242 4242 4242
   - Expiry: Any future date
   - CVC: Any 3 digits
   - ZIP: Any 5 digits

5. Complete checkout

6. Verify webhook processed:
   - Check profile.plan updated
   - Check subscription_status = 'active'
   - Check dashboard shows new plan

7. Test plan limits:
   - Try creating more sites than limit
   - Verify limit enforced

8. Test cancellation:
   - Navigate to billing page
   - Click "Cancel Subscription"
   - Verify cancellation confirmed
   - Verify plan remains until period end

Expected duration: 3-5 minutes

### API Testing

#### Using curl

Test health endpoint:
```powershell
curl -i http://localhost:3000/api/health
```

Test Places search:
```powershell
curl "http://localhost:3000/api/places/search?query=plumber+washington+dc"
```

Test protected endpoint:
```powershell
$token = "your_access_token"
curl -H "Authorization: Bearer $token" http://localhost:3000/api/projects/list
```

#### Using Postman

Collection setup:

1. Import collection
2. Set environment variables:
   - base_url: http://localhost:3000
   - access_token: (get from browser devtools)
   - project_id: (test project ID)

Endpoints to test:
- GET /api/health
- GET /api/places/search
- POST /api/projects/create
- GET /api/projects/list
- POST /api/revisions/create
- POST /api/billing/create-checkout

### Browser Testing

#### Desktop Testing

Browsers:
- Chrome/Edge (Chromium)
- Firefox
- Safari (if available)

Test areas:
- Landing page loads and animates
- Sign in works
- Dashboard displays correctly
- Business search returns results
- Generation progress streams
- Generated sites display properly
- Billing checkout works

#### Mobile Testing

Devices:
- iPhone (Safari)
- Android (Chrome)
- Tablet (iPad/Android)

Test areas:
- Responsive layout
- Touch interactions
- Form inputs
- Stripe mobile checkout
- Generated site mobile view

#### Accessibility Testing

Tools:
- Chrome DevTools Lighthouse
- axe DevTools browser extension
- NVDA or JAWS screen reader

Test areas:
- Keyboard navigation
- Screen reader compatibility
- Color contrast
- Focus indicators
- Alt text on images
- Form labels
- ARIA attributes

### Load Testing

#### Locust Load Test

Script example:

```python
from locust import HttpUser, task, between

class OnaraUser(HttpUser):
    wait_time = between(1, 3)
    
    @task(3)
    def view_dashboard(self):
        self.client.get("/dashboard")
    
    @task(2)
    def search_places(self):
        self.client.get("/api/places/search?query=plumber")
    
    @task(1)
    def start_generation(self):
        self.client.post("/api/generate/start", json={
            "project_id": "test-project-id"
        })
```

Run load test:
```powershell
locust -f loadtest.py --host=http://localhost:3000
```

#### Pipeline Load Test

Test concurrent generations:

```python
import asyncio
import aiohttp

async def start_generation(session, i):
    async with session.post(
        'http://localhost:8000/generate',
        json={"project_id": f"test-{i}", "business_data": {...}}
    ) as response:
        return await response.json()

async def main():
    async with aiohttp.ClientSession() as session:
        tasks = [start_generation(session, i) for i in range(10)]
        results = await asyncio.gather(*tasks)
        print(f"Completed: {len(results)}")

asyncio.run(main())
```

### Performance Testing

#### Next.js Performance

Lighthouse audit:
```powershell
# Install lighthouse CLI
npm install -g lighthouse

# Run audit
lighthouse http://localhost:3000 --output html --output-path ./report.html
```

Target scores:
- Performance: 90+
- Accessibility: 95+
- Best Practices: 90+
- SEO: 90+

#### Pipeline Performance

Measure generation time:

```python
import time
from onara_pipeline import Pipeline

start = time.time()
pipeline = Pipeline()
result = pipeline.generate(business_data)
duration = time.time() - start

print(f"Generation took {duration:.2f} seconds")
```

Target metrics:
- Initial generation: < 180 seconds
- Revisions: < 60 seconds
- Queue processing: < 5 seconds per job

### End-to-End Testing

#### Playwright Tests

Setup:
```powershell
cd Onara_Code/pipeline
npm install
npm run install-browser
```

Test example:

```typescript
import { test, expect } from '@playwright/test';

test('complete generation flow', async ({ page }) => {
  // Sign in
  await page.goto('http://localhost:3000/login');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  
  // Wait for dashboard
  await expect(page).toHaveURL(/.*dashboard/);
  
  // Start new project
  await page.click('text=New Website');
  
  // Search business
  await page.fill('input[placeholder="Search"]', 'Joe\'s Plumbing');
  await page.click('button:has-text("Search")');
  
  // Wait for results
  await page.waitForSelector('.business-card');
  await page.click('.business-card:first-child button');
  
  // Confirm and start generation
  await page.click('button:has-text("Generate Website")');
  
  // Wait for completion (with timeout)
  await page.waitForSelector('text=Your site is live', { timeout: 300000 });
  
  // Verify public URL
  const publicUrl = await page.locator('.public-url').textContent();
  expect(publicUrl).toContain('pages.dev');
});
```

Run tests:
```powershell
npx playwright test
```

### Regression Testing

#### Pre-deployment Checklist

Before deploying to production:

1. Run all unit tests
2. Run integration tests
3. Manual smoke tests:
   - Sign up new user
   - Generate one site
   - Create one revision
   - Test billing flow
   - Test cancellation
4. Check error logs for patterns
5. Verify migrations applied
6. Verify environment variables set
7. Check Stripe webhook endpoint
8. Verify Cloudflare Pages project
9. Test generated site deployment
10. Verify email delivery

#### Test Data Management

Create test users:
```sql
INSERT INTO auth.users (id, email, encrypted_password)
VALUES (gen_random_uuid(), 'test@onara.tech', crypt('password123', gen_salt('bf')));
```

Create test projects:
```sql
INSERT INTO projects (user_id, business_name, status)
VALUES ('[user-id]', 'Test Business', 'live');
```

Clean up test data:
```sql
DELETE FROM projects WHERE business_name LIKE 'Test%';
DELETE FROM auth.users WHERE email LIKE 'test%@onara.tech';
```

### Monitoring and Alerts

#### UptimeRobot Setup

Monitor endpoints:
- https://onara.tech (every 5 minutes)
- https://pipeline.onara.tech/health (every 5 minutes)
- https://onara.tech/api/health (every 10 minutes)

Alert contacts:
- Email: alerts@onara.tech
- Slack: (if configured)

#### Error Tracking

Recommended: Sentry integration

Setup:
```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: process.env.NODE_ENV
});
```

Track custom events:
```typescript
Sentry.captureException(error, {
  tags: {
    component: "generation",
    project_id: projectId
  }
});
```

#### Logs

App logs (Vercel):
```powershell
vercel logs --follow
```

Pipeline logs (PM2):
```powershell
pm2 logs onara-pipeline --lines 100 --timestamp
```

Supabase logs:
- View in Supabase dashboard
- Filter by Edge Function
- Filter by severity

Database logs:
```sql
SELECT * FROM pipeline_events
WHERE event_type = 'job_failed'
  AND created_at > NOW() - INTERVAL '1 day'
ORDER BY created_at DESC;
```




---

# Deployment Guide

## Production Deployment Checklist

### Pre-Deployment Requirements

Before deploying to production:

1. Environment variables configured
2. Database migrations applied
3. Stripe webhook endpoint configured
4. Google OAuth verified
5. Domain DNS configured
6. SSL certificates active
7. Cloudflare tunnel operational
8. PM2 ecosystem configured
9. Backup procedures tested
10. Monitoring alerts active

### Vercel Deployment

#### Initial Setup

1. Connect repository to Vercel:
```powershell
cd C:\Users\Aarush\Downloads\Onara\Onara_Code\app
vercel login
vercel link
```

2. Configure environment variables in Vercel dashboard:
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE_KEY
   - PIPELINE_URL
   - PIPELINE_API_SECRET
   - STRIPE_SECRET_KEY
   - STRIPE_PUBLISHABLE_KEY
   - STRIPE_WEBHOOK_SECRET
   - GOOGLE_PLACES_API_KEY
   - NEXT_PUBLIC_APP_URL
   - APP_URL

3. Deploy:
```powershell
vercel --prod
```

#### Continuous Deployment

Vercel automatically deploys:
- main branch → production
- Other branches → preview deployments

Configure branch protection:
```
Settings → Branches → Branch protection rules
- Require pull request reviews
- Require status checks
- Require conversation resolution
```

#### Domain Configuration

1. Add custom domain in Vercel dashboard
2. Update DNS records:
```
Type: CNAME
Name: @
Value: cname.vercel-dns.com
```

3. Update environment variables:
```
NEXT_PUBLIC_APP_URL=https://onara.tech
APP_URL=https://onara.tech
```

### Pipeline Server Deployment

#### Mini PC Setup

1. Install dependencies:
```powershell
# Python 3.11+
winget install Python.Python.3.11

# Node.js
winget install OpenJS.NodeJS.LTS

# PM2
npm install -g pm2
```

2. Clone repository:
```powershell
cd "C:\Users\Aarush Katam\Downloads"
git clone https://github.com/yourusername/onara.git
cd onara\Onara_Code\pipeline
```

3. Install Python dependencies:
```powershell
python -m pip install -r requirements.txt
```

4. Install browser dependencies:
```powershell
npm install
npm run install-browser
```

5. Configure environment:
```powershell
copy .env.example .env
# Edit .env with production values
```

6. Start with PM2:
```powershell
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

#### Cloudflare Tunnel Setup

1. Install cloudflared:
```powershell
winget install Cloudflare.cloudflared
```

2. Authenticate:
```powershell
cloudflared tunnel login
```

3. Create tunnel:
```powershell
cloudflared tunnel create onara-pipeline
```

4. Configure tunnel:
```yaml
# config.yml
tunnel: onara-pipeline
credentials-file: C:\Users\Aarush\.cloudflared\[tunnel-id].json

ingress:
  - hostname: pipeline.onara.tech
    service: http://localhost:8000
  - service: http_status:404
```

5. Route DNS:
```powershell
cloudflared tunnel route dns onara-pipeline pipeline.onara.tech
```

6. Run tunnel:
```powershell
cloudflared tunnel run onara-pipeline
```

7. Add to PM2:
```javascript
// ecosystem.config.cjs
module.exports = {
  apps: [
    {
      name: 'onara-pipeline',
      script: 'uvicorn',
      args: 'main:app --host 0.0.0.0 --port 8000',
      interpreter: 'python'
    },
    {
      name: 'cloudflared',
      script: 'cloudflared',
      args: 'tunnel run onara-pipeline'
    }
  ]
};
```

### Supabase Configuration

#### Production Project Setup

1. Create production project at dashboard.supabase.com

2. Configure Auth providers:
   - Google OAuth
   - Email/password
   - Redirect URLs

3. Apply migrations:
```powershell
cd C:\Users\Aarush\Downloads\Onara\Onara_Code
supabase link --project-ref [your-project-ref]
supabase db push
```

4. Deploy Edge Functions:
```powershell
supabase functions deploy stripe-webhook
supabase functions deploy downgrade-trials
supabase functions deploy reset-revisions
supabase functions deploy lead-email
supabase functions deploy refresh-reviews
supabase functions deploy support-email
```

5. Configure secrets:
```powershell
supabase secrets set STRIPE_WEBHOOK_SECRET=[secret]
supabase secrets set RESEND_API_KEY=[key]
supabase secrets set GOOGLE_PLACES_API_KEY=[key]
supabase secrets set NVIDIA_NIM_API_KEY=[key]
```

#### Database Backups

1. Enable point-in-time recovery in dashboard

2. Configure daily backups:
```sql
-- Create backup role
CREATE ROLE backup_user WITH LOGIN PASSWORD 'secure_password';
GRANT CONNECT ON DATABASE postgres TO backup_user;
GRANT USAGE ON SCHEMA public TO backup_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO backup_user;
```

3. Automated backup script:
```powershell
# backup.ps1
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupFile = "onara_backup_$timestamp.sql"

pg_dump "postgresql://[user]:[password]@[host]:5432/postgres" -f $backupFile

# Upload to cloud storage
aws s3 cp $backupFile s3://onara-backups/
```

### Stripe Configuration

#### Webhook Setup

1. Create webhook endpoint in Stripe dashboard:
   - URL: https://[project-ref].supabase.co/functions/v1/stripe-webhook
   - Events to send:
     - customer.subscription.created
     - customer.subscription.updated
     - customer.subscription.deleted
     - invoice.payment_succeeded
     - invoice.payment_failed

2. Copy webhook signing secret to Supabase secrets

3. Test webhook:
```powershell
stripe listen --forward-to https://[project-ref].supabase.co/functions/v1/stripe-webhook
stripe trigger customer.subscription.created
```

#### Product Configuration

1. Create products:
   - Starter Monthly ($29/month)
   - Starter Annual ($99/year)
   - Pro Monthly ($79/month)

2. Copy price IDs to environment variables:
```
STRIPE_PRICE_STARTER_MONTHLY=price_xxx
STRIPE_PRICE_STARTER_ANNUAL=price_xxx
STRIPE_PRICE_PRO_MONTHLY=price_xxx
```

### DNS Configuration

Configure DNS records at your provider:

```
# Root domain
Type: A
Name: @
Value: [Vercel IP]

# WWW
Type: CNAME
Name: www
Value: cname.vercel-dns.com

# Pipeline
Type: CNAME
Name: pipeline
Value: [tunnel-id].cfargotunnel.com

# Email (if using custom domain)
Type: MX
Name: @
Value: mx1.resend.com
Priority: 10
```

### SSL/TLS Configuration

Vercel and Cloudflare handle SSL automatically.

For custom certificates:

1. Vercel:
   - Upload certificate in project settings
   - Or use automatic Let's Encrypt

2. Cloudflare:
   - SSL/TLS mode: Full (strict)
   - Edge Certificates: Auto

### Monitoring Setup

#### UptimeRobot

1. Create monitors:
```
Name: Onara App
URL: https://onara.tech
Type: HTTP(s)
Interval: 5 minutes

Name: Pipeline Health
URL: https://pipeline.onara.tech/health
Type: HTTP(s)
Interval: 5 minutes

Name: API Health
URL: https://onara.tech/api/health
Type: HTTP(s)
Interval: 10 minutes
```

2. Configure alert contacts:
   - Email
   - SMS (optional)
   - Webhook (optional)

#### Log Aggregation

Recommended: Datadog, New Relic, or Papertrail

Setup example (Datadog):
```javascript
// app/instrumentation.ts
import tracer from 'dd-trace';

if (process.env.NODE_ENV === 'production') {
  tracer.init({
    service: 'onara-app',
    env: 'production'
  });
}
```

### Performance Optimization

#### Next.js Optimizations

```javascript
// next.config.js
module.exports = {
  images: {
    domains: ['maps.googleapis.com'],
    formats: ['image/avif', 'image/webp']
  },
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  swcMinify: true
};
```

#### CDN Configuration

Vercel CDN is automatic. For additional caching:

```javascript
// Cache static assets
export const config = {
  runtime: 'edge'
};

export default function handler(req) {
  return new Response('...', {
    headers: {
      'Cache-Control': 'public, max-age=31536000, immutable'
    }
  });
}
```

### Security Hardening

#### Headers Configuration

```javascript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ]
      }
    ];
  }
};
```

#### Rate Limiting

```typescript
// middleware.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s')
});

export async function middleware(request: NextRequest) {
  const ip = request.ip ?? '127.0.0.1';
  const { success } = await ratelimit.limit(ip);
  
  if (!success) {
    return new Response('Too Many Requests', { status: 429 });
  }
  
  return NextResponse.next();
}
```

### Rollback Procedures

#### App Rollback

Vercel:
```powershell
# List deployments
vercel ls

# Rollback to specific deployment
vercel rollback [deployment-url]
```

#### Database Rollback

```powershell
# Restore from backup
pg_restore -d postgres backup_file.sql

# Or revert migration
supabase migration revert
```

#### Pipeline Rollback

```powershell
# Stop current version
pm2 stop onara-pipeline

# Checkout previous version
git checkout [previous-commit]

# Reinstall dependencies if needed
python -m pip install -r requirements.txt

# Restart
pm2 restart onara-pipeline
```

### Disaster Recovery

#### Backup Strategy

1. Database: Daily automated backups, 30-day retention
2. Generated sites: GitHub repository backup
3. User uploads: Cloudflare R2 or S3
4. Configuration: Version controlled in Git

#### Recovery Steps

1. Restore database from backup
2. Redeploy app to Vercel
3. Restart pipeline server
4. Verify all services operational
5. Check recent user activity
6. Send status update if downtime exceeded SLA

### Launch Checklist

Final checks before public launch:

- [ ] All environment variables set
- [ ] SSL certificates active
- [ ] Stripe live mode enabled
- [ ] Google OAuth approved
- [ ] Error monitoring active
- [ ] Backup procedures tested
- [ ] Load testing completed
- [ ] Security audit passed
- [ ] Privacy policy published
- [ ] Terms of service published
- [ ] Support email operational
- [ ] Status page configured
- [ ] Monitoring alerts configured
- [ ] Team access configured
- [ ] Incident response plan documented

---

# Appendix

## Environment Variables Reference

### App Environment (.env.local)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon-key]
SUPABASE_SERVICE_ROLE_KEY=[service-role-key]

# Pipeline
PIPELINE_URL=https://pipeline.onara.tech
PIPELINE_API_SECRET=[secret]

# Stripe
STRIPE_SECRET_KEY=[sk_live_xxx]
STRIPE_PUBLISHABLE_KEY=[pk_live_xxx]
STRIPE_WEBHOOK_SECRET=[whsec_xxx]
STRIPE_PRICE_STARTER_MONTHLY=price_xxx
STRIPE_PRICE_STARTER_ANNUAL=price_xxx
STRIPE_PRICE_PRO_MONTHLY=price_xxx

# Google
GOOGLE_PLACES_API_KEY=[key]

# App URLs
NEXT_PUBLIC_APP_URL=https://onara.tech
APP_URL=https://onara.tech
```

### Pipeline Environment (.env)

```bash
# Supabase
SUPABASE_URL=https://[project-ref].supabase.co
SUPABASE_SERVICE_ROLE_KEY=[service-role-key]

# Pipeline
PIPELINE_API_SECRET=[secret]
PIPELINE_V2_ENABLED=true
PIPELINE_V3_ENABLED=true
PIPELINE_V3_CANARY_PERCENT=100

# AI Providers
NVIDIA_NIM_API_KEY=[key]
OLLAMA_BASE_URL=http://localhost:11434

# Cloudflare
CLOUDFLARE_API_TOKEN=[token]
CLOUDFLARE_ACCOUNT_ID=[account-id]
CLOUDFLARE_PAGES_PROJECT=onara-sites

# GitHub
GITHUB_APP_ID=[app-id]
GITHUB_PRIVATE_KEY=[private-key]
GITHUB_REPO_OWNER=[owner]
GITHUB_REPO_NAME=[repo]

# Email
RESEND_API_KEY=[key]

# Features
FEATURE_REVIEWS_BADGE=true
FEATURE_GBP_SYNC=false
```

## Common Commands

### Development

```powershell
# Start app
cd C:\Users\Aarush\Downloads\Onara\Onara_Code\app
pnpm dev

# Start pipeline
cd C:\Users\Aarush\Downloads\Onara\Onara_Code\pipeline
python -m uvicorn main:app --reload

# Type check
pnpm type-check

# Build
pnpm build
```

### Production

```powershell
# Deploy app
vercel --prod

# Restart pipeline
pm2 restart onara-pipeline

# View logs
pm2 logs onara-pipeline --lines 100

# Apply migrations
supabase db push --linked

# Deploy Edge Functions
supabase functions deploy [function-name]
```

### Maintenance

```powershell
# Update dependencies
pnpm update
python -m pip install -r requirements.txt --upgrade

# Clear caches
Remove-Item -Recurse -Force .next
Remove-Item -Recurse -Force node_modules\.cache

# Database cleanup
supabase db reset  # local only
```

## Glossary

| Term | Definition |
|------|------------|
| Agent | AI component specialized for specific task (e.g., content writer, QA) |
| Pipeline | Series of agents that transform business data into a website |
| Component | Section of generated site (hero, services, contact, etc.) |
| Revision | User-requested change to a generated site |
| Snapshot | Before/after state of a component for rollback |
| RLS | Row Level Security - Supabase database access control |
| Edge Function | Serverless function running on Supabase/Deno Deploy |
| RAG | Retrieval Augmented Generation - AI with knowledge base |
| Checkpoint | Saved agent state for resume after interruption |
| Lease | Lock on a job to prevent duplicate processing |
| Candidate | One of multiple generated sites before selection |

---

End of Documentation
