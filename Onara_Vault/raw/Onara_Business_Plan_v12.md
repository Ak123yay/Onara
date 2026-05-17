**Onara**

Business Plan & Complete Technical Architecture

_Draft v11 Final -- Confidential_

# **0\. What Is Onara -- Read This First**

Onara is an AI-powered website builder for small business owners. The owner enters their Google Business name and within 60-120 seconds a complete professional website is generated and deployed. No code, no design decisions, no technical knowledge required.

The site is hosted by Onara. Paid users get a live public URL. Free users get a dashboard preview only. Revision limits reset every month. Cancel and the public URL disappears but the preview remains.

## **How It Works**

- Owner enters their Google Business name

_How this works: The user types their business name (e.g. "Mike's Pizza Austin TX") into a text input. Onara sends this string to the Google Places Text Search API which returns the best matching business listing. The user sees a confirmation card showing their real name, address, phone, hours, and a photo pulled directly from Google Maps. Any missing fields (e.g. no phone number on file) are highlighted in amber with an editable input so the user can fill them in manually. The user clicks Confirm and Continue -- this is the only required input before generation begins._

- Onara fetches real info from Google Maps automatically
- 10 AI agents run on a FastAPI server (your PC at launch, DigitalOcean later) -- each with one job
- Backend handles all deployment steps after the agents finish
- Site appears as a preview in the dashboard
- Paid users get a live shareable public URL
- Monthly revision limits reset each billing cycle

## **Key Terms**

- Agent: a single AI program with one specific job. We use 10 in sequence.
- FastAPI: Python web framework hosting the entire AI pipeline with no timeout limits. Runs on your PC at launch, migrates to DigitalOcean when you need 24/7 reliability.
- Next.js: React framework for the frontend and lightweight backend API routes. Deployed to Vercel.
- Supabase edge functions: serverless functions that run close to the Supabase database. Used for billing and revision reset logic.
- Ollama: runs local 8B AI models on the DigitalOcean server. Free.
- NVIDIA NIM: larger cloud-hosted models accessed via API. Used for harder reasoning tasks.
- GitHub Copilot SDK: generates the actual website code. Free via GitHub Education.
- Supabase: PostgreSQL database plus Google OAuth, storage buckets, and edge functions.
- Supabase buckets: file storage for generated site assets and code backups.
- Vercel: hosts the Onara Next.js app and backend API routes. Free hobby tier -- Next.js is open source and deploys freely on Vercel free tier.
- Cloudflare Pages: hosts all user-generated sites. Completely free with no commercial restrictions. Unlimited sites, unlimited bandwidth, 500 builds/month. Much safer than Vercel for user sites due to no DDoS billing risk. Each generated site gets a free {projectId}.pages.dev subdomain -- this is NOT the same as onara.tech. onara.tech is your app domain (points to Vercel). The .pages.dev subdomains are free URLs given to each user's generated site by Cloudflare.
- DigitalOcean Droplet: a virtual server running 24/7. Hosts the FastAPI pipeline server and Ollama.
- RAG: Retrieval-Augmented Generation. Gives agents access to a searchable knowledge base of HTML/CSS/JS patterns.
- Vector database: stores documentation as searchable embeddings. Used for RAG in the Debugger and QA agents.
- Stripe: subscription billing and payment processing.
- bcrypt: scrambles passwords before storing so they cannot be read if stolen.
- RLS: Row Level Security. Supabase database-level protection so users can only access their own rows.
- Google OAuth: sign in with Google. No password needed. Supabase handles the entire flow.

# **1\. Business Overview**

## **Mission**

Make a professional website achievable for every small business owner by starting with what they already have on Google.

## **The Problem**

Most small business owners have no website. Every existing builder makes you start from scratch -- describe your business, drag things around, write your own copy. Onara imports your Google Business Profile and builds the entire site automatically. No decisions required from the user beyond confirming their info.

## **Positioning Statement**

Built for business owners, not builders. The only website generator that starts with your Google Business Profile, not a blank page.

## **Current Stage**

Pre-launch. Architecture fully defined. Development not yet begun. This document is the single source of truth for all product, business, and technical decisions.

## **What Onara Is Not**

Onara is B2C, not B2B. It sells directly to individual small business owners as end consumers, not to companies as a business tool. This matters for marketing: small business owners respond to emotional appeal, social proof, and low-friction signups -- not enterprise demos or ROI spreadsheets.

Onara does NOT use LangChain or LangGraph. The 10-agent pipeline is built in custom Python on FastAPI with a manual Blackboard pattern. LangChain and LangGraph add abstraction layers that are useful when building complex multi-step agentic workflows where you do not control the underlying infrastructure. Since we control the entire pipeline, FastAPI + Ollama client + custom blackboard is simpler, faster to debug, and has no additional dependencies. If the pipeline grows significantly more complex in v2, LangGraph could be reconsidered.

# **2\. Target Market**

## **Primary**

Small business owners in service industries without a website: plumbers, cleaners, food trucks, photographers, tutors, caterers, landscapers. No technical skills. Need a site for advertising and contact info. Want it done fast with no effort.

## **Secondary**

Developers and power users who want AI-generated scaffolds. Pro users can download the generated code. Not the core revenue target but validate the product and generate word of mouth.

# **3\. Competitive Positioning**

- Lovable / Bolt.new / Base44: target developers, \$20-200/month, credit-based, no Google import, no small business focus
- Wix / Squarespace: drag-and-drop, \$16-17/month, no AI generation, requires significant user effort
- Onara: Free preview (14-day Pro trial) / \$12/month / \$29/month, Google Business import, 10-agent AI pipeline, zero user effort, FastAPI pipeline with no timeout

_Note: No competitor imports Google Business Profile as a core onboarding flow. This is the primary differentiator._

# **4\. Pricing**

## **Free Tier**

- 1 website
- 3 revisions per month -- resets on the 1st of each month
- Embedded dashboard preview only -- no public URL
- Onara branding in footer

_Note: Free tier is a trial. Goal is to let users see their finished site and want to publish it._

## **Reverse Trial -- Recommended Launch Strategy**

Every new signup gets 14 days of full Pro access automatically with no credit card required. After 14 days they drop to the free tier. This is called a reverse trial and converts at 4-12% vs 2-5% for standard free tiers. Users who experience the live URL and all Pro features first feel the loss when those disappear. Loss aversion is a stronger motivator than feature discovery.

- Day 0: User signs up, immediately gets full Pro access for 14 days
- Day 11: Automated email -- Your Pro trial ends in 3 days. Keep your live site online.
- Day 13: Final email -- Tomorrow your live URL goes offline unless you upgrade.
- Day 14: Plan drops to free. show_url set to false. Dashboard shows upgrade prompt.
- Implementation: trial_ends_at and is_trial columns in users table. Supabase edge function checks daily and downgrades expired trials.

_Note: Reverse trials work especially well for Onara because the core value -- a live public URL -- disappears on downgrade. Users who have shared their link with customers will feel real urgency to keep it._

## **Starter -- \$12/month**

- 1 website
- 10 revisions per month -- resets on billing anniversary
- Live public URL
- Custom domain support
- No footer branding

## **Pro -- \$29/month**

- 3 websites
- Unlimited revisions
- Live public URLs for all sites
- Custom domain support
- No footer branding
- Code download as zip
- Priority generation queue

## **One-Time Options**

- Full year Starter: \$99 flat (saves \$45)
- Custom domain connection: \$10 add-on
- Manual human revision: \$20 upsell

## **On Cancellation or Payment Failure**

On cancellation or payment failure, the Cloudflare Pages deployment is deleted and replaced with a placeholder page. The URL still resolves but shows a suspension notice. On resubscription, the real site is redeployed from the Supabase storage bucket backup. The URL changes on each redeployment cycle -- this is intentional and expected.

_Note: The dashboard iframe always works because it calls a protected backend route, not the public Cloudflare URL directly. The backend serves the correct content based on the user plan._

_Note: Revision limits reset monthly. Billing anniversary for paid plans. 1st of month for free tier. Reset is handled by a Supabase edge function._

# **5\. Revenue & Costs**

## **Revenue Estimates**

- 100 users, 10% Starter: \$120/month
- 500 users, 10% Starter, 3% Pro: \$1,035/month
- 1,000 users, 10% Starter, 5% Pro: \$2,070/month

## **Monthly Infrastructure Costs**

- Pipeline server at launch: \$0 -- runs on your PC with Cloudflare Tunnel for public access (free, persistent URL, no session timeouts)
- Run Cloudflare Tunnel: cloudflared tunnel --url <http://localhost:8000> -- copy the generated URL into PIPELINE_SERVER_URL
- DigitalOcean Droplet (when you migrate): ~\$12-24/month depending on RAM (4-8GB recommended)
- Vercel: free hobby tier for Onara Next.js app and backend -- no Pro needed
- Cloudflare Pages: free for all user-generated sites -- unlimited sites and bandwidth, no commercial restriction
- Google Places API: free up to 5,000 requests/month
- GitHub Copilot SDK: free via GitHub Education
- Ollama local models: free, runs on DigitalOcean
- NVIDIA NIM models: free plan with rate limits resetting every 5 hours
- Supabase: free tier, Pro at \$25/month if needed
- Resend: free tier, 3,000 emails/month
- Stripe: 2.9% + \$0.30 per transaction, no monthly fee
- Estimated fixed costs at launch: \$0/month -- all infrastructure is free at this stage

_Note: At launch your infrastructure costs nothing. When you migrate to DigitalOcean the only fixed cost is \$12-24/month. At just 2 paying Starter users the Droplet pays for itself._

# **6\. Risks & Mitigations**

- Google Places API changes: manual fallback form built robustly so the product works without import
- Copilot output malformed: retry once with simplified prompt, then return clean error. No revision deducted on failure.
- Agent failure: each agent retries up to 2 times. User sees which agent failed with a retry button.
- Pipeline server down (PC or Droplet): PM2 auto-restarts on crash. UptimeRobot monitors the /health endpoint. On PC, ensure power settings prevent sleep. On Droplet, use systemd with restart=always.
- NVIDIA NIM rate limits hit: agents wait 10 seconds and retry once on 429. If still failing, fall back to local model.
- Stripe payment failure: after 3 retries over 7 days, plan set to free and show_url to false. User notified by email.
- Wix copies Google import: speed to market. v2 hands-off maintenance becomes the deeper moat.

# **7\. Product Roadmap**

## **v1 -- Launch**

- Google Business Profile import with manual fallback
- 10-agent AI pipeline on DigitalOcean FastAPI
- Backend handles all deployment: GitHub backup commit, Cloudflare Pages Direct Upload, Supabase save, Resend email
- Next.js frontend with serverless API routes on Vercel
- Supabase edge functions for billing events and revision resets
- Supabase storage buckets for generated code backups
- RAG vector database for Debugger and QA agents
- Google OAuth as primary login, email/password as fallback
- Free preview tier, Starter and Pro paid tiers
- Monthly revision limits with automatic reset
- Reverse trial: 14 days full Pro for all new signups, automated downgrade via Supabase edge function
- In-memory queue with position indicator for concurrent users

## **v1.5 -- Queue Upgrade (When Needed)**

When average wait time exceeds 5 minutes, upgrade to BullMQ with Redis for persistent job queuing. Add second DigitalOcean Droplet and load balance between them.

## **v2 -- Hands-Off Maintenance**

Owner sends a plain-language update by email or message. Agents detect which atomic components changed, regenerate only those components, recommit the updated files to the GitHub monorepo, redeploy to Cloudflare Pages, and send the owner a confirmation email. Because of atomic component generation from v1, only the affected component reruns -- changing a phone number only touches the contact component. Token usage drops 60-80% vs regenerating the full site.

- Supported update types: change phone, update hours, add a service, change address, update hero text
- Agent 1 and 4 blueprint is fixed -- only agents 5-9 rerun for the affected component
- Redeployment via Cloudflare Direct Upload -- same project, new deployment
- Owner receives email: We updated your site. Here is what changed.

## **v2.5 -- Strategic Moats**

**Moat 1: Google Sync**

Continuously sync with the user Google Business Profile. When the owner updates their hours or phone number on Google Maps, Onara detects the change via periodic polling (every 24 hours) and automatically updates the corresponding component on their website. Redeploys to Cloudflare Pages silently. Owner gets a notification email: We updated your site with your new hours. This makes Onara indispensable -- the website becomes a live reflection of their Google presence.

**Moat 2: Visual Style DNA**

Enhance Agent 3 (Style Agent) to analyze photos from the Google Business Profile using a vision model. Extract the dominant color palette, logo style, and visual tone from real business images. The generated site feels instantly personalized to the specific business rather than using a generic industry palette. A taco truck with a bright red and yellow logo gets a site that matches. A law firm with a grey and navy office gets dark professional tones.

- Vision model: llama4:scout or qwen2.5vl via Ollama (both support image input)
- Input: business photo URLs from Google Places photos array
- Output: { dominantColors: \[\], logoStyle: 'bold/minimal/vintage', tone: 'energetic/professional/warm' }
- Feeds directly into Agent 3 style output alongside industry defaults

**Moat 3: Instant SEO Landing Pages**

Automatically generate niche-specific location-based landing pages for each user site. A plumber in Austin gets a page at their site's URL /austin-plumber that targets Best Plumber in Austin TX. Generated by the SEO Agent using the business data and location. Deployed as additional pages in the Cloudflare Pages project. Drives organic traffic directly to the user business without them doing anything.

## **v3 -- Future**

- Custom domain connection via Cloudflare API -- add CNAME record pointing to the Pages deployment
- SEO scoring dashboard
- Site analytics
- White-label for agencies

# **8\. Full Architecture Overview**

## **The Three-Layer Stack**

Onara uses three layers that each handle what they are best at. At launch the FastAPI pipeline server runs on your personal PC. When you need reliability or are away from your machine, migrate to a DigitalOcean Droplet -- the code and setup are identical.

**Layer 1: Next.js on Vercel (Stateless, Fast)**

- Serves the React frontend to users
- Handles stateless API routes: auth, site status polling, account management, Stripe webhooks, preview URL serving
- Deployed to Vercel free hobby tier -- Next.js is open source, no Pro required
- Cannot handle long-running tasks -- 60 second timeout limit
- Vercel free tier is sufficient for all Onara app traffic at launch scale

**Layer 2: FastAPI Pipeline Server (Your PC at Launch, DigitalOcean Later)**

- Runs the entire 10-agent AI pipeline with no timeout
- Hosts Ollama with local 8B models loaded in memory
- Calls NVIDIA NIM for harder agents
- Calls GitHub Copilot SDK for code generation
- Pipeline results returned to Next.js which then handles deployment
- At launch: runs on your PC. Expose to the internet using Cloudflare Tunnel (preferred over Cloudflare Tunnel -- free, no session timeout, no bandwidth limits, persistent URL). Command: cloudflared tunnel --url <http://localhost:8000>
- Cloudflare Tunnel gives a stable permanent URL vs Cloudflare Tunnel free tier which resets the URL every restart
- When ready to migrate: identical setup on a DigitalOcean Droplet. Change PIPELINE_SERVER_URL in .env and you are done.
- Python + FastAPI chosen because Ollama Python client is first-class

**Layer 3: Supabase (Database + Auth + Storage + Edge)**

- PostgreSQL database for users and projects
- Google OAuth and email/password auth
- RLS protecting all rows at database level
- Storage buckets for generated code backups and site assets
- Edge functions for billing events (Stripe webhook processing) and monthly revision resets
- Edge functions run close to the database -- minimal latency for writes

## **Infrastructure-as-Code for Cloudflare Pages**

As user sites grow, managing hundreds of Cloudflare Pages projects manually becomes impractical. Use Terraform or Pulumi to define and manage projects, custom domain associations, and DNS records declaratively. IaC is integrated into the backend workflow so every site creation, update, and deletion is version-controlled and consistent.

- Terraform provider: cloudflare/cloudflare -- manages Pages projects and DNS
- Each user site is a Terraform resource created at deployment time
- Plan downgrades and account deletions trigger Terraform destroy for the relevant resources

_Note: IaC is a v1.5 upgrade. At launch, call the Cloudflare API directly. Add Terraform when you have more than 50 active sites._

## **Request Flow**

- User clicks Generate in the Next.js frontend
- Next.js API route receives request, validates session, forwards to FastAPI pipeline server
- FastAPI adds job to in-memory queue, returns job ID immediately
- Next.js returns job ID to frontend -- request ends in under 1 second
- Frontend opens a Server-Sent Events connection to the Next.js stream route using the job ID -- receives real-time push updates as each agent completes
- This replaces polling -- one persistent connection instead of a request every 3 seconds

_Note: SSE fallback: if the connection drops, frontend reopens it and receives current status immediately. Status endpoint kept as a fallback for browsers that do not support SSE._

- FastAPI server (PC or Droplet) runs the 10-agent pipeline -- no timeout pressure
- Pipeline completes, FastAPI notifies Next.js with the validated code
- Next.js backend handles deployment: GitHub monorepo backup commit, Cloudflare Pages Direct Upload deployment, Supabase record save, Resend email
- Status route returns completed state with iframeUrl and publicUrl
- Frontend loads preview page

# **9\. Prerequisites -- Before Writing Any Code**

## **Accounts to Create**

- GitHub -- personal development account
- GitHub App ("Onara Deployer") -- created under your personal account. Scoped to the onara-sites repo only. Replaces the old deploy account PAT approach. See Section 9 Prerequisites for setup steps.
- GitHub Education -- education.github.com -- student email, gets Copilot free
- Supabase -- supabase.com -- create project called onara
- Vercel -- vercel.com -- free tier, link personal GitHub account
- DigitalOcean -- digitalocean.com -- create account now but do not provision a Droplet yet. Use your PC for the pipeline server at launch.
- Cloudflare -- cloudflare.com -- free account. Install cloudflared CLI to create a persistent tunnel to your local FastAPI server. Install on your mini PC (this is where FastAPI runs -- the tunnel exposes the mini PC to the internet). Preferred over Cloudflare Tunnel: no session timeouts, no URL resets, no bandwidth limits on free tier.

_Note: Install cloudflared: brew install cloudflare/cloudflare/cloudflared (Mac) or download from cloudflare.com/products/tunnel. Run: cloudflared tunnel --url <http://localhost:8000>_

- Stripe -- stripe.com -- create account
- Google Cloud -- console.cloud.google.com -- create project onara, enable Places API, create Places API key, create OAuth 2.0 Client ID
- Cloudflare -- cloudflare.com -- create account. Enable Cloudflare Pages in the dashboard. Generate an API token with Cloudflare Pages:Edit permission.
- Ollama -- ollama.com -- create account for cloud model API key
- Resend -- resend.com -- free tier

## **Tools to Install Locally**

Two-machine dev setup: PC runs Ollama local models only (qwen3:8b, llama3.3:8b). Mini PC runs everything else: Next.js, FastAPI pipeline server, Stripe CLI, Cloudflare tunnel. FastAPI on the mini PC connects to Ollama on the PC via local network IP (e.g. <http://192.168.1.45:11434>). Set OLLAMA_LOCAL_URL in the pipeline .env to your PC's local IP.

- Node.js v22+ -- nodejs.org
- Python 3.11+ -- python.org
- Git -- git-scm.com
- VS Code -- code.visualstudio.com

## **Tools to Install on Your PC (Pipeline Server at Launch)**

- Python 3.11+ -- python.org
- Ollama -- ollama.com/download -- install for your OS
- Pull local models: ollama pull qwen3:8b && ollama pull llama3.3:8b
- FastAPI and dependencies: pip install fastapi uvicorn ollama httpx chromadb sentence-transformers
- Cloudflare Tunnel -- Cloudflare Tunnel.com -- to expose your local server: Cloudflare Tunnel http 8000

# **10\. Project Folder Structure**

## **Next.js App (Frontend + Serverless Routes)**

onara-app/ Next.js project

app/

page.jsx landing page

login/page.jsx login page

signup/page.jsx signup page

dashboard/

page.jsx dashboard wrapper

build/page.jsx 4-step build flow

sites/page.jsx My Sites grid

preview/\[id\]/page.jsx preview + iframe

account/page.jsx account settings

api/

auth/route.js signup, login, logout, forgot-password

oauth/google/route.js triggers Google OAuth

sites/route.js generate (forwards to DO), status, preview, delete

places/route.js Google Places search

account/route.js email, password, delete account

stripe/route.js checkout, portal

webhooks/stripe/route.js Stripe webhook handler

components/

Sidebar.jsx left navigation

AgentProgress.jsx 10-agent live progress view

QueuePosition.jsx queue waiting screen

SiteCard.jsx card in My Sites grid

Toast.jsx notification toasts

StepIndicator.jsx 4-step progress bar

lib/

supabase.js Supabase anon client

api.js fetch helpers to backend routes

.env.local Next.js env vars

## **FastAPI Pipeline Server (DigitalOcean)**

onara-pipeline/ Python FastAPI project

main.py FastAPI entry point, queue logic

agents/

analyst.py Agent 1: Business Analyst

content_writer.py Agent 2: Content Writer

style_agent.py Agent 3: Style Agent

planner.py Agent 4: Planner

prompt_engineer.py Agent 5: Prompt Engineer

code_generator.py Agent 6: GitHub Copilot SDK

debugger.py Agent 7: Debugger (RAG enabled)

seo_agent.py Agent 8: SEO Agent

qa_agent.py Agent 9: QA Agent (RAG enabled)

mobile_optimizer.py Agent 10: Mobile Optimization

rag/

vector_store.py vector database setup and search

embedder.py embeds docs into vector store

docs/ HTML/CSS/JS pattern documentation

lib/

ollama_client.py wrapper for local and cloud Ollama calls

copilot_client.py GitHub Copilot SDK wrapper

.env pipeline server secrets

requirements.txt Python dependencies

## **Supabase Edge Functions**

supabase/functions/

stripe-webhook/index.ts processes Stripe events, updates user plan

reset-revisions/index.ts monthly revision count reset job

# **11\. Local Development Setup**

## **Next.js Frontend**

git clone <https://github.com/your-username/onara-app.git>

cd onara-app && npm install

npm run dev

Runs on <http://localhost:3000>

## **FastAPI Pipeline Server**

git clone <https://github.com/your-username/onara-pipeline.git>

cd onara-pipeline

pip install -r requirements.txt

uvicorn main:app --reload --port 8000

Runs on <http://localhost:8000>

## **Ollama Local**

ollama serve

ollama pull qwen3:8b && ollama pull llama3.3:8b

ollama pull llama3.3:8b

_Note: Keep ollama serve running in a separate terminal. Cloud models need no pull._

## **Supabase**

Run the schema from Section 17 in the Supabase SQL editor. Enable Google OAuth in Supabase Authentication > Providers > Google.

## **Stripe Webhooks**

npm install -g stripe

stripe listen --forward-to localhost:3000/api/webhooks/stripe

# **12\. Google OAuth Setup**

## **Google Cloud Console**

- Go to console.cloud.google.com, open the onara project
- APIs & Services > Credentials > Create OAuth 2.0 Client ID
- Application type: Web Application
- Authorized redirect URIs: <https://your-project.supabase.co/auth/v1/callback> and <http://localhost:3000/dashboard> for local dev
- Copy Client ID and Client Secret

## **Supabase**

- Authentication > Providers > Google
- Paste Client ID and Client Secret and enable

**Important: Google OAuth Testing Mode**

When you first create the OAuth app it starts in Testing mode. Only Google accounts you explicitly add as test users can sign in -- everyone else sees an "app not verified" error. To add test users: Google Cloud Console → APIs & Services → OAuth consent screen → Test users → Add users. Add your own Google account and any accounts you want to test with during development.

When ready to launch publicly: OAuth consent screen → Publish App. For basic Google Sign-In (email and profile only) verification is usually automatic. If you request sensitive scopes, Google may take a few days to review.

## **Frontend Code**

The entire Google OAuth flow is one Supabase call:

await supabase.auth.signInWithOAuth({

provider: 'google',

options: { redirectTo: \`\${window.location.origin}/dashboard\` }

})

_Note: Supabase handles the redirect to Google, the callback, session creation, and redirect back. No backend code needed for the OAuth flow._

## **Google OAuth Users vs Email Users**

- OAuth users: password_hash is NULL. Change Email and Change Password hidden in Account page. Google icon badge shown next to email.
- Email users: password_hash stored as bcrypt hash. Full account controls shown.
- RLS works identically for both -- auth.uid() is the same regardless of login method

# **13\. API Routes Reference**

All Next.js API routes. Frontend never touches the database directly.

## **Auth -- /api/auth**

- POST /signup -- { email, password } -- creates user, returns session
- POST /login -- { email, password } -- verifies password, returns session
- POST /logout -- clears session
- POST /forgot-password -- { email } -- Supabase sends reset email
- GET /oauth/google -- triggers Google OAuth via Supabase

## **Sites -- /api/sites**

- POST /generate -- { businessData, extraContext } -- forwards to DigitalOcean FastAPI, returns jobId immediately
- GET /:projectId/status -- returns { phase: queued|running|done|error, queuePosition, activeAgent, result }
- GET /:projectId/stream -- Server-Sent Events stream for real-time pipeline updates (replaces polling when SSE is implemented)
- GET /:projectId/preview -- returns { iframeUrl, publicUrl } based on plan
- POST /:projectId/revise -- { revisionRequest } -- forwards revision to FastAPI for agents 5-9
- GET / -- all sites for logged-in user
- DELETE /:projectId -- removes project from Supabase, deletes GitHub repo

## **Places -- /api/places**

- GET /search?q=name -- calls Google Places, returns data or missing fields list

## **Account -- /api/account**

- PUT /email -- { newEmail, currentPassword } -- updates email
- PUT /password -- { currentPassword, newPassword } -- updates hash
- DELETE / -- { confirm: DELETE } -- full account deletion

## **Stripe -- /api/stripe**

- POST /checkout -- { plan } -- Stripe Checkout session for subscriptions
- POST /portal -- Stripe billing portal session

## **Webhooks -- /api/webhooks**

- POST /stripe -- Stripe events: payment success, failure, cancellation

## **FastAPI Routes (DigitalOcean -- internal)**

- POST /pipeline/start -- { jobId, businessData, extraContext } -- starts 10-agent pipeline
- POST /pipeline/revise -- { jobId, existingCode, blueprint, revisionRequest } -- runs agents 5-9
- GET /pipeline/status/:jobId -- pipeline phase and active agent
- GET /health -- health check endpoint

# **14\. 10-Agent Pipeline**

## **Overview**

10 agents run sequentially on the FastAPI pipeline server (your PC at launch, DigitalOcean later). Agents 2 and 3 run in parallel since both only need Agent 1 output. After Agent 9 approves the output, the pipeline ends and returns the validated code to the Next.js backend which handles all deployment steps. No agent touches GitHub, Vercel, or Supabase -- that is all backend code.

Flow: \[1 Cloud\] -> \[2 Local\] + \[3 Local\] (parallel) -> \[4 Cloud\] -> \[5 Cloud\] -> \[6 Copilot SDK\] -> \[7 Cloud + RAG\] -> \[8 Local\] -> \[9 Cloud + RAG\] -> \[10 Local\] -> Backend Deployment

\# Agents 2 and 3 run in parallel in Python

import asyncio

content_output, style_output = await asyncio.gather(

run_agent_2(analyst_output),

run_agent_3(analyst_output)

)

## **Agent 1: Business Analyst**

**\[Tool\]** NVIDIA NIM -- deepseek-ai/deepseek-v4-flash

**\[Input\]** Raw Google Places data + user extra context

**\[Job\]** Identify what a great website for this specific business type needs. Food truck needs a menu. Plumber needs emergency callout banner. Photographer needs a gallery. Output industry-specific structure recommendations.

**\[Output\]** JSON: { industryType, mustHaveSections, callToActionType, urgencyLevel }

## **Agent 2: Content Writer**

**\[Tool\]** Ollama Local -- qwen3:8b

**\[Runs\]** In parallel with Agent 3

**\[Input\]** Agent 1 JSON + raw business data

**\[Job\]** Write all website copy before any code is generated. Hero headline, subheadline, about paragraph, service descriptions, contact instructions, footer tagline. Tone set by Agent 1 output.

**\[Output\]** JSON: { heroHeadline, heroSub, aboutText, services: \[{name, description}\], contactInstructions, footerTagline }

## **Agent 3: Style Agent**

**\[Tool\]** Ollama Local -- qwen3:8b

**\[Runs\]** In parallel with Agent 2

**\[Input\]** Agent 1 JSON + business name and type

**\[Job\]** Choose color palette, fonts, spacing, layout personality for the business type. Law firm: dark navy, serif. Bakery: warm peach, rounded. Landscaper: deep green, earthy.

**\[Output\]** JSON: { primaryColor, secondaryColor, accentColor, headingFont, bodyFont, layoutStyle, borderRadius, buttonStyle }

## **Agent 4: Planner**

**\[Tool\]** NVIDIA NIM -- deepseek-ai/deepseek-v4-pro

**\[Input\]** Agent 1 JSON + Agent 2 JSON + Agent 3 JSON

**\[Job\]** Merge all three outputs into one unified site blueprint. Decide final section order, map copy to sections, apply style tokens. Resolve any conflicts.

**\[Output\]** JSON: complete site blueprint with sections, content, and style merged

## **Agent 5: Prompt Engineer**

**\[Tool\]** NVIDIA NIM -- deepseek-ai/deepseek-v4-pro

**\[Input\]** Agent 4 blueprint JSON

**\[Job\]** Convert the blueprint into a precise, detailed prompt for GitHub Copilot. Specify every section, color, font, and content block explicitly. Enforce the exact file marker format required for parsing.

**\[Output\]** Polished prompt string ready for NVIDIA NIM

## **Agent 6: Code Generator**

**\[Tool\]** GitHub Copilot SDK -- free via GitHub Education

**\[Input\]** Agent 5 prompt

**\[Job\]** Generate complete website as three files separated by exact markers. System prompt enforces: no markdown fences, no explanations, three sections only. All CSS in style.css, all JS in script.js, no external dependencies.

**\[Output\]** Code string with &lt;!-- index.html --&gt;, /\* style.css \*/, // script.js markers

## **Agent 6 -- Plan-Gated Model Picker**

Agent 6 exposes a model picker to Onara users. The selected model_key is stored in users.preferred_code_model and passed through the blackboard. API keys for Claude/OpenAI are stored encrypted and decrypted in-memory only during generation.

**Free Plan -- NVIDIA NIM (no user key needed)**

nim-kimi -- NVIDIA NIM moonshotai/kimi-k2.6. Tier A coding (87/100). Best open-source HTML/CSS/JS. Beats GPT-5.2-Codex. Zero cost. Default for all free users.

**Starter Plan -- GitHub Copilot Included Models (student plan, zero cost)**

copilot-gpt5.2-codex -- Copilot SDK gpt-5.2-codex (best selectable on student plan)

copilot-gpt4.1 -- Copilot SDK gpt-4.1 (included, zero premium requests consumed)

copilot-gpt4o -- Copilot SDK gpt-4o (included, zero premium requests consumed)

**Pro Plan -- Bring Your Own API Key (Claude and ChatGPT)**

claude-sonnet-4-6 -- Anthropic API claude-sonnet-4-6 (user provides Anthropic API key in Account settings)

claude-opus-4-6 -- Anthropic API claude-opus-4-6 (user provides Anthropic API key)

openai-gpt-5.4 -- OpenAI API gpt-5.4 (user provides OpenAI API key in Account settings)

openai-gpt5.2-codex -- OpenAI API gpt-5.2-codex direct (user provides OpenAI API key)

## **NVIDIA NIM Setup -- One Key for All Cloud Agents**

Go to build.nvidia.com. Create a free NVIDIA Developer account. Profile icon > API Keys > Generate Key. Name it Onara. Key is prefixed nvapi-. Save as NVIDIA_NIM_API_KEY in onara-pipeline/.env. This one key covers all cloud agents: deepseek-ai/deepseek-v4-flash (Agent 1), deepseek-ai/deepseek-v4-pro (Agents 4+9), moonshotai/kimi-k2.6 (Agents 5+6+7). Free tier: 40 req/min per model. Rate limit automatically falls back to local llama3.3:8b. NIM uses OpenAI-compatible endpoints (base_url="<https://integrate.api.nvidia.com/v1>") so the standard openai Python library works with just the API key changed.

## **Agent 7: Debugger**

**\[Tool\]** NVIDIA NIM -- moonshotai/kimi-k2.6 + RAG

**\[Input\]** Raw code string from Agent 6

**\[RAG\]** Vector database of common HTML/CSS/JS error patterns and fixes. Agent searches for patterns matching the errors it finds and uses them as reference.

**\[Job\]** Check for errors: unclosed tags, broken CSS, missing JS references, missing file markers. Fix issues in place using RAG knowledge. If structurally unfixable, set error flag.

**\[Output\]** Fixed code string + { valid: true/false, issuesFound: \[\], issuesFixed: \[\] }

## **Agent 8: SEO Agent**

**\[Tool\]** Ollama Local -- qwen3:8b

**\[Input\]** Debugged code + original business data

**\[Job\]** Inject SEO into HTML only. Add meta title, meta description, Open Graph tags, JSON-LD LocalBusiness schema with real name/address/phone/hours, alt text on all images, canonical URL, mobile viewport meta tag.

**\[Output\]** SEO-enhanced HTML + unchanged CSS and JS

## **Agent 9: QA Agent**

**\[Tool\]** NVIDIA NIM -- deepseek-ai/deepseek-v4-pro + RAG

**\[Input\]** SEO-enhanced code + original business data

**\[RAG\]** Vector database of HTML/CSS best practices and quality standards. Agent cross-references the generated site against these standards.

**\[Job\]** Final quality check: all three file markers present and parseable, contact info matches source data exactly, mobile media queries exist, no Lorem Ipsum, no broken image src attributes.

**\[Output\]** { approved: true/false, issues: \[\] }

## **Agent 10: Mobile Optimizer**

\[Tool\] Ollama Local -- qwen3:8b

\[Input\] QA-approved code from Agent 9

\[Job\] Final mobile pass before deployment. Checks and fixes: viewport meta tag, touch targets (minimum 44x44px), body and input font sizes (minimum 16px to prevent iOS auto-zoom), horizontal overflow (no element wider than 100vw), tap spacing between interactive elements, images (max-width:100%), nav collapse on mobile, full-width CTA button on mobile, and presence of both 768px and 480px media query breakpoints.

\[Output\] Mobile-optimized final code + { fixed: \[list of changes made\] }

## **Blackboard Pattern and Supervisor Agent**

The sequential pipeline is enhanced with a shared state object called the Blackboard. Every agent reads from and writes to this central dict in FastAPI memory. A Supervisor Agent monitors the Blackboard after each agent completes and decides whether to accept the output, request a targeted re-run, or flag an error.

**The Blackboard**

\# Shared state object passed through the entire pipeline

blackboard = {

'business_data': {}, # from Google Places

'style_prefs': {}, # tone, color, layout, extra from UI

'analyst_output': {}, # Agent 1

'content_output': {}, # Agent 2

'style_output': {}, # Agent 3

'blueprint': {}, # Agent 4

'prompt': '', # Agent 5

'raw_code': '', # Agent 6

'debugged_code': '', # Agent 7

'seo_code': '', # Agent 8

'qa_result': {}, # Agent 9

'mobile_code': '', # Agent 10

'errors': \[\], # any agent errors

'retries': {} # retry count per agent

**Supervisor Agent**

**\[Tool\]** Ollama Local -- llama3.3:8b (free, runs on your machine)

**\[Runs\]** After each agent completes, before the next agent starts

**\[Job\]** Read the Blackboard. Check the latest agent output against the overall project goals and previous outputs. Detect inconsistencies -- e.g. Content Writer ignoring Business Analyst urgency level, Style Agent choosing fonts that clash with the industry type. If output is acceptable, return approved. If not, return a specific correction instruction and trigger a targeted re-run of that agent only.

**\[Output\]** { approved: true } or { approved: false, correction: 'specific instruction for agent re-run' }

**\[Cost\]** Ollama local -- completely free. Supervisor runs after every agent but uses a small, fast 8B model. Total added latency is minimal.

_Note: The Supervisor prevents garbage from propagating through the pipeline. Without it, a bad Agent 2 output silently produces a bad Agent 4 blueprint which produces a bad prompt which produces bad code. With it, the error is caught and fixed at Agent 2 before it contaminates downstream agents._

## **Shadow QA Mode**

After Agent 9 (primary QA) approves a generated site, 1-5% of sites are also evaluated by a Shadow QA Agent running a different or more powerful model. Discrepancies are logged for continuous improvement of Agent 9 prompts and quality standards.

- Shadow QA runs asynchronously after the main pipeline completes -- never blocks the user
- Uses deepseek-ai/deepseek-v4-flash for deeper analysis than the primary Agent 9
- If Shadow QA model is rate limited (429) or errors for any reason: log shadow_skipped and move on. Never affects the user.
- Discrepancy log stored in Supabase: { project_id, agent9_result, shadow_result, diff, timestamp }
- Review discrepancy logs weekly to improve Agent 9 system prompt
- Shadow rate: start at 1%, increase to 5% as NVIDIA NIM limits allow

## **Predictive Local Model Preloading**

Ollama loads one model at a time. Loading a new model takes 5-15 seconds. When a cloud model is running (Agents 1, 4, 5, 7, 9) the local Ollama instance is idle. Use that idle time to preload the next local model before it is needed.

**Preload Schedule**

- Agent 1 starts (NVIDIA NIM deepseek-v4-flash): preload qwen3:8b in background for Agent 2
- Agents 2+3 complete (local): no preload needed -- Agent 4 is cloud
- Agent 4 starts (cloud): preload nothing -- Agent 5 is also cloud
- Agent 5 starts (cloud): preload llama3.3:8b in background for Agent 7 Debugger fallback
- Agent 6 runs (NVIDIA NIM -- not Ollama): preload qwen3:8b for Agent 8 SEO
- Agent 7 completes (cloud): Agent 8 uses qwen3:8b -- should already be loaded
- Agent 8 completes (local): Agent 9 is cloud -- no preload needed

\# Preload runs in background using asyncio

async def preload_model(model_name: str):

await ollama_client.generate(model=model_name, prompt='', keep_alive='10m')

\# keep_alive keeps it warm without generating output

_Note: Only preload when a cloud model is actively running. If Ollama is already busy with a local model, skip the preload. Check Ollama /api/ps endpoint to see what is currently loaded before preloading._

## **Atomic Component Generation**

Agent 6 (Code Generator) is modified to output structured JSON components instead of three monolithic files. Each component encapsulates its own HTML, CSS, and JS. The backend assembles these into final files before deploying.

// Agent 6 output format (JSON)

{

components: \[

{ id: 'hero', html: '...', css: '...', js: '...' },

{ id: 'services', html: '...', css: '...', js: '...' },

{ id: 'contact', html: '...', css: '...', js: '...' }

\]

}

- Backend assembles components into index.html, style.css, script.js before Cloudflare upload
- Component IDs stored in Supabase alongside the site record
- v2 revisions: agents only regenerate the specific components that changed, not the entire site
- Reduces token usage by 60-80% for revisions
- Eliminates risk of a revision breaking unrelated sections

_Note: Atomic components are critical for v2 hands-off maintenance. When a business owner says change the phone number, only the contact component reruns. Everything else stays intact._

## **After Pipeline -- Backend Deployment**

Once Agent 9 approves the output, FastAPI returns the validated code to the Next.js backend. The backend then handles all deployment steps deterministically in code -- no AI involved:

- Parse code into three strings using regex on the file markers
- Generate 32-char hex project ID using crypto.randomBytes
- Write index.html, style.css, script.js to temp-projects/projectId/ folder
- Save code backup to Supabase storage bucket
- Call GitHub REST API (authenticated via GitHub App installation token) to commit the three files into the onara-sites monorepo under a folder named after projectId -- no new repo created per site

_Note: GitHub monorepo is used for backup and version history only -- not for triggering deployment. The onara-sites repo (private) stores all site code under /sites/projectId/ for recovery purposes. Cloudflare Pages is deployed separately via Direct Upload API, not from GitHub._

- Delete temp folder immediately after commit
- Deploy to Cloudflare Pages using the Direct Upload API -- no GitHub required

_Note: Cloudflare Direct Upload API: POST /accounts/{account_id}/pages/projects creates the project. POST /accounts/{account_id}/pages/projects/{project_name}/deployments uploads files as multipart form-data. This is independent of GitHub -- files go from the backend directly to Cloudflare edge network._

- Save project record to Supabase with show_url based on user plan
- Send confirmation email via Resend

_Note: Deployment is pure backend code. Deterministic, fast, easy to debug. No language model involved after Agent 9._

# **15\. RAG -- Retrieval-Augmented Generation**

## **What RAG Does for Onara**

The Debugger and QA agents use RAG to search a vector database of HTML/CSS/JS patterns, common errors, and best practices. Instead of relying purely on the model's training knowledge, the agent can look up specific patterns relevant to what it is debugging or checking. This makes both agents significantly more reliable.

## **Vector Database Setup**

The vector database lives on the same machine as the FastAPI pipeline server. We use ChromaDB -- a lightweight open source vector database that runs in-process with no separate server needed.

pip install chromadb sentence-transformers

## **What Gets Embedded**

- Common HTML structural patterns (nav, hero, services grid, contact form, footer)
- Common CSS layout patterns (flexbox, grid, responsive breakpoints)
- Common HTML/CSS error signatures and their fixes
- JSON-LD LocalBusiness schema template
- Mobile responsiveness checklist
- SEO best practice checklist

## **How Agents Search It**

import chromadb

from sentence_transformers import SentenceTransformer

client = chromadb.Client()

collection = client.get_collection('onara-patterns')

model = SentenceTransformer('all-MiniLM-L6-v2')

def search_rag(query, n_results=3):

embedding = model.encode(query).tolist()

results = collection.query(query_embeddings=\[embedding\], n_results=n_results)

return results\['documents'\]\[0\]

Agent 7 calls search_rag with the specific error it found. Agent 9 calls search_rag with quality checks. Both use hybrid search combining vector similarity and BM25 keyword matching for higher precision.

## **Hybrid RAG Search**

Pure vector similarity search misses exact keyword matches. Pure BM25 misses semantic meaning. Combining both gives significantly better retrieval -- especially for specific HTML/CSS error patterns where exact tag names matter.

pip install rank-bm25

from rank_bm25 import BM25Okapi

def hybrid_search(query, n_results=3):

\# Vector search

embedding = model.encode(query).tolist()

vector_results = collection.query(query_embeddings=\[embedding\], n_results=n_results\*2)

\# BM25 keyword search

tokenized_docs = \[doc.split() for doc in all_docs\]

bm25 = BM25Okapi(tokenized_docs)

bm25_scores = bm25.get_scores(query.split())

\# Combine and rerank

combined = merge_and_rerank(vector_results, bm25_scores)

return combined\[:n_results\]

# **16\. Revision Flow**

## **How Revisions Work**

Revisions do not rerun the full pipeline. Agents 1-4 are fixed after initial generation -- the site structure does not change, only the code. The existing code and blueprint are passed as context to Agent 5 along with the revision request. Agents 5-9 rerun.

- User types revision request in dashboard
- Next.js backend checks revisions_used vs revisions_allowed in Supabase
- If at limit: returns error. No pipeline starts.
- Next.js forwards to FastAPI: existing code + blueprint + revision request
- Agents 5-9 rerun with revision context
- Agent 9 approves updated code
- FastAPI returns validated code to Next.js backend
- Backend commits updated files to same GitHub monorepo, deploys updated site to Cloudflare Pages
- revisions_used incremented in Supabase only after Agent 9 approval
- Preview iframe and public URL refresh

## **Revision Limits**

- Free: 3/month, resets 1st of month via Supabase edge function
- Starter: 10/month, resets on billing anniversary via Supabase edge function
- Pro: unlimited
- No revision deducted if pipeline fails before Agent 9 approval

# **17\. Concurrency & Queue**

## **The Bottleneck**

The DigitalOcean FastAPI server runs Ollama locally. Ollama handles one request at a time by default. Multiple simultaneous users means they wait in queue. NVIDIA NIM models also have concurrency limits on the free plan.

## **v1 Solution: In-Memory Queue with Position Indicator**

\# Simple queue in FastAPI

from asyncio import Queue

pipeline_queue = Queue()

is_processing = False

async def add_job(job):

await pipeline_queue.put(job)

if not is_processing:

asyncio.create_task(process_next())

**Queue Position UI**

- User sees: You are #X in line. Estimated wait: ~Y minutes.
- Small note: Your spot is saved. You can leave this page and come back.
- Pulsing gold progress bar to show system is alive
- Frontend polls status endpoint every 3 seconds (upgrade to Server-Sent Events from Section 25c for real-time push updates)
- Transitions to agent progress view automatically when job starts

## **Queue Persistence Between Restarts**

The in-memory queue loses all pending jobs if the FastAPI server crashes. Add a simple SQLite file as a job log so jobs can be recovered on restart. This is not a full queue system but prevents users from losing their place.

import sqlite3

conn = sqlite3.connect('jobs.db')

conn.execute('CREATE TABLE IF NOT EXISTS jobs (id TEXT, status TEXT, created_at TIMESTAMP)')

\# On startup: reload any jobs with status=pending into the in-memory queue

## **When to Upgrade**

- Average wait over 5 minutes: switch to Celery + Redis job queue
- Need multiple workers: add second DigitalOcean Droplet, load balance with nginx

# **18\. User Interface**

## **Design Language**

Brown-themed. Deep espresso (#3B1F0E) primary, warm tan (#C4A882) borders, cream (#FAF3E0) background, gold (#D4A853) CTAs. Inter body text, Playfair Display headings. 8px border radius. One primary action per screen always.

## **Landing Page**

**Navbar**

- Sticky: Onara logo left, How It Works / Pricing / Examples center, Login and Get Started Free right
- Get Started Free: gold, dark brown text, dominant
- Mobile: hamburger collapses nav, CTA buttons stay visible

**Hero**

- Headline: Your business website, live in minutes
- Subheadline: Import your Google Business Profile. Our AI builds and deploys your site automatically.
- Single gold CTA: Get Started Free. Below: No credit card required.
- Visual: split-screen Google Maps listing transforming into a finished site

**How It Works Strip**

- 3 columns: 1. Import, 2. Generate, 3. Launch -- icon, bold label, one sentence each

**Example Sites**

- 3-4 cards with real generated site previews and business type labels. Hover lift effect.

**Pricing Table**

- 3 columns: Free, Starter (\$12/month), Pro (\$29/month)
- Starter highlighted with gold border and Most Popular badge
- Feature checklist per column

**Footer**

- Dark brown background, cream text. Logo + tagline, nav links, social icons, copyright.

## **Auth Pages**

- Full-page brown gradient, centered white card 480px wide
- Sign Up and Log In: Continue with Google button (gold, full width, Google icon) at top. Divider OR. Email/password fields below.
- Forgot Password: email field, Send Reset Link button. Not shown to OAuth users.
- Success: redirect to dashboard

## **Dashboard Layout**

Fixed left sidebar (240px, deep brown) and scrollable main content area (cream).

**Sidebar**

- Onara logo, nav: My Sites, Build New Site, Account
- Active: gold left border, lighter background, gold text
- Upgrade button for free users -- gold, full width
- Plan badge at bottom
- Mobile: bottom tab bar

## **Build Flow**

**First Login Checklist**

Every new user sees a three-step checklist on their first dashboard visit. Progress bars and checklists increase onboarding completion by 20-30%. The checklist collapses after all three steps are done.

- Step 1: Import your Google Business Profile -- Start button, always unlocked
- Step 2: Generate your website -- unlocked after Step 1 complete
- Step 3: Go live -- unlocked after Step 2 complete, shows upgrade prompt
- Each completed step shows a gold checkmark. Incomplete steps show a grey circle.
- Banner above checklist: Your 14-day Pro trial is active. X days remaining.

**Step Indicator**

- 4 steps: Import, Customize, Generating, Preview
- Gold filled circle (done), gold number (current), grey (upcoming). Connecting line fills gold.

**Step 1: Import**

- Card 600px, heading: Where is your business on Google?
- Input with placeholder: e.g. Austin Lawn Care TX
- Search Google Business button -- gold, full card width
- Link: I don't have a Google listing, enter manually
- On success: confirmation card with name, address, phone, hours, photo thumbnail
- Missing fields: amber highlight with inline editable inputs and Missing badge
- Two buttons: Search Again (grey) and Confirm and Continue (gold)

**Step 1b: Manual Entry**

- Fields: Business Name, Type, Address, Phone (required), Website, Hours, Services (optional)
- Services: tag input, type and press enter per service

**Step 2: Customize**

- After confirming their Google Business data, the user sees a style preferences card before generation starts. All fields are optional -- skipping uses smart industry defaults.
- Tone: pill buttons -- Professional, Friendly, Bold, Minimal, Luxurious
- Color Style: pill buttons -- Auto (from industry), Dark, Light, Vibrant, Earthy, Custom
- Layout Style: pill buttons -- Modern, Classic, Bold & Graphic, Clean & Simple
- Anything else? Free-text textarea, 500 char limit. e.g. "We do emergency callouts 24/7. Brand colours are navy and white."
- Style preferences are passed to Agent 1 (Business Analyst) and Agent 3 (Style Agent). User selections override industry defaults when provided. Skipping any field means the agents use smart defaults for the business type.
- Character counter: 0/500. Revision meter showing dots. Generate button gold 64px full width.

**Step 3: Generating -- Streaming Code Preview**

As Agent 6 (Code Generator) produces its output, the code streams directly to the frontend in real time. Instead of a blank waiting screen, users watch their site code appear line by line. This transforms passive waiting into an engaging experience.

- Agent 6 uses streaming mode on the NVIDIA NIM response
- FastAPI pipes the stream to the Next.js backend via Server-Sent Events
- Frontend uses Shiki for syntax highlighting -- renders color-coded HTML/CSS/JS as it arrives
- Code preview panel sits below the agent progress rows, expanding as code arrives
- When Agent 6 completes, preview panel fades out and Agent 7 row activates

**Step 3: Generating -- Agent Progress**

- Queue position view if waiting: You are #X in line. Estimated wait Y minutes. Pulsing bar.
- Agent progress view once running: 10 rows, status icons grey/amber pulse/green/red

**\[Business Analyst\]** Analyzing your industry and requirements...

**\[Content Writer\]** Writing copy for every section...

**\[Style Agent\]** Selecting colors, fonts, and layout...

**\[Planner\]** Building your site blueprint...

**\[Prompt Engineer\]** Optimizing the generation prompt...

**\[Code Generator\]** Writing your website code...

**\[Debugger\]** Reviewing and fixing errors...

**\[SEO Agent\]** Injecting SEO tags and local schema...

**\[QA Agent\]** Running final quality check...

- Error row: red, Retry this step button
- Full failure: clean error card, Something went wrong. No revision used. Try Again.

**Step 4: Preview**

- Full width iframe 640px height
- Top bar: project ID, date, revisions used / allowed
- Free users: amber banner -- Your site is ready! Upgrade to Starter to get your live link.
- Paid users: green banner -- Your site is live! -- clickable URL with copy button
- Request a Revision button (gold, only if revisions > 0)
- Pro users: Download Code button (grey outline)
- Revision panel slides down: textarea, character counter, Cancel and Submit Revision
- 0 revisions: button greyed, tooltip -- Resets on \[date\]

## **My Sites**

- Grid: 3 cols desktop, 2 tablet, 1 mobile
- Each card: thumbnail, project ID, business name, date, status badge, URL if paid
- Empty state: illustration + Build Your First Site button

## **Account Page**

**Profile**

- Email users: Change Email and Change Password inline forms with bcrypt verification
- OAuth users: email with Google badge, message -- Your account is linked to Google

**Plan & Billing**

- Plan badge, revisions used this month
- Free: Starter and Pro upgrade cards
- Paid: next billing date, Manage Billing (Stripe portal), Cancel Subscription
- Cancellation modal: active until \[date\], then URL hidden, preview remains

**Danger Zone**

- Red-bordered card. Delete Account button opens modal requiring typing DELETE.

## **Toasts & Mobile**

- Toasts: bottom-right, green/red/gold border, auto-dismiss 4 seconds
- Mobile: bottom tab bar under 768px, single column cards, iframe 400px height, 44px min tap targets

# **19\. Environment Variables**

## **Next.js (.env.local)**

NEXT_PUBLIC_SUPABASE_URL=<https://your-project.supabase.co>

NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-key

SUPABASE_SECRET_KEY=your-service-role-key

PIPELINE_SERVER_URL=<https://abc-def.trycloudflare.com> # your PC tunnel at launch, DigitalOcean URL later

PIPELINE_SECRET=shared-secret-between-nextjs-and-fastapi

GOOGLE_PLACES_API_KEY=your-places-key

GOOGLE_OAUTH_CLIENT_ID=your-oauth-client-id

GOOGLE_OAUTH_CLIENT_SECRET=your-oauth-client-secret

GITHUB_APP_ID=your-app-id

GITHUB_APP_INSTALLATION_ID=your-installation-id

GITHUB_APP_PRIVATE_KEY=contents-of-pem-file

\# Cloudflare Pages

CLOUDFLARE_ACCOUNT_ID=your-account-id

CLOUDFLARE_API_TOKEN=your-api-token

\# Stripe

STRIPE*SECRET_KEY=sk_live*...

STRIPE*WEBHOOK_SECRET=whsec*...

STRIPE*STARTER_PRICE_ID=price*...

STRIPE*PRO_PRICE_ID=price*...

RESEND_API_KEY=your-resend-key

## **FastAPI (.env on DigitalOcean)**

OLLAMA_API_KEY=your-ollama-api-key

COPILOT_GITHUB_TOKEN=your-fine-grained-copilot-token

PIPELINE_SECRET=same-shared-secret-as-nextjs

GITHUB_APP_ID=your-app-id

GITHUB_APP_INSTALLATION_ID=your-installation-id

GITHUB_APP_PRIVATE_KEY=contents-of-pem-file

## **.gitignore (both repos)**

.env

.env.local

temp-projects/

**Warning: If any token is accidentally committed, revoke it immediately on the provider dashboard and generate a new one.**

# **20\. Database Schema (Supabase)**

CREATE TABLE users (

id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

email VARCHAR(255) UNIQUE NOT NULL,

password_hash VARCHAR(255),

plan TEXT DEFAULT 'free',

sub_status TEXT DEFAULT 'inactive',

stripe_customer_id VARCHAR(255),

stripe_subscription_id VARCHAR(255),

referral_code VARCHAR(32) UNIQUE,

trial_ends_at TIMESTAMPTZ,

is_trial BOOLEAN DEFAULT FALSE,

referred_by UUID REFERENCES users(id),

created_at TIMESTAMPTZ DEFAULT NOW()

CREATE TABLE projects (

id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

project_id VARCHAR(64) UNIQUE NOT NULL,

github_repo VARCHAR(512),

cloudflare_url VARCHAR(512),

cloudflare_project_id VARCHAR(64),

show_url BOOLEAN DEFAULT FALSE,

revisions_used INT DEFAULT 0,

revisions_allowed INT DEFAULT 3,

revisions_reset TIMESTAMPTZ,

bucket_path VARCHAR(512),

status TEXT DEFAULT 'generating',

created_at TIMESTAMPTZ DEFAULT NOW()

_Note: password_hash is nullable -- Google OAuth users have NULL here. show_url controls whether the public URL is shown. cloudflare_url stores the live Pages URL. cloudflare_project_id is needed to delete and redeploy on plan changes. bucket_path stores the Supabase backup zip path for redeployment. revisions_reset stores the next reset date._

## **Row Level Security**

**Warning: RLS is NOT enabled by default in Supabase. You must explicitly enable it on every table or your data is publicly accessible to anyone with the publishable key. Run the SQL below in the Supabase SQL editor immediately after creating your tables.**

\-- Step 1: Enable RLS on both tables (REQUIRED -- not automatic)

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

\-- Step 2: Create access policies

CREATE POLICY user_self_access ON users FOR ALL USING (auth.uid() = id);

CREATE POLICY project_owner ON projects FOR ALL USING (auth.uid() = user_id);

**Warning: If you skip this step, any user can read all other users data using the publishable key from the browser. Test RLS is working by calling the Supabase API with the publishable key and verifying you cannot access another user row.**

_Note: RLS works identically for Google OAuth and email users. Backend uses secret key which bypasses RLS. Frontend always uses publishable key which fully respects RLS._

## **Supabase Storage Bucket**

A bucket called generated-sites stores a zip of each project HTML/CSS/JS. This serves three purposes: Pro user code download, recovery source when redeploying after plan changes, and backup if a Cloudflare deployment is lost. The GitHub monorepo also holds the code but the Supabase bucket is the primary redeployment source.

\-- Create bucket in Supabase dashboard: Storage > New Bucket

\-- Name: generated-sites

\-- Private bucket: yes (only accessible via secret key)

\-- Path format: {user_id}/{project_id}/site.zip

# **21\. Supabase Edge Functions**

## **Why Edge Functions**

Edge functions run close to the Supabase database on Deno runtime. Used for two tasks that need to be reliable, scheduled, and database-adjacent: processing Stripe webhooks and resetting monthly revision counts.

## **stripe-webhook/index.ts**

Processes Stripe events and updates user records in Supabase immediately. Runs as an edge function instead of a Next.js route because edge functions have no timeout and run closer to the database.

// Handles these Stripe events:

// checkout.session.completed -> set plan, sub_status active, show_url true

// invoice.payment_failed -> after final retry: set plan free, show_url false

// customer.subscription.deleted -> set plan free, show_url false

## **downgrade-trials/index.ts**

Runs daily. Finds all users where is_trial = true and trial_ends_at has passed. Sets plan to free, show_url to false for all their projects, is_trial to false. Sends the trial ended email via Resend.

\-- Scheduled daily: finds expired trials and downgrades them to free tier

## **reset-revisions/index.ts**

Runs on a schedule. Resets revisions_used to 0 for all projects where revisions_reset date has passed. Supabase supports scheduled edge functions via pg_cron.

\-- Enable pg_cron in Supabase SQL editor

SELECT cron.schedule(

'reset-revisions',

'0 0 \* \* \*',

\$\$ SELECT net.http_post(url := '<https://your-project.supabase.co/functions/v1/reset-revisions>') \$\$

);

# **22\. Security**

## **Credentials**

- All keys in .env / .env.local -- never hardcoded, never committed
- PIPELINE_SECRET used to sign JWT tokens between Next.js and FastAPI -- FastAPI verifies the JWT on every request. Better than a raw shared secret because tokens expire and carry the user ID as a claim.
- Token expiry: 5 minutes. Next.js generates a fresh signed JWT per pipeline request. FastAPI rejects any token older than 5 minutes.

_Note: Install: pip install python-jose in FastAPI. npm install jsonwebtoken in Next.js._

- Supabase secret key on backend only -- never sent to frontend
- Stripe webhooks verified with constructEvent before processing
- Revoke and rotate any exposed key immediately

## **Auth**

- Email users: bcrypt at 12 salt rounds, never stored as plain text
- Google OAuth users: no password stored, authentication handled by Google and Supabase
- Supabase Auth manages all session tokens
- Every Next.js API route verifies session before processing
- Every project action verifies user_id matches requesting user
- RLS at database level as second layer of access control

## **Project Isolation**

- Project IDs are 32-char cryptographically random hex strings
- Free user Cloudflare URLs served only via protected Next.js route as iframe src -- the cloudflare_url is never sent directly to the frontend for free users
- Backend checks show_url in Supabase before returning any URL -- ownership verification always runs first
- Temp folders deleted immediately after GitHub backup commit and Cloudflare upload complete
- GitHub App ("Onara Deployer") is scoped to onara-sites repo only -- Contents: Read & Write, Metadata: Read. No other repos accessible.
- Supabase bucket is private -- only accessible via secret key

## **Security Checklist -- Common Mistakes to Avoid**

**Warning: Run through this checklist before going live. Each item is a real vulnerability that has caused data breaches in production SaaS products.**

- RLS enabled on EVERY Supabase table -- not just users and projects. If you add a new table later, enable RLS on it immediately.
- Never expose SUPABASE_SECRET_KEY to the frontend -- it bypasses all RLS. Only ever used server-side.
- Never store the PIPELINE*SECRET, GITHUB tokens, or CLOUDFLARE token in client-side code or .env.local with NEXT_PUBLIC* prefix.
- Validate Stripe webhook signatures with constructEvent before processing any event -- never trust an unverified webhook payload.
- Sanitize all user inputs before passing to agents -- especially the extra context field which users type freely.
- Check project ownership on every API route that touches a project -- never trust the projectId from the request alone.
- Set Supabase publishable key table policies to SELECT only where INSERT/UPDATE/DELETE are not needed from the frontend.
- Add a spending limit in Vercel dashboard to prevent bill shock from unexpected traffic.
- Set Cloudflare rate limiting on the Pages deployment domain to prevent abuse of user sites.
- Rotate all API keys and tokens before going live if they were used during development.

## **FastAPI Security**

- FastAPI server only accepts requests with correct PIPELINE_SECRET header
- DigitalOcean firewall configured to only allow traffic on port 8000 from Vercel IP ranges
- Rate limiting enforced at two levels: Next.js rejects requests exceeding the limit before they reach FastAPI, and FastAPI also enforces per-IP rate limits as a second layer using slowapi (pip install slowapi)
- Free tier: 3 generations per hour. Paid: 10 per hour. Both checked against user_id in Supabase.
- NVIDIA NIM rate limit handling: if Copilot returns 429, wait 30 seconds and retry once before falling back to deepseek-ai/deepseek-v4-flash
- No revision deducted if pipeline fails before Agent 9 approval

# **23\. Stripe & Subscriptions**

## **Setup**

- Create Starter (\$12/month) and Pro (\$29/month) products in Stripe dashboard
- Copy Price IDs into .env
- Set Stripe webhook endpoint to Supabase edge function URL
- Run: npm install stripe

## **Reverse Trial Flow (New Signup)**

- User signs up via Google OAuth or email
- Backend sets is_trial = true, plan = pro, trial_ends_at = NOW() + 14 days
- show_url set to true for all projects -- user has full Pro immediately
- Day 11 and 13: trial ending emails sent via Resend
- Day 14: downgrade-trials edge function runs, plan = free, show_url = false
- User sees upgrade prompt on dashboard

## **Subscription Flow**

- User clicks Upgrade
- Next.js creates Stripe Checkout Session
- User redirected to Stripe-hosted checkout
- Payment success: Stripe sends event to Supabase edge function
- Edge function sets plan, sub_status active, show_url true for all user projects
- User redirected back to dashboard

## **Failed Payments**

- Stripe retries 3 times over 7 days
- After final failure: edge function sets plan to free
- Backend deletes Cloudflare Pages deployment, deploys placeholder page
- Dashboard iframe still works via Supabase bucket backup
- If user has multiple sites (was on Pro): downgrade modal shown on next login to choose which site to keep
- User notified by Stripe and by Onara Resend email

## **Cancellations and Plan Downgrade Edge Cases**

When a paid plan lapses (manual cancel, payment failure, or trial end), the user may have more sites than the free tier allows. The free tier allows 1 site. Starter allows 1. Pro allows 3. This requires careful handling on downgrade.

**Pro -> Free (3 sites -> 1 site)**

- Plan set to free in Supabase
- On next dashboard login: a full-screen modal appears before the dashboard loads
- Modal: Your plan has changed to Free. You can keep 1 site as a preview. Please choose which site to keep.
- User sees all 3 sites as cards and selects one to keep
- Two buttons: Keep This Site (keeps selected as preview, deletes others) or Upgrade to Pro (restores all sites with live URLs)
- If user keeps 1: backend deletes Cloudflare Pages deployments for the other 2, deletes their GitHub folders, removes records from Supabase
- Kept site: Cloudflare Pages deployment deleted, placeholder page deployed, show_url set to false. Site shows as preview via Supabase bucket backup.

**Starter -> Free (1 site -> 1 site, URL changes)**

- Plan set to free in Supabase
- No site deletion needed -- user already has 1 site
- Backend deletes the current Cloudflare Pages deployment
- Backend deploys a placeholder page to a new Cloudflare Pages deployment
- cloudflare_url updated in Supabase to the new placeholder URL
- show_url set to false -- user sees preview iframe via Supabase bucket
- On next login: banner -- Your plan has changed to Free. Your live URL is no longer active. Upgrade to get a new live link.

**Pro -> Starter (3 sites -> 1 site)**

- Plan set to starter in Supabase
- On next login: modal -- Your plan has changed to Starter. You can keep 1 live site. Please choose which one.
- User selects 1 site to keep live
- Other 2 sites: Cloudflare deleted, placeholder deployed, show_url false
- Kept site: stays live with existing Cloudflare URL, show_url remains true

**Resubscription After Downgrade**

- User upgrades via the Account page
- Stripe processes payment, webhook fires
- Edge function sets new plan and sub_status in Supabase
- For each site in the user account up to the new plan limit:
- Backend retrieves the site zip from Supabase storage bucket
- Backend deploys to a new Cloudflare Pages project
- cloudflare_url updated in Supabase with the new URL
- show_url set to true
- User sees new live URLs in dashboard

_Note: URL changes on every resubscription cycle because a new Cloudflare Pages project is created each time. This is expected and documented in the user-facing cancellation modal._

**Pro Users Who Deleted Sites Before Downgrade**

If a Pro user cancels and they only have 1 or 2 sites (having deleted some), the downgrade logic checks actual site count vs free tier limit. No modal is shown if they already have 1 or fewer sites.

# **24\. Account Management**

## **Change Email**

- User enters new email and current password (email users only)
- Backend verifies password with bcrypt
- Supabase sends confirmation to new address
- Updates after user clicks confirmation link

## **Change Password**

- User enters current and new password (email users only)
- Backend verifies with bcrypt, hashes new password, updates hash
- All sessions invalidated

## **Forgot Password**

- User clicks Forgot Password on login page
- Enters email -- Supabase sends reset link, expires in 1 hour
- User sets new password via link

## **Delete Account**

- User types DELETE in confirmation input
- Backend cancels Stripe subscription immediately
- Backend deletes all project records from Supabase
- Backend deletes all GitHub repos for this user from deployment account
- Backend deletes all files from Supabase storage bucket for this user
- User record deleted -- CASCADE removes all linked data
- User logged out and redirected to landing page

_Note: Vercel deployments for deleted projects expire naturally or can be removed manually from the Vercel dashboard._

# **25\. Complete End-to-End Flow**

- User signs up or logs in (Google OAuth or email/password)
- User enters Google Business name on Build page
- Next.js calls Google Places API -- fetches name, address, phone, hours, photos, reviews
- Missing fields returned to frontend -- user fills them in
- User confirms data and adds optional extra context, clicks Generate
- Next.js forwards job to FastAPI on DigitalOcean, receives jobId back immediately
- Frontend polls status every 3 seconds
- If queue: user sees position indicator
- When job starts: user sees 10-agent progress view
- Agent 1 runs on NVIDIA NIM (deepseek-ai/deepseek-v4-flash) -- industry analysis
- Agents 2 and 3 run in parallel -- Content Writer (qwen3:8b local) and Style Agent (qwen3:8b local)
- Agent 4 runs on NVIDIA NIM -- blueprint planning
- Agent 5 runs on NVIDIA NIM -- prompt engineering
- Agent 6 runs -- GitHub Copilot SDK generates complete HTML/CSS/JS (free via GitHub Education)
- Agent 7 runs on NVIDIA NIM + RAG -- debugging with knowledge base
- Agent 8 runs on Ollama local (qwen3:8b) -- SEO injection
- Agent 9 runs on NVIDIA NIM + RAG -- quality check with knowledge base
- Agent 10 runs on Ollama local (qwen3:8b) -- mobile optimization pass: touch targets, font sizes, viewport, overflow, media queries
- FastAPI returns validated code to Next.js backend
- Backend parses code, generates project ID, writes temp folder
- Backend saves code zip to Supabase storage bucket
- Backend creates GitHub repo and commits three files
- Backend deletes temp folder
- Backend deploys to Cloudflare Pages via API -- site live at projectId.pages.dev
- Backend saves project record to Supabase: cloudflare_url, show_url based on plan
- Backend sends Resend email with project ID and URL (paid) or preview note (free)
- Frontend loads Preview page -- iframe for all users
- Paid users (Starter/Pro): green banner with live URL and copy button
- Free users on trial: green banner showing trial days remaining and live URL
- Free users post-trial: amber banner -- Your Pro trial has ended. Upgrade to Starter to get your live link back.

# **25b. Growth & SEO Strategy**

## **Why SEO Matters for Onara**

Small business owners searching for website builders use Google. If Onara ranks for the right terms, every click is a potential paying customer with zero ad spend. Unlike developer tools that rely on Product Hunt or Twitter, small business owners discover tools through search and word of mouth.

## **Target Keywords**

**High Intent -- These People Are Ready to Buy**

- website builder for small business -- high volume, high competition, long-term target
- free website for my business -- high intent, easier to rank
- AI website builder -- growing fast, medium competition
- google business website builder -- low competition, perfect fit for our differentiator
- website builder no coding -- strong conversion intent
- website for plumber / cleaner / food truck / landscaper -- niche long tail, very low competition, easy to rank

**Long-Tail -- Easy Wins**

Create individual landing pages for each business type. Examples:

- onara.tech/for/plumbers -- AI website builder for plumbers
- onara.tech/for/food-trucks -- AI website builder for food trucks
- onara.tech/for/photographers -- AI website builder for photographers

These pages rank easily because competition is near zero. A plumber searching for a website builder will find a page built specifically for them. Conversion rate is significantly higher than a generic landing page.

## **Landing Page Conversion Improvements**

**Interactive Demo Before Signup**

An interactive demo on the landing page before any signup prompt converts 65% better than a static screenshot. Build a clickable walkthrough of the generation flow -- user types a fake business name, sees the Google Places card appear, clicks generate, watches the 10 agents animate, and sees a sample site load. Built with static HTML and prerecorded responses, not real AI. Runs in under 90 seconds.

- Embed demo directly in hero section, above the CTA button
- After demo completes, CTA changes to: Now do it for your real business -- Get Started Free
- Removes the biggest barrier: users do not know what they will get until they see it

**Bento Grid Layout for Features Section**

Replace the standard three-column How It Works strip with a bento grid. Bento grids use asymmetric rectangular blocks of varying sizes. 67% of top SaaS sites now use this pattern and report 47% higher dwell time. Use 5-7 cells: large hero cell showing the generation demo, medium cells for Google import, 10-agent pipeline, instant deploy, and a small cell with live site count.

**Video Testimonials Below Pricing**

Video testimonials placed immediately below the pricing section improve conversion by 27%. Get 2-3 short 30-60 second videos from early users showing their real generated site. Specific claims convert better than vague praise -- each video should mention business type, time to generate, and what they had before.

**Time to Value**

Target under 5 minutes from signup to seeing the generated site. The faster users reach their aha moment, the higher the trial-to-paid rate. Keep the path: signup, import, generate, see site. No extra steps in between. Every additional step before generation hurts conversion.

## **On-Page SEO**

**Landing Page**

- Title tag: Onara -- AI Website Builder for Small Businesses | Free to Start
- Meta description: Import your Google Business Profile and get a complete website in 60 seconds. No coding. No design skills. Free to try.
- H1: Your business website, live in minutes
- Structured data: SoftwareApplication schema on the landing page
- Core Web Vitals: Next.js with static generation gives excellent LCP and CLS scores by default
- Page speed: all static assets served via Vercel CDN, images optimized with Next.js Image component

**Generated Sites (User Sites)**

Every site generated by Onara is already SEO-optimized by Agent 8. But the Onara footer on free tier sites acts as a backlink network. Every free tier site links back to onara.tech. At scale this is hundreds of backlinks from real deployed websites.

- Free tier footer: Powered by Onara -- links to onara.tech
- Use descriptive anchor text: AI website builder for \[business type\]
- Each backlink is from a unique domain -- high value for domain authority

## **Content Marketing**

**Blog -- Target Informational Keywords**

A blog at onara.tech/blog targets how-to and informational queries that small business owners search before they are ready to buy. This builds organic traffic and trust.

- How to get your small business found on Google
- Does my business need a website in 2026?
- How to set up a Google Business Profile (step by step)
- What should be on a small business website?
- How much does a business website cost?

Each post ends with a CTA to try Onara. These posts rank for the consideration-stage queries that precede a purchase decision.

**Comparison Pages**

- Onara vs Wix -- target users evaluating alternatives
- Onara vs Squarespace
- Onara vs Hiring a Web Designer

Comparison pages rank for high-intent queries from people already in buying mode. They convert extremely well.

## **Programmatic SEO**

Generate thousands of landing pages automatically targeting location and business type combinations. Examples:

- Website builder for plumbers in Austin TX
- Free website for food trucks in Chicago
- AI website for photographers in New York

These pages are generated from a template with the location and business type filled in. Each targets a unique long-tail keyword with near-zero competition. Combined they can drive significant organic traffic.

// Next.js dynamic route: /for/\[industry\]/\[location\]

// generateStaticParams() generates all combinations at build time

// Each page is fully static -- fast and indexable

## **Re-Engagement Email Sequences**

70% of users who sign up never return after the first session. Event-driven email sequences bring them back based on exactly what they did or did not do in the product. All sent via Resend, triggered by Supabase edge functions watching user state.

**Sequence 1: Signed Up But Never Generated**

- Trigger: signup with no generation within 24 hours
- Email 1 at 24h: Your website is waiting. You are 60 seconds away from seeing it.
- Email 2 at 72h: We built a preview for a business like yours. Here is what your site could look like.
- Email 3 at 7 days: Your 14-day Pro trial has X days left. You have not generated your site yet.

**Sequence 2: Generated But Did Not Upgrade**

- Trigger: site generated and previewed but no upgrade after 48 hours
- Email 1 at 48h: Your site is ready to go live. One click to publish.
- Email 2 at 5 days: Your trial ends in X days. After that your live URL goes offline.

**Sequence 3: Churned Win-Back**

- Trigger: 30 days after plan drops to free with no resubscription
- Email: We improved Onara. Your site is still saved in your dashboard.

_Note: Every email references what the user specifically did. Never send a generic newsletter to these sequences._

## **Viral & Word of Mouth**

**Footer Branding as a Growth Loop**

Every free tier site has a Powered by Onara footer link. A plumber gets a site, shares it with customers, those customers see the footer, some click it and become users. This is the same growth loop that made Hotmail and Typeform scale.

- Footer text: Powered by Onara -- Make your own free site
- Link goes to onara.tech with UTM parameters tracking which site referred the visit
- At 1,000 free tier sites live, this is 1,000 pages constantly showing the link to real business visitors

**Referral Program**

- Give users a unique referral link
- When a referral signs up for Starter: referrer gets 1 month free
- When a referral signs up for Pro: referrer gets 2 months free
- Simple to implement with Stripe and a referral_code column in the users table

**Social Proof**

- Show generated site count on the landing page: X businesses already live
- Pull real testimonials from early users and show on landing page
- Case studies: before (no website, only Google Maps) and after (live Onara site)
- Show real generated sites in the examples section -- actual business names and types

## **Paid Acquisition (When Ready)**

Organic first. Once the product is validated and converting, run paid ads targeting the highest-intent keywords.

- Google Ads: target website builder for small business and niche variants
- Facebook/Instagram Ads: target small business owner interest segments, show the generation demo video
- Retargeting: anyone who visited the landing page but did not sign up
- Budget: start with -10/day to test messaging before scaling

## **Analytics & Tracking**

Instrument everything before launch so decisions are data-driven from day one.

- Vercel Analytics: built-in, free, shows page views and Core Web Vitals
- Plausible or PostHog: privacy-friendly event tracking for user actions (signup, generate, upgrade)
- Stripe Dashboard: revenue, churn, MRR -- check weekly
- Key metrics to track: signup rate, free to paid conversion rate, monthly churn rate, average revisions per site, generation success rate
- Funnel: Landing page visit -> Signup -> First generation -> Preview -> Upgrade
- Track drop-off at each stage and optimize the weakest step first

## **Launch Strategy**

- Launch on Product Hunt on a Tuesday or Wednesday -- highest traffic days
- Post in relevant subreddits: r/smallbusiness, r/entrepreneur, r/sidehustle -- show the product honestly, no spam
- Reach out to 20-30 small business owners personally and offer the first month free in exchange for honest feedback and a testimonial
- Post the generation demo video on TikTok and Instagram Reels -- showing a business going from Google Maps listing to live site in under 2 minutes
- Submit to AI tool directories: There Is An AI For That, Futurepedia, AI Tools Directory -- these drive consistent organic traffic
- Write a detailed build log on dev.to or Hacker News -- developers who see it will share it

# **25c. Architecture Improvements & Scaling**

## **Current Architecture Assessment**

The three-layer stack (Next.js + FastAPI + Supabase) is clean and correct. Each layer does what it is best at. The main areas to improve are: caching repeated agent work, replacing polling with real-time updates, adding a fallback for the NVIDIA NIM, and adding monitoring. These are not needed at launch but should be planned for.

## **Improvement 1: Redis Cache for Agent Outputs**

If two plumbers in Austin both generate sites, Agents 1, 3, and 4 produce nearly identical output. A Redis cache stores the output of these agents keyed by business type and industry. Cache hit means agents 1, 3, and 4 skip entirely and the pipeline completes significantly faster.

**What to Cache**

- Agent 1 (Business Analyst): cache by industryType key. A plumber always gets the same mustHaveSections and callToActionType.
- Agent 3 (Style Agent): cache by industryType key. All landscapers get the same green palette.
- Agent 4 (Planner): cache is less useful here because Content Writer output varies per business.
- Do NOT cache: Agent 2 (Content Writer), Agent 5-9 -- these use real business-specific data and must always run fresh.

**Implementation**

\# Add Redis to FastAPI pipeline

pip install redis

import redis

cache = redis.Redis(host="localhost", port=6379)

def get_cached_or_run(agent_fn, cache_key, input_data, ttl=86400):

cached = cache.get(cache_key)

if cached: return json.loads(cached)

result = agent_fn(input_data)

cache.set(cache_key, json.dumps(result), ex=ttl)

return result

_Note: TTL of 86400 = 24 hours. Cache keys: analyst:{industryType} and style:{industryType}. At scale move Redis to a managed instance (Redis Cloud free tier)._

## **Improvement 2: Server-Sent Events Instead of Polling**

The current architecture polls the status endpoint every 3 seconds. For a 90-second generation that is 30 HTTP requests. Server-Sent Events (SSE) replaces this with one persistent connection that the server pushes updates through in real time. Each agent completion triggers a push event immediately.

**FastAPI SSE**

from fastapi.responses import StreamingResponse

import asyncio

async def event_stream(job_id: str):

while True:

status = get_job_status(job_id)

yield f"data: {json.dumps(status)} "

if status\["phase"\] in \["done", "error"\]: break

await asyncio.sleep(0.5)

**Next.js SSE Client**

const source = new EventSource()

source.onmessage = (event) => {

const status = JSON.parse(event.data)

updateAgentProgress(status)

if (status.phase === "done") source.close()

}

_Note: SSE is supported natively by all modern browsers. No library needed. Falls back to polling if SSE is unavailable._

## **Improvement 3: Code Generator Fallback**

GitHub Copilot SDK is the only agent with an external dependency outside your control. If GitHub is down, the student plan expires, or rate limits are hit, the entire product stops. A fallback model ensures the pipeline keeps working.

**Fallback Chain for Agent 6**

- Try GitHub Copilot SDK first (free, best output quality)
- If Copilot fails or times out after 30 seconds: fall back to NVIDIA NIM deepseek-ai/deepseek-v4-flash
- If NVIDIA NIM rate limited: fall back to local qwen3:8b (already loaded on your PC)
- All three produce the same file marker format -- the rest of the pipeline is unaffected

async def run_code_generator(prompt):

try:

return await copilot_sdk_generate(prompt)

except Exception:

try:

return await ollama_cloud_generate("deepseek-ai/deepseek-v4-flash", prompt)

except Exception:

return await ollama_local_generate("qwen3:8b", prompt)

## **Improvement 4: Circuit Breaker for NVIDIA NIM**

When an NVIDIA NIM model is rate limited, agents currently wait 10 seconds and retry. Under load this means many requests pile up waiting. A circuit breaker detects repeated failures and immediately falls back to local without waiting, then retries cloud after a cooldown period.

class CircuitBreaker:

def \__init_\_(self, failure_threshold=3, cooldown=60):

self.failures = 0

self.threshold = failure_threshold

self.cooldown = cooldown

self.open_until = None

def call(self, cloud_fn, local_fn, \*args):

if self.open_until and time.time() < self.open_until:

return local_fn(\*args) # circuit open, use local

try:

result = cloud_fn(\*args)

self.failures = 0

return result

except RateLimitError:

self.failures += 1

if self.failures >= self.threshold:

self.open_until = time.time() + self.cooldown

return local_fn(\*args)

## **Improvement 5: Uptime Monitoring**

Without monitoring you find out the pipeline server is down when users complain. Add monitoring from day one.

**Free Tools**

- UptimeRobot (free): monitors your FastAPI /health endpoint every 5 minutes, sends email and SMS on downtime
- Vercel Analytics (built-in free): monitors Next.js response times and error rates
- Supabase dashboard: shows database health and edge function logs

**Health Check Endpoint on FastAPI**

from fastapi import FastAPI

app = FastAPI()

@app.get("/health")

async def health():

ollama_ok = await check_ollama_running()

return {

"status": "ok" if ollama_ok else "degraded",

"ollama": ollama_ok,

"queue_length": pipeline_queue.qsize()

}

**Auto-Restart on Your PC**

When running on your PC, use PM2 to keep the FastAPI server running and auto-restart on crash:

npm install -g pm2

pm2 start "uvicorn main:app --port 8000" --name onara-pipeline

**Auto-Restart on DigitalOcean**

When you migrate to DigitalOcean, use systemd with restart=always so the service comes back up automatically after a crash or reboot.

## **Improvement 6: Externalize ChromaDB at Scale**

ChromaDB currently runs in-process with the FastAPI server. This is fine for one server but breaks when you run multiple pipeline workers because each has its own separate vector store.

- At launch: in-process ChromaDB, no issue
- When adding a second pipeline worker: move ChromaDB to a separate persistent volume or use a managed vector database like Qdrant Cloud (free tier available)
- No code changes needed in agents -- only the connection string changes

## **Migration Path: PC to DigitalOcean**

When you are ready to move from your PC to a proper server, the migration is simple because the code is identical.

- Provision a DigitalOcean Droplet: Ubuntu 22.04, 4GB RAM minimum, 8GB recommended
- SSH in and run the exact same setup commands from Section 9
- Clone the onara-pipeline repo and copy .env
- Start with PM2 or systemd
- Update PIPELINE_SERVER_URL in Next.js .env.local from the Cloudflare Tunnel URL to the Droplet IP
- Stop Cloudflare Tunnel on your PC
- Done -- zero code changes required

_Note: Monthly cost: \$12-24/month depending on RAM. At just 2 paying Starter users the Droplet pays for itself._

## **Model Fallback Reference**

Every agent has a defined fallback chain. Harder agents try cloud first, fall back to local. Simpler agents run local only.

**Agent 1 -- Business Analyst**

- Primary: NVIDIA NIM deepseek-ai/deepseek-v4-flash
- Fallback: Ollama local llama3.3:8b

**Agent 2 -- Content Writer**

- Primary: Ollama local qwen3:8b
- No cloud fallback needed -- local is sufficient for writing tasks

**Agent 3 -- Style Agent**

- Primary: Ollama local qwen3:8b
- No cloud fallback needed -- structured JSON output well within local 7B capability

**Agent 4 -- Planner**

- Primary: NVIDIA NIM deepseek-ai/deepseek-v4-pro
- Fallback: Ollama local llama3.3:8b

**Agent 5 -- Prompt Engineer**

- Primary: NVIDIA NIM deepseek-ai/deepseek-v4-pro
- Fallback: Ollama local llama3.3:8b

**Agent 6 -- Code Generator**

- Primary: GitHub Copilot SDK (free via student plan)
- Fallback 1: NVIDIA NIM deepseek-ai/deepseek-v4-flash
- Fallback 2: Ollama local qwen3:8b

**Agent 7 -- Debugger**

- Primary: NVIDIA NIM moonshotai/kimi-k2.6
- Fallback: Ollama local qwen3:8b

**Agent 8 -- SEO Agent**

- Primary: Ollama local qwen3:8b
- No cloud fallback needed -- structured HTML injection is well-defined

**Agent 9 -- QA Agent**

- Primary: NVIDIA NIM deepseek-ai/deepseek-v4-pro
- Fallback: Ollama local llama3.3:8b

_Note: Pull llama3.3:8b as a fallback model: ollama pull llama3.3. Pull qwen3:8b for all local fallbacks: ollama pull qwen3:8b && ollama pull llama3.3:8b. These only run when cloud is unavailable._

# **26\. Legal & Compliance**

## **Terms of Service**

Required before launch. Must cover: what the service does, permitted use of generated sites, that Onara is not responsible for content accuracy, payment terms, cancellation policy, account termination.

## **Privacy Policy**

Legally required. Must cover: data collected (email, business info, payment data), storage (Supabase, Stripe), third parties (Google, Vercel, GitHub, Resend, DigitalOcean), retention, deletion requests. GDPR compliance for EU users.

## **Data Handling**

- Email: Supabase, auth and notifications only
- Business data: passed through pipeline, stored as project record and code backup in Supabase bucket
- Payment data: Stripe only, Onara never stores card numbers
- Generated code: GitHub repos and Supabase bucket, deleted on account deletion
- Stripe customer ID: Supabase, subscription management only

## **Cookie Notice**

Supabase Auth uses session tokens in browser storage. A cookie/session notice is required on first visit for EU compliance.

_Onara -- Draft v11 Final -- Confidential_

# **27\. Architecture Hardening**

The first 10 build steps produce a working product. This section covers 11 production-grade improvements that prevent real failure modes once paying users arrive. Implement in priority order.

## **HIGH PRIORITY -- Do Before First Paying User**

**1\. Redis Job Queue (crash recovery)**

The current asyncio queue loses all pending jobs if FastAPI crashes. Replace with Redis/RQ -- jobs persist across restarts. pip install redis rq. Enqueue with job_timeout=300. Run a separate rq worker process. Effort: ~1 hour.

**2\. Copilot SDK Timeout**

The Copilot SDK has no default timeout. Wrap every call in asyncio.wait_for(..., timeout=30.0). If GitHub is slow the pipeline hangs indefinitely and the queue backs up behind it. Effort: ~15 minutes.

**3\. Blackboard Memory Pruning**

The blackboard holds all agent outputs in memory for the full job duration. With 50 concurrent users, raw_code fields alone exceed 2.5MB of RAM per worker. Set each blackboard field to None immediately after the downstream agent has consumed it. Effort: ~30 minutes.

**4\. Global 5-Minute Job Timeout**

Without a hard timeout, a stuck agent blocks the queue for hours. Wrap the entire pipeline in asyncio.wait_for(..., timeout=300.0). Set job_timeout=300 on the RQ enqueue call. Effort: ~5 minutes (included in Redis work above).

## **MEDIUM PRIORITY -- After First 50 Users**

**5\. Smarter ollama_cloud Exception Handling**

Currently all cloud errors fall back identically. A 429 rate limit (temporary -- wait 15s and retry) should be handled differently from a 500 server error (fall back immediately) and a timeout (fall back immediately, no wait). Catch httpx.HTTPStatusError separately and branch on status code. Effort: ~1 hour.

**6\. ChromaDB Persistent File Path**

ChromaDB currently runs in-process with in-memory storage. Adding a second pipeline worker means two separate vector stores that cannot share data. Switch to chromadb.PersistentClient(path="./chroma_db") now so the store persists on disk and can be shared across workers. Effort: ~15 minutes.

**7\. Request Deduplication**

A double-click or browser retry on Generate creates two pipeline jobs, wasting tokens and confusing the user. Check job_store for any job with matching user_id and phase = queued or running before enqueuing. Return the existing job_id if found. Effort: ~30 minutes.

**8\. GitHub App Token Caching**

A fresh GitHub App installation token is generated on every deployment via an httpx round trip. Cache the token in FastAPI memory with a 50-minute TTL (GitHub tokens last 60 minutes). Use a module-level \_token_cache variable with an expiry timestamp. Effort: ~20 minutes.

## **LOWER PRIORITY -- When Actively Iterating**

**9\. Move Prompts to Files**

Agent prompts are hardcoded in Python. Every prompt improvement requires touching code and restarting the server. Move all prompts to a prompts/ directory as .txt files loaded by a prompt_loader.py utility. Changes take effect on next job with no restart. Effort: ~1 hour.

**10\. Structured Error Logging to Supabase**

When an agent fails in production there is currently no way to debug it without SSH access to the mini PC. On any pipeline error, POST the job_id, active_agent, error message, and blackboard state (excluding large code fields) to a pipeline_errors table in Supabase. Effort: ~45 minutes.

**11\. Per-User Pipeline Rate Limiting**

A free user can spam /pipeline/start and fill the entire queue, blocking paid users. Add slowapi rate limiting keyed on user_id (not IP, which is easy to rotate). Free users: 3 generations per day. This is separate from the revision limits enforced in Next.js. Effort: ~30 minutes.