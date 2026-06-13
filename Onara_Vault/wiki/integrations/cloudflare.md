# Cloudflare Integration — Onara

_Cloudflare Pages setup, Direct Upload API, account config, and Tunnel for dev._

---

## What Onara Uses Cloudflare For

- **Live hosting** for all user-generated sites via Pages Direct Upload API
- Each user gets a unique Pages project → live URL: `{project}.pages.dev`
- Cloudflare Tunnel (dev): exposes the FastAPI host so Next.js can reach it

---

## Required Env Vars

| Variable | Where | Value |
|----------|-------|-------|
| `CLOUDFLARE_ACCOUNT_ID` | FastAPI `.env` | 32-char hex from Workers & Pages dashboard |
| `CLOUDFLARE_API_TOKEN` | FastAPI `.env` | Token with `Cloudflare Pages:Edit` only |

---

## Finding Your Account ID

Cloudflare dashboard → Workers & Pages → Overview → right sidebar → **Account ID** (32-char hex) → `CLOUDFLARE_ACCOUNT_ID`

---

## Creating the API Token

Cloudflare dashboard → My Profile → API Tokens → Create Token → Custom token:

- **Name**: `onara-pages-deployer`
- **Permissions**: Account → Cloudflare Pages → **Edit**
- **Account Resources**: Include → your account
- Create → copy → `CLOUDFLARE_API_TOKEN`

Only `Cloudflare Pages:Edit` — no other permissions.

---

## How Agent 10 Deploys a Site

**Step 1 — Create project (first deploy only)**:
```
POST /v4/accounts/{accountId}/pages/projects
Body: { "name": "onara-{shortUserId}", "production_branch": "main" }
```

**Step 2 — Upload HTML**:
```
POST /v4/accounts/{accountId}/pages/projects/{name}/deployments
Content-Type: multipart/form-data  [file: index.html]
```
Returns `{ url }` — the live URL. Subsequent deploys overwrite the previous.

**Project naming**: `onara-` + first 8 chars of Supabase user UUID.
Example: user `abc12345-...` → `onara-abc12345` → `https://onara-abc12345.pages.dev`

---

## Cloudflare Tunnel (Development)

Run `cloudflared` on the same machine that runs FastAPI.

```bash
# Quick dev tunnel; URL changes each run
cloudflared tunnel --url http://localhost:8000
```

The HTTPS URL Cloudflare assigns → set as `PIPELINE_SERVER_URL` in Next.js `.env.local`.

Use a named tunnel later only if you need a stable development URL. For v1 local development, the quick tunnel is enough.

---

## Common Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| 403 on deployment | Token missing `Pages:Edit` | Recreate token with correct permission |
| 404 after deploy | Cloudflare propagation | Wait 30–60 seconds |
| Tunnel disconnects | Network drop | Re-run `cloudflared tunnel --url http://localhost:8000` |

---

## Related Files

- `wiki/decisions/adr-002.md` — why Cloudflare Pages over Vercel
- `wiki/architecture/deployment-pipeline.md` — Agent 10 deployment steps
- `wiki/architecture/env-vars.md` — `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`
