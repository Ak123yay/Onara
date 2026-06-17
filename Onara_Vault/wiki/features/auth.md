# Auth — Onara

_Google OAuth, email/password, session handling, and route protection._

---

## Auth Provider

Supabase Auth handles all authentication. Two sign-in methods:

1. **Google OAuth** — primary; imports name and avatar from Google
2. **Email + password** — fallback

---

## Google OAuth Setup

1. Google Cloud Console → OAuth 2.0 Client ID → Web application
   - Authorized redirect URI: `https://{supabase-project}.supabase.co/auth/v1/callback`
2. Add test users to the OAuth consent screen (testing mode at launch)
3. Add Client ID + Secret to Supabase Dashboard → Auth → Providers → Google
4. Before production: submit for Google app verification

**ENV vars**:
```
GOOGLE_OAUTH_CLIENT_ID=...apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=GOCSPX-...
```

---

## Session Handling

- **Browser**: `createClient()` with `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — RLS enforced
- **Server API routes**: `createServiceClient()` with `SUPABASE_SECRET_KEY` — RLS bypassed — never exposed to browser

---

## Route Protection Middleware

`middleware.ts` at Next.js root. Protects `/dashboard/:path*` and `/account/:path*`. No session → redirect to `/auth/login`.

---

## New User Trigger

On signup, a Supabase trigger (`on_auth_user_created`) inserts into `public.users`:

```sql
INSERT INTO public.users (
  id,
  email,
  full_name,
  avatar_url,
  plan,
  is_trial,
  trial_ends_at,
  revisions_limit,
  show_url
)
VALUES (
  NEW.id,
  NEW.email,
  NEW.raw_user_meta_data->>'full_name',
  NEW.raw_user_meta_data->>'avatar_url',
  'pro',
  TRUE,
  NOW() + INTERVAL '14 days',
  -1,
  TRUE
);
```

Reverse-trial fields on insert: `plan = 'pro'`, `is_trial = TRUE`, `trial_ends_at = NOW() + 14 days`, `revisions_limit = -1`

---

## Trial Logic

- All new accounts start with 14-day Pro access, no credit card required
- `pg_cron` daily at 2am UTC invokes the protected `downgrade-trials` Edge Function: if `is_trial = TRUE AND trial_ends_at < NOW()` → set `plan = 'free'`, `show_url = FALSE`
- Resend emails: Day 11 (3-day warning) and Day 13 (1-day warning)

---

## Auth Pages

| Path | Purpose |
|------|---------|
| `/auth/login` | Login with Google or email/password |
| `/auth/signup` | New account creation |
| `/api/auth/callback` | Google OAuth callback handler |
