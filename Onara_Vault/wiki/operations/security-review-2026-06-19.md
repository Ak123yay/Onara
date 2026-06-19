# Security Review - 2026-06-19

Scope: Phase 28 pre-launch security review covering Supabase RLS, service-role exposure, API key rotation planning, secret-pattern scanning, and dependency vulnerability audits.

## Summary

Status: review completed with one residual package risk.

- RLS audit: pass after adding migration `019_harden_training_examples_access.sql`.
- Tracked-file secret scan: pass, no standalone key-like tokens found.
- Node dependency audit: pass after forcing patched `postcss@8.5.15`.
- Python dependency audit: mostly remediated; `chromadb@1.5.9` still reports `CVE-2026-45829` with no fixed release available.
- API key rotation: manual provider-dashboard action remains; checklist below.

## Code Changes

- Added `Onara_Code/supabase/migrations/019_harden_training_examples_access.sql`.
- Added `postcss: 8.5.15` override in `Onara_Code/app/pnpm-workspace.yaml`.
- Updated pipeline requirements:
  - `fastapi==0.137.2`
  - `PyJWT[crypto]==2.13.0`
  - `starlette==1.3.1`
  - `github-copilot-sdk==1.0.1`

## RLS Audit

Tables checked:

- `users`
- `projects`
- `pipeline_jobs`
- `revisions`
- `pipeline_errors`
- `gbp_sync_log`
- `stripe_events`
- `revision_messages`
- `leads`
- `training_examples`
- `support_threads`

Result:

- RLS is enabled on user-owned tables.
- Base table public access is revoked by migration `008_harden_public_api_access.sql`.
- `leads` and `support_threads` are service-role only.
- `training_examples` now explicitly revokes access from `public`, `anon`, and `authenticated`, then grants only `service_role`.
- User training-data consent still uses `set_training_data_consent(...)`.
- User training-example deletion still runs through the account server action with the service-role client after auth verification.

## Vulnerability Audit

Commands run:

```powershell
pnpm.cmd audit --prod
python -m pip_audit --local --progress-spinner off
python -m pip_audit --local --progress-spinner off --desc on
```

Node result:

- Initial finding: `postcss <8.5.10` through Next.
- Fix: forced `postcss@8.5.15`.
- Final result: no known production npm vulnerabilities.

Python result:

- Fixed `PyJWT` findings by upgrading to `2.13.0`.
- Fixed `Starlette` findings by upgrading FastAPI/Starlette pins.
- Remaining: `chromadb@1.5.9` reports `CVE-2026-45829`.
- Exposure note: Onara uses `chromadb.PersistentClient(path=...)`, not a public Chroma HTTP server. Do not expose a Chroma server endpoint until a fixed release is available.

`pip-audit -r requirements.txt` hit a repeated pip/PyPI incomplete-read error during dependency resolution, so the final Python result is based on the installed local environment after `pip install -r requirements.txt`.

## Secret Scan

Tracked files were scanned for standalone key-like tokens:

- Stripe secret keys
- Stripe webhook secrets
- NVIDIA NIM keys
- Google API keys
- GitHub PATs
- Resend keys
- JWT-like tokens

Result: no tracked-file secret patterns found.

## API Key Rotation Checklist

Rotate one provider at a time, update all runtime surfaces, then verify before moving to the next key.

Order:

1. `PIPELINE_API_SECRET` and `CRON_SECRET`
2. `SUPABASE_SERVICE_ROLE_KEY` / Supabase JWT secrets if rotated in Supabase
3. `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`
4. `GOOGLE_PLACES_API_KEY`, `GOOGLE_OAUTH_CLIENT_SECRET`
5. `CLOUDFLARE_API_TOKEN`
6. `RESEND_API_KEY`, `RESEND_WEBHOOK_SECRET`
7. `NVIDIA_NIM_API_KEY`
8. `GITHUB_APP_PRIVATE_KEY`, `COPILOT_GITHUB_TOKEN`
9. `NEXTAUTH_SECRET`, `SUPPORT_EMAIL_WEBHOOK_SECRET`

Update locations:

- Vercel production environment variables
- Mini PC pipeline `.env`
- Supabase Edge Function secrets
- Supabase Vault secrets for cron-triggered Edge Functions
- Stripe webhook endpoint configuration
- Google OAuth client configuration if OAuth secret changes

Verification after rotation:

```powershell
pnpm.cmd type-check
pnpm.cmd build
python -m compileall -q .
Invoke-WebRequest -Method GET https://pipeline.onara.tech/health -UseBasicParsing
```

Manual provider-dashboard rotation is still required before launch.
