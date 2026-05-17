# Phase 1 Setup Guide — GitHub Account & Copilot PAT

_Step-by-step execution for the first two Phase 1 tasks. Each section ends with what to paste into `.env.template`._

---

## Task 1 — Create GitHub Account + GitHub Education Verification

### Why GitHub Education?

GitHub Education gives students free GitHub Pro, which includes:
- Unlimited private repositories
- GitHub Copilot access (free during enrollment)
- GitHub Pages, Actions minutes, Packages storage

Onara's Copilot PAT (Task 2) only works if you have Copilot access. Education verification unlocks this at zero cost.

**Requirement**: A `.edu` email address from your school.

---

### Step 1A — Create the GitHub Account (skip if you already have one)

1. Go to **github.com** → click **Sign up**
2. Enter your `.edu` email address (not Gmail — use your school email)
3. Create a username — keep it professional (your real name or initials)
4. Complete email verification
5. Choose the **Free** plan (Education upgrade comes next)

**Note your GitHub username** — needed as `GITHUB_REPO_OWNER` in `.env`.

---

### Step 1B — Submit GitHub Education Verification

1. Go to **education.github.com/discount_requests/application**
2. Click **"Get student benefits"**
3. Sign in with your GitHub account if prompted
4. On the application form:
   - **Email**: Select your `.edu` email (or add it under GitHub Settings → Emails if not listed)
   - **School name**: Your university / college
   - **How do you plan to use GitHub?**: Building a SaaS product for local businesses as a student project
5. **Proof of enrollment** — upload any one of:
   - Student ID card (phone photo is fine)
   - Current class schedule or enrollment confirmation email
   - Any official document showing your name + school + active enrollment
6. Submit

**Timeline**: Approval takes 1–7 days. You'll get an email at your `.edu` address. You can proceed with all other setup steps while waiting — Copilot access is not needed until Phase 16 (AI Client Library).

---

### What to record after Task 1

| Value | Where to paste |
|-------|---------------|
| Your GitHub username | `GITHUB_REPO_OWNER` in FastAPI `.env` |

---

## Task 2 — Generate Fine-Grained PAT for Copilot SDK

**Token spec:**
- **Name**: `Onara Copilot`
- **Expiration**: 90 days
- **Repository access**: No repositories
- **Permissions**: GitHub Copilot → Read-only only

---

### Step 2A — Navigate to PAT creation

1. Log into GitHub
2. Click your profile photo (top right) → **Settings**
3. Scroll to the bottom of the left sidebar → **Developer settings**
4. Click **Personal access tokens** → **Fine-grained tokens**
5. Click **"Generate new token"**

---

### Step 2B — Configure the token

| Field | Value |
|-------|-------|
| Token name | `Onara Copilot` |
| Expiration | 90 days |
| Description | `Copilot SDK read access for Onara pipeline` |
| Resource owner | Your personal account |
| Repository access | **No repositories** |

Under **Permissions**, find **"GitHub Copilot"** → set to **Read-only**. Leave all other permissions as "No access".

Click **"Generate token"**.

---

### Step 2C — Save the token immediately

GitHub shows the token **once only**. Copy it before closing the page.

Format: `github_pat_XXXXXXXXXXXXXXXXXXX...`

Paste into `Onara_Code/config/.env.template` as `COPILOT_GITHUB_TOKEN`.

---

### What to record after Task 2

| Value | Where to paste |
|-------|---------------|
| `github_pat_...` token | `COPILOT_GITHUB_TOKEN` in FastAPI `.env` |

---

## Status After Both Tasks

- [x] GitHub account created / confirmed
- [x] GitHub Education submitted (approval pending — proceed with other tasks)
- [x] `COPILOT_GITHUB_TOKEN` collected

**Remaining Phase 1 tasks:**
- Create GitHub App (Onara Deployer) — `wiki/integrations/github.md`
- Create `onara-sites` repo (private)
- Set up Google Cloud project — `wiki/integrations/google.md`

---

## Related Files

- `wiki/integrations/github.md` — GitHub App setup (Phase 1 Tasks 3–4)
- `wiki/dev/setup.md` — full local env setup sequence
- `wiki/architecture/env-vars.md` — all 45 env vars
- `Onara_Code/config/.env.template` — paste collected values here
