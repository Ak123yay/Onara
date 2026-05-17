# Supabase Integration — Onara

_Project setup, auth providers, storage buckets, pg_cron, and connection strings._

---

## What Onara Uses Supabase For

- **PostgreSQL database**: all 7 tables (users, sites, jobs, subscriptions, revisions, etc.)
- **Auth**: Google OAuth + email/password sign-in
- **Storage**: HTML archives of every generated site
- **Edge Functions**: (future) server-side logic close to DB
- **pg_cron**: scheduled jobs for trial emails and monthly revision resets

---

## Required Env Vars

| Variable | Where | Value |
|----------|-------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Next.js `.env.local` | Project URL — safe to expose |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Next.js `.env.local` | Anon key — safe for browser |
| `SUPABASE_SERVICE_ROLE_KEY` | Next.js `.env.local` | Service role key — server-side only |
| `DATABASE_URL` | Next.js `.env.local` | Direct Postgres connection string for migrations |

---

## Project Setup

### 1. Create Supabase Project

supabase.com → New project:
- **Name**: `onara-production`
- **Database password**: generate strong password, save it
- **Region**: choose closest to your users (US East for NA launch)
- **Plan**: Free tier for development; upgrade to Pro ($25/month) for pg_cron

### 2. Get Connection Strings

Supabase dashboard → Settings → API:
- **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- **Anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Service role** key → `SUPABASE_SERVICE_ROLE_KEY` (keep secret)

Settings → Database → Connection string (URI format) → `DATABASE_URL`

### 3. Run Migrations

```bash
# From Next.js project root
npx supabase db push
# or if using direct DATABASE_URL:
psql $DATABASE_URL -f migrations/001_initial_schema.sql
```

Schema source: `wiki/data/models.md`

---

## Auth Configuration

### Enable Google OAuth

Supabase dashboard → Authentication → Providers → Google:
- Toggle **enabled**
- Paste `GOOGLE_OAUTH_CLIENT_ID` and `GOOGLE_OAUTH_CLIENT_SECRET`
- Save → copy the **Callback URL** → use this in Google Cloud Console OAuth config

### Enable Email/Password

Authentication → Providers → Email → already enabled by default.

Optionally disable email confirmation for development (Authentication → Settings → "Confirm email").

### Site URL

Authentication → Settings → **Site URL**: `https://onara.tech`

**Additional redirect URLs** (for local dev):
- `http://localhost:3000`

---

## Storage Setup

### Create `site-html` Bucket

Supabase dashboard → Storage → Create bucket:
- **Name**: `site-html`
- **Public**: No (private — access via service role key only)
- **File size limit**: 25 MB

Agent 10 uploads to: `{userId}/{jobId}.html`

---

## pg_cron Setup

pg_cron requires **Supabase Pro plan** ($25/month).

Enable via Supabase dashboard → Database → Extensions → search `pg_cron` → Enable.

Jobs are created by running SQL in the SQL editor (see `wiki/data/models.md` for the 4 scheduled jobs).

---

## Row Level Security

RLS is enabled on all tables. See `wiki/data/models.md` for full RLS policies.

**Key rule**: Server-side routes use `SUPABASE_SERVICE_ROLE_KEY` (bypasses RLS). Client-side components use `NEXT_PUBLIC_SUPABASE_ANON_KEY` (RLS enforced).

---

## Common Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| 401 on client requests | Wrong anon key | Verify `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| RLS blocking server routes | Using anon key server-side | Switch to service role key |
| pg_cron not running | Free tier | Upgrade to Pro |
| Storage upload fails | Bucket doesn't exist | Create `site-html` bucket |
| OAuth redirect fails | Site URL mismatch | Set correct Site URL in Auth settings |

---

## Related Files

- `wiki/data/models.md` — full schema, RLS policies, pg_cron jobs
- `wiki/architecture/security.md` — RLS policy details
- `wiki/integrations/google.md` — Google OAuth client setup
- `wiki/architecture/env-vars.md` — all Supabase env vars
