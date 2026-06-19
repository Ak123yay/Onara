# Onara Documentation

Last updated: 2026-06-19

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
- In-memory job queue.
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

The pipeline uses 10 agents:

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
python -m compileall -q onara_pipeline
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
