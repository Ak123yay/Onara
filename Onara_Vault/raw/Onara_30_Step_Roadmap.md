**Onara**

Complete 30-Step Development Roadmap

AI-Powered Contractor Website Builder - onara.tech

**_Confidential - Internal Development Reference_**

# **How to Use This Document**

This 30-step roadmap takes Onara from zero to a live, revenue-generating product with paying customers. Each step is self-contained - read the Why section, follow the numbered instructions, and tick every item in the Verification Checklist before moving on. Steps are ordered exactly as you should execute them.

**🧠 Model Stack - NVIDIA NIM (one free nvapi- key) + Plan-Gated Picker**

ALL cloud calls go through NVIDIA NIM. One key. Free. 80+ open-source models. NIM Models by Agent: Agent 1 (Analyst): deepseek-ai/deepseek-v4-flash Agent 4 (Planner): deepseek-ai/deepseek-v4-pro Agent 5 (Prompt Engineer): moonshotai/kimi-k2.6 Agent 6 (Code Gen primary): moonshotai/kimi-k2.6 (Tier A, 87/100, best frontend) Agent 7 (Debugger): moonshotai/kimi-k2.6 Agent 9 (QA): deepseek-ai/deepseek-v4-pro Local Models (your PC - no cost): Agents 2, 3, 8, 10: qwen3:8b | Supervisor + all cloud fallbacks: llama3.3:8b Model Picker for Agent 6 (plan-gated): Free: NIM kimi-k2.6 (default, no user key needed) Starter: + GitHub Copilot SDK (gpt-5.2-codex, gpt-4.1, gpt-4o - student plan) Pro: + Claude API (sonnet/opus - user provides key) + OpenAI API (gpt-5.4, gpt-5.2-codex - user provides key)

## **30 Steps at a Glance**

| **Step** | **Title**                                              | **Phase**               |
| -------- | ------------------------------------------------------ | ----------------------- |
| 0        | Niche Selection & ICP Definition                       | Strategy                |
| 1        | GitHub, Google Cloud & Education                       | Accounts                |
| 2        | Supabase, Cloudflare, Stripe, Resend, Ollama           | Accounts                |
| 3        | PC Setup - Ollama Models & Network                     | Dev Environment         |
| 4        | Mini PC - Tools, Repos & Environment Variables         | Dev Environment         |
| 5        | Database Schema - Tables, Types & Indexes              | Database                |
| 6        | RLS, Auth Triggers, Edge Functions & pg_cron           | Database                |
| 7        | Google OAuth - Supabase Config & Testing Mode          | Auth & Places           |
| 8        | Google Places API Route & Business Confirmation        | Auth & Places           |
| 9        | Design System - Tailwind Tokens & Base Components      | Frontend Foundation     |
| 10       | Landing Page - Niche-Specific, Pricing & Social Proof  | Frontend Foundation     |
| 11       | Auth Pages - Sign Up, Login & Middleware               | Frontend Foundation     |
| 12       | Dashboard Shell - Layout, Sidebar & My Sites           | Dashboard               |
| 13       | Build Flow - Search → Confirm → Style → Generate       | Dashboard               |
| 14       | Agent Progress, Preview Iframe & Status Route          | Dashboard               |
| 15       | FastAPI Server - Redis Queue & Deduplication           | Pipeline Infrastructure |
| 16       | AI Client Library - NIM, Kimi, DeepSeek & Model Picker | Pipeline Infrastructure |
| 17       | RAG System - ChromaDB & BM25 Hybrid Search             | Pipeline Infrastructure |
| 18       | Agents 1-3 - Analyst, Content Writer, Style Agent      | AI Agents               |
| 19       | Agents 4-5 - Planner & Prompt Engineer                 | AI Agents               |
| 20       | Agent 6 - Code Generator with Model Picker             | AI Agents               |
| 21       | Agents 7-10 - Debugger, SEO, QA, Mobile                | AI Agents               |
| 22       | Deployment Pipeline - Parser, GitHub, Cloudflare       | Deployment              |
| 23       | Revision System - Incremental Updates                  | Deployment              |
| 24       | Stripe Billing - Checkout, Webhooks & Trials           | Monetization            |
| 25       | Account Page - Plan Gating & Model Picker              | Monetization            |
| 26       | Retention Features - GBP Sync & Review Badge           | Retention               |
| 27       | Architecture Hardening - 11 Production Fixes           | Retention               |
| 28       | Pre-Launch - Legal, Monitoring & Security              | Launch                  |
| 29       | Distribution - Cold Outbound & Partnerships            | Launch                  |
| 30       | Launch Week - Soft Launch, Product Hunt & Metrics      | Launch                  |

PHASE 0 - STRATEGY

**STEP 0**

**Niche Selection & ICP Definition**

Choosing exactly who Onara serves before writing a line of code - the single highest-leverage decision you will make.

**⏱️ Time estimate: 1 day | Difficulty: Critical - do not skip**

Complete the verification checklist at the bottom before moving to the next step.

## **Why This Step Determines Everything**

"Small businesses" is not a customer. A plumber in Ohio and a boutique in Miami have completely different website needs, different willingness to pay, different places they congregate online, and different words they use to describe their problem. Onara built for everyone is Onara built for no one. The businesses that reach \$10K MRR in year one all share one trait: obsessive specificity about who they serve.

Niche specificity also makes word-of-mouth happen automatically. "It's the website builder for restaurants" travels in a way that "it's an AI website builder" never does. Every restaurant owner in a city knows every other restaurant owner. One enthusiastic customer in a tight niche can replace an entire marketing budget.

## **0.1 The Three Criteria for Picking Your Niche**

A good niche for Onara satisfies all three of these criteria simultaneously:

- High Google Business Profile density - the business type must have dense, complete GBP listings. Restaurants, contractors, salons, and gyms do. Art galleries and law firms often do not. Without a good GBP listing, the import workflow produces thin output.
- Recurring pain point - the owner must feel the website problem monthly, not once every three years. Restaurants change menus seasonally. Contractors get new certifications. Salons add new stylists. This drives retention.
- Reachable in community - there must be a clear channel to reach them. Local Facebook groups for restaurant owners, trade association newsletters for contractors, Reddit communities for barber shop owners. Without a channel, you have no distribution.

## **0.2 Recommended Starting Vertical**

**🎯 Start here: Local Service Contractors (Plumbers, Electricians, HVAC, Landscapers)**

Why: Dense GBP listings with photos and reviews. Clear website need (most have nothing or a broken Wix from 2015). High willingness to pay (\$29/month is nothing when one job is \$800+). Easy to reach via HomeAdvisor, Angi, and local contractor Facebook groups. Strong word-of-mouth within trades. Do NOT start with: restaurants (high churn, thin margins), e-commerce (different needs), professional services (lawyers/accountants have compliance constraints).

## **0.3 Define Your ICP (Ideal Customer Profile)**

Write this down before any code. Fill it out completely:

| \# Onara ICP v1 - fill this out                                               |
| ----------------------------------------------------------------------------- |
|                                                                               |
| Business Type: Local service contractor (plumber/electrician/HVAC/landscaper) |
| Geography: Single metro area at launch (choose your city)                     |
| Size: Solo operator or 1-5 employees                                          |
| Annual Revenue: \$80K - \$400K                                                |
| Current Website: None, or broken/outdated (3+ years old)                      |
| Tech Comfort: Uses smartphone daily, not technical                            |
| Pain Point: Losing jobs to competitors who appear more professional online    |
| Decision Maker: The owner themselves, not a marketing manager                 |
| Where to Find: Local contractor Facebook groups, Angi/HomeAdvisor profiles,   |
| Google Maps listings without websites                                         |
|                                                                               |
| Willingness to Pay: \$12-29/month (less than one job)                         |
| Value Proposition: "A professional website in 60 seconds - just search your   |
| Google listing, we do the rest"                                               |

## **0.4 Niche-Specific Features to Build**

Once you have your niche, add these vertical-specific features to the build plan. For contractors:

- Emergency callout banner with large phone number at top - plumbers and electricians get called at 2am
- Service area map or list of cities served - contractors work a radius, not a single address
- License number display - builds trust and is legally required in many states
- Before/after photo gallery section - most contractors have these on their phones already
- "Get a Free Quote" CTA instead of "Contact" - matches how contractors talk about their business
- Google Reviews badge pulled from GBP - social proof is the #1 conversion driver for trades

## **0.5 Distribution Research Before Building**

Find your first 20 customers before launch. Do this now, not after:

- Search Facebook for "\[your city\] plumbers group" or "\[trade\] business owners \[state\]". Join 5-10 groups. Read what they talk about. Note the language they use to describe website problems.
- Go to Google Maps and search your target trade in your city. Find 50 listings with no website link. These are your warm leads. Copy their business name, phone number, and any email you can find. This is your outbound list.
- Find the local chapter of the relevant trade association (plumbing association, electrical contractors association). They have email newsletters and often welcome product partnerships.
- Find 3 local accountants who serve small contractors. Accountants are trusted advisors for their clients and can refer Onara as a service. Offer a referral fee of \$20/month per active customer.

## **0.6 Retention Strategy Before You Build**

Anyone can build a website once. Write down right now why contractors will still be paying Onara in month 6:

**🔒 Retention Mechanisms - Build These Into the Plan**

1\. Hours/Holiday sync: When Google Business hours change (Christmas, Thanksgiving), Onara detects the change and offers to update the website in one click. This is automated retention. 2. Review badge: Pull latest Google Reviews into the site weekly. The review count going up is a reason to keep the subscription. 3. Seasonal SEO updates: Offer a monthly "SEO refresh" that updates the site meta tags based on seasonal search trends for their trade. 4. Lead notification: When someone submits the contact form, send the owner an SMS. This makes Onara feel essential daily, not monthly.

## **0.7 The Wow Moment - Speed is the Product**

The single most important user experience metric: time from "search your business name" to "site is live on screen." This must be under 60 seconds.

**⚠️ WARNING**

If the generation pipeline takes more than 60 seconds end-to-end, your product's core story falls apart. "60 seconds to a professional website" is your entire value proposition. Every architectural decision in Steps 15-21 should be evaluated against this benchmark first.

How to hit under 60 seconds:

- Agents 2 and 3 run in parallel - saves 8-12 seconds
- Agent preloading: start the Ollama warm-up call as soon as the user hits "Confirm" on the business data, before they've even filled in style preferences
- Stream the preview: show the iframe as HTML chunks arrive from Agent 6, don't wait for the full file
- Deploy to Cloudflare while the user is still reading the preview - the URL is ready before they click "Go Live"

## **Step 0 Verification Checklist**

**📋 Do not move to Step 1 until all of these are done**

These decisions shape every technical choice that follows. Changing your niche after Step 5 means rebuilding your database schema and landing page.

- ICP document written and saved (business type, geography, size, pain point, WTP)
- 50+ GBP listings without websites identified in your target city - this is your outbound list
- 3-5 Facebook groups joined and read for at least 30 minutes
- Niche-specific features list written (for contractors: emergency banner, service area, license number, reviews badge)
- Retention mechanisms decided: which 2-3 will you build into v1?
- 60-second generation target committed to - all pipeline decisions will be benchmarked against this

PHASE 1 - ACCOUNTS

**STEP 1**

**GitHub, Google Cloud & Education Setup**

Creating your GitHub account with Education benefits, setting up the GitHub App for secure deployments, and configuring Google Cloud for OAuth and Places API.

**⏱️ Time estimate: 2-4 hours | Difficulty: Low - mostly form filling**

Complete the verification checklist at the bottom before moving to the next step.

**📋 Prerequisites for this step**

Completed Step 0 - niche and ICP defined A student email address (.edu) for GitHub Education

## **1.1 GitHub Account & Education Verification**

Everything in Onara runs under one GitHub account - your personal development account. The GitHub App (Onara Deployer) handles all security isolation, scoped to the onara-sites repo only.

- Go to github.com and create or log into your personal account.
- Navigate to github.com/education and click "Get benefits for students."
- Submit verification with your student email. This can take 24-72 hours. Start it now - do not wait until Step 4.
- Once approved: Settings > Copilot > Enable for your account. This is Agent 6's primary code generation tool.

## **1.2 Copilot SDK Fine-Grained PAT**

The GitHub Copilot SDK authenticates with a fine-grained Personal Access Token. This is separate from the GitHub App - it's only for the SDK's API calls.

- Settings > Developer Settings > Personal access tokens > Fine-grained tokens > Generate new token.
- Name: Onara Copilot. Expiration: 90 days. Set a calendar reminder to regenerate it.
- Resource owner: your personal account.
- Repository access: No repositories (Copilot SDK does not need repo access - it only calls the Copilot completions API).
- Permissions: Scroll to User permissions. Enable "Copilot" - set to Read only. No other permissions.
- Click Generate token. Copy immediately and save as COPILOT_GITHUB_TOKEN. You will not see it again.

**💡 PRO TIP**

Why Read only for Copilot? The SDK reads completions from the Copilot API - it never writes anything back. "Write" would mean managing Copilot seat billing, which you do not need.

## **1.3 GitHub App - Onara Deployer**

The GitHub App replaces the old "deploy account" approach. It gives the pipeline write access to onara-sites only - no other repos on your account are accessible even if credentials leak.

- Settings > Developer Settings > GitHub Apps > New GitHub App.
- Name: Onara Deployer. Homepage URL: <https://onara.tech> (or any placeholder for now).
- Webhooks: uncheck "Active" - you do not need webhooks.
- Permissions - set EXACTLY these, nothing else:
  - Repository permissions > Contents: Read & Write
  - Repository permissions > Metadata: Read only
  - Everything else: No access
- "Where can this GitHub App be installed?": Only on this account.
- Click Create GitHub App. Copy the App ID shown at the top - save as GITHUB_APP_ID.
- Scroll to "Private keys" > Generate a private key. A .pem file downloads. Open it in a text editor and copy the full contents - save as GITHUB_APP_PRIVATE_KEY.
- In the left sidebar, click "Install App." Install on your account. Choose "Only select repositories" and select onara-sites (create this repo first - see next step).
- After installing, look at the URL bar: /settings/installations/{number}. Copy that number and save as GITHUB_APP_INSTALLATION_ID.

## **1.4 Create the onara-sites Repository**

- On GitHub, create a new repository named onara-sites.
- Set it to Private. Add a README. Click Create.
- This repo will hold all user-generated site code under sites/{projectId}/

**💡 PRO TIP**

Why private? Your users' generated site code is their business data. Making it public would expose every business's content before they've even launched. Private also prevents competitors from seeing your generated output quality.

## **1.5 Google Cloud Project Setup**

- Go to console.cloud.google.com. Sign in with your personal Google account.
- Click the project dropdown at the top > New Project. Name: onara-prod. Click Create.
- Make sure onara-prod is selected in the dropdown before proceeding.

## **1.6 Enable Google Places API (New)**

- In the left menu: APIs & Services > Library.
- Search "Places API (New)" - make sure it says "(New)" not the legacy version.
- Click Enable.
- Navigate to APIs & Services > Credentials > Create Credentials > API Key.
- Name: Onara Places Key.
- Click Edit Key (the pencil icon). Under "API restrictions" select "Restrict key." Choose Places API (New) only.
- Under "Application restrictions" - set to "None" for now (you can add HTTP referrers later to lock it to onara.tech).
- Click Save. Copy the key and save as GOOGLE_PLACES_API_KEY.

**💳 Places API Billing**

The Places API requires a billing account but has a \$200/month free credit. At roughly \$0.017 per Text Search call, you get ~11,700 searches free per month. That is 11,700 business search attempts before you pay anything. Way more than you need at launch.

## **1.7 Google OAuth Credentials**

- APIs & Services > OAuth consent screen. User Type: External. Click Create.
- App name: Onara. User support email: your email. Developer contact: your email. Click Save and Continue.
- Scopes: click "Add or remove scopes." Add: .../auth/userinfo.email and .../auth/userinfo.profile. Click Update.
- Test users: click "Add users." Add your own Google account. This is CRITICAL - in testing mode, only listed accounts can sign in. Click Save and Continue.
- Back to credentials: Create Credentials > OAuth 2.0 Client ID.
- Application type: Web Application. Name: Onara OAuth.
- Authorized redirect URIs - add these two (you will get the first from Supabase in Step 7):
  - <http://localhost:3000/dashboard> (for local dev)
  - <https://your-project.supabase.co/auth/v1/callback> (from Supabase Step 7)
- Click Create. Copy the Client ID as GOOGLE_OAUTH_CLIENT_ID and Client Secret as GOOGLE_OAUTH_CLIENT_SECRET.

**⚠️ WARNING**

Testing Mode means ONLY Google accounts you list as test users can sign in. Everyone else sees "This app hasn't been verified." This is fine for development. Before launch, go to OAuth consent screen > Publish App. For basic Google Sign-In (email + profile only), verification is usually automatic and instant.

## **Step 1 Verification Checklist**

- GitHub Education application submitted (24-72 hours - start this first)
- Copilot enabled on GitHub account once Education is approved
- COPILOT_GITHUB_TOKEN created with Copilot Read scope only, no repo access
- GitHub App "Onara Deployer" created with Contents R/W and Metadata R only
- GITHUB_APP_ID, GITHUB_APP_INSTALLATION_ID, GITHUB_APP_PRIVATE_KEY all saved
- onara-sites private repo created and GitHub App installed on it
- Google Cloud project "onara-prod" created
- Places API (New) enabled and API key created with Places restriction only
- OAuth consent screen created with your email as test user
- GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET saved

PHASE 1 - ACCOUNTS

**STEP 2**

**Supabase, Cloudflare, Stripe, Resend & Ollama**

Creating all remaining service accounts and collecting every API key needed for the full application.

**⏱️ Time estimate: 2-3 hours | Difficulty: Low**

Complete the verification checklist at the bottom before moving to the next step.

**📋 Prerequisites for this step**

Step 1 complete - GitHub and Google Cloud set up

## **2.1 Supabase Project**

- Go to supabase.com and create a free account.
- New project. Name: onara. Choose a strong database password - save it immediately in your password manager, Supabase will not show it again.
- Region: choose closest to your target users (us-east-1 for US, eu-west-1 for Europe).
- Wait for project creation (1-2 minutes).
- Go to Project Settings > API. You need these three values:
  - Project URL → save as SUPABASE_URL
  - Project API Keys > Publishable (formerly "anon/public") → save as NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  - Project API Keys > Secret (formerly "service_role") → save as SUPABASE_SECRET_KEY

**🚨 CRITICAL**

SUPABASE*SECRET_KEY bypasses ALL Row Level Security. It must NEVER appear in any NEXT_PUBLIC* variable, any client-side code, or any file that gets committed to Git. Only use it in Next.js API routes (server-side) and FastAPI. Set up .gitignore before you ever touch this key.

## **2.2 Vercel**

- Go to vercel.com and sign up with your GitHub account (single-click OAuth).
- Do not create a project yet - that happens when you push the Next.js repo in Step 4.
- Account Settings > Tokens > Create Token. Name: onara-deploy. Copy as VERCEL_TOKEN.
- Note your team ID if you are on a team plan, or your username for the free hobby tier.

## **2.3 Cloudflare**

Onara uses two completely separate Cloudflare features. Understand the distinction before proceeding:

**☁️ Two Different Cloudflare Things**

Cloudflare Pages: This is where your USERS' generated websites live. Each generated site gets a free {projectId}.pages.dev subdomain. You configure this with API tokens. Cloudflare Tunnel (cloudflared CLI): This exposes your FastAPI pipeline server (running on the mini PC) to the public internet so Next.js can call it. This runs on your mini PC. Your domain onara.tech points to Vercel (your app), NOT to Cloudflare.

- Go to cloudflare.com and create a free account.
- Note your Account ID - visible in the URL after you log in: dash.cloudflare.com/{accountId}. Save as CLOUDFLARE_ACCOUNT_ID.
- My Profile > API Tokens > Create Token. Use template "Edit Cloudflare Workers." Change permissions to: Account > Cloudflare Pages > Edit. Click Create. Save as CLOUDFLARE_API_TOKEN.
- Add your domain onara.tech to Cloudflare: Add a Site. Follow DNS configuration instructions from your registrar. This takes 24-48 hours to propagate.

## **2.4 Stripe**

- Go to stripe.com and create an account. Complete the business info form.
- Developers > API Keys. Copy the Secret Key (sk*test*...) - save as STRIPE_SECRET_KEY. Use test mode during all development.
- Products > Add Product. Create three products:
  - Free - \$0. Save Price ID as STRIPE_FREE_PRICE_ID
  - Starter - \$12.00/month recurring. Save Price ID as STRIPE_STARTER_PRICE_ID
  - Pro - \$29.00/month recurring. Save Price ID as STRIPE_PRO_PRICE_ID
- Developers > Webhooks > Add Endpoint. URL: placeholder for now. Events: checkout.session.completed, customer.subscription.deleted, invoice.payment*failed. Save the Signing Secret (whsec*...) as STRIPE_WEBHOOK_SECRET.
- Install Stripe CLI for local webhook testing: npm install -g stripe. Run: stripe login.

## **2.5 Resend (Transactional Email)**

- Go to resend.com and create a free account (3,000 emails/month free - sufficient for launch).
- API Keys > Create API Key. Name: Onara. Copy as RESEND_API_KEY.
- Domains > Add Domain. Add mail.onara.tech. Follow the DNS verification steps (add MX and TXT records to your Cloudflare DNS). This takes a few minutes to verify.
- Once verified, your from address will be something like <noreply@mail.onara.tech>.

## **2.6 NVIDIA NIM Account**

- Go to ollama.com and create a free account.
- Settings > API Keys > Generate. Copy as OLLAMA_API_KEY.

The cloud models Onara uses (deepseek-ai/deepseek-v4-flash, deepseek-ai/deepseek-v4-pro, moonshotai/kimi-k2.6, deepseek-ai/deepseek-v4-pro) are all on the free tier. No payment method required.

## **2.7 Master Credentials File**

Create a file called onara-credentials.txt in a location that will NEVER be inside a Git repository (e.g., ~/Desktop or a password manager). This is your single source of truth for all credentials.

| \# onara-credentials.txt                                                         |
| -------------------------------------------------------------------------------- |
| \# NEVER commit this file. Add it to .gitignore.                                 |
| \# Location: ~/Desktop/onara-credentials.txt (NOT inside any repo)               |
|                                                                                  |
| \# ── GitHub ──────────────────────────────────────────────                      |
| GITHUB_USERNAME=                                                                 |
| COPILOT_GITHUB_TOKEN=                                                            |
| GITHUB_APP_ID=                                                                   |
| GITHUB_APP_INSTALLATION_ID=                                                      |
| GITHUB_APP_PRIVATE_KEY= # full .pem file contents                                |
|                                                                                  |
| \# ── Google ───────────────────────────────────────────────                     |
| GOOGLE_PLACES_API_KEY=                                                           |
| GOOGLE_OAUTH_CLIENT_ID=                                                          |
| GOOGLE_OAUTH_CLIENT_SECRET=                                                      |
|                                                                                  |
| \# ── Supabase ─────────────────────────────────────────────                     |
| SUPABASE_URL=                                                                    |
| NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=                                            |
| SUPABASE_SECRET_KEY=                                                             |
|                                                                                  |
| \# ── Cloudflare ───────────────────────────────────────────                     |
| CLOUDFLARE_ACCOUNT_ID=                                                           |
| CLOUDFLARE_API_TOKEN=                                                            |
|                                                                                  |
| \# ── Stripe ───────────────────────────────────────────────                     |
| STRIPE_SECRET_KEY=                                                               |
| STRIPE_WEBHOOK_SECRET=                                                           |
| STRIPE_FREE_PRICE_ID=                                                            |
| STRIPE_STARTER_PRICE_ID=                                                         |
| STRIPE_PRO_PRICE_ID=                                                             |
|                                                                                  |
| \# ── Resend ───────────────────────────────────────────────                     |
| RESEND_API_KEY=                                                                  |
|                                                                                  |
| \# ── Ollama ───────────────────────────────────────────────                     |
| OLLAMA_API_KEY=                                                                  |
|                                                                                  |
| \# ── Shared pipeline secret (generate once, use in both apps) ──                |
| \# Run: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))" |
| PIPELINE_SECRET=                                                                 |
|                                                                                  |
| \# ── Vercel ───────────────────────────────────────────────                     |
| VERCEL_TOKEN=                                                                    |
|                                                                                  |
| \# ── URLs (fill in as you create them) ───────────────────                      |
| PIPELINE_SERVER_URL= # Cloudflare Tunnel URL (Step 3)                            |
| NEXT_PUBLIC_APP_URL= # <https://onara.tech> (or vercel preview URL)              |

## **Step 2 Verification Checklist**

- Supabase project created, all three keys saved (URL, publishable, secret)
- Vercel account created and linked to GitHub, VERCEL_TOKEN saved
- Cloudflare account created, onara.tech domain added, Account ID and API token saved
- Stripe account created, all three Price IDs saved, Stripe CLI installed and logged in
- Resend account created, API key saved, mail.onara.tech domain verified in DNS
- NVIDIA NIM account created, API key saved
- Master credentials file created with ALL fields - none left blank
- PIPELINE_SECRET generated (crypto.randomBytes(32).toString('hex')) and saved

PHASE 2 - DEV ENVIRONMENT

**STEP 3**

**PC Setup - Ollama Models & Local Network**

Installing Ollama on your main PC, pulling the two local models, configuring the network to allow the mini PC to reach the PC's Ollama server.

**⏱️ Time estimate: 1-2 hours (includes model download time) | Difficulty: Low**

Complete the verification checklist at the bottom before moving to the next step.

**📋 Prerequisites for this step**

Steps 1-2 complete PC with at least 16GB RAM for qwen3:8b (8GB minimum - qwen3:8b quantized will run on 8GB) PC and mini PC on the same WiFi or ethernet network

## **3.1 Two-Machine Architecture Explained**

**🖥️ Why split across two machines?**

PC: Runs Ollama only. Ollama's local models are compute-heavy and RAM-hungry. Keeping them on the PC prevents them from competing with your web servers for memory. Mini PC: Runs everything else - Next.js (port 3000), FastAPI pipeline server (port 8000), Stripe CLI, Cloudflare tunnel. This is where you write code. The FastAPI server on the mini PC calls Ollama on the PC via your local network IP (e.g., <http://192.168.1.45:11434>). The cloud Ollama models (deepseek-ai/deepseek-v4-pro, moonshotai/kimi-k2.6, etc.) are all called via NVIDIA NIM - no separate installation needed.

## **3.2 Install Ollama on Your PC**

| \# macOS                                                     |
| ------------------------------------------------------------ |
| curl -fsSL <https://ollama.com/install.sh> \| sh             |
| \# Or download the .dmg from ollama.com/download             |
|                                                              |
| \# Windows                                                   |
| \# Download OllamaSetup.exe from ollama.com/download         |
| \# Run installer, Ollama starts automatically in system tray |
|                                                              |
| \# Linux                                                     |
| curl -fsSL <https://ollama.com/install.sh> \| sh             |
|                                                              |
| \# Verify Ollama is running                                  |
| curl <http://localhost:11434/api/tags>                       |
| \# Should return: {"models":\[\]}                            |

## **3.3 Pull the Local Models**

Onara uses exactly two local models. Both run on your PC. Download times vary (qwen3:8b is ~5GB, llama3.3:8b is ~5GB):

| \# Agent 2 (Content Writer), Agent 3 (Style), Agent 8 (SEO), Agent 10 (Mobile) |
| ------------------------------------------------------------------------------ |
| ollama pull qwen3:8b                                                           |
|                                                                                |
| \# Supervisor + all cloud agent fallbacks when rate limited                    |
| ollama pull llama3.3:8b                                                        |
|                                                                                |
| \# Verify both downloaded successfully                                         |
| ollama list                                                                    |
| \# Expected output:                                                            |
| \# NAME ID SIZE MODIFIED                                                       |
| \# qwen3:8b abc123def456 4.7GB Just now                                        |
| \# llama3.3:8b def456abc123 4.7GB Just now                                     |

## **3.4 Configure Ollama to Accept Network Requests**

By default, Ollama only listens on localhost - it will not accept requests from your mini PC. You need to bind it to 0.0.0.0 to make it accessible on the local network.

| \# macOS: edit the Ollama service plist                            |
| ------------------------------------------------------------------ |
| launchctl setenv OLLAMA_HOST "0.0.0.0"                             |
| \# Then restart Ollama from the menu bar                           |
|                                                                    |
| \# Linux: create a systemd override                                |
| sudo mkdir -p /etc/systemd/system/ollama.service.d/                |
| sudo tee /etc/systemd/system/ollama.service.d/override.conf << EOF |
| \[Service\]                                                        |
| Environment="OLLAMA_HOST=0.0.0.0"                                  |
| EOF                                                                |
| sudo systemctl daemon-reload && sudo systemctl restart ollama      |
|                                                                    |
| \# Windows: set environment variable in System Properties          |
| \# System > Advanced > Environment Variables > New System Variable |
| \# Name: OLLAMA_HOST Value: 0.0.0.0                                |
| \# Restart Ollama from system tray                                 |

## **3.5 Find Your PC's Local IP Address**

| \# macOS/Linux                                                           |
| ------------------------------------------------------------------------ |
| ifconfig \| grep "inet " \| grep -v 127.0.0.1                            |
| \# Example output: inet 192.168.1.45 ...                                 |
|                                                                          |
| \# Windows                                                               |
| ipconfig \| findstr "IPv4"                                               |
| \# Example output: IPv4 Address. . . . . . : 192.168.1.45                |
|                                                                          |
| \# Save this IP as OLLAMA_LOCAL_URL=<http://192.168.1.45:11434>          |
| \# You will put this in the mini PC .env in Step 4                       |
|                                                                          |
| \# TIP: Set a static IP for your PC on your router so this never changes |
| \# Most routers: DHCP reservation by MAC address                         |

## **3.6 Test Network Access from Mini PC**

Before Step 4, confirm the mini PC can reach the PC's Ollama server:

| \# Run this FROM THE MINI PC (not the PC)                               |
| ----------------------------------------------------------------------- |
| curl <http://192.168.1.45:11434/api/tags>                               |
| \# Should return the same {"models":\[...\]} response                   |
|                                                                         |
| \# If this fails, check:                                                |
| \# 1. Both machines on same network (same WiFi SSID or ethernet switch) |
| \# 2. PC firewall allows port 11434                                     |
| \# 3. OLLAMA_HOST is set to 0.0.0.0 (not just 127.0.0.1)                |
|                                                                         |
| \# macOS firewall: System Settings > Privacy & Security > Firewall      |
| \# Add Ollama to allowed apps, or add port 11434 exception              |
|                                                                         |
| \# Windows firewall:                                                    |
| \# Windows Defender Firewall > Advanced Settings > Inbound Rules        |
| \# New Rule > Port > TCP > 11434 > Allow connection                     |

## **3.7 Quick Model Test**

| \# Test that both models can generate output                          |
| --------------------------------------------------------------------- |
| ollama run qwen3:8b "Reply with only the word: READY"                 |
| \# Expected: READY                                                    |
|                                                                       |
| ollama run llama3.3:8b "Reply with only the word: READY"              |
| \# Expected: READY                                                    |
|                                                                       |
| \# Test via network from mini PC                                      |
| curl -X POST <http://192.168.1.45:11434/api/generate> \\              |
| \-H "Content-Type: application/json" \\                               |
| \-d '{"model":"qwen3:8b","prompt":"Reply READY only","stream":false}' |
| \# Expected: {"response":"READY",...}                                 |

## **Step 3 Verification Checklist**

- Ollama installed on PC and running
- qwen3:8b and llama3.3:8b both pulled and visible in ollama list
- OLLAMA_HOST set to 0.0.0.0 on PC and Ollama restarted
- PC local IP identified and noted (e.g., 192.168.1.45)
- curl http://PC_IP:11434/api/tags works FROM THE MINI PC
- Both models tested and returning output
- Optional but recommended: static IP set on router for the PC

PHASE 2 - DEV ENVIRONMENT

**STEP 4**

**Mini PC Setup - Tools, Repos & Environment Variables**

Installing all development tools on the mini PC, creating both repositories, establishing folder structure, creating all environment variable files, and confirming both servers start.

**⏱️ Time estimate: 2-4 hours | Difficulty: Medium**

Complete the verification checklist at the bottom before moving to the next step.

**📋 Prerequisites for this step**

Step 3 complete - Ollama running on PC and accessible from mini PC All credentials from Steps 1-2 in your credentials file Node.js, Python, Git - not yet installed on mini PC

## **4.1 Install Required Tools**

| \# Node.js v22+ (use nvm for easy version management)                                                 |
| ----------------------------------------------------------------------------------------------------- |
| curl -o- <https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh> \| bash                    |
| source ~/.bashrc # or source ~/.zshrc on macOS                                                        |
| nvm install 22                                                                                        |
| nvm use 22                                                                                            |
| nvm alias default 22                                                                                  |
| node --version # must show v22.x.x                                                                    |
|                                                                                                       |
| \# Python 3.11+                                                                                       |
| \# macOS:                                                                                             |
| brew install python@3.11                                                                              |
| \# Ubuntu/Debian:                                                                                     |
| sudo apt update && sudo apt install python3.11 python3.11-venv python3-pip -y                         |
| \# Verify:                                                                                            |
| python3.11 --version # must show 3.11.x                                                               |
|                                                                                                       |
| \# Git                                                                                                |
| git --version # usually pre-installed                                                                 |
| \# If not: brew install git OR sudo apt install git -y                                                |
|                                                                                                       |
| \# PM2 - process manager, keeps FastAPI running and auto-restarts on crash                            |
| npm install -g pm2                                                                                    |
| pm2 --version                                                                                         |
|                                                                                                       |
| \# Stripe CLI - for local webhook testing                                                             |
| npm install -g stripe                                                                                 |
| stripe --version                                                                                      |
|                                                                                                       |
| \# cloudflared - creates the tunnel from internet to your mini PC                                     |
| \# macOS:                                                                                             |
| brew install cloudflare/cloudflare/cloudflared                                                        |
| \# Linux:                                                                                             |
| wget <https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb> |
| sudo dpkg -i cloudflared-linux-amd64.deb                                                              |
| \# Windows: download installer from cloudflare.com/products/tunnel                                    |
|                                                                                                       |
| \# Supabase CLI                                                                                       |
| npm install -g supabase                                                                               |
| supabase --version                                                                                    |
|                                                                                                       |
| \# VS Code (download from code.visualstudio.com)                                                      |

## **4.2 Create Next.js Repository - onara-app**

| npx create-next-app@latest onara-app                                                       |
| ------------------------------------------------------------------------------------------ |
|                                                                                            |
| \# Answer the prompts:                                                                     |
| \# TypeScript? No (JavaScript for faster iteration)                                        |
| \# ESLint? Yes                                                                             |
| \# Tailwind CSS? Yes                                                                       |
| \# src/ directory? No                                                                      |
| \# App Router? Yes                                                                         |
| \# Import alias? No                                                                        |
|                                                                                            |
| cd onara-app                                                                               |
|                                                                                            |
| \# Install all dependencies upfront                                                        |
| npm install \\                                                                             |
| @supabase/supabase-js \\                                                                   |
| @supabase/ssr \\                                                                           |
| @supabase/auth-helpers-nextjs \\                                                           |
| stripe \\                                                                                  |
| resend \\                                                                                  |
| @vercel/analytics                                                                          |
|                                                                                            |
| \# Create full folder structure                                                            |
| mkdir -p app/{login,signup,dashboard/{build,sites,account,preview}}                        |
| mkdir -p "app/dashboard/preview/\[id\]"                                                    |
| mkdir -p app/api/{auth,oauth/google,sites,places,account,stripe,webhooks/stripe}           |
| mkdir -p components lib prompts                                                            |
|                                                                                            |
| \# Create placeholder files                                                                |
| touch app/login/page.jsx app/signup/page.jsx                                               |
| touch app/dashboard/page.jsx app/dashboard/build/page.jsx                                  |
| touch app/dashboard/sites/page.jsx app/dashboard/account/page.jsx                          |
| touch "app/dashboard/preview/\[id\]/page.jsx"                                              |
| touch app/api/auth/route.js app/api/oauth/google/route.js                                  |
| touch app/api/sites/route.js "app/api/sites/\[jobId\]/status/route.js"                     |
| touch app/api/places/route.js app/api/account/route.js                                     |
| touch app/api/stripe/route.js app/api/webhooks/stripe/route.js                             |
| touch components/{Sidebar,AgentProgress,SiteCard,Toast,StepIndicator}.jsx                  |
| touch lib/{supabase,api,codeParser,githubBackup,cloudflarePages,deploymentOrchestrator}.js |
| touch middleware.js                                                                        |
|                                                                                            |
| \# Initialize git and push                                                                 |
| git init && git add . && git commit -m "feat: initial Next.js scaffold"                    |
| git remote add origin <https://github.com/YOUR_USERNAME/onara-app.git>                     |
| git push -u origin main                                                                    |

After pushing: go to vercel.com > Add New Project > Import onara-app. Click Deploy. Your first deployment is live. Every push to main auto-redeploys.

## **4.3 Create FastAPI Repository - onara-pipeline**

| mkdir onara-pipeline && cd onara-pipeline                                        |
| -------------------------------------------------------------------------------- |
|                                                                                  |
| \# Python virtual environment                                                    |
| python3.11 -m venv venv                                                          |
| source venv/bin/activate # Windows: venv\\Scripts\\activate                      |
|                                                                                  |
| \# Install all Python dependencies                                               |
| pip install \\                                                                   |
| fastapi uvicorn httpx ollama \\                                                  |
| chromadb sentence-transformers \\                                                |
| python-jose\[cryptography\] slowapi rank-bm25 \\                                 |
| redis rq python-dotenv pyjwt                                                     |
|                                                                                  |
| pip freeze > requirements.txt                                                    |
|                                                                                  |
| \# Create full folder structure                                                  |
| mkdir -p agents lib rag/docs prompts                                             |
|                                                                                  |
| \# Agent stubs                                                                   |
| touch agents/{\__init_\_,pipeline,analyst,content_writer,style_agent}.py         |
| touch agents/{planner,prompt_engineer,code_generator,debugger}.py                |
| touch agents/{seo_agent,qa_agent,mobile_optimizer,supervisor}.py                 |
|                                                                                  |
| \# Library stubs                                                                 |
| touch lib/{\__init_\_,ollama_client,copilot_client,github_auth,prompt_loader}.py |
|                                                                                  |
| \# RAG stubs                                                                     |
| touch rag/{\__init_\_,vector_store,embedder}.py                                  |
|                                                                                  |
| \# Entry point and config                                                        |
| touch main.py .env .gitignore                                                    |
|                                                                                  |
| \# .gitignore                                                                    |
| cat > .gitignore << EOF                                                          |
| .env                                                                             |
| \__pycache_\_/                                                                   |
| venv/                                                                            |
| \*.pyc                                                                           |
| jobs.db                                                                          |
| chroma_db/                                                                       |
| EOF                                                                              |
|                                                                                  |
| git init && git add . && git commit -m "feat: initial FastAPI scaffold"          |
| git remote add origin <https://github.com/YOUR_USERNAME/onara-pipeline.git>      |
| git push -u origin main                                                          |

## **4.4 Create All Environment Variable Files**

Create these now. Fill in every value from your credentials file. Do not leave anything blank.

**onara-app/.env.local**

| \# onara-app/.env.local - Next.js reads this automatically  |
| ----------------------------------------------------------- |
| \# NEVER commit this file                                   |
|                                                             |
| \# Supabase                                                 |
| NEXT_PUBLIC_SUPABASE_URL=<https://your-project.supabase.co> |
| NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key   |
| SUPABASE_SECRET_KEY=your-secret-key                         |
|                                                             |
| \# Pipeline                                                 |
| PIPELINE_SERVER_URL=<https://your-tunnel.trycloudflare.com> |
| PIPELINE_SECRET=your-64-char-hex                            |
|                                                             |
| \# Google                                                   |
| GOOGLE_PLACES_API_KEY=your-places-key                       |
| GOOGLE_OAUTH_CLIENT_ID=your-oauth-client-id                 |
| GOOGLE_OAUTH_CLIENT_SECRET=your-oauth-client-secret         |
|                                                             |
| \# GitHub App                                               |
| GITHUB_USERNAME=your-github-username                        |
| GITHUB_APP_ID=your-app-id                                   |
| GITHUB_APP_INSTALLATION_ID=your-installation-id             |
| GITHUB_APP_PRIVATE_KEY=your-pem-contents                    |
|                                                             |
| \# Cloudflare                                               |
| CLOUDFLARE_ACCOUNT_ID=your-account-id                       |
| CLOUDFLARE_API_TOKEN=your-api-token                         |
|                                                             |
| \# Stripe                                                   |
| STRIPE_SECRET_KEY=sk_test_your-key                          |
| STRIPE_WEBHOOK_SECRET=whsec_your-secret                     |
| STRIPE_STARTER_PRICE_ID=price_your-id                       |
| STRIPE_PRO_PRICE_ID=price_your-id                           |
|                                                             |
| \# Resend                                                   |
| RESEND_API_KEY=your-resend-key                              |
|                                                             |
| \# App                                                      |
| NEXT_PUBLIC_APP_URL=<http://localhost:3000>                 |

**onara-pipeline/.env**

| \# onara-pipeline/.env - FastAPI reads this via python-dotenv   |
| --------------------------------------------------------------- |
| \# NEVER commit this file                                       |
|                                                                 |
| \# Ollama                                                       |
| OLLAMA_API_KEY=your-ollama-api-key                              |
| OLLAMA_LOCAL_URL=<http://192.168.1.45:11434> # your PC local IP |
|                                                                 |
| \# GitHub Copilot SDK                                           |
| COPILOT_GITHUB_TOKEN=your-fine-grained-pat                      |
|                                                                 |
| \# GitHub App                                                   |
| GITHUB_APP_ID=your-app-id                                       |
| GITHUB_APP_INSTALLATION_ID=your-installation-id                 |
| GITHUB_APP_PRIVATE_KEY=your-pem-contents                        |
|                                                                 |
| \# Supabase (for error logging)                                 |
| SUPABASE_URL=<https://your-project.supabase.co>                 |
| SUPABASE_SECRET_KEY=your-secret-key                             |
|                                                                 |
| \# Pipeline                                                     |
| PIPELINE_SECRET=same-value-as-nextjs                            |
|                                                                 |
| \# ChromaDB                                                     |
| CHROMA_PATH=./chroma_db                                         |

## **4.5 Start the Cloudflare Tunnel**

The Cloudflare Tunnel creates a stable public URL pointing at your FastAPI server on the mini PC. This is PIPELINE_SERVER_URL.

| \# Option A: Quick tunnel (URL resets on restart - OK for early dev)  |
| --------------------------------------------------------------------- |
| cloudflared tunnel --url <http://localhost:8000>                      |
| \# Copy the URL: <https://random-words.trycloudflare.com>             |
| \# Paste into PIPELINE_SERVER_URL in onara-app/.env.local             |
|                                                                       |
| \# Option B: Named tunnel (URL never changes - do this before launch) |
| cloudflared tunnel create onara-pipeline                              |
| \# This creates a tunnel with a stable ID                             |
|                                                                       |
| cloudflared tunnel route dns onara-pipeline pipeline.onara.tech       |
| \# Now pipeline.onara.tech always points to this tunnel               |
|                                                                       |
| \# Run the named tunnel:                                              |
| cloudflared tunnel run onara-pipeline                                 |
| \# PIPELINE_SERVER_URL=<https://pipeline.onara.tech>                  |

**💡 PRO TIP**

Set up the named tunnel (Option B) now. The quick tunnel URL resets every time cloudflared restarts, which means updating PIPELINE_SERVER_URL and redeploying Next.js every time. The named tunnel with pipeline.onara.tech is permanent.

## **4.6 Confirm Everything Starts**

| \# Terminal 1 (mini PC): Start Next.js                            |
| ----------------------------------------------------------------- |
| cd onara-app && npm run dev                                       |
| \# Visit <http://localhost:3000> - Next.js default page           |
|                                                                   |
| \# Terminal 2 (mini PC): Start FastAPI skeleton                   |
| cd onara-pipeline && source venv/bin/activate                     |
| uvicorn main:app --reload --port 8000                             |
| \# Visit <http://localhost:8000/health> - returns {"status":"ok"} |
|                                                                   |
| \# Terminal 3 (mini PC): Start Cloudflare Tunnel                  |
| cloudflared tunnel run onara-pipeline                             |
| \# Confirms "Connection established"                              |
|                                                                   |
| \# Terminal 4 (PC): Ollama must be running                        |
| ollama serve                                                      |
| \# (Usually auto-starts - verify with: ollama list)               |
|                                                                   |
| \# Test full chain from mini PC:                                  |
| curl <http://192.168.1.45:11434/api/tags> # PC Ollama             |
| curl <http://localhost:8000/health> # FastAPI                     |
| curl <https://pipeline.onara.tech/health> # Via tunnel            |

## **Step 4 Verification Checklist**

- Node.js v22+, Python 3.11+, Git, PM2, Stripe CLI, cloudflared, Supabase CLI all installed on mini PC
- onara-app repo created on GitHub and first deployment live on Vercel
- onara-pipeline repo created on GitHub with all folder stubs
- onara-app/.env.local completely filled in - zero blank values
- onara-pipeline/.env completely filled in - zero blank values
- Named Cloudflare Tunnel created and running (pipeline.onara.tech resolves)
- All four terminal processes confirmed running: Next.js, FastAPI, cloudflared, Ollama
- Full chain test passes: mini PC curl hits PC Ollama via network

PHASE 3 - DATABASE

**STEP 5**

**Database Schema - Tables, Types, Indexes & Enums**

Creating the complete Supabase PostgreSQL schema: all tables, enums, indexes, foreign key constraints, and the full column set needed for billing, revisions, retention, and referrals.

**⏱️ Time estimate: 2-3 hours | Difficulty: Medium - read carefully before running**

Complete the verification checklist at the bottom before moving to the next step.

**📋 Prerequisites for this step**

Step 4 complete Supabase project created and accessible Credentials file complete

## **5.1 Why Database-First Development**

Every feature in Onara - billing, revision limits, trial expiry, retention sync, referral tracking - is driven by database state. Building the schema before the UI prevents the most expensive mistake in web development: designing a UI and discovering your schema cannot support it. Every column defined here has a specific feature it enables.

## **5.2 Open the Supabase SQL Editor**

In the Supabase dashboard, click "SQL Editor" in the left sidebar. Run the complete schema below as a single script. If it fails partway, check the error message and re-run from the failed statement.

## **5.3 Complete Schema - Run This**

| \-- ====================================================                                 |
| ---------------------------------------------------------------------------------------- |
| \-- Onara Database Schema v1                                                             |
| \-- Run in Supabase SQL Editor as a single script                                        |
| \-- ====================================================                                 |
|                                                                                          |
| \-- Enums                                                                                |
| CREATE TYPE user_plan AS ENUM ('free', 'starter', 'pro');                                |
| CREATE TYPE sub_status AS ENUM ('inactive', 'active', 'past_due', 'canceled');           |
| CREATE TYPE project_status AS ENUM ('queued', 'generating', 'live', 'error', 'deleted'); |
|                                                                                          |
| \-- Users table                                                                          |
| CREATE TABLE users (                                                                     |
| id UUID PRIMARY KEY DEFAULT gen_random_uuid(),                                           |
| email VARCHAR(255) UNIQUE NOT NULL,                                                      |
| plan user_plan DEFAULT 'free',                                                           |
| sub_status sub_status DEFAULT 'inactive',                                                |
| stripe_customer_id VARCHAR(255),                                                         |
| stripe_sub_id VARCHAR(255),                                                              |
| referral_code VARCHAR(16) UNIQUE DEFAULT                                                 |
| LEFT(MD5(RANDOM()::TEXT), 8),                                                            |
| referred_by UUID REFERENCES users(id),                                                   |
| trial_ends_at TIMESTAMPTZ,                                                               |
| is_trial BOOLEAN DEFAULT FALSE,                                                          |
| niche VARCHAR(100), -- "contractor" / "restaurant" etc                                   |
| created_at TIMESTAMPTZ DEFAULT NOW(),                                                    |
| updated_at TIMESTAMPTZ DEFAULT NOW()                                                     |
| );                                                                                       |
|                                                                                          |
| \-- Projects (generated sites)                                                           |
| CREATE TABLE projects (                                                                  |
| id UUID PRIMARY KEY DEFAULT gen_random_uuid(),                                           |
| user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,                            |
| project_id VARCHAR(64) UNIQUE NOT NULL, -- job ID from pipeline                          |
| business_name VARCHAR(255) NOT NULL,                                                     |
| business_type VARCHAR(100),                                                              |
| business_phone VARCHAR(50),                                                              |
| business_address TEXT,                                                                   |
| business_hours JSONB, -- Google hours array                                              |
| google_place_id VARCHAR(255), -- for retention: re-fetch from GBP                        |
| github_folder VARCHAR(512),                                                              |
| cloudflare_url TEXT,                                                                     |
| cloudflare_project_id VARCHAR(64),                                                       |
| show_url BOOLEAN DEFAULT FALSE,                                                          |
| revisions_used INT DEFAULT 0,                                                            |
| revisions_allowed INT DEFAULT 3,                                                         |
| revisions_reset TIMESTAMPTZ DEFAULT                                                      |
| NOW() + INTERVAL '1 month',                                                              |
| bucket_path VARCHAR(512),                                                                |
| status project_status DEFAULT 'queued',                                                  |
| blueprint JSONB, -- Agent 4 output                                                       |
| style_prefs JSONB, -- user style selections                                              |
| last_synced TIMESTAMPTZ, -- last GBP sync (retention)                                    |
| created_at TIMESTAMPTZ DEFAULT NOW(),                                                    |
| updated_at TIMESTAMPTZ DEFAULT NOW()                                                     |
| );                                                                                       |
|                                                                                          |
| \-- Pipeline error log (for debugging failed jobs)                                       |
| CREATE TABLE pipeline_errors (                                                           |
| id UUID PRIMARY KEY DEFAULT gen_random_uuid(),                                           |
| job_id TEXT,                                                                             |
| user_id UUID REFERENCES users(id),                                                       |
| phase TEXT,                                                                              |
| active_agent TEXT,                                                                       |
| error TEXT,                                                                              |
| blackboard JSONB,                                                                        |
| created_at TIMESTAMPTZ DEFAULT NOW()                                                     |
| );                                                                                       |
|                                                                                          |
| \-- Lead capture (for cold outbound list)                                                |
| CREATE TABLE leads (                                                                     |
| id UUID PRIMARY KEY DEFAULT gen_random_uuid(),                                           |
| business_name VARCHAR(255),                                                              |
| google_place_id VARCHAR(255),                                                            |
| phone VARCHAR(50),                                                                       |
| email VARCHAR(255),                                                                      |
| source VARCHAR(100), -- "gBP_scrape" / "facebook_group" / etc                            |
| status VARCHAR(50) DEFAULT 'new',                                                        |
| notes TEXT,                                                                              |
| contacted_at TIMESTAMPTZ,                                                                |
| created_at TIMESTAMPTZ DEFAULT NOW()                                                     |
| );                                                                                       |
|                                                                                          |
| \-- Indexes for performance                                                              |
| CREATE INDEX idx_projects_user_id ON projects(user_id);                                  |
| CREATE INDEX idx_projects_status ON projects(status);                                    |
| CREATE INDEX idx_projects_project_id ON projects(project_id);                            |
| CREATE INDEX idx_pipeline_errors_job ON pipeline_errors(job_id);                         |
| CREATE INDEX idx_users_stripe_cust ON users(stripe_customer_id);                         |
| CREATE INDEX idx_users_referral ON users(referral_code);                                 |
|                                                                                          |
| \-- Auto-update updated_at on any row change                                             |
| CREATE OR REPLACE FUNCTION update_updated_at()                                           |
| RETURNS TRIGGER AS \$\$                                                                  |
| BEGIN NEW.updated_at = NOW(); RETURN NEW; END;                                           |
| \$\$ LANGUAGE plpgsql;                                                                   |
|                                                                                          |
| CREATE TRIGGER users_updated_at                                                          |
| BEFORE UPDATE ON users                                                                   |
| FOR EACH ROW EXECUTE FUNCTION update_updated_at();                                       |
|                                                                                          |
| CREATE TRIGGER projects_updated_at                                                       |
| BEFORE UPDATE ON projects                                                                |
| FOR EACH ROW EXECUTE FUNCTION update_updated_at();                                       |

## **5.4 Schema Design Decisions Explained**

Every non-obvious column has a reason:

- google_place_id on projects - stored so the retention sync can re-fetch Google Business data monthly without asking the user to re-enter their business name.
- last_synced on projects - tracks when the site data was last refreshed from Google. Used to trigger the monthly sync notification.
- niche on users - tracks which vertical each user is in. Used for analytics to see which niche converts and retains best.
- leads table - for your cold outbound list. Load GBP listings without websites here before launch.
- pipeline_errors table - when an agent fails in production, the full blackboard state is logged here. Gives you full debug visibility from the Supabase dashboard.
- revisions_reset as a TIMESTAMPTZ - more flexible than a simple monthly counter. Lets you grant bonus revisions to individual users for specific periods.

## **Step 5 Verification Checklist**

- All SQL ran without errors in Supabase SQL Editor
- Five tables visible in Table Editor: users, projects, pipeline_errors, leads, and (from next step) auth.users
- Three enums created: user_plan, sub_status, project_status
- All five indexes created (check with: SELECT \* FROM pg_indexes WHERE tablename IN ('users', 'projects'))
- update_updated_at trigger function created and both triggers attached

PHASE 3 - DATABASE

**STEP 6**

**RLS, Auth Triggers, Edge Functions & Scheduled Jobs**

Enabling Row Level Security on all tables, creating auth triggers for automatic user record creation, setting up Supabase Edge Functions, and scheduling daily automated tasks.

**⏱️ Time estimate: 2-3 hours | Difficulty: Medium**

Complete the verification checklist at the bottom before moving to the next step.

**📋 Prerequisites for this step**

Step 5 complete - all tables and indexes created

**🚨 CRITICAL**

Row Level Security (RLS) is NOT enabled by default. Without it, any user can read every other user's data using the publishable key from the browser. Enable it on ALL tables before testing with real users.

## **6.1 Enable Row Level Security**

| \-- Run in Supabase SQL Editor                                           |
| ------------------------------------------------------------------------ |
|                                                                          |
| \-- Enable RLS on all tables                                             |
| ALTER TABLE users ENABLE ROW LEVEL SECURITY;                             |
| ALTER TABLE projects ENABLE ROW LEVEL SECURITY;                          |
| ALTER TABLE pipeline_errors ENABLE ROW LEVEL SECURITY;                   |
| ALTER TABLE leads ENABLE ROW LEVEL SECURITY;                             |
|                                                                          |
| \-- Users: can only read/write their own row                             |
| CREATE POLICY user_self ON users                                         |
| FOR ALL USING (auth.uid() = id);                                         |
|                                                                          |
| \-- Projects: owner can read/write, no one else                          |
| CREATE POLICY project_owner ON projects                                  |
| FOR ALL USING (auth.uid() = user_id);                                    |
|                                                                          |
| \-- pipeline_errors: no user access - service key only                   |
| \-- (no policy = no access to anon/publishable key)                      |
|                                                                          |
| \-- leads: no user access - service key only                             |
|                                                                          |
| \-- Verify: in Table Editor, both tables should show a green shield icon |

## **6.2 New User Trigger**

When a user signs up (via Google OAuth or email), Supabase creates a record in auth.users but NOT in your public users table. This trigger automatically creates the corresponding public users record, sets a 14-day Pro trial, and generates a referral code.

| \-- Trigger: auto-create users record on new Supabase auth signup             |
| ----------------------------------------------------------------------------- |
| CREATE OR REPLACE FUNCTION handle_new_user()                                  |
| RETURNS TRIGGER AS \$\$                                                       |
| BEGIN                                                                         |
| INSERT INTO public.users (id, email, plan, is_trial, trial_ends_at)           |
| VALUES (                                                                      |
| NEW.id,                                                                       |
| NEW.email,                                                                    |
| 'pro', -- start on Pro during trial                                           |
| TRUE,                                                                         |
| NOW() + INTERVAL '14 days'                                                    |
| );                                                                            |
| RETURN NEW;                                                                   |
| END;                                                                          |
| \$\$ LANGUAGE plpgsql SECURITY DEFINER;                                       |
|                                                                               |
| CREATE TRIGGER on_auth_user_created                                           |
| AFTER INSERT ON auth.users                                                    |
| FOR EACH ROW EXECUTE FUNCTION handle_new_user();                              |
|                                                                               |
| \-- Test: create a test user in Supabase Auth > Users > Invite user           |
| \-- Then check: SELECT \* FROM public.users ORDER BY created_at DESC LIMIT 1; |
| \-- Should see: plan=pro, is_trial=true, trial_ends_at = 14 days from now     |

## **6.3 Initialize Supabase CLI and Link Project**

| \# In onara-app/ directory                           |
| ---------------------------------------------------- |
| supabase login                                       |
| \# Opens browser - log in with your Supabase account |
|                                                      |
| supabase link --project-ref your-project-ref         |
| \# Find your project ref: Supabase dashboard URL:    |
| \# <https://app.supabase.com/project/{project-ref}>  |
|                                                      |
| \# Create the three edge functions                   |
| supabase functions new stripe-webhook                |
| supabase functions new downgrade-trials              |
| supabase functions new reset-revisions               |
|                                                      |
| \# These create folders under supabase/functions/    |
| \# Full implementation in Step 24 (Stripe Billing)   |

## **6.4 Enable pg_cron and Schedule Jobs**

| \-- Enable the pg_cron extension (run in Supabase SQL Editor)                                 |
| --------------------------------------------------------------------------------------------- |
| CREATE EXTENSION IF NOT EXISTS pg_cron;                                                       |
| CREATE EXTENSION IF NOT EXISTS pg_net; -- needed for HTTP calls from cron                     |
|                                                                                               |
| \-- Schedule: downgrade-trials - runs daily at 1am UTC                                        |
| \-- Finds all users whose trial_ends_at < NOW() and sets plan=free                            |
| SELECT cron.schedule(                                                                         |
| 'downgrade-expired-trials',                                                                   |
| '0 1 \* \* \*',                                                                               |
| \$\$                                                                                          |
| SELECT net.http_post(                                                                         |
| url := '<https://your-project.supabase.co/functions/v1/downgrade-trials>',                    |
| headers := '{"Authorization":"Bearer SERVICE_KEY","Content-Type":"application/json"}'::jsonb, |
| body := '{}'::jsonb                                                                           |
| );                                                                                            |
| \$\$                                                                                          |
| );                                                                                            |
|                                                                                               |
| \-- Schedule: reset-revisions - runs daily at midnight UTC                                    |
| \-- Resets revisions_used=0 for projects past their revisions_reset date                      |
| SELECT cron.schedule(                                                                         |
| 'reset-monthly-revisions',                                                                    |
| '0 0 \* \* \*',                                                                               |
| \$\$                                                                                          |
| SELECT net.http_post(                                                                         |
| url := '<https://your-project.supabase.co/functions/v1/reset-revisions>',                     |
| headers := '{"Authorization":"Bearer SERVICE_KEY","Content-Type":"application/json"}'::jsonb, |
| body := '{}'::jsonb                                                                           |
| );                                                                                            |
| \$\$                                                                                          |
| );                                                                                            |
|                                                                                               |
| \-- Verify schedules created:                                                                 |
| SELECT \* FROM cron.job;                                                                      |

## **6.5 Initialize the Supabase Clients in Next.js**

| // lib/supabase.js                                                         |
| -------------------------------------------------------------------------- |
|                                                                            |
| import { createClient } from '@supabase/supabase-js'                       |
|                                                                            |
| // ── Frontend client ──────────────────────────────────────────────       |
| // Uses publishable key. Respects RLS - users can only see their own data. |
| // Safe to use in React components.                                        |
| export const supabase = createClient(                                      |
| process.env.NEXT_PUBLIC_SUPABASE_URL,                                      |
| process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY                           |
| )                                                                          |
|                                                                            |
| // ── Backend client ───────────────────────────────────────────────       |
| // Uses secret key. BYPASSES RLS - use only in API routes.                 |
| // NEVER import this in any component file.                                |
| // NEVER put SUPABASE*SECRET_KEY in a NEXT_PUBLIC* variable.               |
| export function getServiceClient() {                                       |
| return createClient(                                                       |
| process.env.NEXT_PUBLIC_SUPABASE_URL,                                      |
| process.env.SUPABASE_SECRET_KEY                                            |
| )                                                                          |
| }                                                                          |
|                                                                            |
| // ── Helper: get authenticated user from request ───────────────────      |
| // Use this in every API route that needs to know who is calling.          |
| export async function getUserFromRequest(req) {                            |
| const supabase = getServiceClient()                                        |
| const token = req.headers.get('Authorization')?.replace('Bearer ', '')     |
| if (!token) return null                                                    |
| const { data: { user } } = await supabase.auth.getUser(token)              |
| return user \| null                                                        |
| }                                                                          |

## **6.6 Storage Bucket**

- Supabase dashboard > Storage > Create Bucket.
- Name: generated-sites. Type: Private (no public access).
- This stores zip backups of generated sites at path: {user_id}/{project_id}/site.zip
- Access is only through the service key - never direct public URL.

## **Step 6 Verification Checklist**

- RLS enabled on all four tables - green shield visible in Table Editor
- Both RLS policies created (user_self on users, project_owner on projects)
- New user trigger created - test by creating a user in Auth and confirming public.users record appears
- Supabase CLI installed, logged in, and linked to project
- Three edge function folders created under supabase/functions/
- pg_cron and pg_net extensions enabled
- Both cron schedules created (verify with: SELECT \* FROM cron.job)
- lib/supabase.js created with all three exports
- generated-sites storage bucket created as private

PHASE 4 - AUTH & PLACES

**STEP 7**

**Google OAuth - Supabase Auth Configuration & Testing Mode**

Connecting Google OAuth to Supabase, configuring redirect URIs, understanding testing mode, adding test users, and verifying the full sign-in flow works locally.

**⏱️ Time estimate: 1-2 hours | Difficulty: Low**

Complete the verification checklist at the bottom before moving to the next step.

**📋 Prerequisites for this step**

Step 6 complete GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET from Step 1 Supabase project running

## **7.1 Connect Google OAuth to Supabase**

- In Supabase dashboard: Authentication > Providers > Google.
- Toggle "Enable Google provider" to ON.
- Paste GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET.
- Copy the Callback URL shown by Supabase - it looks like: <https://your-project.supabase.co/auth/v1/callback>
- Go back to Google Cloud Console > APIs & Services > Credentials > your OAuth 2.0 Client ID.
- Under "Authorized redirect URIs," add the Supabase callback URL you just copied.
- Click Save in Google Cloud Console.
- Click Save in Supabase.

## **7.2 Understanding Google OAuth Testing Mode**

**⚠️ IMPORTANT: Testing Mode Behaviour**

Your Google OAuth app starts in "Testing" mode. In testing mode: • ONLY Google accounts you explicitly list as "test users" can sign in • Everyone else sees: "Error 403: access_denied - App not verified" • This is intentional - Google prevents unverified apps from accessing user data This is completely fine for development. You will publish the app before launch. To add test users: Google Cloud Console > APIs & Services > OAuth consent screen > Test users > + Add Users. Add your personal Google email and any other accounts you want to test with. Changes take effect within 5 minutes.

## **7.3 Publish the App (Do This Before Launch)**

When ready to accept real users, publishing your OAuth app takes 30 seconds and is usually automatic for basic sign-in:

- Google Cloud Console > APIs & Services > OAuth consent screen.
- Click "Publish App."
- Google will review the scopes. For email + profile only (which is all Onara uses), this is typically automatic and immediate.
- If Google requests additional verification, it is because you added sensitive scopes. Onara only needs email and profile - do not add any other scopes.

## **7.4 Install Supabase Auth Helpers in Next.js**

| \# Already installed in Step 4, but confirm: |
| -------------------------------------------- |
| cd onara-app                                 |
| npm list @supabase/auth-helpers-nextjs       |
| \# Should show the package version           |
|                                              |
| \# If missing:                               |
| npm install @supabase/auth-helpers-nextjs    |

## **7.5 Middleware - Route Protection**

Create middleware.js at the root of onara-app/. This runs before every request and redirects unauthenticated users away from protected dashboard routes.

| // middleware.js - root of onara-app/                                            |
| -------------------------------------------------------------------------------- |
|                                                                                  |
| import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'           |
| import { NextResponse } from 'next/server'                                       |
|                                                                                  |
| export async function middleware(req) {                                          |
| const res = NextResponse.next()                                                  |
| const supabase = createMiddlewareClient({ req, res })                            |
|                                                                                  |
| // Refresh session if it exists - keeps token fresh                              |
| const { data: { session } } = await supabase.auth.getSession()                   |
|                                                                                  |
| const { pathname } = req.nextUrl                                                 |
|                                                                                  |
| // Protect all dashboard routes                                                  |
| if (pathname.startsWith('/dashboard') && !session) {                             |
| const redirect = encodeURIComponent(pathname)                                    |
| return NextResponse.redirect(new URL(\`/login?redirect=\${redirect}\`, req.url)) |
| }                                                                                |
|                                                                                  |
| // Redirect logged-in users away from auth pages                                 |
| if ((pathname === '/login' \| pathname === '/signup') && session) {              |
| return NextResponse.redirect(new URL('/dashboard', req.url))                     |
| }                                                                                |
|                                                                                  |
| return res                                                                       |
| }                                                                                |
|                                                                                  |
| export const config = {                                                          |
| matcher: \['/dashboard/:path\*', '/login', '/signup'\],                          |
| }                                                                                |

## **7.6 Test the Full OAuth Sign-In Flow**

| \# Start Next.js locally                                                     |
| ---------------------------------------------------------------------------- |
| cd onara-app && npm run dev                                                  |
|                                                                              |
| \# Visit <http://localhost:3000/login>                                       |
| \# Click "Continue with Google"                                              |
| \# Should redirect to Google sign-in                                         |
| \# Sign in with your test user Google account                                |
| \# Should redirect back to <http://localhost:3000/dashboard>                 |
|                                                                              |
| \# Verify in Supabase:                                                       |
| \# Authentication > Users - your email should appear                         |
| \# SQL Editor: SELECT \* FROM public.users ORDER BY created_at DESC LIMIT 1; |
| \# Should show: plan=pro, is_trial=true, trial_ends_at in 14 days            |
|                                                                              |
| \# Common errors:                                                            |
| \# "redirect_uri_mismatch" - the callback URL in Google Cloud does not       |
| \# match exactly. Copy the URL from Supabase Auth > Google provider.         |
| \# "access_denied" - your Google account is not in the test users list.      |
| \# Go to OAuth consent screen > Test users > Add your email.                 |

## **Step 7 Verification Checklist**

- Google provider enabled in Supabase Auth with correct Client ID and Secret
- Supabase callback URL added to Google Cloud Console Authorized Redirect URIs
- Your Google account added as a test user in OAuth consent screen
- middleware.js created and protecting /dashboard routes
- Full OAuth flow tested: login → Google → dashboard works end-to-end
- User record created in public.users with correct trial fields

PHASE 4 - AUTH & PLACES

**STEP 8**

**Google Places API - Business Search Route & Confirmation**

Implementing the /api/places Next.js route that searches Google Places, handles missing fields, returns structured business data, and implements rate limiting to protect API quota.

**⏱️ Time estimate: 2-3 hours | Difficulty: Medium**

Complete the verification checklist at the bottom before moving to the next step.

**📋 Prerequisites for this step**

Step 7 complete GOOGLE_PLACES_API_KEY from Step 1

## **8.1 How the Business Search Works End-to-End**

**🔍 User Journey Through Business Search**

1\. User types their business name: e.g., "Mike's Plumbing Austin TX" 2. Next.js calls /api/places?q=Mike's+Plumbing+Austin+TX 3. Route calls Google Places Text Search API → gets matching businesses 4. If found: fetches full Place Details (name, address, phone, hours, photos, type) 5. Returns to frontend: {found: true, data: {...}, missing: \["phone", "hours"\]} 6. Frontend shows confirmation card with real Google data 7. Missing fields highlighted in amber - user fills them in 8. User clicks Confirm → proceeds to style preferences Key design: the search is forgiving (partial names work, city is optional), and missing fields do NOT block the user - they just get highlighted for manual entry.

## **8.2 The /api/places Route**

| // app/api/places/route.js                                                               |
| ---------------------------------------------------------------------------------------- |
|                                                                                          |
| import { NextResponse } from 'next/server'                                               |
|                                                                                          |
| const KEY = process.env.GOOGLE_PLACES_API_KEY                                            |
| const BASE = '<https://places.googleapis.com/v1>'                                        |
|                                                                                          |
| export async function GET(req) {                                                         |
| const { searchParams } = new URL(req.url)                                                |
| const q = searchParams.get('q')?.trim()                                                  |
|                                                                                          |
| if (!q \| q.length < 3) {                                                                |
| return NextResponse.json({ error: 'Query too short' }, { status: 400 })                  |
| }                                                                                        |
|                                                                                          |
| // Step 1: Text Search                                                                   |
| const searchRes = await fetch(\`\${BASE}/places:searchText\`, {                          |
| method: 'POST',                                                                          |
| headers: {                                                                               |
| 'Content-Type': 'application/json',                                                      |
| 'X-Goog-Api-Key': KEY,                                                                   |
| 'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.types', |
| },                                                                                       |
| body: JSON.stringify({                                                                   |
| textQuery: q,                                                                            |
| maxResultCount: 1,                                                                       |
| languageCode: 'en',                                                                      |
| }),                                                                                      |
| })                                                                                       |
|                                                                                          |
| const searchData = await searchRes.json()                                                |
|                                                                                          |
| if (!searchData.places?.length) {                                                        |
| return NextResponse.json({ found: false })                                               |
| }                                                                                        |
|                                                                                          |
| const placeId = searchData.places\[0\].id                                                |
|                                                                                          |
| // Step 2: Place Details                                                                 |
| const detailRes = await fetch(                                                           |
| \`\${BASE}/places/\${placeId}\`,                                                         |
| {                                                                                        |
| headers: {                                                                               |
| 'X-Goog-Api-Key': KEY,                                                                   |
| 'X-Goog-FieldMask': \[                                                                   |
| 'displayName',                                                                           |
| 'formattedAddress',                                                                      |
| 'nationalPhoneNumber',                                                                   |
| 'regularOpeningHours',                                                                   |
| 'photos',                                                                                |
| 'primaryType',                                                                           |
| 'types',                                                                                 |
| 'websiteUri',                                                                            |
| 'rating',                                                                                |
| 'userRatingCount',                                                                       |
| \].join(','),                                                                            |
| },                                                                                       |
| }                                                                                        |
| )                                                                                        |
|                                                                                          |
| const p = await detailRes.json()                                                         |
|                                                                                          |
| // Build photo URLs (max 3)                                                              |
| const photos = (p.photos \| \[\]).slice(0, 3).map(ph =>                                  |
| \`\${BASE}/\${ph.name}/media?key=\${KEY}&maxHeightPx=400&maxWidthPx=600\`                |
| )                                                                                        |
|                                                                                          |
| // Identify missing fields                                                               |
| const missing = \[\]                                                                     |
| if (!p.nationalPhoneNumber) missing.push('phone')                                        |
| if (!p.regularOpeningHours?.weekdayDescriptions) missing.push('hours')                   |
|                                                                                          |
| return NextResponse.json({                                                               |
| found: true,                                                                             |
| placeId,                                                                                 |
| data: {                                                                                  |
| name: p.displayName?.text \| '',                                                         |
| address: p.formattedAddress \| '',                                                       |
| phone: p.nationalPhoneNumber \| null,                                                    |
| hours: p.regularOpeningHours?.weekdayDescriptions \| null,                               |
| photos,                                                                                  |
| type: p.primaryType \| p.types?.\[0\] \| 'local_business',                               |
| rating: p.rating \| null,                                                                |
| reviewCount: p.userRatingCount \| null,                                                  |
| website: p.websiteUri \| null,                                                           |
| },                                                                                       |
| missing,                                                                                 |
| })                                                                                       |
| }                                                                                        |

## **8.3 Test the Route Before Building the UI**

| \# With Next.js running locally, test the route directly:               |
| ----------------------------------------------------------------------- |
|                                                                         |
| \# Search for a real local business                                     |
| curl "<http://localhost:3000/api/places?q=McDonalds+New+York>"          |
|                                                                         |
| \# Expected response structure:                                         |
| \# {                                                                    |
| \# "found": true,                                                       |
| \# "placeId": "ChIJ...",                                                |
| \# "data": {                                                            |
| \# "name": "McDonald's",                                                |
| \# "address": "123 Broadway, New York, NY 10006",                       |
| \# "phone": "+1 212-555-0123",                                          |
| \# "hours": \["Monday: 6:00 AM - 11:00 PM", ...\],                      |
| \# "photos": \["<https://places.googleapis.com/v1/..."\>],              |
| \# "type": "restaurant",                                                |
| \# "rating": 3.8,                                                       |
| \# "reviewCount": 1247                                                  |
| \# },                                                                   |
| \# "missing": \[\]                                                      |
| \# }                                                                    |
|                                                                         |
| \# Test with a business that has no website:                            |
| curl "<http://localhost:3000/api/places?q=Joness+Plumbing+Austin+TX>"   |
| \# Should still return found: true with missing: \["phone"\] or similar |
|                                                                         |
| \# Test not found:                                                      |
| curl "<http://localhost:3000/api/places?q=zzzznotabusiness999>"         |
| \# Expected: {"found": false}                                           |

## **8.4 Protecting the API Key**

The GOOGLE_PLACES_API_KEY must NEVER be exposed to the browser. The route above runs server-side only (it is in app/api/) so the key stays on the server. This is why you use the Next.js API route as a proxy rather than calling Google directly from the React component.

**⚠️ WARNING**

If you see the API key in the browser Network tab, you have a bug - the key is being exposed. Check that you are calling /api/places (your Next.js route) not calling the Google Places API directly from client code.

## **Step 8 Verification Checklist**

- app/api/places/route.js created and deployed
- Route returns {found: true, data: {...}, missing: \[...\]} for a real business
- Route returns {found: false} for a non-existent business
- GOOGLE_PLACES_API_KEY does NOT appear in the browser Network tab
- photos array returns valid URLs that load images in the browser
- placeId saved in the response (needed for retention sync in Step 26)

PHASE 5 - FRONTEND FOUNDATION

**STEP 9**

**Design System - Tailwind Tokens, Fonts & Base Components**

Establishing the brown/gold design language used across every page in Onara.

**⏱️ Time estimate: 2-3 hours | Difficulty: Low**

Complete the verification checklist at the bottom before moving to the next step.

**📋 Prerequisites for this step**

Step 4 complete - Next.js repo running locally

## **9.1 Tailwind Config**

| // tailwind.config.js                                                                       |
| ------------------------------------------------------------------------------------------- |
| module.exports = {                                                                          |
| content: \["./app/\*\*/\*.{js,jsx}","./components/\*\*/\*.{js,jsx}"\],                      |
| theme: { extend: {                                                                          |
| colors: {                                                                                   |
| espresso:"#3B1F0E", gold:"#D4A853", tan:"#C4A882",                                          |
| cream:"#FAF3E0", midBrown:"#6B3F20", darkBrown:"#2A1508",                                   |
| },                                                                                          |
| fontFamily: { sans:\["Inter","sans-serif"\], display:\["Playfair Display","serif"\] },      |
| boxShadow: { card:"0 2px 12px rgba(59,31,14,0.08)", cta:"0 4px 20px rgba(212,168,83,0.4)" } |
| }},                                                                                         |
| }                                                                                           |

## **9.2 globals.css**

| /\* app/globals.css - top \*/                                                                                                   |
| ------------------------------------------------------------------------------------------------------------------------------- |
| @import url("<https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Playfair+Display:wght@700&display=swap>"); |
| :root { --espresso:#3B1F0E; --gold:#D4A853; --tan:#C4A882; }                                                                    |
| html { scroll-behavior:smooth; }                                                                                                |

## **9.3 Button, Card, Badge & Toast Components**

| // components/Button.jsx                                                                               |
| ------------------------------------------------------------------------------------------------------ |
| export default function Button({children,variant="gold",className="",disabled,onClick,type="button"}){ |
| const v={gold:"bg-gold text-espresso font-bold shadow-cta hover:bg-yellow-500",                        |
| espresso:"bg-espresso text-gold font-bold hover:bg-midBrown",                                          |
| outline:"border-2 border-tan text-tan hover:border-espresso hover:text-espresso",                      |
| danger:"bg-red-600 text-white font-bold hover:bg-red-700"}                                             |
| return(<button type={type} onClick={onClick} disabled={disabled}                                       |
| className={\`px-6 py-3 rounded-xl text-sm transition-all \${v\[variant\]}                              |
| \${disabled?"opacity-50 cursor-not-allowed":""} \${className}\`}>{children}&lt;/button&gt;)            |
| }                                                                                                      |

## **Step 9 Verification Checklist**

- Tailwind config updated with all custom colors
- Google Fonts loading - Playfair Display visible in browser
- Button renders all 4 variants correctly

PHASE 5 - FRONTEND FOUNDATION

**STEP 10**

**Landing Page - Niche-Specific Hero, Pricing & Social Proof**

Building the complete public landing page with niche-specific copy for contractors.

**⏱️ Time estimate: 4-6 hours | Difficulty: Medium**

Complete the verification checklist at the bottom before moving to the next step.

**📋 Prerequisites for this step**

Step 9 complete - design system ready Niche decided in Step 0

## **10.1 Page Structure**

| **Component** | **File**                             | **Purpose**                  |
| ------------- | ------------------------------------ | ---------------------------- |
| Navbar        | components/landing/Navbar.jsx        | Logo, nav, CTA               |
| Hero          | components/landing/Hero.jsx          | Niche headline + demo        |
| HowItWorks    | components/landing/HowItWorks.jsx    | 3-step process               |
| NicheFeatures | components/landing/NicheFeatures.jsx | Contractor-specific features |
| Pricing       | components/landing/Pricing.jsx       | 3 plans                      |
| SocialProof   | components/landing/SocialProof.jsx   | Testimonials                 |
| Footer        | components/landing/Footer.jsx        | Links + legal                |

## **10.2 Niche-Specific Hero**

| // components/landing/Hero.jsx                                                                |
| --------------------------------------------------------------------------------------------- |
| // CHANGE these two lines for your niche:                                                     |
| const HEADLINE = "Your plumbing business, online in 60 seconds"                               |
| const SUBHEADLINE = "Import your Google listing. AI builds your site automatically."          |
|                                                                                               |
| export default function Hero() {                                                              |
| return (                                                                                      |
| &lt;section className="bg-cream pt-24 pb-16 px-6 text-center"&gt;                             |
| &lt;div className="max-w-4xl mx-auto"&gt;                                                     |
| &lt;p className="text-midBrown text-sm font-medium mb-4"&gt;                                  |
| ✓ Trusted by 200+ contractors in Austin                                                       |
| &lt;/p&gt;                                                                                    |
| &lt;h1 className="font-display text-5xl md:text-6xl text-espresso mb-6 leading-tight"&gt;     |
| {HEADLINE}                                                                                    |
| &lt;/h1&gt;                                                                                   |
| &lt;p className="text-midBrown text-xl mb-10 max-w-2xl mx-auto"&gt;{SUBHEADLINE}&lt;/p&gt;    |
| &lt;div className="flex flex-col sm:flex-row gap-4 justify-center mb-6"&gt;                   |
| <a href="/signup" className="px-10 py-4 bg-gold text-espresso font-bold                       |
| text-lg rounded-xl shadow-cta hover:bg-yellow-400 transition">                                |
| Build My Website Free                                                                         |
| &lt;/a&gt;                                                                                    |
| <a href="#examples" className="px-10 py-4 border-2 border-espresso                            |
| text-espresso font-bold text-lg rounded-xl hover:bg-espresso hover:text-gold transition">     |
| See Examples                                                                                  |
| &lt;/a&gt;                                                                                    |
| &lt;/div&gt;                                                                                  |
| &lt;p className="text-tan text-sm"&gt;Average: 47 seconds · No credit card required&lt;/p&gt; |
| &lt;/div&gt;                                                                                  |
| &lt;/section&gt;                                                                              |
| )                                                                                             |
| }                                                                                             |

## **10.3 Pricing - 3 Plans**

| // components/landing/Pricing.jsx                                                     |
| ------------------------------------------------------------------------------------- |
| const PLANS = \[                                                                      |
| { name:"Free", price:"\$0", period:"", cta:"Start Free",                              |
| features:\["1 website","3 revisions/month","Preview in dashboard","Onara branding"\], |
| highlight:false },                                                                    |
| { name:"Starter", price:"\$12", period:"/mo", cta:"Start 14-Day Trial",               |
| features:\["1 website","10 revisions/month","Live public URL","Custom domain",        |
| "No branding","GitHub Copilot models"\],                                              |
| highlight:true, badge:"Most Popular" },                                               |
| { name:"Pro", price:"\$29", period:"/mo", cta:"Start 14-Day Trial",                   |
| features:\["3 websites","Unlimited revisions","Live URLs","Code download",            |
| "Priority queue","Claude & ChatGPT models","Priority support"\],                      |
| highlight:false },                                                                    |
| \]                                                                                    |

## **Step 10 Verification Checklist**

- All 7 sections render without errors
- Niche-specific headline in place
- Pricing cards show correct plan-specific features including model access
- Page is fully responsive at 375px, 768px, 1280px

PHASE 5 - FRONTEND FOUNDATION

**STEP 11**

**Auth Pages - Sign Up, Login, OAuth & Middleware**

Sign-up and login with Google OAuth and email/password. Plan pre-selection from URL params.

**⏱️ Time estimate: 3-4 hours | Difficulty: Medium**

Complete the verification checklist at the bottom before moving to the next step.

**📋 Prerequisites for this step**

Step 7 complete - Google OAuth configured in Supabase

## **11.1 Sign Up Page**

| // app/signup/page.jsx                                                                           |
| ------------------------------------------------------------------------------------------------ |
| "use client"                                                                                     |
| import { useState, Suspense } from "react"                                                       |
| import { useSearchParams, useRouter } from "next/navigation"                                     |
| import { supabase } from "@/lib/supabase"                                                        |
|                                                                                                  |
| function SignupForm() {                                                                          |
| const params = useSearchParams()                                                                 |
| const router = useRouter()                                                                       |
| const planParam = params.get("plan")                                                             |
| const \[email,pw,err,loading\] = \[useState(""),useState(""),useState(""),useState(false)\]      |
|                                                                                                  |
| async function handleGoogle() {                                                                  |
| await supabase.auth.signInWithOAuth({ provider:"google", options:{                               |
| redirectTo:\`\${window.location.origin}/dashboard\${planParam?\`?plan=\${planParam}\`:""}\`,     |
| }})                                                                                              |
| }                                                                                                |
| async function handleEmail(e) {                                                                  |
| e.preventDefault()                                                                               |
| const { error } = await supabase.auth.signUp({ email:email\[0\], password:pw\[0\] })             |
| if (error) { err\[1\](error.message); return }                                                   |
| router.push(\`/dashboard\${planParam?\`?plan=\${planParam}\`:""}\`)                              |
| }                                                                                                |
| return (                                                                                         |
| <div className="min-h-screen bg-gradient-to-br from-espresso to-midBrown                         |
| flex items-center justify-center p-4">                                                           |
| {/\* card, Google button, divider, email form \*/}                                               |
| {/\* See full implementation at Step 13 for pattern \*/}                                         |
| &lt;/div&gt;                                                                                     |
| )                                                                                                |
| }                                                                                                |
| export default function SignupPage(){return&lt;Suspense&gt;&lt;SignupForm/&gt;&lt;/Suspense&gt;} |

## **11.2 Middleware - Route Protection**

| // middleware.js                                                                                    |
| --------------------------------------------------------------------------------------------------- |
| import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"                              |
| import { NextResponse } from "next/server"                                                          |
|                                                                                                     |
| export async function middleware(req) {                                                             |
| const res = NextResponse.next()                                                                     |
| const supabase = createMiddlewareClient({ req, res })                                               |
| const { data:{ session } } = await supabase.auth.getSession()                                       |
| const { pathname } = req.nextUrl                                                                    |
| if (pathname.startsWith("/dashboard") && !session)                                                  |
| return NextResponse.redirect(new URL(\`/login?redirect=\${encodeURIComponent(pathname)}\`,req.url)) |
| if ((pathname==="/login"\|pathname==="/signup") && session)                                         |
| return NextResponse.redirect(new URL("/dashboard",req.url))                                         |
| return res                                                                                          |
| }                                                                                                   |
| export const config = { matcher:\["/dashboard/:path\*","/login","/signup"\] }                       |

## **Step 11 Verification Checklist**

- Google OAuth flow: login → Google → /dashboard works end-to-end
- /signup?plan=starter shows correct plan copy
- /dashboard without session redirects to /login

PHASE 6 - DASHBOARD

**STEP 12**

**Dashboard Shell - Layout, Sidebar, My Sites & Account Page**

The dashboard layout with fixed sidebar, My Sites grid, SiteCard component, and account settings.

**⏱️ Time estimate: 3-4 hours | Difficulty: Medium**

Complete the verification checklist at the bottom before moving to the next step.

**📋 Prerequisites for this step**

Step 11 complete - auth working end-to-end

## **12.1 Dashboard Layout**

| // app/dashboard/layout.jsx                                                |
| -------------------------------------------------------------------------- |
| import Sidebar from "@/components/Sidebar"                                 |
| export default function DashboardLayout({children}){                       |
| return(&lt;div className="flex min-h-screen bg-cream"&gt;                  |
| &lt;Sidebar/&gt;                                                           |
| &lt;main className="flex-1 ml-64 p-8 max-w-6xl"&gt;{children}&lt;/main&gt; |
| &lt;/div&gt;)                                                              |
| }                                                                          |

## **12.2 Sidebar**

| // components/Sidebar.jsx                                                                                 |
| --------------------------------------------------------------------------------------------------------- |
| "use client"                                                                                              |
| import Link from "next/link"                                                                              |
| import { usePathname, useRouter } from "next/navigation"                                                  |
| import { supabase } from "@/lib/supabase"                                                                 |
|                                                                                                           |
| const NAV = \[                                                                                            |
| {href:"/dashboard/sites", label:"My Sites", icon:"🌐"},                                                   |
| {href:"/dashboard/build", label:"Build New Site", icon:"✨"},                                             |
| {href:"/dashboard/account", label:"Account", icon:"⚙️"},                                                  |
| \]                                                                                                        |
|                                                                                                           |
| export default function Sidebar(){                                                                        |
| const path=usePathname(); const router=useRouter()                                                        |
| return(                                                                                                   |
| &lt;aside className="fixed top-0 left-0 h-full w-64 bg-espresso flex flex-col py-8 px-4 z-40"&gt;         |
| &lt;Link href="/" className="font-display text-2xl text-gold px-2 mb-10"&gt;Onara&lt;/Link&gt;            |
| &lt;nav className="flex-1 space-y-1"&gt;                                                                  |
| {NAV.map(i=>(<Link key={i.href} href={i.href}                                                             |
| className={\`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition                  |
| \${path.startsWith(i.href)?"bg-midBrown text-gold border-l-2 border-gold":"text-tan hover:text-gold"}\`}> |
| &lt;span&gt;{i.icon}&lt;/span&gt;{i.label}                                                                |
| &lt;/Link&gt;))}                                                                                          |
| &lt;/nav&gt;                                                                                              |
| &lt;button onClick={async()=&gt;{await supabase.auth.signOut();router.push("/")}}                         |
| className="flex items-center gap-3 px-4 py-3 text-tan text-sm hover:text-gold">                           |
| 🚪 Log out                                                                                                |
| &lt;/button&gt;                                                                                           |
| &lt;/aside&gt;                                                                                            |
| )                                                                                                         |
| }                                                                                                         |

## **Step 12 Verification Checklist**

- Sidebar active state highlights current page
- My Sites shows empty state for new users with Build CTA
- SiteCard shows status badge, URL (if show_url=true), and revision count
- Log out signs out and redirects to home

PHASE 6 - DASHBOARD

**STEP 13**

**Build Flow - Search → Confirm → Style Preferences → Generate**

The 3-step generation wizard: Google Business search, confirmation card with missing field highlighting, style pill selectors, and the Generate button.

**⏱️ Time estimate: 4-5 hours | Difficulty: Medium-High**

Complete the verification checklist at the bottom before moving to the next step.

**📋 Prerequisites for this step**

Step 8 - /api/places working Step 12 - dashboard shell ready

## **13.1 Build Page - Full 3-Step Flow**

**📋 Flow Overview**

Step 1: User types business name → /api/places search → confirmation card Step 2: Confirm card shows Google data. Missing phone/hours highlighted amber. User fills in gaps. Step 3: Style preferences - Tone, Color, Layout pill buttons + 500-char free text box Step 4: Generate button → calls /api/sites → transitions to AgentProgress

| // app/dashboard/build/page.jsx - state machine                                                                                    |
| ---------------------------------------------------------------------------------------------------------------------------------- |
| "use client"                                                                                                                       |
| import { useState, Suspense } from "react"                                                                                         |
| import { useSearchParams, useRouter } from "next/navigation"                                                                       |
| import { supabase } from "@/lib/supabase"                                                                                          |
| import AgentProgress from "@/components/AgentProgress"                                                                             |
|                                                                                                                                    |
| const STYLE_OPTIONS = {                                                                                                            |
| tone: \["Professional","Friendly","Bold","Minimal","Luxurious"\],                                                                  |
| color: \["Auto (from industry)","Dark","Light","Vibrant","Earthy"\],                                                               |
| layout: \["Modern","Classic","Bold & Graphic","Clean & Simple"\],                                                                  |
| }                                                                                                                                  |
|                                                                                                                                    |
| function BuildFlow() {                                                                                                             |
| const params = useSearchParams()                                                                                                   |
| const router = useRouter()                                                                                                         |
| const revision = params.get("revision")                                                                                            |
| const \[step, setStep\] = useState(1)                                                                                              |
| const \[query, setQuery\] = useState("")                                                                                           |
| const \[result, setResult\] = useState(null)                                                                                       |
| const \[missing, setMissing\] = useState({})                                                                                       |
| const \[stylePrefs, setStylePrefs\] = useState({tone:"",color:"",layout:"",extra:""})                                              |
| const \[jobId, setJobId\] = useState(null)                                                                                         |
| const \[loading, setLoading\] = useState(false)                                                                                    |
| const \[error, setError\] = useState("")                                                                                           |
|                                                                                                                                    |
| async function search() {                                                                                                          |
| setLoading(true); setError("")                                                                                                     |
| const res = await fetch(\`/api/places?q=\${encodeURIComponent(query)}\`)                                                           |
| const data = await res.json()                                                                                                      |
| if (!data.found) { setError("Not found - try adding your city name."); setLoading(false); return }                                 |
| setResult(data); setStep(2); setLoading(false)                                                                                     |
| }                                                                                                                                  |
|                                                                                                                                    |
| async function generate() {                                                                                                        |
| setLoading(true)                                                                                                                   |
| const { data:{session} } = await supabase.auth.getSession()                                                                        |
| const merged = { ...result.data, ...missing }                                                                                      |
| const res = await fetch("/api/sites",{                                                                                             |
| method:"POST",                                                                                                                     |
| headers:{"Content-Type":"application/json","Authorization":\`Bearer \${session.access_token}\`},                                   |
| body:JSON.stringify({businessData:merged,placeId:result.placeId,stylePrefs,revisionOf:revision\|null})                             |
| })                                                                                                                                 |
| const data = await res.json()                                                                                                      |
| if (!res.ok){setError(data.error\|"Failed");setLoading(false);return}                                                              |
| setJobId(data.jobId); setStep(4); setLoading(false)                                                                                |
| }                                                                                                                                  |
|                                                                                                                                    |
| if (step===1) return (                                                                                                             |
| &lt;div className="max-w-lg mx-auto mt-12"&gt;                                                                                     |
| &lt;h1 className="text-2xl font-bold text-espresso mb-2"&gt;Find your business on Google&lt;/h1&gt;                                |
| &lt;p className="text-tan mb-6"&gt;Type your business name as it appears on Google Maps.&lt;/p&gt;                                 |
| &lt;div className="flex gap-2"&gt;                                                                                                 |
| &lt;input value={query} onChange={e=&gt;setQuery(e.target.value)}                                                                  |
| onKeyDown={e=>e.key==="Enter"&&search()}                                                                                           |
| placeholder="e.g. Mikes Plumbing Austin TX"                                                                                        |
| className="flex-1 border border-tan rounded-xl px-4 py-3 text-sm"/>                                                                |
| <button onClick={search} disabled={loading}                                                                                        |
| className="px-6 py-3 bg-gold text-espresso font-bold rounded-xl">                                                                  |
| {loading?"...":"Search"}                                                                                                           |
| &lt;/button&gt;                                                                                                                    |
| &lt;/div&gt;                                                                                                                       |
| {error&&&lt;p className="text-red-500 text-sm mt-3"&gt;{error}&lt;/p&gt;}                                                          |
| &lt;/div&gt;                                                                                                                       |
| )                                                                                                                                  |
|                                                                                                                                    |
| if (step===2) return (                                                                                                             |
| &lt;div className="max-w-lg mx-auto mt-12 space-y-4"&gt;                                                                           |
| &lt;h2 className="text-xl font-bold text-espresso"&gt;Is this your business?&lt;/h2&gt;                                            |
| &lt;div className="bg-white rounded-2xl p-6 shadow border border-tan"&gt;                                                          |
| {result.data.photos?.\[0\]&&<img src={result.data.photos\[0\]}                                                                     |
| className="w-full h-40 object-cover rounded-xl mb-4" alt="Business"/>}                                                             |
| &lt;p className="font-bold text-espresso text-lg"&gt;{result.data.name}&lt;/p&gt;                                                  |
| &lt;p className="text-tan text-sm mt-1"&gt;{result.data.address}&lt;/p&gt;                                                         |
| {result.data.rating&&&lt;p className="text-sm mt-1"&gt;⭐ {result.data.rating} ({result.data.reviewCount} reviews)&lt;/p&gt;}      |
| {result.missing?.includes("phone")&&(                                                                                              |
| &lt;div className="mt-4"&gt;                                                                                                       |
| &lt;span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full"&gt;Phone missing&lt;/span&gt;                  |
| <input placeholder="Enter phone number"                                                                                            |
| onChange={e=>setMissing(m=>({...m,phone:e.target.value}))}                                                                         |
| className="w-full border border-yellow-300 rounded-xl px-3 py-2 mt-2 text-sm"/>                                                    |
| &lt;/div&gt;                                                                                                                       |
| )}                                                                                                                                 |
| &lt;/div&gt;                                                                                                                       |
| &lt;div className="flex gap-3"&gt;                                                                                                 |
| &lt;button onClick={()=&gt;setStep(1)} className="flex-1 py-3 rounded-xl border border-tan text-tan">Search Again&lt;/button&gt;   |
| &lt;button onClick={()=&gt;setStep(3)} className="flex-1 py-3 rounded-xl bg-gold text-espresso font-bold">Confirm →&lt;/button&gt; |
| &lt;/div&gt;                                                                                                                       |
| &lt;/div&gt;                                                                                                                       |
| )                                                                                                                                  |
|                                                                                                                                    |
| if (step===3) return (                                                                                                             |
| &lt;div className="max-w-lg mx-auto mt-12 space-y-6"&gt;                                                                           |
| &lt;div&gt;&lt;h2 className="text-xl font-bold text-espresso"&gt;Customize your site&lt;/h2&gt;                                    |
| &lt;p className="text-tan text-sm"&gt;All optional - skip to use smart defaults.&lt;/p&gt;&lt;/div&gt;                             |
| {Object.entries(STYLE_OPTIONS).map((\[key,opts\])=>(                                                                               |
| &lt;div key={key}&gt;                                                                                                              |
| &lt;label className="text-sm font-semibold text-espresso mb-2 block capitalize"&gt;{key}&lt;/label&gt;                             |
| &lt;div className="flex flex-wrap gap-2"&gt;                                                                                       |
| {opts.map(opt=>(                                                                                                                   |
| &lt;button key={opt} onClick={()=&gt;setStylePrefs(s=>({...s,\[key\]:s\[key\]===opt?"":opt}))}                                     |
| className={\`px-4 py-2 rounded-full text-sm border transition                                                                      |
| \${stylePrefs\[key\]===opt?"bg-espresso text-gold border-espresso":"border-tan text-tan hover:border-espresso"}\`}>                |
| {opt}                                                                                                                              |
| &lt;/button&gt;                                                                                                                    |
| ))}                                                                                                                                |
| &lt;/div&gt;                                                                                                                       |
| &lt;/div&gt;                                                                                                                       |
| ))}                                                                                                                                |
| &lt;div&gt;                                                                                                                        |
| &lt;label className="text-sm font-semibold text-espresso mb-2 block"&gt;                                                           |
| Anything else? &lt;span className="font-normal text-tan"&gt;(optional)&lt;/span&gt;                                                |
| &lt;/label&gt;                                                                                                                     |
| <textarea value={stylePrefs.extra}                                                                                                 |
| onChange={e=>setStylePrefs(s=>({...s,extra:e.target.value.slice(0,500)}))}                                                         |
| placeholder="e.g. We do 24/7 emergency callouts. Brand colors are navy and white."                                                 |
| rows={3} className="w-full border border-tan rounded-xl px-4 py-3 text-sm resize-none"/>                                           |
| &lt;p className="text-right text-xs text-tan mt-1"&gt;{stylePrefs.extra.length}/500&lt;/p&gt;                                      |
| &lt;/div&gt;                                                                                                                       |
| {error&&&lt;p className="text-red-500 text-sm"&gt;{error}&lt;/p&gt;}                                                               |
| <button onClick={generate} disabled={loading}                                                                                      |
| className="w-full py-4 bg-gold text-espresso font-bold text-lg rounded-xl shadow-cta">                                             |
| {loading?"Starting...":"⚡ Generate My Website"}                                                                                   |
| &lt;/button&gt;                                                                                                                    |
| &lt;p className="text-center text-xs text-tan"&gt;Usually ready in under 60 seconds&lt;/p&gt;                                      |
| &lt;/div&gt;                                                                                                                       |
| )                                                                                                                                  |
|                                                                                                                                    |
| if (step===4) return(                                                                                                              |
| <AgentProgress jobId={jobId}                                                                                                       |
| onComplete={()=>router.push(\`/dashboard/preview/\${jobId}\`)}                                                                     |
| onError={(msg)=>{setError(msg);setStep(3)}}/>                                                                                      |
| )                                                                                                                                  |
| return null                                                                                                                        |
| }                                                                                                                                  |
| export default function BuildPage(){return&lt;Suspense&gt;&lt;BuildFlow/&gt;&lt;/Suspense&gt;}                                     |

## **Step 13 Verification Checklist**

- Search returns real business data and confirmation card renders
- Missing fields shown with amber badge and editable input
- Style pill buttons toggle on/off correctly
- Generate button calls /api/sites and jobId returned
- Revision flow: /dashboard/build?revision=jobId loads in revision mode

PHASE 6 - DASHBOARD

**STEP 14**

**Generation Progress - Agent Polling, Status Route & Preview**

The AgentProgress component, /api/sites/\[jobId\]/status polling route, and preview page with iframe.

**⏱️ Time estimate: 3-4 hours | Difficulty: Medium**

Complete the verification checklist at the bottom before moving to the next step.

**📋 Prerequisites for this step**

Step 13 complete - generate button calling /api/sites

## **14.1 Status API Route**

| // app/api/sites/\[jobId\]/status/route.js                                                         |
| -------------------------------------------------------------------------------------------------- |
| import { NextResponse } from "next/server"                                                         |
| import { getUserFromRequest } from "@/lib/supabase"                                                |
|                                                                                                    |
| export async function GET(req, { params }) {                                                       |
| const user = await getUserFromRequest(req)                                                         |
| if (!user) return NextResponse.json({error:"Unauthorized"},{status:401})                           |
| const res = await fetch(\`\${process.env.PIPELINE_SERVER_URL}/pipeline/status/\${params.jobId}\`,{ |
| headers:{"x-pipeline-secret":process.env.PIPELINE_SECRET}                                          |
| })                                                                                                 |
| if (!res.ok) return NextResponse.json({phase:"error",error:"Pipeline unreachable"})                |
| return NextResponse.json(await res.json())                                                         |
| }                                                                                                  |

## **14.2 AgentProgress Component - Shows All 10 Agents with NIM Model Labels**

| // components/AgentProgress.jsx                                                                                        |
| ---------------------------------------------------------------------------------------------------------------------- |
| "use client"                                                                                                           |
| import { useState, useEffect, useRef } from "react"                                                                    |
|                                                                                                                        |
| const AGENTS = \[                                                                                                      |
| {key:"Business Analyst", model:"NIM deepseek-v4-flash (free)", icon:"🔍"},                                             |
| {key:"Content Writer", model:"qwen3:8b local", icon:"✍️"},                                                             |
| {key:"Style Agent", model:"qwen3:8b local", icon:"🎨"},                                                                |
| {key:"Planner", model:"NIM deepseek-v4-pro", icon:"📐"},                                                               |
| {key:"Prompt Engineer", model:"NIM kimi-k2.6", icon:"🧠"},                                                             |
| {key:"Code Generator", model:"NIM kimi-k2.6 (or your model)", icon:"💻"},                                              |
| {key:"Debugger", model:"NIM kimi-k2.6", icon:"🔧"},                                                                    |
| {key:"SEO Agent", model:"qwen3:8b local", icon:"📈"},                                                                  |
| {key:"QA Agent", model:"NIM deepseek-v4-pro", icon:"✅"},                                                              |
| {key:"Mobile Optimizer", model:"qwen3:8b local", icon:"📱"},                                                           |
| \]                                                                                                                     |
|                                                                                                                        |
| export default function AgentProgress({jobId,onComplete,onError}){                                                     |
| const \[status,setStatus\] = useState(null)                                                                            |
| const \[completed,setDone\] = useState(\[\])                                                                           |
| const ref = useRef(null)                                                                                               |
|                                                                                                                        |
| useEffect(()=>{                                                                                                        |
| ref.current = setInterval(async()=>{                                                                                   |
| try{                                                                                                                   |
| const data = await (await fetch(\`/api/sites/\${jobId}/status\`)).json()                                               |
| setStatus(data)                                                                                                        |
| const idx = AGENTS.findIndex(a=>a.key===data.activeAgent)                                                              |
| if(idx>0) setDone(AGENTS.slice(0,idx).map(a=>a.key))                                                                   |
| if(data.phase==="done"){clearInterval(ref.current);setDone(AGENTS.map(a=>a.key));setTimeout(()=>onComplete(data),600)} |
| if(data.phase==="error"){clearInterval(ref.current);onError(data.errors?.\[0\]\|"Failed")}                             |
| }catch(e){}                                                                                                            |
| },3000)                                                                                                                |
| return()=>clearInterval(ref.current)                                                                                   |
| },\[jobId\])                                                                                                           |
|                                                                                                                        |
| const st={done:{i:"✓",c:"text-green-600"},running:{i:"⟳",c:"text-gold animate-spin"},                                  |
| error:{i:"✗",c:"text-red-600"},waiting:{i:"○",c:"text-tan"}}                                                           |
|                                                                                                                        |
| return(                                                                                                                |
| &lt;div className="max-w-md mx-auto mt-12"&gt;                                                                         |
| &lt;div className="text-center mb-8"&gt;                                                                               |
| &lt;div className="text-4xl mb-3"&gt;⚡&lt;/div&gt;                                                                    |
| &lt;h2 className="text-xl font-bold text-espresso"&gt;Building your website...&lt;/h2&gt;                              |
| &lt;p className="text-tan text-sm mt-1"&gt;Usually ready in under 60 seconds&lt;/p&gt;                                 |
| &lt;/div&gt;                                                                                                           |
| &lt;div className="bg-white rounded-2xl shadow-card p-6 space-y-3"&gt;                                                 |
| {AGENTS.map(agent=>{                                                                                                   |
| const s=completed.includes(agent.key)?"done":status?.activeAgent===agent.key?"running":"waiting"                       |
| return(&lt;div key={agent.key} className="flex items-center gap-3"&gt;                                                 |
| &lt;span className={\`text-lg font-bold w-5 \${st\[s\].c}\`}&gt;{st\[s\].i}&lt;/span&gt;                               |
| &lt;span className="text-lg"&gt;{agent.icon}&lt;/span&gt;                                                              |
| &lt;div className="flex-1"&gt;                                                                                         |
| &lt;p className="text-sm font-medium text-darkBrown"&gt;{agent.key}&lt;/p&gt;                                          |
| &lt;p className="text-xs text-tan"&gt;{agent.model}&lt;/p&gt;                                                          |
| &lt;/div&gt;                                                                                                           |
| &lt;/div&gt;)                                                                                                          |
| })}                                                                                                                    |
| &lt;/div&gt;                                                                                                           |
| {status?.queuePosition>0&&(                                                                                            |
| &lt;p className="text-center text-sm text-tan mt-4"&gt;                                                                |
| Queue position: #{status.queuePosition+1}                                                                              |
| &lt;/p&gt;                                                                                                             |
| )}                                                                                                                     |
| &lt;/div&gt;                                                                                                           |
| )                                                                                                                      |
| }                                                                                                                      |

## **Step 14 Verification Checklist**

- /api/sites/\[jobId\]/status returns correct phase and activeAgent
- AgentProgress polls every 3 seconds and updates agent rows
- Agent rows show NIM model name and local model label correctly
- onComplete fires and router.push to preview page works
- Preview iframe loads the Cloudflare Pages URL

PHASE 7 - PIPELINE INFRASTRUCTURE

**STEP 15**

**FastAPI Pipeline Server - Redis Queue, Health & Deduplication**

The complete FastAPI entry point: Redis/RQ job queue, per-user deduplication, 5-minute timeout, rate limiting, and health endpoint.

**⏱️ Time estimate: 3-4 hours | Difficulty: High**

Complete the verification checklist at the bottom before moving to the next step.

**📋 Prerequisites for this step**

Step 4 complete - onara-pipeline repo scaffolded Redis installed: sudo apt install redis-server -y

## **15.1 Redis Setup**

| sudo apt install redis-server -y                                        |
| ----------------------------------------------------------------------- |
| sudo systemctl enable redis-server && sudo systemctl start redis-server |
| redis-cli ping # Expected: PONG                                         |

## **15.2 Blackboard - Central State**

| \# lib/blackboard.py                                                                      |
| ----------------------------------------------------------------------------------------- |
| def create_blackboard(job_id,business_data,style_prefs={},user_id=None,revision_of=None): |
| return {                                                                                  |
| "job_id":job_id, "user_id":user_id, "revision_of":revision_of,                            |
| "business_data":business_data, "style_prefs":style_prefs,                                 |
| "analyst_output":{}, "content_output":{}, "style_output":{},                              |
| "blueprint":{}, "prompt":"", "raw_code":"",                                               |
| "debugged_code":"", "seo_code":"",                                                        |
| "qa_result":{}, "qa_approved_code":"",                                                    |
| "mobile_code":"", # Agent 10 final output - this gets deployed                            |
| "errors":\[\], "retries":{}, "active_agent":None, "phase":"queued",                       |
| "supervisor_correction":None,                                                             |
| }                                                                                         |

## **15.3 main.py - Full Server**

| \# main.py                                                                                       |
| ------------------------------------------------------------------------------------------------ |
| from fastapi import FastAPI, Depends, HTTPException, Header, Request                             |
| from fastapi.middleware.cors import CORSMiddleware                                               |
| from slowapi import Limiter                                                                      |
| from slowapi.util import get_remote_address                                                      |
| from redis import Redis                                                                          |
| from rq import Queue as RQueue                                                                   |
| from dotenv import load_dotenv                                                                   |
| from lib.blackboard import create_blackboard                                                     |
| import os                                                                                        |
| load_dotenv()                                                                                    |
|                                                                                                  |
| app = FastAPI(title="Onara Pipeline")                                                            |
| app.add_middleware(CORSMiddleware,                                                               |
| allow_origins=\["<https://onara.tech","https://onara-app.vercel.app","http://localhost:3000"\>], |
| allow_methods=\["GET","POST"\], allow_headers=\["\*"\])                                          |
|                                                                                                  |
| def get_user_key(request:Request):                                                               |
| try: return request.state.body.get("userId",get_remote_address(request))                         |
| except: return get_remote_address(request)                                                       |
|                                                                                                  |
| limiter = Limiter(key_func=get_user_key)                                                         |
| app.state.limiter = limiter                                                                      |
|                                                                                                  |
| redis_conn = Redis(host="localhost", port=6379)                                                  |
| pipeline_queue = RQueue("onara-pipeline", connection=redis_conn)                                 |
| job_store: dict = {}                                                                             |
|                                                                                                  |
| PIPELINE_SECRET = os.getenv("PIPELINE_SECRET")                                                   |
| def verify_secret(x_pipeline_secret:str=Header(None)):                                           |
| if x_pipeline_secret!=PIPELINE_SECRET:                                                           |
| raise HTTPException(status_code=401,detail="Unauthorized")                                       |
|                                                                                                  |
| @app.on_event("startup")                                                                         |
| async def startup():                                                                             |
| from rag.embedder import initialize_rag                                                          |
| initialize_rag()                                                                                 |
|                                                                                                  |
| @app.get("/health")                                                                              |
| def health(): return{"status":"ok","queue_length":len(pipeline_queue)}                           |
|                                                                                                  |
| @app.post("/pipeline/start")                                                                     |
| @limiter.limit("10/hour")                                                                        |
| async def start_pipeline(request:Request,body:dict,\_=Depends(verify_secret)):                   |
| job_id=body\["jobId"\]; user_id=body.get("userId")                                               |
| if user_id:                                                                                      |
| active=\[bb for bb in job_store.values()                                                         |
| if bb.get("user_id")==user_id and bb.get("phase") in("queued","running")\]                       |
| if active:                                                                                       |
| return{"jobId":active\[0\]\["job_id"\],"queuePosition":0,"deduplicated":True}                    |
| bb=create_blackboard(job_id,body\["businessData"\],body.get("stylePrefs",{}),                    |
| user_id=user_id,revision_of=body.get("revisionOf"))                                              |
| \# Pass model preference and API keys                                                            |
| bb\["preferred_code_model"\] = body.get("preferredCodeModel","nim-kimi")                         |
| bb\["user_claude_key"\] = body.get("userClaudeKey")                                              |
| bb\["user_openai_key"\] = body.get("userOpenaiKey")                                              |
| job_store\[job_id\]=bb                                                                           |
| pipeline_queue.enqueue("agents.pipeline.run_pipeline_job",bb,                                    |
| job_id=job_id,job_timeout=300,result_ttl=3600)                                                   |
| return{"jobId":job_id,"queuePosition":len(pipeline_queue)}                                       |
|                                                                                                  |
| @app.get("/pipeline/status/{job_id}")                                                            |
| def pipeline_status(job_id:str,\_=Depends(verify_secret)):                                       |
| if job_id not in job_store:                                                                      |
| raise HTTPException(status_code=404,detail="Job not found")                                      |
| bb=job_store\[job_id\]                                                                           |
| return{"phase":bb\["phase"\],"activeAgent":bb\["active_agent"\],                                 |
| "queuePosition":0,"errors":bb\["errors"\]}                                                       |
|                                                                                                  |
| @app.get("/github/token")                                                                        |
| def github_token(\_=Depends(verify_secret)):                                                     |
| from lib.github_auth import generate_installation_token                                          |
| return{"token":generate_installation_token()}                                                    |

## **15.4 Start RQ Worker via PM2**

| pm2 start "rq worker onara-pipeline" --name onara-worker  |
| --------------------------------------------------------- |
| pm2 start "uvicorn main:app --port 8000" --name onara-api |
| pm2 save                                                  |
| pm2 status # both should show "online"                    |

## **Step 15 Verification Checklist**

- redis-cli ping returns PONG
- GET /health returns {"status":"ok","queue_length":0}
- POST /pipeline/start returns jobId and queuePosition
- Second request from same user_id returns deduplicated:true
- Both PM2 processes show online

PHASE 7 - PIPELINE INFRASTRUCTURE

**STEP 16**

**AI Client - All Agents on NVIDIA NIM + Plan-Gated Model Picker**

The unified AI client routing all agents to NVIDIA NIM (one free API key) with local Ollama fallbacks. Model picker: free=NIM kimi-k2.6, starter=+Copilot, pro=+Claude+OpenAI.

**⏱️ Time estimate: 3-4 hours | Difficulty: High**

Complete the verification checklist at the bottom before moving to the next step.

**📋 Prerequisites for this step**

NVIDIA_NIM_API_KEY from build.nvidia.com Copilot student plan active (for Starter model picker) Step 3 complete - local models running on PC

## **16.1 NVIDIA NIM Account Setup**

- Go to build.nvidia.com. Sign in or create a free NVIDIA Developer account.
- Click your profile > API Keys > Generate Key. Name it "Onara". Copy as NVIDIA_NIM_API_KEY.
- Add to onara-pipeline/.env: NVIDIA_NIM_API_KEY=nvapi-...
- Test immediately:

| curl -X POST <https://integrate.api.nvidia.com/v1/chat/completions> \\                                             |
| ------------------------------------------------------------------------------------------------------------------ |
| \-H "Content-Type: application/json" \\                                                                            |
| \-H "Authorization: Bearer \$NVIDIA_NIM_API_KEY" \\                                                                |
| \-d '{"model":"moonshotai/kimi-k2.6","messages":\[{"role":"user","content":"Reply READY only"}\],"max_tokens":10}' |
| \# Expected: ...{"content":"READY"}...                                                                             |

## **16.2 Model Picker - Plan Gating**

**🎛️ Plan-Gated Models**

Free plan: NIM kimi-k2.6 only (best open-source HTML/CSS/JS, Tier A, zero cost) Starter plan: + GitHub Copilot SDK included models (free with student plan) → gpt-5.2-codex (best selectable on Copilot student) → gpt-4.1 (included, no premium request) → gpt-4o (included, no premium request) Pro plan: All Starter + Claude API (user provides key) → claude-sonnet-4-6 → claude-opus-4-6 Plus OpenAI API (user provides key) → gpt-5.4 → gpt-5.2-codex (direct OpenAI, not Copilot)

## **16.3 lib/ai_client.py - The Complete Client**

| \# lib/ai_client.py                                                           |
| ----------------------------------------------------------------------------- |
| \# ALL cloud agents go through NVIDIA NIM - one API key, 80+ free models.     |
| \# Local agents use Ollama on your PC via OLLAMA_LOCAL_URL.                   |
| \# Every cloud call auto-falls back to local llama3.3:8b on error/rate-limit. |
|                                                                               |
| import asyncio, os                                                            |
| from openai import AsyncOpenAI                                                |
| from ollama import AsyncClient as OllamaClient                                |
| from dotenv import load_dotenv                                                |
| load_dotenv()                                                                 |
|                                                                               |
| OLLAMA_LOCAL_URL = os.getenv("OLLAMA_LOCAL_URL","<http://localhost:11434>")   |
| NVIDIA_NIM_API_KEY = os.getenv("NVIDIA_NIM_API_KEY")                          |
|                                                                               |
| \# ── Clients ──────────────────────────────────────────────────────────      |
| local_ollama = OllamaClient(host=OLLAMA_LOCAL_URL)                            |
|                                                                               |
| nim = AsyncOpenAI(                                                            |
| base_url="<https://integrate.api.nvidia.com/v1>",                             |
| api_key=NVIDIA_NIM_API_KEY,                                                   |
| )                                                                             |
|                                                                               |
| \# ── Local Ollama (PC on network) ─────────────────────────────────────      |
| async def local(model:str, prompt:str, system:str="") -> str:                 |
| msgs = \[\]                                                                   |
| if system: msgs.append({"role":"system","content":system})                    |
| msgs.append({"role":"user","content":prompt})                                 |
| loop = asyncio.get_event_loop()                                               |
| r = await loop.run_in_executor(                                               |
| None, lambda: local_ollama.chat(model=model,messages=msgs))                   |
| return r.message.content                                                      |
|                                                                               |
| \# ── NVIDIA NIM cloud call with local fallback ─────────────────────────     |
| async def nim_call(model:str, prompt:str, system:str="",                      |
| fallback:str="llama3.3:8b") -> str:                                           |
| msgs = \[\]                                                                   |
| if system: msgs.append({"role":"system","content":system})                    |
| msgs.append({"role":"user","content":prompt})                                 |
| for attempt in range(2):                                                      |
| try:                                                                          |
| r = await nim.chat.completions.create(                                        |
| model=model, messages=msgs, max_tokens=8192)                                  |
| return r.choices\[0\].message.content                                         |
| except Exception as e:                                                        |
| status = getattr(getattr(e,"response",None),"status_code",None)               |
| if status==429:                                                               |
| await asyncio.sleep(15) # rate limit - wait then retry                        |
| continue                                                                      |
| \# Server error or network - fall back to local immediately                   |
| print(f"NIM error ({model}, status={status}): {e}")                           |
| return await local(fallback, prompt, system)                                  |
| \# Still rate-limited after retry - use local                                 |
| return await local(fallback, prompt, system)                                  |
|                                                                               |
| \# ── Named model functions (used directly by agents) ──────────────────      |
|                                                                               |
| \# Agent 1 - DeepSeek V4 Flash (free, Tier B, fast JSON)                      |
| async def deepseek_flash(prompt:str, system:str="") -> str:                   |
| return await nim_call("deepseek-ai/deepseek-v4-flash", prompt, system)        |
|                                                                               |
| \# Agents 4 + 9 - DeepSeek V4 Pro (#1 agentic structured output)              |
| async def deepseek_pro(prompt:str, system:str="") -> str:                     |
| return await nim_call("deepseek-ai/deepseek-v4-pro", prompt, system)          |
|                                                                               |
| \# Agents 5 + 7 - Kimi K2.6 (Tier A coding, 87/100, 2.8x faster)              |
| async def kimi(prompt:str, system:str="") -> str:                             |
| return await nim_call("moonshotai/kimi-k2.6", prompt, system)                 |
|                                                                               |
| \# Agents 2, 3, 8, 10 - Local qwen3:8b (best under-8B instruction model)      |
| async def qwen(prompt:str, system:str="") -> str:                             |
| return await local("qwen3:8b", prompt, system)                                |
|                                                                               |
| \# Supervisor - Local llama3.3:8b (fastest local, minimal latency)            |
| async def llama(prompt:str, system:str="") -> str:                            |
| return await local("llama3.3:8b", prompt, system)                             |
|                                                                               |
| \# ── Model picker for Agent 6 (plan-gated) ────────────────────────────      |
| async def code_gen(                                                           |
| prompt: str,                                                                  |
| model_key: str = "nim-kimi",                                                  |
| claude_key: str = None,                                                       |
| openai_key: str = None,                                                       |
| ) -> str:                                                                     |
| """                                                                           |
| Routes Agent 6 based on plan and user preference.                             |
|                                                                               |
| FREE PLAN (no user API key):                                                  |
| "nim-kimi" → NIM moonshotai/kimi-k2.6 (best open-source frontend)             |
|                                                                               |
| STARTER PLAN (GitHub Copilot student - included models, zero cost):           |
| "copilot-gpt4o" → Copilot SDK gpt-4o                                          |
| "copilot-gpt4.1" → Copilot SDK gpt-4.1                                        |
| "copilot-gpt5.2-codex" → Copilot SDK gpt-5.2-codex (best on student plan)     |
|                                                                               |
| PRO PLAN (user provides their own key):                                       |
| "claude-sonnet-4-6" → Anthropic API claude-sonnet-4-6                         |
| "claude-opus-4-6" → Anthropic API claude-opus-4-6                             |
| "openai-gpt-5.4" → OpenAI API gpt-5.4                                         |
| "openai-gpt5.2-codex" → OpenAI API gpt-5.2-codex (direct, not Copilot)        |
| """                                                                           |
|                                                                               |
| \# ── Free default: NIM kimi-k2.6 ─────────────────────────────────           |
| if model_key == "nim-kimi" or not model_key:                                  |
| return await kimi(prompt)                                                     |
|                                                                               |
| \# ── Starter: GitHub Copilot SDK ──────────────────────────────────          |
| if model_key.startswith("copilot-"):                                          |
| copilot_model_map = {                                                         |
| "copilot-gpt4o": "gpt-4o",                                                    |
| "copilot-gpt4.1": "gpt-4.1",                                                  |
| "copilot-gpt5.2-codex": "gpt-5.2-codex",                                      |
| }                                                                             |
| copilot_model = copilot_model_map.get(model_key, "gpt-4o")                    |
| from lib.copilot_client import copilot_sdk_generate                           |
| try:                                                                          |
| return await copilot_sdk_generate(prompt, copilot_model)                      |
| except Exception as e:                                                        |
| print(f"Copilot SDK failed ({e}), falling back to NIM kimi-k2.6")             |
| return await kimi(prompt)                                                     |
|                                                                               |
| \# ── Pro: Claude API (user provides key) ──────────────────────────          |
| if model_key.startswith("claude-") and claude_key:                            |
| import anthropic                                                              |
| model_map = {                                                                 |
| "claude-sonnet-4-6": "claude-sonnet-4-6",                                     |
| "claude-opus-4-6": "claude-opus-4-6",                                         |
| }                                                                             |
| client = anthropic.Anthropic(api_key=claude_key)                              |
| r = client.messages.create(                                                   |
| model=model_map.get(model_key,"claude-sonnet-4-6"),                           |
| max_tokens=8192,                                                              |
| messages=\[{"role":"user","content":prompt}\]                                 |
| )                                                                             |
| return r.content\[0\].text                                                    |
|                                                                               |
| \# ── Pro: OpenAI API (user provides key) ──────────────────────────          |
| if model_key.startswith("openai-") and openai_key:                            |
| model_map = {                                                                 |
| "openai-gpt-5.4": "gpt-5.4",                                                  |
| "openai-gpt5.2-codex": "gpt-5.2-codex",                                       |
| }                                                                             |
| openai_client = AsyncOpenAI(api_key=openai_key)                               |
| r = await openai_client.chat.completions.create(                              |
| model=model_map.get(model_key,"gpt-5.4"),                                     |
| max_tokens=8192,                                                              |
| messages=\[{"role":"user","content":prompt}\]                                 |
| )                                                                             |
| return r.choices\[0\].message.content                                         |
|                                                                               |
| \# ── Fallback: always NIM kimi-k2.6 ───────────────────────────────          |
| return await kimi(prompt)                                                     |

## **16.4 Model Picker UI (Account Page)**

| // components/ModelPicker.jsx - plan-gated model selector                                                                           |
| ----------------------------------------------------------------------------------------------------------------------------------- |
| "use client"                                                                                                                        |
| import Badge from "./Badge"                                                                                                         |
|                                                                                                                                     |
| const FREE_MODELS = \[                                                                                                              |
| {key:"nim-kimi", label:"Kimi K2.6 (NIM)", badge:"Free",                                                                             |
| desc:"Best open-source frontend HTML/CSS/JS. Tier A (87/100 coding). NVIDIA NIM free tier."},                                       |
| \]                                                                                                                                  |
|                                                                                                                                     |
| const STARTER_MODELS = \[                                                                                                           |
| {key:"copilot-gpt4o", label:"GPT-4o", badge:"Copilot Student", desc:"Included - no premium requests consumed."},                    |
| {key:"copilot-gpt4.1", label:"GPT-4.1", badge:"Copilot Student", desc:"Included - no premium requests consumed."},                  |
| {key:"copilot-gpt5.2-codex", label:"GPT-5.2 Codex",badge:"Copilot Student", desc:"Best model selectable on Copilot student plan."}, |
| \]                                                                                                                                  |
|                                                                                                                                     |
| const PRO_MODELS = \[                                                                                                               |
| {key:"claude-sonnet-4-6", label:"Claude Sonnet 4.6", badge:"Anthropic API", needsClaude:true},                                      |
| {key:"claude-opus-4-6", label:"Claude Opus 4.6", badge:"Anthropic API", needsClaude:true},                                          |
| {key:"openai-gpt-5.4", label:"GPT-5.4", badge:"OpenAI API", needsOpenAI:true},                                                      |
| {key:"openai-gpt5.2-codex",label:"GPT-5.2 Codex", badge:"OpenAI API", needsOpenAI:true},                                            |
| \]                                                                                                                                  |
|                                                                                                                                     |
| export default function ModelPicker({user, currentModel, onSave}){                                                                  |
| const isPro = user?.plan==="pro"                                                                                                    |
| const isStarter = \["starter","pro"\].includes(user?.plan)                                                                          |
| const \[selected, setSelected\] = React.useState(currentModel\|"nim-kimi")                                                          |
| const \[claudeKey, setClaudeKey\] = React.useState("")                                                                              |
| const \[openaiKey, setOpenaiKey\] = React.useState("")                                                                              |
|                                                                                                                                     |
| const needsClaude = selected?.startsWith("claude")                                                                                  |
| const needsOpenAI = selected?.startsWith("openai")                                                                                  |
|                                                                                                                                     |
| const ModelOption = ({m})=>(                                                                                                        |
| <label className={\`flex items-start gap-3 p-3 rounded-xl border cursor-pointer                                                     |
| \${selected===m.key?"border-gold bg-gold/5":"border-tan/30 hover:border-tan"}\`}>                                                   |
| <input type="radio" name="model" value={m.key}                                                                                      |
| checked={selected===m.key} onChange={()=>setSelected(m.key)}                                                                        |
| className="mt-1"/>                                                                                                                  |
| &lt;div className="flex-1"&gt;                                                                                                      |
| &lt;div className="flex items-center gap-2"&gt;                                                                                     |
| &lt;span className="text-sm font-medium text-darkBrown"&gt;{m.label}&lt;/span&gt;                                                   |
| <span className={\`text-xs px-2 py-0.5 rounded-full font-semibold                                                                   |
| \${m.badge==="Free"?"bg-green-100 text-green-800":                                                                                  |
| m.badge==="Copilot Student"?"bg-blue-100 text-blue-800":                                                                            |
| "bg-purple-100 text-purple-800"}\`}>{m.badge}&lt;/span&gt;                                                                          |
| &lt;/div&gt;                                                                                                                        |
| {m.desc&&&lt;p className="text-xs text-tan mt-0.5"&gt;{m.desc}&lt;/p&gt;}                                                           |
| &lt;/div&gt;                                                                                                                        |
| &lt;/label&gt;                                                                                                                      |
| )                                                                                                                                   |
|                                                                                                                                     |
| return(                                                                                                                             |
| &lt;div className="space-y-6"&gt;                                                                                                   |
| &lt;h3 className="font-bold text-espresso"&gt;Code Generation Model&lt;/h3&gt;                                                      |
|                                                                                                                                     |
| &lt;div&gt;                                                                                                                         |
| &lt;p className="text-xs font-semibold text-tan uppercase tracking-wide mb-2"&gt;                                                   |
| Free - NVIDIA NIM (no key needed)                                                                                                   |
| &lt;/p&gt;                                                                                                                          |
| {FREE_MODELS.map(m=>&lt;ModelOption key={m.key} m={m}/&gt;)}                                                                        |
| &lt;/div&gt;                                                                                                                        |
|                                                                                                                                     |
| {isStarter&&(                                                                                                                       |
| &lt;div&gt;                                                                                                                         |
| &lt;p className="text-xs font-semibold text-tan uppercase tracking-wide mb-2"&gt;                                                   |
| Starter - GitHub Copilot included models                                                                                            |
| &lt;/p&gt;                                                                                                                          |
| {STARTER_MODELS.map(m=>&lt;ModelOption key={m.key} m={m}/&gt;)}                                                                     |
| &lt;/div&gt;                                                                                                                        |
| )}                                                                                                                                  |
|                                                                                                                                     |
| {isPro&&(                                                                                                                           |
| &lt;div&gt;                                                                                                                         |
| &lt;p className="text-xs font-semibold text-tan uppercase tracking-wide mb-2"&gt;                                                   |
| Pro - Bring your own API key                                                                                                        |
| &lt;/p&gt;                                                                                                                          |
| {PRO_MODELS.map(m=>&lt;ModelOption key={m.key} m={m}/&gt;)}                                                                         |
| {needsClaude&&(                                                                                                                     |
| <input type="password" placeholder="Anthropic API key (sk-ant-...)"                                                                 |
| value={claudeKey} onChange={e=>setClaudeKey(e.target.value)}                                                                        |
| className="w-full mt-3 border border-purple-300 rounded-xl px-4 py-3 text-sm"/>                                                     |
| )}                                                                                                                                  |
| {needsOpenAI&&(                                                                                                                     |
| <input type="password" placeholder="OpenAI API key (sk-...)"                                                                        |
| value={openaiKey} onChange={e=>setOpenaiKey(e.target.value)}                                                                        |
| className="w-full mt-3 border border-purple-300 rounded-xl px-4 py-3 text-sm"/>                                                     |
| )}                                                                                                                                  |
| &lt;/div&gt;                                                                                                                        |
| )}                                                                                                                                  |
|                                                                                                                                     |
| &lt;button onClick={()=&gt;onSave(selected,claudeKey,openaiKey)}                                                                    |
| className="px-6 py-3 bg-gold text-espresso font-bold rounded-xl text-sm">                                                           |
| Save Preference                                                                                                                     |
| &lt;/button&gt;                                                                                                                     |
| &lt;/div&gt;                                                                                                                        |
| )                                                                                                                                   |
| }                                                                                                                                   |

## **16.5 Quick Test - All Providers**

| \# test_clients.py - run after setting up all keys                              |
| ------------------------------------------------------------------------------- |
| import asyncio                                                                  |
| from lib.ai_client import deepseek_flash, deepseek_pro, kimi, qwen, llama       |
|                                                                                 |
| T = "Reply with only the word: READY"                                           |
|                                                                                 |
| async def main():                                                               |
| for name, fn in \[("qwen3:8b local", qwen),                                     |
| ("llama3.3:8b local", llama),                                                   |
| ("NIM deepseek-flash", deepseek_flash),                                         |
| ("NIM deepseek-pro", deepseek_pro),                                             |
| ("NIM kimi-k2.6", kimi)\]:                                                      |
| try:                                                                            |
| out = await fn(T)                                                               |
| print(f"✓ {name}: {out.strip()}")                                               |
| except Exception as e:                                                          |
| print(f"✗ {name}: {e}")                                                         |
|                                                                                 |
| asyncio.run(main())                                                             |
|                                                                                 |
| \# Run: cd onara-pipeline && source venv/bin/activate && python test_clients.py |
| \# All 5 should print: ✓ {name}: READY                                          |

## **Step 16 Verification Checklist**

- NVIDIA_NIM_API_KEY in .env and curl test returns READY from kimi-k2.6
- test_clients.py: all 5 providers return READY
- Rate limit fallback: disconnect internet - cloud calls fall back to llama3.3:8b
- Free model picker: NIM kimi-k2.6 renders as only option
- Starter model picker: GitHub Copilot options appear for starter plan users
- Pro model picker: Claude and OpenAI options appear with API key inputs
- Claude API route works with a valid claude-sonnet-4-6 key
- OpenAI API route works with a valid key

PHASE 7 - PIPELINE INFRASTRUCTURE

**STEP 17**

**RAG System - ChromaDB, Embeddings & BM25 Hybrid Search**

Setting up the persistent vector database with 15 HTML/CSS/JS pattern documents for Agents 7 and 9.

**⏱️ Time estimate: 2 hours | Difficulty: Medium**

Complete the verification checklist at the bottom before moving to the next step.

**📋 Prerequisites for this step**

Step 16 complete

## **17.1 ChromaDB Persistent Client**

| \# rag/vector_store.py                                                                   |
| ---------------------------------------------------------------------------------------- |
| import chromadb, os                                                                      |
| from sentence_transformers import SentenceTransformer                                    |
| from rank_bm25 import BM25Okapi                                                          |
|                                                                                          |
| CHROMA_PATH = os.getenv("CHROMA_PATH", "./chroma_db")                                    |
| client = chromadb.PersistentClient(path=CHROMA_PATH)                                     |
| embedder = SentenceTransformer("all-MiniLM-L6-v2")                                       |
|                                                                                          |
| def get_collection():                                                                    |
| return client.get_or_create_collection("onara-patterns")                                 |
|                                                                                          |
| def embed_documents(docs: list\[dict\]):                                                 |
| col = get_collection()                                                                   |
| embeddings = embedder.encode(\[d\["content"\] for d in docs\]).tolist()                  |
| col.add(ids=\[d\["id"\] for d in docs\],                                                 |
| documents=\[d\["content"\] for d in docs\],                                              |
| embeddings=embeddings,                                                                   |
| metadatas=\[d.get("metadata",{}) for d in docs\])                                        |
|                                                                                          |
| def hybrid_search(query: str, n: int = 3) -> list\[str\]:                                |
| col = get_collection()                                                                   |
| emb = embedder.encode(query).tolist()                                                    |
| res = col.query(query_embeddings=\[emb\], n_results=n\*2)                                |
| docs = res\["documents"\]\[0\]                                                           |
| if not docs: return \[\]                                                                 |
| bm25 = BM25Okapi(\[d.split() for d in docs\])                                            |
| scores = bm25.get_scores(query.split())                                                  |
| return \[d for d,\_ in sorted(zip(docs,scores),key=lambda x:x\[1\],reverse=True)\[:n\]\] |

## **17.2 Pattern Documents**

| \# rag/embedder.py                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------- |
| from rag.vector_store import embed_documents                                                                                          |
|                                                                                                                                       |
| DOCS = \[                                                                                                                             |
| {"id":"nav", "content":"Sticky navbar: position:fixed top-0 z-50. Logo left, links center, CTA right. Hamburger at <768px."},         |
| {"id":"hero", "content":"Hero: min-height 90vh, flexbox center, H1 under 10 words, single CTA. No competing CTAs."},                  |
| {"id":"grid", "content":"Responsive grid: display:grid grid-template-columns:repeat(auto-fit,minmax(280px,1fr)) gap:2rem."},          |
| {"id":"media", "content":"Mobile breakpoints @media(max-width:768px) and @media(max-width:480px). flex-direction:column."},           |
| {"id":"touch", "content":"Touch targets minimum 44x44px. 8px gap between interactive elements."},                                     |
| {"id":"fontsize", "content":"Minimum font-size 16px on inputs prevents iOS auto-zoom. clamp() for responsive headings."},             |
| {"id":"overflow", "content":"overflow-x:hidden on body. No fixed widths > viewport. Images: max-width:100% height:auto."},            |
| {"id":"jsonld", "content":"JSON-LD LocalBusiness in &lt;head&gt;: @type:LocalBusiness, name, address, telephone, openingHours."},     |
| {"id":"meta", "content":"&lt;title&gt; &lt;60 chars. <meta description&gt; <160 chars. og:title og:description canonical viewport."}, |
| {"id":"contact", "content":"Contact: &lt;a href=tel:&gt; for phone, &lt;a href=mailto:&gt; for email. Form: name email message."},    |
| {"id":"markers", "content":"File markers: &lt;!-- index.html --&gt; then /\* style.css \*/ then // script.js. All three required."},  |
| {"id":"cssvars", "content":":root {--primary:#hex;--secondary:#hex;} Use var(--primary) throughout for consistency."},                |
| {"id":"alt", "content":"All &lt;img&gt; need descriptive alt text. alt='Business service description'. Empty alt only decorative."},  |
| {"id":"emergency","content":"Contractor emergency banner: background:#d32f2f color:white, large phone, sticky mobile."},              |
| {"id":"reviews", "content":"Google reviews badge with star rating, count, Google Maps link. AggregateRating JSON-LD for SEO."},       |
| \]                                                                                                                                    |
|                                                                                                                                       |
| def initialize_rag():                                                                                                                 |
| embed_documents(DOCS)                                                                                                                 |
| print(f"RAG: {len(DOCS)} docs embedded")                                                                                              |

| \# main.py - add startup                |
| --------------------------------------- |
| from rag.embedder import initialize_rag |
|                                         |
| @app.on_event("startup")                |
| async def startup(): initialize_rag()   |

## **Step 17 Verification Checklist**

- chroma_db/ directory created on startup
- hybrid_search("file markers") returns the markers document
- Documents persist after server restart - no re-embedding needed

PHASE 8 - AI AGENTS

**STEP 18**

**Agents 1-3 - Business Analyst, Content Writer & Style Agent**

Implementing the first three agents: industry classification with DeepSeek V4 Flash, parallel content writing and style selection with local qwen3:8b.

**⏱️ Time estimate: 2-3 hours | Difficulty: Medium**

Complete the verification checklist at the bottom before moving to the next step.

**📋 Prerequisites for this step**

Steps 16-17 complete - AI client and RAG ready

## **18.1 Agent 1 - Business Analyst (DeepSeek V4 Flash via NIM)**

**🧠 Model choice**

DeepSeek V4 Flash on NVIDIA NIM. Tier B coding, excellent structured JSON output, ultra-cheap. Perfect for the classification task of Agent 1 - no frontier model needed here.

| \# agents/analyst.py                                                           |
| ------------------------------------------------------------------------------ |
| from lib.ai_client import nim_call # DeepSeek V4 Flash                         |
| import json                                                                    |
|                                                                                |
| SYSTEM = """You are a website strategy expert for small businesses.            |
| Analyze the business and return ONLY valid JSON - no markdown, no explanation: |
| {                                                                              |
| "industryType": "plumber\|restaurant\|photographer\|etc",                      |
| "mustHaveSections": \["hero","services","contact",...\],                       |
| "callToActionType": "call_now\|book_appointment\|order_online\|get_quote",     |
| "urgencyLevel": "high\|medium\|low",                                           |
| "specialFeatures": \["emergency_callout","gallery","menu","booking",...\],     |
| "targetCustomer": "one sentence describing the typical customer"               |
| }"""                                                                           |
|                                                                                |
| async def run(bb: dict) -> dict:                                               |
| bd = bb\["business_data"\]                                                     |
| sp = bb.get("style_prefs", {})                                                 |
| prompt = f"""Business: {bd.get("name")} ({bd.get("type","")})                  |
| Services: {", ".join(bd.get("services", \[\]))}                                |
| Address: {bd.get("address","")}                                                |
| Style preferences: tone={sp.get("tone","")}, layout={sp.get("layout","")}      |
| Extra context: {sp.get("extra","")}"""                                         |
| response = await nim_call("deepseek-ai/deepseek-v4-flash", prompt, SYSTEM)     |
| return json.loads(response.strip())                                            |

## **18.2 Agents 2 & 3 - Content Writer and Style Agent (Local, Parallel)**

| \# agents/content_writer.py                                                          |
| ------------------------------------------------------------------------------------ |
| from lib.ai_client import qwen                                                       |
| import json                                                                          |
|                                                                                      |
| SYSTEM = """Write conversion-focused website copy. Return ONLY JSON:                 |
| {"heroHeadline":"under 10 words","heroSub":"one sentence",                           |
| "aboutText":"2-3 sentences","services":\[{"name":"","description":"one sentence"}\], |
| "emergencyBanner":"null or urgent callout text","ctaText":"action phrase",           |
| "footerTagline":"short tagline"}                                                     |
| Use real business name, real services, real tone from style_prefs."""                |
|                                                                                      |
| async def run(bb: dict) -> dict:                                                     |
| bd = bb\["business_data"\]                                                           |
| ao = bb\["analyst_output"\]                                                          |
| sp = bb.get("style_prefs", {})                                                       |
| prompt = f"""Business: {bd.get("name")} ({ao.get("industryType","")}))               |
| Services: {", ".join(bd.get("services",\[\]))}                                       |
| Phone: {bd.get("phone","")}                                                          |
| CTA type: {ao.get("callToActionType","")}                                            |
| Urgency: {ao.get("urgencyLevel","")}                                                 |
| Tone preference: {sp.get("tone","professional")}                                     |
| Extra: {sp.get("extra","")}"""                                                       |
| response = await qwen(prompt, SYSTEM)                                                |
| return json.loads(response.strip())                                                  |

| \# agents/style_agent.py                                                                     |
| -------------------------------------------------------------------------------------------- |
| from lib.ai_client import qwen                                                               |
| import json                                                                                  |
|                                                                                              |
| INDUSTRY_DEFAULTS = {                                                                        |
| "plumber": {"primaryColor":"#1A3A5C","tone":"professional","layout":"classic"},              |
| "electrician": {"primaryColor":"#F57F17","tone":"bold","layout":"modern"},                   |
| "restaurant": {"primaryColor":"#8B1A1A","tone":"warm","layout":"bold"},                      |
| "photographer": {"primaryColor":"#2C2C2C","tone":"minimal","layout":"clean"},                |
| "landscaper": {"primaryColor":"#2D5016","tone":"earthy","layout":"classic"},                 |
| "salon": {"primaryColor":"#C2185B","tone":"luxurious","layout":"modern"},                    |
| }                                                                                            |
|                                                                                              |
| async def run(bb: dict) -> dict:                                                             |
| industry = bb\["analyst_output"\].get("industryType","general")                              |
| sp = bb.get("style_prefs", {})                                                               |
| defaults = INDUSTRY_DEFAULTS.get(industry, {"primaryColor":"#2C3E50","tone":"professional"}) |
| \# User prefs override industry defaults                                                     |
| tone = sp.get("tone") or defaults.get("tone","professional")                                 |
| color = sp.get("color") or "Auto"                                                            |
| layout = sp.get("layout") or defaults.get("layout","modern")                                 |
| prompt = f"""Design a color palette and typography for a {industry} website.                 |
| User preferences: tone={tone}, color={color}, layout={layout}                                |
| Industry defaults: {json.dumps(defaults)}                                                    |
| Return ONLY JSON:                                                                            |
| {{ "primaryColor":"#hex","secondaryColor":"#hex","accentColor":"#hex",                       |
| "headingFont":"name","bodyFont":"name","layoutStyle":"modern\|classic\|bold\|minimal",       |
| "borderRadius":"none\|soft\|rounded","buttonStyle":"solid\|outline\|gradient" }}"""          |
| response = await qwen(prompt)                                                                |
| return json.loads(response.strip())                                                          |

## **Step 18 Verification Checklist**

- Agent 1 returns valid JSON with industryType, mustHaveSections, callToActionType for a test plumbing business
- Agent 2 returns heroHeadline under 10 words with real business name
- Agent 3 returns valid hex colors and font names
- Agents 2 and 3 run in parallel via asyncio.gather - confirm in logs

PHASE 8 - AI AGENTS

**STEP 19**

**Agents 4-5 - Planner & Prompt Engineer**

The blueprint synthesis (DeepSeek V4 Pro - best agentic tasks) and prompt engineering (Kimi K2.6 - fastest Tier A).

**⏱️ Time estimate: 2 hours | Difficulty: Medium**

Complete the verification checklist at the bottom before moving to the next step.

**📋 Prerequisites for this step**

Step 18 complete

## **19.1 Agent 4 - Planner (DeepSeek V4 Pro via NIM)**

**🧠 Model choice**

DeepSeek V4 Pro on NVIDIA NIM. Leads all open-weight models on GDPval-AA agentic real-world tasks (score 1554). The Planner merges 3 complex JSON outputs into one unified blueprint - the most demanding synthesis task in the pipeline.

| \# agents/planner.py                                                                              |
| ------------------------------------------------------------------------------------------------- |
| from lib.ai_client import nim_call                                                                |
| import json                                                                                       |
|                                                                                                   |
| SYSTEM = """You are a senior web architect.                                                       |
| Merge analyst, content, and style outputs into one unified site blueprint.                        |
| Return ONLY valid JSON:                                                                           |
| {"sections":\[{"id":"hero","content":{...},"style":{...}},...\],"globalStyle":{...},"meta":{...}} |
| Every section from analyst mustHaveSections must appear.                                          |
| Content must match content_output exactly.                                                        |
| Colors must match style_output exactly."""                                                        |
|                                                                                                   |
| async def run(bb: dict) -> dict:                                                                  |
| prompt = f"""Analyst output: {json.dumps(bb\["analyst_output"\])}                                 |
| Content output: {json.dumps(bb\["content_output"\])}                                              |
| Style output: {json.dumps(bb\["style_output"\])}                                                  |
| Business name: {bb\["business_data"\].get("name","")}                                             |
| Merge into unified blueprint."""                                                                  |
| response = await nim_call("deepseek-ai/deepseek-v4-pro", prompt, SYSTEM)                          |
| result = json.loads(response.strip())                                                             |
| \# Prune consumed outputs to save memory                                                          |
| bb\["analyst_output"\] = None                                                                     |
| bb\["content_output"\] = None                                                                     |
| bb\["style_output"\] = None                                                                       |
| return result                                                                                     |

## **19.2 Agent 5 - Prompt Engineer (Kimi K2.6 via NIM)**

**🧠 Model choice**

Kimi K2.6 on NVIDIA NIM. Tier A coding (87/100), 2.8x faster than DeepSeek V4 Pro. The prompt engineer writes the exact instruction that Agent 6 (Copilot SDK) will follow - speed and precision both matter here.

| \# agents/prompt_engineer.py                                                   |
| ------------------------------------------------------------------------------ |
| from lib.ai_client import nim_call                                             |
|                                                                                |
| SYSTEM = """Convert this site blueprint into a precise code generation prompt. |
| The prompt must:                                                               |
| \- Specify every section by name with exact content                            |
| \- Include all colors as exact hex values                                      |
| \- Include all font names                                                      |
| \- Require EXACTLY these file markers:                                         |
| &lt;!-- index.html --&gt; for HTML                                             |
| /\* style.css \*/ for CSS                                                      |
| // script.js for JS                                                            |
| \- Require no external dependencies, no markdown, no explanations              |
| \- All CSS in style.css, all JS in script.js, fully responsive                 |
| Return ONLY the generation prompt string. No JSON wrapper. No preamble."""     |
|                                                                                |
| async def run(bb: dict) -> dict:                                               |
| import json                                                                    |
| prompt = f"Blueprint to convert:\\n{json.dumps(bb\['blueprint'\], indent=2)}"  |
| response = await nim_call("moonshotai/kimi-k2.6", prompt, SYSTEM)              |
| result = response.strip()                                                      |
| bb\["blueprint"\] = None # prune                                               |
| return result                                                                  |

## **Step 19 Verification Checklist**

- Agent 4 blueprint contains all sections from mustHaveSections with actual content and style
- Agent 4 prunes analyst_output, content_output, style_output from blackboard after running
- Agent 5 prompt contains all hex colors from style_output
- Agent 5 prompt explicitly mentions all three file markers

PHASE 8 - AI AGENTS

**STEP 20**

**Agent 6 - Code Generator with Model Picker**

GitHub Copilot SDK as primary code generator with plan-gated model picker: free users get Copilot included models, Starter/Pro users can bring Claude or OpenAI API keys.

**⏱️ Time estimate: 3 hours | Difficulty: High**

Complete the verification checklist at the bottom before moving to the next step.

**📋 Prerequisites for this step**

Step 19 complete GitHub Education approved and Copilot enabled

## **20.1 Model Picker Architecture**

| **Onara Plan** | **Available Models**  | **Provider**                   |
| -------------- | --------------------- | ------------------------------ |
| Free           | GPT-4o (included)     | GitHub Copilot SDK - zero cost |
| Free           | GPT-4.1 (included)    | GitHub Copilot SDK - zero cost |
| Free           | GPT-5 mini (included) | GitHub Copilot SDK - zero cost |
| Starter / Pro  | All Free models +     | -                              |
| Starter / Pro  | claude-sonnet-4-6     | Anthropic API (user's key)     |
| Starter / Pro  | claude-opus-4-6       | Anthropic API (user's key)     |
| Starter / Pro  | gpt-5.2-codex         | OpenAI API (user's key)        |
| Starter / Pro  | gpt-5.4               | OpenAI API (user's key)        |

## **20.2 Account Settings - API Key Storage**

Add a model settings section to the Account page where Starter/Pro users paste their API keys. Keys are stored encrypted in Supabase and never logged.

| \-- Add to users table (run in Supabase SQL Editor)               |
| ----------------------------------------------------------------- |
| ALTER TABLE users ADD COLUMN IF NOT EXISTS                        |
| preferred_code_model VARCHAR(100) DEFAULT 'github-copilot-gpt4o'; |
| ALTER TABLE users ADD COLUMN IF NOT EXISTS                        |
| encrypted_claude_key TEXT; -- AES-256 encrypted, Starter/Pro only |
| ALTER TABLE users ADD COLUMN IF NOT EXISTS                        |
| encrypted_openai_key TEXT; -- AES-256 encrypted, Starter/Pro only |

## **20.3 Model Picker UI (Account Page)**

| // components/ModelPicker.jsx                                                                                |
| ------------------------------------------------------------------------------------------------------------ |
| "use client"                                                                                                 |
| import { useState } from "react"                                                                             |
| import Badge from "./Badge"                                                                                  |
|                                                                                                              |
| const FREE_MODELS = \[                                                                                       |
| { key: "github-copilot-gpt4o", label: "GPT-4o", badge: "Included" },                                         |
| { key: "github-copilot-gpt4.1", label: "GPT-4.1", badge: "Included" },                                       |
| { key: "github-copilot-gpt5mini", label: "GPT-5 mini", badge: "Included" },                                  |
| \]                                                                                                           |
|                                                                                                              |
| const PRO_MODELS = \[                                                                                        |
| { key: "claude-sonnet-4-6", label: "Claude Sonnet 4.6", badge: "Claude API" },                               |
| { key: "claude-opus-4-6", label: "Claude Opus 4.6", badge: "Claude API" },                                   |
| { key: "openai-gpt-5.2-codex", label: "GPT-5.2 Codex", badge: "OpenAI API" },                                |
| { key: "openai-gpt-5.4", label: "GPT-5.4", badge: "OpenAI API" },                                            |
| \]                                                                                                           |
|                                                                                                              |
| export default function ModelPicker({ user, currentModel, onSave }) {                                        |
| const isPro = \["starter","pro"\].includes(user?.plan)                                                       |
| const \[selected, setSelected\] = useState(currentModel)                                                     |
| const \[claudeKey, setClaudeKey\] = useState("")                                                             |
| const \[openaiKey, setOpenaiKey\] = useState("")                                                             |
|                                                                                                              |
| const needsClaude = selected?.startsWith("claude")                                                           |
| const needsOpenAI = selected?.startsWith("openai")                                                           |
|                                                                                                              |
| return (                                                                                                     |
| &lt;div className="space-y-6"&gt;                                                                            |
| &lt;h3 className="font-bold text-espresso"&gt;Code Generation Model&lt;/h3&gt;                               |
|                                                                                                              |
| &lt;div&gt;                                                                                                  |
| &lt;p className="text-sm font-semibold text-tan mb-2"&gt;Free - GitHub Copilot (no API key needed)&lt;/p&gt; |
| &lt;div className="space-y-2"&gt;                                                                            |
| {FREE_MODELS.map(m => (                                                                                      |
| <label key={m.key} className={\`flex items-center gap-3 p-3 rounded-xl border cursor-pointer                 |
| \${selected === m.key ? "border-gold bg-gold/5" : "border-tan/30"}\`}>                                       |
| <input type="radio" name="model" value={m.key}                                                               |
| checked={selected === m.key} onChange={() => setSelected(m.key)}/>                                           |
| &lt;span className="text-sm font-medium text-darkBrown"&gt;{m.label}&lt;/span&gt;                            |
| &lt;Badge variant="success"&gt;{m.badge}&lt;/Badge&gt;                                                       |
| &lt;/label&gt;                                                                                               |
| ))}                                                                                                          |
| &lt;/div&gt;                                                                                                 |
| &lt;/div&gt;                                                                                                 |
|                                                                                                              |
| {isPro && (                                                                                                  |
| &lt;div&gt;                                                                                                  |
| &lt;p className="text-sm font-semibold text-tan mb-2"&gt;                                                    |
| Premium - Bring your own API key (Starter & Pro)                                                             |
| &lt;/p&gt;                                                                                                   |
| &lt;div className="space-y-2"&gt;                                                                            |
| {PRO_MODELS.map(m => (                                                                                       |
| <label key={m.key} className={\`flex items-center gap-3 p-3 rounded-xl border cursor-pointer                 |
| \${selected === m.key ? "border-gold bg-gold/5" : "border-tan/30"}\`}>                                       |
| <input type="radio" name="model" value={m.key}                                                               |
| checked={selected === m.key} onChange={() => setSelected(m.key)}/>                                           |
| &lt;span className="text-sm font-medium text-darkBrown"&gt;{m.label}&lt;/span&gt;                            |
| &lt;Badge variant="gold"&gt;{m.badge}&lt;/Badge&gt;                                                          |
| &lt;/label&gt;                                                                                               |
| ))}                                                                                                          |
| &lt;/div&gt;                                                                                                 |
|                                                                                                              |
| {needsClaude && (                                                                                            |
| <input type="password" placeholder="Anthropic API key (sk-ant-...)"                                          |
| value={claudeKey} onChange={e => setClaudeKey(e.target.value)}                                               |
| className="w-full mt-3 border border-tan rounded-xl px-4 py-3 text-sm"/>                                     |
| )}                                                                                                           |
| {needsOpenAI && (                                                                                            |
| <input type="password" placeholder="OpenAI API key (sk-...)"                                                 |
| value={openaiKey} onChange={e => setOpenaiKey(e.target.value)}                                               |
| className="w-full mt-3 border border-tan rounded-xl px-4 py-3 text-sm"/>                                     |
| )}                                                                                                           |
| &lt;/div&gt;                                                                                                 |
| )}                                                                                                           |
|                                                                                                              |
| &lt;button onClick={() =&gt; onSave(selected, claudeKey, openaiKey)}                                         |
| className="px-6 py-3 bg-gold text-espresso font-bold rounded-xl text-sm">                                    |
| Save Preference                                                                                              |
| &lt;/button&gt;                                                                                              |
| &lt;/div&gt;                                                                                                 |
| )                                                                                                            |
| }                                                                                                            |

## **20.4 Agent 6 - Code Generator Implementation**

| \# agents/code_generator.py                                                      |
| -------------------------------------------------------------------------------- |
| from lib.ai_client import nim_call_call, code_gen, qwen, kimi                    |
| import anthropic, os                                                             |
| from openai import AsyncOpenAI                                                   |
|                                                                                  |
| SYSTEM = """You are an expert HTML/CSS/JS developer.                             |
| Generate a COMPLETE functional small business website as THREE sections.         |
| Use EXACTLY these markers (no markdown, no explanation):                         |
| &lt;!-- index.html --&gt;                                                        |
| \[complete HTML\]                                                                |
| /\* style.css \*/                                                                |
| \[complete CSS\]                                                                 |
| // script.js                                                                     |
| \[complete JS\]                                                                  |
|                                                                                  |
| Requirements:                                                                    |
| \- No external dependencies                                                      |
| \- All CSS in style.css, all JS in script.js                                     |
| \- Fully responsive: @media (max-width:768px) and @media (max-width:480px)       |
| \- All touch targets minimum 44x44px                                             |
| \- Real business data everywhere - no Lorem Ipsum                                |
| \- font-size minimum 16px on inputs and body"""                                  |
|                                                                                  |
| async def run(bb: dict) -> str:                                                  |
| prompt = bb\["prompt"\]                                                          |
| model_key = bb.get("preferred_code_model", "github-copilot-gpt4o")               |
| claude_key = bb.get("user_claude_key") # decrypted from Supabase                 |
| openai_key = bb.get("user_openai_key") # decrypted from Supabase                 |
|                                                                                  |
| \# ── GitHub Copilot SDK (free plan) ──────────────────────────                  |
| if model_key.startswith("github-copilot"):                                       |
| copilot_model = {                                                                |
| "github-copilot-gpt4o": "gpt-4o",                                                |
| "github-copilot-gpt4.1": "gpt-4.1",                                              |
| "github-copilot-gpt5mini": "gpt-5-mini",                                         |
| }.get(model_key, "gpt-4o")                                                       |
| try:                                                                             |
| return await copilot_sdk_generate(prompt, SYSTEM, model=copilot_model)           |
| except Exception as e:                                                           |
| print(f"Copilot failed ({e}), falling back to NIM kimi-k2.6")                    |
| return await nim_call("moonshotai/kimi-k2.6", prompt, SYSTEM)                    |
|                                                                                  |
| \# ── Anthropic Claude (starter/pro) ───────────────────────────                 |
| if model_key.startswith("claude-") and claude_key:                               |
| model_map = {                                                                    |
| "claude-sonnet-4-6": "claude-sonnet-4-6",                                        |
| "claude-opus-4-6": "claude-opus-4-6",                                            |
| }                                                                                |
| client = anthropic.Anthropic(api_key=claude_key)                                 |
| r = client.messages.create(                                                      |
| model=model_map.get(model_key,"claude-sonnet-4-6"),                              |
| max_tokens=8192,                                                                 |
| system=SYSTEM,                                                                   |
| messages=\[{"role":"user","content":prompt}\]                                    |
| )                                                                                |
| return r.content\[0\].text                                                       |
|                                                                                  |
| \# ── OpenAI (starter/pro) ──────────────────────────────────────                |
| if model_key.startswith("openai-") and openai_key:                               |
| model_map = {                                                                    |
| "openai-gpt-5.2-codex": "gpt-5.2-codex",                                         |
| "openai-gpt-5.4": "gpt-5.4",                                                     |
| }                                                                                |
| client = AsyncOpenAI(api_key=openai_key)                                         |
| r = await client.chat.completions.create(                                        |
| model=model_map.get(model_key,"gpt-5.4"),                                        |
| max_tokens=8192,                                                                 |
| messages=\[{"role":"system","content":SYSTEM},{"role":"user","content":prompt}\] |
| )                                                                                |
| return r.choices\[0\].message.content                                            |
|                                                                                  |
| \# ── Default fallback: NIM kimi-k2.6 ──────────────────────────                 |
| return await nim_call("moonshotai/kimi-k2.6", prompt, SYSTEM)                    |

## **Step 20 Verification Checklist**

- Model picker UI renders free and pro tiers correctly
- Free users cannot see or select Claude/OpenAI models
- API key inputs appear only when Claude or OpenAI model is selected
- Copilot SDK generates complete HTML/CSS/JS with all three file markers
- Claude API route works when valid claude-sonnet-4-6 key provided
- Default fallback (kimi-k2.6 on NIM) fires when no key provided

PHASE 8 - AI AGENTS

**STEP 21**

**Agents 7-10 - Debugger, SEO, QA & Mobile Optimizer**

Completing the pipeline: RAG-enhanced debugging (Kimi K2.6), SEO injection (local), systematic QA (DeepSeek V4 Pro), and mobile optimization (local).

**⏱️ Time estimate: 3-4 hours | Difficulty: Medium**

Complete the verification checklist at the bottom before moving to the next step.

**📋 Prerequisites for this step**

Step 20 complete - Agent 6 generating code

## **21.1 Agent 7 - Debugger (Kimi K2.6 via NIM + RAG)**

**🔧 Model choice**

Kimi K2.6 on NVIDIA NIM. Tier A coding (87/100), 2.8x faster than alternatives. Debugging requires fast iteration - speed matters as much as accuracy here.

| \# agents/debugger.py                                                                  |
| -------------------------------------------------------------------------------------- |
| from lib.ai_client import nim_call                                                     |
| from rag.vector_store import hybrid_search                                             |
|                                                                                        |
| async def run(bb: dict) -> str:                                                        |
| code = bb\["raw_code"\]                                                                |
| issues = \[\]                                                                          |
| if "&lt;!-- index.html --&gt;" not in code: issues.append("missing index.html marker") |
| if "/\* style.css \*/" not in code: issues.append("missing style.css marker")          |
| if "// script.js" not in code: issues.append("missing script.js marker")               |
| if "Lorem Ipsum" in code: issues.append("contains placeholder text")                   |
|                                                                                        |
| rag_ctx = ""                                                                           |
| for issue in issues:                                                                   |
| docs = hybrid_search(issue)                                                            |
| rag_ctx += " ".join(docs\[:2\])                                                        |
|                                                                                        |
| system = """You are an expert HTML/CSS/JS debugger.                                    |
| Fix ALL issues. Return COMPLETE fixed code with all three file markers intact.         |
| After code add: // DEBUG_RESULT {"valid":true/false,"issuesFixed":\["list"\]}"""       |
|                                                                                        |
| prompt = f"""Issues detected: {issues}                                                 |
| Reference patterns: {rag_ctx}                                                          |
|                                                                                        |
| Code to fix:                                                                           |
| {code\[:10000\]}"""                                                                    |
|                                                                                        |
| result = await nim_call("moonshotai/kimi-k2.6", prompt, system)                        |
| bb\["raw_code"\] = None # prune                                                        |
| return result                                                                          |

## **21.2 Agent 8 - SEO Agent (Local qwen3:8b)**

| \# agents/seo_agent.py                                                                        |
| --------------------------------------------------------------------------------------------- |
| from lib.ai_client import qwen                                                                |
|                                                                                               |
| async def run(bb: dict) -> str:                                                               |
| bd = bb\["business_data"\]                                                                    |
| code = bb\["debugged_code"\]                                                                  |
|                                                                                               |
| system = """Inject SEO into HTML &lt;head&gt;. Do NOT modify CSS or JS sections.              |
| Add exactly: &lt;title&gt;, &lt;meta name=description&gt;, og:title, og:description, og:type, |
| JSON-LD LocalBusiness schema, viewport meta, descriptive alt attributes on all images.        |
| Return COMPLETE code with all three file markers intact."""                                   |
|                                                                                               |
| prompt = f"""Business: {bd.get("name")}, Type: {bd.get("type","")}                            |
| Address: {bd.get("address","")}, Phone: {bd.get("phone","")}                                  |
| Hours: {bd.get("hours","")}                                                                   |
|                                                                                               |
| Inject SEO into this site:                                                                    |
| {code\[:10000\]}"""                                                                           |
|                                                                                               |
| result = await qwen(prompt, system)                                                           |
| bb\["debugged_code"\] = None # prune                                                          |
| return result                                                                                 |

## **21.3 Agent 9 - QA Agent (DeepSeek V4 Pro via NIM + RAG)**

**🧠 Model choice**

DeepSeek V4 Pro on NVIDIA NIM. Leads all open-weight models on systematic agentic checking tasks. GLM-5.1 dropped to Tier C in coding benchmarks (46/100) - DeepSeek V4 Pro is the right call here.

| \# agents/qa_agent.py                                                                           |
| ----------------------------------------------------------------------------------------------- |
| from lib.ai_client import nim_call                                                              |
| from rag.vector_store import hybrid_search                                                      |
| import json                                                                                     |
|                                                                                                 |
| async def run(bb: dict) -> dict:                                                                |
| code = bb\["seo_code"\]                                                                         |
| bd = bb\["business_data"\]                                                                      |
| rag = hybrid_search("HTML CSS quality checklist mobile responsive", n=3)                        |
|                                                                                                 |
| system = """You are a QA engineer reviewing a generated website.                                |
| Check each item and return ONLY JSON:                                                           |
| {"approved":true/false,"issues":\["list of failures"\],"passedChecks":\["list passed"\]}"""     |
|                                                                                                 |
| prompt = f"""QA checklist:                                                                      |
| 1\. All three file markers present (&lt;!-- index.html --&gt;, /\* style.css \*/, // script.js) |
| 2\. Phone number "{bd.get("phone","")}" appears in HTML                                         |
| 3\. Business name "{bd.get("name","")}" in &lt;title&gt; tag                                    |
| 4\. @media (max-width:768px) present in CSS                                                     |
| 5\. @media (max-width:480px) present in CSS                                                     |
| 6\. No Lorem Ipsum text                                                                         |
| 7\. JSON-LD LocalBusiness schema in &lt;head&gt;                                                |
| 8\. meta description present                                                                    |
| 9\. All &lt;img&gt; tags have non-empty alt attributes                                          |
| 10\. No external CDN dependencies (no bootstrap.min.js, no jquery)                              |
|                                                                                                 |
| QA standards: {" ".join(rag)}                                                                   |
|                                                                                                 |
| Site code to check:                                                                             |
| {code\[:8000\]}"""                                                                              |
|                                                                                                 |
| response = await nim_call("deepseek-ai/deepseek-v4-pro", prompt, system)                        |
| result = json.loads(response.strip())                                                           |
| if result.get("approved"):                                                                      |
| bb\["qa_approved_code"\] = bb\["seo_code"\]                                                     |
| bb\["seo_code"\] = None # prune                                                                 |
| return result                                                                                   |

## **21.4 Agent 10 - Mobile Optimizer (Local qwen3:8b)**

| \# agents/mobile_optimizer.py                                                  |
| ------------------------------------------------------------------------------ |
| from lib.ai_client import qwen                                                 |
|                                                                                |
| CHECKS = """Audit and fix this website for mobile. Fix ALL of:                 |
| 1\. &lt;meta name="viewport" content="width=device-width, initial-scale=1"&gt; |
| 2\. Touch targets minimum 44x44px on all buttons and links                     |
| 3\. font-size minimum 16px on body, inputs (prevents iOS auto-zoom)            |
| 4\. No element wider than 100vw, no fixed px widths > 390px                    |
| 5\. 8px gap between interactive elements                                       |
| 6\. All img: max-width:100% height:auto                                        |
| 7\. Nav collapses to hamburger on mobile                                       |
| 8\. CTA button full-width on mobile (width:100%)                               |
| 9\. @media(max-width:768px) AND @media(max-width:480px) both present           |
| Return COMPLETE fixed code with all three file markers.                        |
| After code: // MOBILE_RESULT {"fixed":\["list of changes"\]}"""                |
|                                                                                |
| async def run(bb: dict) -> str:                                                |
| code = bb\["qa_approved_code"\]                                                |
| result = await qwen(f"{CHECKS}\\n\\nCode:\\n{code\[:10000\]}")                 |
| bb\["mobile_code"\] = result                                                   |
| bb\["qa_approved_code"\] = None # prune                                        |
| return result                                                                  |

## **21.5 Pipeline Orchestrator - Full 10-Agent Run**

| \# agents/pipeline.py                                                  |
| ---------------------------------------------------------------------- |
| import asyncio                                                         |
| from agents import (analyst, content_writer, style_agent, planner,     |
| prompt_engineer, code_generator, debugger,                             |
| seo_agent, qa_agent, mobile_optimizer, supervisor)                     |
|                                                                        |
| async def run_pipeline_job(bb: dict):                                  |
| """Entry point called by RQ worker."""                                 |
| try:                                                                   |
| await asyncio.wait_for(\_run(bb), timeout=300.0)                       |
| except asyncio.TimeoutError:                                           |
| bb\["phase"\] = "error"                                                |
| bb\["errors"\].append("Pipeline exceeded 5-minute timeout")            |
| await \_log_error(bb, "timeout")                                       |
| raise                                                                  |
|                                                                        |
| async def \_run(bb: dict):                                             |
|                                                                        |
| async def supervise(agent_fn, name, key=None):                         |
| bb\["active_agent"\] = name                                            |
| bb\["phase"\] = "running"                                              |
| for attempt in range(3):                                               |
| try:                                                                   |
| result = await agent_fn(bb)                                            |
| check = await supervisor.run(name, result, bb)                         |
| if check.get("approved"):                                              |
| if key: bb\[key\] = result                                             |
| return result                                                          |
| bb\["supervisor_correction"\] = check.get("correction")                |
| except Exception as e:                                                 |
| bb\["errors"\].append(f"{name} attempt {attempt+1}: {e}")              |
| raise RuntimeError(f"{name} failed after 3 attempts")                  |
|                                                                        |
| \# Agent 1                                                             |
| await supervise(analyst.run, "Business Analyst", key="analyst_output") |
|                                                                        |
| \# Agents 2+3 in parallel                                              |
| content, style = await asyncio.gather(                                 |
| content_writer.run(bb),                                                |
| style_agent.run(bb),                                                   |
| )                                                                      |
| bb\["content_output"\] = content                                       |
| bb\["style_output"\] = style                                           |
|                                                                        |
| \# Agents 4-10 sequential                                              |
| await supervise(planner.run, "Planner", key="blueprint")               |
| await supervise(prompt_engineer.run, "Prompt Engineer", key="prompt")  |
| await supervise(code_generator.run, "Code Generator", key="raw_code")  |
| await supervise(debugger.run, "Debugger", key="debugged_code")         |
| await supervise(seo_agent.run, "SEO Agent", key="seo_code")            |
| result = await qa_agent.run(bb)                                        |
| bb\["qa_result"\] = result                                             |
| if not result.get("approved"):                                         |
| raise RuntimeError(f"QA failed: {result.get('issues',\[\])}")          |
| await mobile_optimizer.run(bb)                                         |
|                                                                        |
| bb\["phase"\] = "done"                                                 |

## **Step 21 Verification Checklist**

- Agent 7 detects and fixes missing file markers in test code
- Agent 8 injects JSON-LD LocalBusiness schema into HTML head
- Agent 9 returns {"approved":true} for valid generated code
- Agent 9 returns {"approved":false,"issues":\[...\]} for code missing markers
- Agent 10 adds @media(max-width:480px) if missing
- Full pipeline runs end-to-end for a test plumbing business in under 60 seconds

PHASE 9 - DEPLOYMENT

**STEP 22**

**Deployment Pipeline - Parse, GitHub Backup & Cloudflare Pages**

The post-pipeline deployment chain: parsing the 3-file code output, backing up to the GitHub monorepo, deploying to Cloudflare Pages via Direct Upload, and sending the confirmation email.

**⏱️ Time estimate: 3-4 hours | Difficulty: High**

Complete the verification checklist at the bottom before moving to the next step.

**📋 Prerequisites for this step**

Step 21 complete - full pipeline running GitHub App installed on onara-sites repo

## **22.1 Code Parser**

| // lib/codeParser.js                                                                                           |
| -------------------------------------------------------------------------------------------------------------- |
| export function parseGeneratedCode(raw) {                                                                      |
| const htmlMatch = raw.match(/&lt;!--\\s\*index\\.html\\s\*--&gt;\[\\s\\S\]\*?(?=\\/\\\*\\s\*style\\.css\|\$)/) |
| const cssMatch = raw.match(/\\/\\\*\\s\*style\\.css\\s\*\\\*\\/\[\\s\\S\]\*?(?=\\/\\/\\s\*script\\.js\|\$)/)   |
| const jsMatch = raw.match(/\\/\\/\\s\*script\\.js\[\\s\\S\]\*/)                                                |
| if (!htmlMatch \| !cssMatch \| !jsMatch) {                                                                     |
| throw new Error("Generated code missing required file markers")                                                |
| }                                                                                                              |
| return {                                                                                                       |
| html: htmlMatch\[0\].replace(/&lt;!--\\s\*index\\.html\\s\*--&gt;/, "").trim(),                                |
| css: cssMatch\[0\].replace(/\\/\\\*\\s\*style\\.css\\s\*\\\*\\//, "").trim(),                                  |
| js: jsMatch\[0\].replace(/\\/\\/\\s\*script\\.js/, "").trim(),                                                 |
| }                                                                                                              |
| }                                                                                                              |

## **22.2 GitHub App Token Cache + Backup**

| // lib/githubBackup.js                                                                                       |
| ------------------------------------------------------------------------------------------------------------ |
| import jwt from "jsonwebtoken"                                                                               |
|                                                                                                              |
| let \_tokenCache = null                                                                                      |
| let \_tokenExpires = 0                                                                                       |
|                                                                                                              |
| async function getGitHubToken() {                                                                            |
| if (\_tokenCache && Date.now() < \_tokenExpires) return \_tokenCache                                         |
| const payload = {                                                                                            |
| iat: Math.floor(Date.now()/1000) - 60,                                                                       |
| exp: Math.floor(Date.now()/1000) + 540,                                                                      |
| iss: process.env.GITHUB_APP_ID,                                                                              |
| }                                                                                                            |
| const jwtToken = jwt.sign(payload, process.env.GITHUB_APP_PRIVATE_KEY, { algorithm:"RS256" })                |
| const res = await fetch(                                                                                     |
| \`<https://api.github.com/app/installations/\${process.env.GITHUB_APP_INSTALLATION_ID}/access_tokens\`>,     |
| { method:"POST", headers:{ Authorization:\`Bearer \${jwtToken}\`, Accept:"application/vnd.github+json" }}    |
| )                                                                                                            |
| const data = await res.json()                                                                                |
| \_tokenCache = data.token                                                                                    |
| \_tokenExpires = Date.now() + 50\*60\*1000 // 50 min                                                         |
| return \_tokenCache                                                                                          |
| }                                                                                                            |
|                                                                                                              |
| async function upsertFile(token, path, content) {                                                            |
| const url = \`<https://api.github.com/repos/\${process.env.GITHUB_USERNAME}/onara-sites/contents/\${path}\`> |
| const existing = await fetch(url, { headers:{ Authorization:\`token \${token}\` }})                          |
| const sha = existing.ok ? (await existing.json()).sha : null                                                 |
| await fetch(url, {                                                                                           |
| method: "PUT",                                                                                               |
| headers: { Authorization:\`token \${token}\`, "Content-Type":"application/json" },                           |
| body: JSON.stringify({                                                                                       |
| message: \`Update site \${path}\`,                                                                           |
| content: Buffer.from(content).toString("base64"),                                                            |
| ...(sha ? { sha } : {})                                                                                      |
| })                                                                                                           |
| })                                                                                                           |
| }                                                                                                            |
|                                                                                                              |
| export async function backupToGitHub(projectId, { html, css, js }) {                                         |
| const token = await getGitHubToken()                                                                         |
| const base = \`sites/\${projectId}\`                                                                         |
| await Promise.all(\[                                                                                         |
| upsertFile(token, \`\${base}/index.html\`, html),                                                            |
| upsertFile(token, \`\${base}/style.css\`, css),                                                              |
| upsertFile(token, \`\${base}/script.js\`, js),                                                               |
| \])                                                                                                          |
| }                                                                                                            |

## **22.3 Cloudflare Pages Direct Upload**

| // lib/cloudflarePages.js                                                                                  |
| ---------------------------------------------------------------------------------------------------------- |
| const CF = \`<https://api.cloudflare.com/client/v4/accounts/\${process.env.CLOUDFLARE_ACCOUNT_ID}/pages\`> |
| const headers = { Authorization: \`Bearer \${process.env.CLOUDFLARE_API_TOKEN}\` }                         |
|                                                                                                            |
| export async function deployToCloudflare(projectId, { html, css, js }) {                                   |
| const name = \`onara-\${projectId.slice(0,20)}\` // max 28 char subdomain                                  |
| // Create project (no-op if exists)                                                                        |
| await fetch(\`\${CF}/projects\`, {                                                                         |
| method: "POST",                                                                                            |
| headers: { ...headers, "Content-Type":"application/json" },                                                |
| body: JSON.stringify({ name, production_branch:"main" })                                                   |
| })                                                                                                         |
| // Direct upload                                                                                           |
| const form = new FormData()                                                                                |
| form.append("manifest", JSON.stringify({                                                                   |
| "/index.html": { hash: projectId.slice(0,8)+"0", size: html.length },                                      |
| "/style.css": { hash: projectId.slice(0,8)+"1", size: css.length },                                        |
| "/script.js": { hash: projectId.slice(0,8)+"2", size: js.length },                                         |
| }))                                                                                                        |
| form.append("/index.html", new Blob(\[html\], {type:"text/html"}), "index.html")                           |
| form.append("/style.css", new Blob(\[css\], {type:"text/css"}), "style.css")                               |
| form.append("/script.js", new Blob(\[js\], {type:"text/javascript"}), "script.js")                         |
| await fetch(\`\${CF}/projects/\${name}/deployments\`, { method:"POST", headers, body:form })               |
| return \`https://\${name}.pages.dev\`                                                                      |
| }                                                                                                          |

## **22.4 Full Deployment Orchestrator**

| // lib/deploymentOrchestrator.js                                                                            |
| ----------------------------------------------------------------------------------------------------------- |
| import { parseGeneratedCode } from "./codeParser"                                                           |
| import { backupToGitHub } from "./githubBackup"                                                             |
| import { deployToCloudflare } from "./cloudflarePages"                                                      |
| import { getServiceClient } from "./supabase"                                                               |
| import { Resend } from "resend"                                                                             |
|                                                                                                             |
| const resend = new Resend(process.env.RESEND_API_KEY)                                                       |
|                                                                                                             |
| export async function deployGeneratedSite({ jobId, userId, userEmail, mobileCode, plan }) {                 |
| const supabase = getServiceClient()                                                                         |
| const { html, css, js } = parseGeneratedCode(mobileCode)                                                    |
|                                                                                                             |
| // Run backup and deploy in parallel                                                                        |
| const \[cloudflareUrl\] = await Promise.all(\[                                                              |
| deployToCloudflare(jobId, { html, css, js }),                                                               |
| backupToGitHub(jobId, { html, css, js }),                                                                   |
| \])                                                                                                         |
|                                                                                                             |
| const showUrl = plan !== "free"                                                                             |
| const revisionsAllowed = plan === "pro" ? 9999 : plan === "starter" ? 10 : 3                                |
| const nextReset = new Date()                                                                                |
| nextReset.setMonth(nextReset.getMonth() + 1)                                                                |
|                                                                                                             |
| await supabase.from("projects").update({                                                                    |
| cloudflare_url: cloudflareUrl,                                                                              |
| status: "live",                                                                                             |
| show_url: showUrl,                                                                                          |
| revisions_allowed: revisionsAllowed,                                                                        |
| revisions_reset: nextReset.toISOString(),                                                                   |
| }).eq("project_id", jobId)                                                                                  |
|                                                                                                             |
| await resend.emails.send({                                                                                  |
| from: "Onara &lt;<noreply@mail.onara.tech>&gt;",                                                            |
| to: userEmail,                                                                                              |
| subject: "Your website is ready!",                                                                          |
| html: showUrl                                                                                               |
| ? \`&lt;p&gt;Your site is live at &lt;a href="\${cloudflareUrl}"&gt;\${cloudflareUrl}&lt;/a&gt;&lt;/p&gt;\` |
| : \`&lt;p&gt;Your site preview is ready in your Onara dashboard. Upgrade to go live.&lt;/p&gt;\`,           |
| })                                                                                                          |
|                                                                                                             |
| return { cloudflareUrl, showUrl }                                                                           |
| }                                                                                                           |

## **Step 22 Verification Checklist**

- parseGeneratedCode correctly extracts HTML, CSS, JS from sample code string
- GitHub App token caching works - second call reuses token without hitting GitHub
- backupToGitHub commits all three files to onara-sites/sites/{projectId}/
- deployToCloudflare returns a working .pages.dev URL
- Confirmation email sent via Resend with correct URL
- projects table updated: status=live, cloudflare_url set, show_url correct for plan

PHASE 9 - DEPLOYMENT

**STEP 23**

**Revision System - Incremental Updates & Partial Re-run**

Implementing the revision flow: detecting what changed, running only agents 5-10 on revision requests, checking revision limits, and deploying the updated site to the same Cloudflare URL.

**⏱️ Time estimate: 2-3 hours | Difficulty: Medium**

Complete the verification checklist at the bottom before moving to the next step.

**📋 Prerequisites for this step**

Step 22 complete - full deployment working

## **23.1 Revision vs Full Generation**

**🔄 How revisions work**

A revision request skips Agents 1-4 (no need to re-analyse the business or re-plan). The user describes what to change. The change description goes into Agent 5 (Prompt Engineer) which rewrites the generation prompt incorporating the change. Agents 6-10 run as normal. The result deploys to the SAME Cloudflare Pages project - same URL, updated content.

## **23.2 Revision Route - /api/sites**

| // app/api/sites/route.js - add revision handling                                         |
| ----------------------------------------------------------------------------------------- |
|                                                                                           |
| export async function POST(req) {                                                         |
| const user = await getUserFromRequest(req)                                                |
| if (!user) return NextResponse.json({ error:"Unauthorized" }, { status:401 })             |
|                                                                                           |
| const supabase = getServiceClient()                                                       |
| const body = await req.json()                                                             |
| const { businessData, placeId, stylePrefs, revisionOf } = body                            |
|                                                                                           |
| // If revisionOf provided: check revision limits                                          |
| if (revisionOf) {                                                                         |
| const { data: project } = await supabase                                                  |
| .from("projects")                                                                         |
| .select("revisions_used, revisions_allowed, blueprint")                                   |
| .eq("project_id", revisionOf)                                                             |
| .eq("user_id", user.id)                                                                   |
| .single()                                                                                 |
|                                                                                           |
| if (!project) return NextResponse.json({ error:"Project not found" }, { status:404 })     |
|                                                                                           |
| if (project.revisions_used >= project.revisions_allowed) {                                |
| return NextResponse.json({                                                                |
| error: "Revision limit reached",                                                          |
| revisionsUsed: project.revisions_used,                                                    |
| revisionsAllowed: project.revisions_allowed,                                              |
| }, { status:429 })                                                                        |
| }                                                                                         |
|                                                                                           |
| // Increment revision count                                                               |
| await supabase.from("projects")                                                           |
| .update({ revisions_used: project.revisions_used + 1 })                                   |
| .eq("project_id", revisionOf)                                                             |
| }                                                                                         |
|                                                                                           |
| const jobId = require("crypto").randomBytes(16).toString("hex")                           |
|                                                                                           |
| // Forward to FastAPI                                                                     |
| const pipelineRes = await fetch(\`\${process.env.PIPELINE_SERVER_URL}/pipeline/start\`, { |
| method: "POST",                                                                           |
| headers: {                                                                                |
| "Content-Type": "application/json",                                                       |
| "x-pipeline-secret": process.env.PIPELINE_SECRET,                                         |
| },                                                                                        |
| body: JSON.stringify({                                                                    |
| jobId,                                                                                    |
| userId: user.id,                                                                          |
| businessData,                                                                             |
| placeId,                                                                                  |
| stylePrefs,                                                                               |
| revisionOf: revisionOf \| null,                                                           |
| // Pass user's preferred model and decrypted keys                                         |
| preferredCodeModel: body.preferredCodeModel,                                              |
| }),                                                                                       |
| })                                                                                        |
|                                                                                           |
| const pipelineData = await pipelineRes.json()                                             |
|                                                                                           |
| // Create or update project record                                                        |
| if (!revisionOf) {                                                                        |
| await supabase.from("projects").insert({                                                  |
| user_id: user.id,                                                                         |
| project_id: jobId,                                                                        |
| business_name: businessData.name,                                                         |
| google_place_id: placeId,                                                                 |
| status: "queued",                                                                         |
| style_prefs: stylePrefs,                                                                  |
| })                                                                                        |
| }                                                                                         |
|                                                                                           |
| return NextResponse.json({ jobId, queuePosition: pipelineData.queuePosition })            |
| }                                                                                         |

## **Step 23 Verification Checklist**

- Revision with 0 revisions used: succeeds, revisions_used increments to 1
- Revision at limit (e.g., 3/3 on free plan): returns 429 with error message
- Revision deploys to same Cloudflare Pages URL - not a new URL
- "Revise" button on SiteCard shows updated count after revision

PHASE 10 - MONETIZATION

**STEP 24**

**Stripe Billing - Checkout, Webhooks, Trials & Downgrade**

Implementing the full billing cycle: Stripe Checkout sessions, webhook processing, 14-day Pro trial, automatic trial downgrade, monthly revision reset, and plan-gated feature enforcement.

**⏱️ Time estimate: 4-5 hours | Difficulty: High**

Complete the verification checklist at the bottom before moving to the next step.

**📋 Prerequisites for this step**

Step 6 complete - Supabase edge functions scaffolded Stripe CLI installed and logged in

## **24.1 Checkout Route**

| // app/api/stripe/route.js                                                    |
| ----------------------------------------------------------------------------- |
| import { NextResponse } from "next/server"                                    |
| import Stripe from "stripe"                                                   |
| import { getUserFromRequest, getServiceClient } from "@/lib/supabase"         |
|                                                                               |
| const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)                      |
|                                                                               |
| export async function POST(req) {                                             |
| const user = await getUserFromRequest(req)                                    |
| if (!user) return NextResponse.json({ error:"Unauthorized" }, { status:401 }) |
|                                                                               |
| const { plan } = await req.json()                                             |
| const priceId = plan === "pro"                                                |
| ? process.env.STRIPE_PRO_PRICE_ID                                             |
| : process.env.STRIPE_STARTER_PRICE_ID                                         |
|                                                                               |
| const session = await stripe.checkout.sessions.create({                       |
| mode: "subscription",                                                         |
| line_items: \[{ price: priceId, quantity: 1 }\],                              |
| success_url: \`\${process.env.NEXT_PUBLIC_APP_URL}/dashboard?upgraded=true\`, |
| cancel_url: \`\${process.env.NEXT_PUBLIC_APP_URL}/dashboard/account\`,        |
| customer_email: user.email,                                                   |
| metadata: { userId: user.id, plan },                                          |
| subscription_data: {                                                          |
| trial_period_days: 14, // 14-day free trial before charging                   |
| }                                                                             |
| })                                                                            |
|                                                                               |
| return NextResponse.json({ url: session.url })                                |
| }                                                                             |

## **24.2 Webhook Handler**

| // app/api/webhooks/stripe/route.js                                                      |
| ---------------------------------------------------------------------------------------- |
| import { NextResponse } from "next/server"                                               |
| import Stripe from "stripe"                                                              |
| import { getServiceClient } from "@/lib/supabase"                                        |
|                                                                                          |
| const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)                                 |
|                                                                                          |
| export async function POST(req) {                                                        |
| const body = await req.text()                                                            |
| const sig = req.headers.get("stripe-signature")                                          |
| let event                                                                                |
| try {                                                                                    |
| event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)     |
| } catch {                                                                                |
| return NextResponse.json({ error:"Invalid signature" }, { status:400 })                  |
| }                                                                                        |
|                                                                                          |
| const supabase = getServiceClient()                                                      |
|                                                                                          |
| if (event.type === "checkout.session.completed") {                                       |
| const { userId, plan } = event.data.object.metadata                                      |
| const revisionsAllowed = plan === "pro" ? 9999 : 10                                      |
| await supabase.from("users").update({                                                    |
| plan,                                                                                    |
| sub_status: "active",                                                                    |
| stripe_customer_id: event.data.object.customer,                                          |
| stripe_sub_id: event.data.object.subscription,                                           |
| is_trial: false,                                                                         |
| }).eq("id", userId)                                                                      |
| await supabase.from("projects")                                                          |
| .update({ show_url:true, revisions_allowed:revisionsAllowed })                           |
| .eq("user_id", userId)                                                                   |
| }                                                                                        |
|                                                                                          |
| if (\["customer.subscription.deleted","invoice.payment_failed"\].includes(event.type)) { |
| const customerId = event.data.object.customer                                            |
| const { data: user } = await supabase.from("users")                                      |
| .select("id").eq("stripe_customer_id", customerId).single()                              |
| if (user) {                                                                              |
| await supabase.from("users")                                                             |
| .update({ plan:"free", sub_status:"inactive" }).eq("id", user.id)                        |
| await supabase.from("projects")                                                          |
| .update({ show_url:false, revisions_allowed:3 }).eq("user_id", user.id)                  |
| }                                                                                        |
| }                                                                                        |
|                                                                                          |
| return NextResponse.json({ received:true })                                              |
| }                                                                                        |

## **24.3 Supabase Edge Functions**

| // supabase/functions/downgrade-trials/index.ts                                             |
| ------------------------------------------------------------------------------------------- |
| import { createClient } from "<https://esm.sh/@supabase/supabase-js@2>"                     |
|                                                                                             |
| Deno.serve(async () => {                                                                    |
| const s = createClient(Deno.env.get("SUPABASE_URL")!,                                       |
| Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!)                                                 |
| const { data: expired } = await s.from("users")                                             |
| .select("id").eq("is_trial",true).lt("trial_ends_at", new Date().toISOString())             |
| for (const u of expired \| \[\]) {                                                          |
| await s.from("users").update({ plan:"free", is_trial:false }).eq("id",u.id)                 |
| await s.from("projects").update({ show_url:false, revisions_allowed:3 }).eq("user_id",u.id) |
| }                                                                                           |
| return new Response(JSON.stringify({ downgraded: expired?.length\|0 }))                     |
| })                                                                                          |
|                                                                                             |
| // supabase/functions/reset-revisions/index.ts                                              |
| Deno.serve(async () => {                                                                    |
| const s = createClient(Deno.env.get("SUPABASE_URL")!,                                       |
| Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!)                                                 |
| const now = new Date().toISOString()                                                        |
| const { data: projects } = await s.from("projects")                                         |
| .select("id,user_id").lt("revisions_reset", now)                                            |
| for (const p of projects \| \[\]) {                                                         |
| const next = new Date(); next.setMonth(next.getMonth()+1)                                   |
| await s.from("projects")                                                                    |
| .update({ revisions_used:0, revisions_reset:next.toISOString() }).eq("id",p.id)             |
| }                                                                                           |
| return new Response(JSON.stringify({ reset: projects?.length\|0 }))                         |
| })                                                                                          |

| \# Deploy edge functions                                                                     |
| -------------------------------------------------------------------------------------------- |
| supabase functions deploy downgrade-trials                                                   |
| supabase functions deploy reset-revisions                                                    |
| supabase functions deploy stripe-webhook                                                     |
|                                                                                              |
| \# Add Stripe webhook endpoint:                                                              |
| \# Stripe Dashboard > Developers > Webhooks > Add Endpoint                                   |
| \# URL: <https://your-project.supabase.co/functions/v1/stripe-webhook>                       |
| \# Events: checkout.session.completed, customer.subscription.deleted, invoice.payment_failed |
|                                                                                              |
| \# Test webhooks locally:                                                                    |
| stripe listen --forward-to localhost:3000/api/webhooks/stripe                                |

## **Step 24 Verification Checklist**

- Clicking Upgrade redirects to Stripe Checkout for both Starter and Pro
- After test payment: user plan updates in Supabase, show_url=true for all projects
- Subscription cancelled: plan=free, show_url=false for all projects
- downgrade-trials edge function deployed and tested
- reset-revisions edge function deployed and tested
- Stripe webhook signature validation rejects requests without correct signature

PHASE 10 - MONETIZATION

**STEP 25**

**My Sites Dashboard - Plan Gating, Revisions & Account Page**

Finalising the dashboard experience: plan badges, upgrade CTAs, revision tracking, account settings with model picker, and the billing portal.

**⏱️ Time estimate: 2-3 hours | Difficulty: Medium**

Complete the verification checklist at the bottom before moving to the next step.

**📋 Prerequisites for this step**

Step 24 complete - billing working

## **25.1 Account Page**

| // app/dashboard/account/page.jsx                                                                          |
| ---------------------------------------------------------------------------------------------------------- |
| "use client"                                                                                               |
| import { useEffect, useState } from "react"                                                                |
| import { supabase } from "@/lib/supabase"                                                                  |
| import Card from "@/components/Card"                                                                       |
| import Badge from "@/components/Badge"                                                                     |
| import Button from "@/components/Button"                                                                   |
| import ModelPicker from "@/components/ModelPicker"                                                         |
|                                                                                                            |
| export default function AccountPage() {                                                                    |
| const \[user, setUser\] = useState(null)                                                                   |
| const \[loading, setLoading\] = useState(true)                                                             |
|                                                                                                            |
| useEffect(() => {                                                                                          |
| async function load() {                                                                                    |
| const { data:{ user: authUser } } = await supabase.auth.getUser()                                          |
| const { data } = await supabase                                                                            |
| .from("users").select("\*").eq("id", authUser.id).single()                                                 |
| setUser(data)                                                                                              |
| setLoading(false)                                                                                          |
| }                                                                                                          |
| load()                                                                                                     |
| }, \[\])                                                                                                   |
|                                                                                                            |
| async function openBillingPortal() {                                                                       |
| const res = await fetch("/api/stripe/portal")                                                              |
| const data = await res.json()                                                                              |
| window.open(data.url, "\_blank")                                                                           |
| }                                                                                                          |
|                                                                                                            |
| if (loading \| !user) return &lt;div className="text-tan"&gt;Loading...&lt;/div&gt;                        |
|                                                                                                            |
| const planColors = { free:"default", starter:"gold", pro:"pro" }                                           |
|                                                                                                            |
| return (                                                                                                   |
| &lt;div className="max-w-xl space-y-6"&gt;                                                                 |
| &lt;h1 className="text-2xl font-bold text-espresso"&gt;Account&lt;/h1&gt;                                  |
|                                                                                                            |
| &lt;Card border&gt;                                                                                        |
| &lt;div className="flex items-center justify-between mb-4"&gt;                                             |
| &lt;h2 className="font-bold text-espresso"&gt;Plan&lt;/h2&gt;                                              |
| &lt;Badge variant={planColors\[user.plan\]}&gt;{user.plan.toUpperCase()}&lt;/Badge&gt;                     |
| &lt;/div&gt;                                                                                               |
| &lt;p className="text-sm text-tan mb-4"&gt;{user.email}&lt;/p&gt;                                          |
| {user.is_trial && (                                                                                        |
| &lt;p className="text-sm text-gold mb-4"&gt;                                                               |
| ✨ Pro trial active - expires {new Date(user.trial_ends_at).toLocaleDateString()}                          |
| &lt;/p&gt;                                                                                                 |
| )}                                                                                                         |
| {user.plan === "free" && !user.is_trial && (                                                               |
| &lt;div className="space-y-2"&gt;                                                                          |
| &lt;a href="/api/stripe?plan=starter"&gt;                                                                  |
| &lt;Button variant="gold" className="w-full"&gt;Upgrade to Starter - \$12/mo&lt;/Button&gt;                |
| &lt;/a&gt;                                                                                                 |
| &lt;a href="/api/stripe?plan=pro"&gt;                                                                      |
| &lt;Button variant="espresso" className="w-full"&gt;Upgrade to Pro - \$29/mo&lt;/Button&gt;                |
| &lt;/a&gt;                                                                                                 |
| &lt;/div&gt;                                                                                               |
| )}                                                                                                         |
| {user.sub_status === "active" && (                                                                         |
| &lt;Button variant="outline" onClick={openBillingPortal}&gt;                                               |
| Manage Billing                                                                                             |
| &lt;/Button&gt;                                                                                            |
| )}                                                                                                         |
| &lt;/Card&gt;                                                                                              |
|                                                                                                            |
| &lt;Card border&gt;                                                                                        |
| &lt;h2 className="font-bold text-espresso mb-4"&gt;Referral&lt;/h2&gt;                                     |
| &lt;p className="text-sm text-tan mb-2"&gt;Share your link and earn 1 month free per signup:&lt;/p&gt;     |
| &lt;div className="flex gap-2"&gt;                                                                         |
| <input readOnly value={\`<https://onara.tech/signup?ref=\${user.referral_code}\`}>                         |
| className="flex-1 border border-tan rounded-xl px-3 py-2 text-sm bg-cream"/>                               |
| <Button variant="gold" className="text-xs"                                                                 |
| onClick={() => navigator.clipboard.writeText(\`<https://onara.tech/signup?ref=\${user.referral_code}\`)}>> |
| Copy                                                                                                       |
| &lt;/Button&gt;                                                                                            |
| &lt;/div&gt;                                                                                               |
| &lt;/Card&gt;                                                                                              |
|                                                                                                            |
| &lt;Card border&gt;                                                                                        |
| <ModelPicker user={user} currentModel={user.preferred_code_model}                                          |
| onSave={async (model, claudeKey, openaiKey) => {                                                           |
| await supabase.from("users")                                                                               |
| .update({ preferred_code_model: model }).eq("id", user.id)                                                 |
| alert("Model preference saved!")                                                                           |
| }}                                                                                                         |
| />                                                                                                         |
| &lt;/Card&gt;                                                                                              |
| &lt;/div&gt;                                                                                               |
| )                                                                                                          |
| }                                                                                                          |

## **Step 25 Verification Checklist**

- Account page shows correct plan badge and email
- Trial expiry date displays correctly for trial users
- Free users see upgrade buttons; paid users see Manage Billing
- Referral link copies to clipboard
- Model picker saves preference to Supabase and persists on refresh

PHASE 11 - RETENTION

**STEP 26**

**Retention Features - GBP Sync, Review Badge & Seasonal SEO**

Building the retention mechanisms that keep users paying month-over-month: monthly Google Business data sync, live review badge, and seasonal SEO updates.

**⏱️ Time estimate: 4-5 hours | Difficulty: Medium-High**

Complete the verification checklist at the bottom before moving to the next step.

**📋 Prerequisites for this step**

Step 25 complete google_place_id stored in projects table from Step 5

## **26.1 Why Retention is Architecture**

The businesses that churn after month 1 are those who feel their website is "done." The businesses that stay are those where Onara keeps delivering value. Three mechanisms deliver monthly value automatically - with zero extra work from the user.

## **26.2 Monthly GBP Sync - /api/sites/sync**

| // app/api/sites/sync/route.js                                                             |
| ------------------------------------------------------------------------------------------ |
| // Called by Supabase pg_cron weekly, or manually by user                                  |
|                                                                                            |
| import { NextResponse } from "next/server"                                                 |
| import { getUserFromRequest, getServiceClient } from "@/lib/supabase"                      |
|                                                                                            |
| export async function POST(req) {                                                          |
| const user = await getUserFromRequest(req)                                                 |
| const supabase = getServiceClient()                                                        |
| const { projectId } = await req.json()                                                     |
|                                                                                            |
| const { data: project } = await supabase                                                   |
| .from("projects").select("\*").eq("project_id", projectId).eq("user_id", user.id).single() |
|                                                                                            |
| if (!project?.google_place_id) {                                                           |
| return NextResponse.json({ synced:false, reason:"No Google Place ID stored" })             |
| }                                                                                          |
|                                                                                            |
| // Re-fetch from Google Places                                                             |
| const res = await fetch(\`/api/places/details?placeId=\${project.google_place_id}\`,       |
| { headers: req.headers })                                                                  |
| const latest = await res.json()                                                            |
|                                                                                            |
| const changes = \[\]                                                                       |
| if (latest.hours !== JSON.stringify(project.business_hours)) changes.push("hours")         |
| if (latest.phone !== project.business_phone) changes.push("phone")                         |
| if (latest.address !== project.business_address) changes.push("address")                   |
|                                                                                            |
| if (changes.length > 0) {                                                                  |
| // Update project with new data                                                            |
| await supabase.from("projects").update({                                                   |
| business_hours: latest.hours,                                                              |
| business_phone: latest.phone,                                                              |
| business_address: latest.address,                                                          |
| last_synced: new Date().toISOString(),                                                     |
| }).eq("project_id", projectId)                                                             |
|                                                                                            |
| // Notify user of changes                                                                  |
| return NextResponse.json({ synced:true, changes })                                         |
| }                                                                                          |
|                                                                                            |
| await supabase.from("projects")                                                            |
| .update({ last_synced: new Date().toISOString() }).eq("project_id", projectId)             |
| return NextResponse.json({ synced:true, changes:\[\] })                                    |
| }                                                                                          |

## **26.3 Sync Notification in Dashboard**

When a sync detects changes, show a notification in My Sites with a "Update Website" button that triggers a revision with the new data pre-filled.

| // In SiteCard.jsx - add sync status notification                                 |
| --------------------------------------------------------------------------------- |
| {site.last_synced && site.has_pending_changes && (                                |
| &lt;div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-xl"&gt; |
| &lt;p className="text-xs text-yellow-800 font-semibold mb-1"&gt;                  |
| 📍 Your Google listing changed                                                    |
| &lt;/p&gt;                                                                        |
| &lt;p className="text-xs text-yellow-700 mb-2"&gt;                                |
| Hours or address updated - keep your website in sync.                             |
| &lt;/p&gt;                                                                        |
| <a href={\`/dashboard/build?revision=\${site.project_id}&autosync=true\`}         |
| className="text-xs bg-yellow-600 text-white px-3 py-1.5 rounded-lg font-medium">  |
| Update Website                                                                    |
| &lt;/a&gt;                                                                        |
| &lt;/div&gt;                                                                      |
| )}                                                                                |

## **Step 26 Verification Checklist**

- Sync route fetches fresh data from Google Places using stored place_id
- Changes detected and returned in the response
- last_synced updates on every call
- SiteCard shows sync notification when changes detected

PHASE 11 - RETENTION

**STEP 27**

**Architecture Hardening - Production-Grade Reliability**

All 11 hardening improvements: Redis crash recovery, Copilot timeouts, blackboard pruning, deduplication, token caching, smarter exceptions, ChromaDB persistence, prompts to files, error logging, and rate limiting.

**⏱️ Time estimate: Implement before first paying user | Difficulty: High**

Complete the verification checklist at the bottom before moving to the next step.

| **Fix**                                     | **When**                 | **Effort**                             |
| ------------------------------------------- | ------------------------ | -------------------------------------- |
| Redis queue - crash recovery                | Before first paying user | ~1 hour (Step 15 already covers this)  |
| Copilot SDK timeout (asyncio.wait_for 30s)  | Before launch            | ~15 mins                               |
| Blackboard pruning (None after consumption) | Before launch            | ~30 mins (Step 21 already covers this) |
| Global 5-min job timeout                    | Before launch            | ~5 mins (Step 15 already covers this)  |
| Smarter cloud exceptions (429 vs 500)       | After first 50 users     | ~1 hour                                |
| ChromaDB PersistentClient                   | Before launch            | ~15 mins (Step 17 already covers this) |
| Request deduplication                       | Before launch            | ~30 mins (Step 15 already covers this) |
| GitHub App token caching (50-min TTL)       | Before launch            | ~20 mins (Step 22 already covers this) |
| Prompts to files (prompts/\*.txt)           | When iterating prompts   | ~1 hour                                |
| Supabase error logging (pipeline_errors)    | After first paying user  | ~45 mins                               |
| Per-user rate limiting (slowapi 10/hour)    | After first 100 users    | ~30 mins (Step 15 covers this)         |

**✅ Most hardening already implemented**

Steps 15, 17, 21, and 22 implement items 1, 3, 4, 6, 7, 8, and 11. The remaining items (2, 5, 9, 10) are below.

## **27.1 Copilot SDK Timeout**

| \# lib/copilot_client.py - add timeout wrapper                                          |
| --------------------------------------------------------------------------------------- |
| import asyncio                                                                          |
|                                                                                         |
| async def copilot_sdk_generate(prompt: str, system: str, model: str = "gpt-4o") -> str: |
| try:                                                                                    |
| return await asyncio.wait_for(                                                          |
| \_copilot_call(prompt, system, model),                                                  |
| timeout=30.0                                                                            |
| )                                                                                       |
| except asyncio.TimeoutError:                                                            |
| raise RuntimeError("Copilot SDK timed out after 30s - try a different model")           |

## **27.2 Smarter Cloud Exception Handling**

| \# lib/ai_client.py - update nim_call() function                      |
| --------------------------------------------------------------------- |
| import httpx                                                          |
|                                                                       |
| async def nim_call(model: str, prompt: str, system: str = "") -> str: |
| messages = \[\]                                                       |
| if system: messages.append({"role":"system","content":system})        |
| messages.append({"role":"user","content":prompt})                     |
| for attempt in range(2):                                              |
| try:                                                                  |
| r = await nim_client.chat.completions.create(                         |
| model=model, messages=messages, max_tokens=8192)                      |
| return r.choices\[0\].message.content                                 |
| except Exception as e:                                                |
| status = getattr(getattr(e,"response",None),"status_code",None)       |
| if status == 429:                                                     |
| \# Rate limited - wait then retry once                                |
| await asyncio.sleep(15)                                               |
| continue                                                              |
| \# Any other error - fall back to local immediately                   |
| print(f"NIM error ({model}, status={status}): {e}")                   |
| return await local("llama3.3:8b", prompt, system)                     |
| \# After retry still rate-limited - fall back to local                |
| return await local("llama3.3:8b", prompt, system)                     |

## **27.3 Prompts to Files**

| \# lib/prompt_loader.py                                                       |
| ----------------------------------------------------------------------------- |
| import os                                                                     |
|                                                                               |
| \_cache = {}                                                                  |
|                                                                               |
| def load(name: str) -> str:                                                   |
| """Load prompt from prompts/{name}.txt. Cached after first read."""           |
| if name not in \_cache:                                                       |
| path = os.path.join(os.path.dirname(\__file_\_), "../prompts", f"{name}.txt") |
| with open(path) as f:                                                         |
| \_cache\[name\] = f.read()                                                    |
| return \_cache\[name\]                                                        |
|                                                                               |
| \# Create prompts/ directory and move all SYSTEM strings there                |
| \# prompts/analyst.txt, prompts/planner.txt, etc.                             |
| \# Usage in any agent: from lib.prompt_loader import load                     |
| \# SYSTEM = load("analyst")                                                   |

## **27.4 Error Logging to Supabase**

| \# agents/pipeline.py - add error logger                          |
| ----------------------------------------------------------------- |
| import httpx, json, os                                            |
|                                                                   |
| async def \_log_error(bb: dict, error: str):                      |
| """Log failed job to pipeline_errors table for debugging."""      |
| try:                                                              |
| slim_bb = {k:v for k,v in bb.items()                              |
| if k not in ("raw_code","debugged_code","seo_code","mobile_code") |
| and v is not None}                                                |
| async with httpx.AsyncClient() as client:                         |
| await client.post(                                                |
| f"{os.getenv('SUPABASE_URL')}/rest/v1/pipeline_errors",           |
| headers={                                                         |
| "apikey": os.getenv("SUPABASE_SECRET_KEY"),                       |
| "Authorization": f"Bearer {os.getenv('SUPABASE_SECRET_KEY')}",    |
| "Content-Type": "application/json",                               |
| },                                                                |
| json={                                                            |
| "job_id": bb\["job_id"\],                                         |
| "user_id": bb.get("user_id"),                                     |
| "phase": bb\["phase"\],                                           |
| "active_agent": bb\["active_agent"\],                             |
| "error": error,                                                   |
| "blackboard": json.dumps(slim_bb),                                |
| }                                                                 |
| )                                                                 |
| except Exception:                                                 |
| pass # Never let logging crash the error handler                  |

PHASE 12 - LAUNCH

**STEP 28**

**Pre-Launch - Legal Pages, Monitoring, Analytics & Security Audit**

Everything needed before accepting real users: Terms of Service, Privacy Policy, UptimeRobot monitoring, Vercel Analytics, and the complete security checklist.

**⏱️ Time estimate: 2-3 days | Difficulty: Medium**

Complete the verification checklist at the bottom before moving to the next step.

**📋 Prerequisites for this step**

Steps 1-27 complete onara.tech DNS propagated through Cloudflare

## **28.1 Legal Pages**

Both pages are required before any paying user. Generate them with termly.io or privacypolicies.com and customise for Onara's specific data practices.

- Terms: describe the AI-generated nature of sites, no guarantee of accuracy, subscription terms, cancellation policy, limitation of liability for Cloudflare downtime
- Privacy: data collected (email, Google Business data), third parties (Supabase, Stripe, Cloudflare, GitHub, Resend, Google, NVIDIA NIM, Moonshot API, DeepSeek API), data retention, GDPR rights, cookie usage

## **28.2 UptimeRobot Monitoring**

- Go to uptimerobot.com. Create free account.
- Add monitor: HTTP(S), URL: <https://pipeline.onara.tech/health>. Interval: 5 minutes.
- Add monitor: HTTP(S), URL: <https://onara.tech>. Interval: 5 minutes.
- Alert contacts: your email and phone (SMS).

## **28.3 Vercel Analytics**

| // app/layout.jsx - add Analytics                   |
| --------------------------------------------------- |
| import { Analytics } from "@vercel/analytics/react" |
|                                                     |
| export default function RootLayout({ children }) {  |
| return (                                            |
| &lt;html&gt;&lt;body&gt;                            |
| {children}                                          |
| &lt;Analytics /&gt;                                 |
| &lt;/body&gt;&lt;/html&gt;                          |
| )                                                   |
| }                                                   |

## **28.4 Security Final Checklist**

**🚨 CRITICAL**

Run every item before your first real user. Each represents a real breach vector.

- RLS enabled on ALL Supabase tables - green shield icon on each
- SUPABASE*SECRET_KEY never in any NEXT_PUBLIC* variable
- Stripe webhook signature verified with constructEvent before processing
- All user inputs (especially stylePrefs.extra) sanitized before passing to agents
- Project ownership verified on every API route that touches a project
- PIPELINE_SECRET is a random 64-char hex - not a dictionary word
- All .env and .env.local files in .gitignore - run: git ls-files --error-unmatch .env.local (should error)
- Cloudflare named tunnel active - pipeline URL never changes
- NVIDIA NIM API key not hardcoded anywhere - only in .env

PHASE 12 - LAUNCH

**STEP 29**

**Distribution - Cold Outbound, Facebook Groups & Partnerships**

Getting your first 20 paying customers before any public launch using the three channels that work for local service businesses: GBP cold outbound, niche Facebook groups, and accountant partnerships.

**⏱️ Time estimate: Ongoing - start week 1 | Difficulty: Low tech, high effort**

Complete the verification checklist at the bottom before moving to the next step.

## **29.1 Cold Outbound - GBP Listings Without Websites**

You already built this list in Step 0. 50 contractors in your city with no website. This is your warmest possible outbound - they literally have a documented problem you can solve.

- Go to Google Maps. Search your target trade in your city (e.g. "plumber Austin TX").
- Click each listing. If there's no website link - add them to your outbound list.
- Find their phone number on the listing. Call (not email) between 9-11am. Script:

| "Hi, is this \[Business Name\]? Great - I noticed you don't have a website yet.  |
| -------------------------------------------------------------------------------- |
| I built a tool that creates professional contractor websites in about 60 seconds |
| using your Google listing. It's free to try - do you have 2 minutes for me to    |
| show you what it builds for your business right now?"                            |
|                                                                                  |
| If yes: screen share, enter their business name, show the result live.           |
| If no: "Can I send you the link? You can try it yourself for free."              |

## **29.2 Facebook Groups**

- Join: "\[City\] Plumbers", "\[City\] Contractors", "\[Trade\] Business Owners \[State\]"
- Read for 2 weeks before posting. Note language used for website problems.
- Post genuine story - not an ad. Example:

| "I built something for contractors who need a website but don't have time.     |
| ------------------------------------------------------------------------------ |
| It imports your Google listing and generates a full professional site in under |
| a minute. No forms to fill out, no templates to pick. Just enter your business |
| name. Trying it for free: onara.tech. Would love feedback from this group."    |

## **29.3 Accountant Partnerships**

Local accountants who serve small contractors are trusted advisors to their clients. One accountant with 50 contractor clients can replace months of cold outbound.

- Find 5 local accountants who advertise contractor bookkeeping on Google.
- Call or email: "I built a tool that gives your contractor clients a professional website in under a minute using their Google listing. I'd love to partner - I'll give you \$20/month for every client who stays active. Can I show you a 5-minute demo?"
- If they agree: give them a referral link (?ref=accountantname) and track conversions.

## **Step 29 Verification Checklist**

- 50+ GBP listings without websites identified and in leads table
- First 10 cold calls completed - note objections and update pitch
- Posted in at least 3 Facebook groups - note engagement
- At least 2 accountant conversations started
- First paying customer signed up - ask for a video testimonial

PHASE 12 - LAUNCH

**STEP 30**

**Launch Week - Soft Launch, Product Hunt & First-Week Metrics**

The complete launch sequence: soft launch with 20 real users, collecting testimonials and fixing critical bugs, then the public launch via Product Hunt and community channels.

**⏱️ Time estimate: 2 weeks | Difficulty: High - this is the most important step**

Complete the verification checklist at the bottom before moving to the next step.

## **30.1 Week Before Launch - Soft Launch**

- Reach out personally to 20 small business owners from your outbound list. Offer the first month free in exchange for honest feedback and a 60-second video testimonial.
- Walk each person through the product on a video call. Record the session with their permission. Watch exactly where they get confused - those are your highest-priority UX fixes.
- Generate 10+ example sites for different contractor types (plumber, electrician, HVAC, landscaper, general contractor). These go on the Examples section.
- Collect at least 3 video testimonials showing real contractors with their real generated sites.
- Fix the top 3 UX issues identified in the calls before public launch.

## **30.2 Product Hunt Launch**

- Schedule the submission for Tuesday or Wednesday at 12:01 AM Pacific.
- Tagline: "Your contractor website, live in 60 seconds - powered by AI, zero coding."
- 4-5 screenshots: Google import, 10-agent progress, live site preview, pricing, mobile view.
- 60-second demo video showing a real generation from start to finish.
- Line up 25+ people to upvote at launch time.

## **30.3 First-Week Metrics**

| **Metric**              | **Definition**                                   | **Target**   |
| ----------------------- | ------------------------------------------------ | ------------ |
| Signup rate             | % of landing page visitors who sign up           | \> 5%        |
| Generation rate         | % of signups who generate a site                 | \> 60%       |
| Trial-to-paid rate      | % of trials that convert                         | \> 4%        |
| Pipeline success rate   | % of generations completing without error        | \> 95%       |
| Average generation time | Seconds from click to preview                    | < 60 seconds |
| Week-1 retention        | % of users who log in again in week 1            | \> 40%       |
| NPS                     | Would you recommend Onara to another contractor? | \> 50        |

## **30.4 Distribution Channels - Launch Day**

- Product Hunt - the main event
- r/smallbusiness - genuine story post, not an ad
- r/entrepreneur and r/sidehustle
- AI tool directories: There's An AI For That, Futurepedia
- Local contractor Facebook groups - show the real product
- TikTok and Instagram Reels - 60-second generation demo
- "How I built this" post on dev.to and Hacker News (Show HN)

**🎯 The brutal truth about getting from 6.5 to 10**

The difference between a 6.5 and a 10 is rarely the product - it's whether people find it and whether they stay. 1. Niche specificity beats general polish. "The website builder for contractors" travels in a way "AI website builder" never does. 2. Retention is architecture. Build the GBP sync, the review badge, the seasonal SEO updates into v1. If users can cancel after month 1 and lose nothing, they will. 3. Speed is the product. Under 60 seconds from "enter business name" to live site is your entire value proposition. Every architecture decision should be evaluated against this benchmark. 4. Distribution over product. Get 20 paying customers in one niche, learn why they stay or leave, then scale what works. That feedback loop is the only real path from 6.5 to 10.

## **Step 30 Verification Checklist**

- 20 soft launch users have generated sites and given feedback
- Top 3 UX issues fixed from soft launch calls
- 3+ video testimonials collected
- 10+ example sites in the Examples section
- Product Hunt listing ready and scheduled
- UptimeRobot monitoring both URLs
- Stripe billing tested end-to-end with a real payment
- Pipeline running under 60 seconds for simple contractor sites

# **Appendix: Quick Reference**

## **Final Model Stack - All NIM + Plan-Gated Picker**

| **Agent**                   | **Model**                                     | **Where**                | **Why**                                                    |
| --------------------------- | --------------------------------------------- | ------------------------ | ---------------------------------------------------------- |
| 1 - Business Analyst        | deepseek-ai/deepseek-v4-flash                 | NVIDIA NIM (free)        | Tier B, fast, sufficient for JSON classification           |
| 2 - Content Writer          | qwen3:8b                                      | Local PC (free)          | Best under-8B instruction following                        |
| 3 - Style Agent             | qwen3:8b                                      | Local PC (free)          | Good structured JSON, runs in parallel with Agent 2        |
| 4 - Planner                 | deepseek-ai/deepseek-v4-pro                   | NVIDIA NIM (free)        | #1 agentic structured output, GDPval-AA score 1554         |
| 5 - Prompt Engineer         | moonshotai/kimi-k2.6                          | NVIDIA NIM (free)        | Tier A coding (87/100), 2.8x faster than alternatives      |
| 6 - Code Gen (Free plan)    | moonshotai/kimi-k2.6                          | NVIDIA NIM (free)        | Best open-source HTML/CSS/JS. Tier A. Beats GPT-5.2-Codex. |
| 6 - Code Gen (Starter plan) | Copilot SDK: gpt-5.2-codex / gpt-4.1 / gpt-4o | GitHub Copilot (student) | Included models - zero premium requests consumed           |
| 6 - Code Gen (Pro plan)     | Claude Sonnet/Opus OR GPT-5.4                 | Anthropic / OpenAI API   | User provides their own API key in Account settings        |
| 7 - Debugger                | moonshotai/kimi-k2.6                          | NVIDIA NIM (free)        | Tier A, 2.8x faster - speed matters for iterative fixes    |
| 8 - SEO Agent               | qwen3:8b                                      | Local PC (free)          | Simple structured HTML injection, no cloud needed          |
| 9 - QA Agent                | deepseek-ai/deepseek-v4-pro                   | NVIDIA NIM (free)        | Leads systematic agentic checking tasks                    |
| 10 - Mobile Optimizer       | qwen3:8b                                      | Local PC (free)          | Fast structured CSS/HTML fixes, no cloud needed            |
| Supervisor                  | llama3.3:8b                                   | Local PC (free)          | Fastest local model, minimal latency between agents        |
| All cloud fallbacks         | llama3.3:8b                                   | Local PC (free)          | Auto-fires on any NIM error or rate limit                  |

## **Master Environment Variables**

| **Variable**                         | **Used In**              | **Where to Get It**                        |
| ------------------------------------ | ------------------------ | ------------------------------------------ |
| NEXT_PUBLIC_SUPABASE_URL             | Next.js (frontend)       | Supabase Project Settings > API            |
| NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY | Next.js (frontend)       | Supabase Project Settings > API            |
| SUPABASE_SECRET_KEY                  | Next.js API routes only  | Supabase Project Settings > API            |
| PIPELINE_SERVER_URL                  | Next.js → FastAPI        | Cloudflare named tunnel URL                |
| PIPELINE_SECRET                      | Auth between services    | crypto.randomBytes(32).toString("hex")     |
| NEXT_PUBLIC_APP_URL                  | Stripe redirects         | <https://onara.tech> or Vercel preview URL |
| GOOGLE_PLACES_API_KEY                | Next.js /api/places      | Google Cloud Console > Credentials         |
| GOOGLE_OAUTH_CLIENT_ID               | Supabase OAuth config    | Google Cloud Console > Credentials         |
| GOOGLE_OAUTH_CLIENT_SECRET           | Supabase OAuth config    | Google Cloud Console > Credentials         |
| GITHUB_USERNAME                      | Next.js GitHub backup    | Your personal GitHub username              |
| GITHUB_APP_ID                        | FastAPI + Next.js        | GitHub App settings page                   |
| GITHUB_APP_INSTALLATION_ID           | FastAPI + Next.js        | URL after installing GitHub App            |
| GITHUB_APP_PRIVATE_KEY               | FastAPI + Next.js        | Generated .pem file from GitHub App        |
| COPILOT_GITHUB_TOKEN                 | FastAPI Copilot SDK      | Fine-grained PAT, Copilot Read only        |
| CLOUDFLARE_ACCOUNT_ID                | Next.js deployment       | Cloudflare dashboard URL                   |
| CLOUDFLARE_API_TOKEN                 | Next.js deployment       | Cloudflare > My Profile > API Tokens       |
| STRIPE_SECRET_KEY                    | Next.js billing          | Stripe Dashboard > Developers > API Keys   |
| STRIPE_WEBHOOK_SECRET                | Webhook verification     | Stripe Dashboard > Webhooks                |
| STRIPE_STARTER_PRICE_ID              | Checkout sessions        | Stripe Products > Starter price            |
| STRIPE_PRO_PRICE_ID                  | Checkout sessions        | Stripe Products > Pro price                |
| RESEND_API_KEY                       | Email sending            | Resend Dashboard > API Keys                |
| NVIDIA_NIM_API_KEY                   | FastAPI all cloud agents | build.nvidia.com > API Keys                |
| OLLAMA_LOCAL_URL                     | FastAPI → PC Ollama      | http://YOUR_PC_IP:11434                    |

## **NVIDIA NIM Models Used**

| **NIM Model ID**              | **Agent**                | **Benchmark**                                                        |
| ----------------------------- | ------------------------ | -------------------------------------------------------------------- |
| deepseek-ai/deepseek-v4-flash | Agent 1 Business Analyst | Tier B coding, \$0.01/run                                            |
| deepseek-ai/deepseek-v4-pro   | Agents 4+9               | #1 agentic tasks GDPval-AA score 1554                                |
| moonshotai/kimi-k2.6          | Agents 5+6+7             | Tier A coding 87/100, 80.2% SWE-bench, 2.8x faster than alternatives |
| llama3.3:8b                   | Fallback for all cloud   | Local on PC, free, ~7B params                                        |
| qwen3:8b                      | Local agents 2,3,8,10    | Best under-8B instruction following                                  |

## **Key Architecture Decisions**

| **Decision**      | **Choice**                       | **Reason**                                          |
| ----------------- | -------------------------------- | --------------------------------------------------- |
| Pipeline queue    | Redis + RQ (not asyncio)         | Survives server restart, jobs persist               |
| ChromaDB          | PersistentClient (not in-memory) | Survives restart, shareable across workers          |
| GitHub deploys    | GitHub App (not PAT)             | Scoped to onara-sites only, auto token rotation     |
| Cloudflare tunnel | Named tunnel (not quick)         | Stable URL, survives mini PC restart                |
| Ollama placement  | PC (not mini PC)                 | Isolates compute from server processes              |
| Cloud AI          | NVIDIA NIM (not vendor APIs)     | One API key, 80+ models, free tier                  |
| Agent 6 primary   | Kimi K2.6 on NIM                 | Tier A frontend (87/100), beats GPT-5.2-Codex, free |
| RLS policy        | Enabled on all tables            | Prevents cross-user data access                     |
| Job timeout       | 5 minutes hard limit             | Prevents queue blocking from stuck agents           |