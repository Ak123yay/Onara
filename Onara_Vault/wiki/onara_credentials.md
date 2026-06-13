# Onara Credentials Checklist

This wiki file must not contain real secrets.

Use it only to track which values are needed. Store actual values in local `.env` files:
- `Onara_Code/app/.env.local`
- `Onara_Code/pipeline/.env`

Do not commit real `.env` files.

---

## GitHub

```bash
GITHUB_USERNAME=
COPILOT_GITHUB_TOKEN=
GITHUB_APP_ID=
GITHUB_APP_INSTALLATION_ID=
GITHUB_APP_PRIVATE_KEY=
```

## Google

```bash
GOOGLE_PLACES_API_KEY=
GOOGLE_OAUTH_CLIENT_ID=
GOOGLE_OAUTH_CLIENT_SECRET=
```

## Supabase

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
```

## Cloudflare

```bash
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_API_TOKEN=
```

## Stripe

```bash
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_FREE_PRICE_ID=
STRIPE_STARTER_PRICE_ID=
STRIPE_STARTER_ANNUAL_PRICE_ID=
STRIPE_PRO_PRICE_ID=
```

## Resend

```bash
RESEND_API_KEY=
RESEND_FROM_EMAIL=
RESEND_REPLY_TO=
```

## NVIDIA NIM

```bash
NVIDIA_NIM_API_KEY=
NVIDIA_NIM_BASE_URL=https://integrate.api.nvidia.com/v1
```

## Ollama

```bash
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_PRIMARY_MODEL=qwen3.5:9b
OLLAMA_FALLBACK_MODEL=gemma4:e4b
```

## Pipeline

```bash
PIPELINE_SERVER_URL=
PIPELINE_PORT=8000
PIPELINE_API_SECRET=
PIPELINE_MAX_CONCURRENCY=1
PIPELINE_JOB_TIMEOUT=300
```

## App URLs

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
APP_URL=http://localhost:3000
NEXTAUTH_SECRET=
```
