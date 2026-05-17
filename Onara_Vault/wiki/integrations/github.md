# GitHub Integration — Onara

_GitHub App setup, permissions, `onara-sites` repository structure, and Copilot PAT._

---

## What Onara Uses GitHub For

- **Agent 10**: Commits generated `index.html` to `onara-sites` repository (backup + audit trail)
- **Copilot SDK**: Read-only access for Copilot features (future)

---

## Required Env Vars

| Variable | Where | Value |
|----------|-------|-------|
| `GITHUB_APP_ID` | FastAPI `.env` | Numeric ID from GitHub App settings |
| `GITHUB_APP_PRIVATE_KEY` | FastAPI `.env` | Full `.pem` contents including header/footer lines |
| `GITHUB_APP_INSTALLATION_ID` | FastAPI `.env` | From `/settings/installations/{number}` |
| `GITHUB_REPO_OWNER` | FastAPI `.env` | GitHub username owning `onara-sites` |
| `GITHUB_REPO_NAME` | FastAPI `.env` | Always `onara-sites` |
| `COPILOT_GITHUB_TOKEN` | FastAPI `.env` | Fine-grained PAT, Copilot read-only scope |

---

## GitHub App Setup

### 1. Create GitHub App

GitHub → Settings → Developer settings → GitHub Apps → New GitHub App:

- **App name**: `onara-deployer`
- **Homepage URL**: `https://onara.tech`
- **Webhook**: Disable (uncheck "Active")
- **Permissions** → Repository permissions:
  - Contents: **Read and write**
  - Metadata: **Read-only**
- **Where installed**: Only on this account

Click "Create GitHub App" → copy **App ID** → `GITHUB_APP_ID`

### 2. Generate Private Key

GitHub App settings page → "Generate a private key":
- Downloads a `.pem` file
- Copy entire file contents (including `-----BEGIN RSA PRIVATE KEY-----` lines) → `GITHUB_APP_PRIVATE_KEY`
- In FastAPI `.env`: use multi-line syntax or escape newlines as `\n`

### 3. Install the App

GitHub App settings → "Install App" → Install on your account:
- Select "Only select repositories" → choose `onara-sites`
- After install: URL contains installation ID (`/settings/installations/{id}`)
- Copy installation ID → `GITHUB_APP_INSTALLATION_ID`

### 4. Create `onara-sites` Repository

Create repo named `onara-sites` under `GITHUB_REPO_OWNER`'s account. Initialize with a README.

---

## `onara-sites` Repository Structure

Agent 10 commits to this path pattern:

```
onara-sites/
└── sites/
    └── {userId}/
        └── {jobId}/
            └── index.html
```

Each generation creates a new folder by `jobId` — full history preserved. The repo is NOT the live serving path; Cloudflare Pages serves the live site.

---

## Authentication Flow (Agent 10)

1. Mint JWT signed with `GITHUB_APP_PRIVATE_KEY` (10-minute expiry)
2. Exchange JWT for installation access token: `POST /app/installations/{id}/access_tokens`
3. Use installation token for GitHub API calls (commit file)
4. Token cached for the duration of the pipeline job

---

## Copilot PAT

GitHub → Settings → Personal access tokens → Fine-grained tokens:
- Repository access: None (or specific repos)
- Permissions: GitHub Copilot (read-only)
- Copy token → `COPILOT_GITHUB_TOKEN`

---

## Related Files

- `wiki/architecture/env-vars.md` — GitHub env vars reference
- `wiki/architecture/deployment-pipeline.md` — Agent 10 GitHub usage in pipeline
