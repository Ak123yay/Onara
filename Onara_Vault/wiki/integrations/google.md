# Google Integration — Onara

_Google Cloud Console setup: Places API key and OAuth client for Supabase auth._

---

## What Onara Uses Google For

- **Places API (New)**: Business search and detail fetch used by the build flow before the AI pipeline starts
- **Google OAuth**: User sign-in via Supabase Auth ("Sign in with Google")

These are two separate Google configurations — one API key, one OAuth client.

---

## Required Env Vars

| Variable | Where | Value |
|----------|-------|-------|
| `GOOGLE_PLACES_API_KEY` | Next.js `.env.local` | Restricted API key for Places API only |
| `GOOGLE_OAUTH_CLIENT_ID` | Next.js `.env.local` | OAuth 2.0 Client ID |
| `GOOGLE_OAUTH_CLIENT_SECRET` | Next.js `.env.local` | OAuth 2.0 Client Secret |

---

## Part 1: Places API Key

### 1. Create or select a Google Cloud project

Google Cloud Console → New Project → name it `onara-production`

### 2. Enable Places API (New)

APIs & Services → Library → search "Places API (New)" → Enable

**Important**: Enable "Places API (New)" — NOT the legacy "Places API". They are different APIs with different endpoints.

### 3. Create API Key

APIs & Services → Credentials → Create Credentials → API Key

Copy key → then immediately restrict it:
- **Application restrictions**: None for local server-side development; add server restrictions before production if using fixed infrastructure
- **API restrictions**: Restrict key → select "Places API (New)"

Copy restricted key → `GOOGLE_PLACES_API_KEY`

**Key is stored in Next.js server env only — never in `NEXT_PUBLIC_*` and never exposed to browser.**

---

## Part 2: OAuth 2.0 Client (Google Sign-In)

### 1. Configure OAuth Consent Screen

APIs & Services → OAuth consent screen:
- **User type**: External
- **App name**: Onara
- **User support email**: `support@onara.tech`
- **Authorized domains**: `onara.tech`
- **Scopes**: email, profile, openid (default)
- Save and continue through all steps

### 2. Create OAuth Client

APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID:
- **Application type**: Web application
- **Name**: `onara-supabase`
- **Authorized redirect URIs**:
  - `https://{your-supabase-project-ref}.supabase.co/auth/v1/callback`
  - (Get this URL from Supabase → Authentication → Providers → Google)

Click Create → copy **Client ID** → `GOOGLE_OAUTH_CLIENT_ID`
Copy **Client Secret** → `GOOGLE_OAUTH_CLIENT_SECRET`

### 3. Configure in Supabase

Supabase dashboard → Authentication → Providers → Google:
- Paste Client ID and Client Secret
- Save

Supabase handles the OAuth flow — Next.js only needs the Supabase client SDK.

---

## Common Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| Places search returns nothing | Wrong API enabled | Ensure "Places API (New)" is enabled, not legacy |
| Places returns 403 | Key not restricted correctly or wrong API | Check key restrictions in Cloud Console |
| Google sign-in fails | Redirect URI mismatch | Add exact Supabase callback URL to authorized URIs |
| OAuth consent screen error | App not verified | OK for testing; for prod, submit for Google verification |

---

## Related Files

- `wiki/features/google-places.md` — Places API behavior and field mapping
- `wiki/features/api.md` — `/api/places/search` route
- `wiki/features/auth.md` — Google OAuth sign-in flow
- `wiki/integrations/supabase.md` — Supabase auth provider config
- `wiki/architecture/env-vars.md` — all Google env vars
