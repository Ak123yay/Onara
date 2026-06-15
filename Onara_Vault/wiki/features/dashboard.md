# Dashboard — UI & Account Features

The dashboard is the logged-in user's primary interface. It covers: My Sites list, site actions, account/billing, and onboarding.

---

## Layout

```
┌─────────────────────────────────────────┐
│  Sidebar         │  Main content area   │
│  - My Sites      │                      │
│  - Account       │                      │
│  - Billing       │                      │
│  - [Upgrade CTA] │                      │
└─────────────────────────────────────────┘
```

Sidebar is persistent on desktop, collapsible on mobile. The upgrade CTA is shown permanently in the sidebar for Free/Trial users — hidden for paid plans.

---

## My Sites View

**Route**: `/dashboard`

Displays all the user's projects. Each site card shows:

| Field | Source |
|-------|--------|
| Business name | `projects.business_name` |
| Site status | `projects.status` (live / generating / failed / suspended) |
| Public URL | `projects.public_url` — only shown if `users.show_url = true` |
| Last deployed | `projects.last_deployed_at` |
| Revision count | `users.revisions_used` / `users.revisions_limit` |

**Actions per site card**:
- **Preview** — opens `/api/preview/:project_id` in iframe or new tab (available on all plans)
- **Visit site** — links to `public_url` (hidden on free tier after trial)
- **Revise** — opens revision form (disabled if at monthly limit)
- **Retry** — shown only if `status = 'failed'`, triggers new pipeline job (no revision deducted)

**Empty state**: First-time users see a "Build your website" CTA that starts the build flow.

---

## Build Flow Entry

**Route**: `/dashboard/build`

4-step flow:
1. **Search** — Google Places search input with debounce (300ms)
2. **Confirm** — Business confirmation card (name, address, phone, hours, photo)
3. **Style** — Color scheme preference (auto/manual), tone selector
4. **Generate** — Triggers pipeline, shows SSE progress timeline

See `wiki/features/build-flow.md` for full detail.

---

## Site Preview

**Route**: `/dashboard/preview/:project_id`

Renders the generated HTML in a full-screen iframe. The HTML is served from Supabase storage by `/api/preview/:project_id`.

- Available on all plans (free users can always preview)
- No Cloudflare public URL shown if `users.show_url = false` (free after trial)
- Includes a "Your site is live at:" banner when `show_url = true`

---

## Revision Interface

Appears on each site card when the user clicks "Revise."

- Text area: "Describe what you'd like to change..."
- Character limit: 500
- Counter badge: revisions remaining this month
- Submit → `POST /api/revision` → returns `revision_id` + new progress timeline
- Disable state: if `revisions_used >= revisions_limit`, show "Upgrade for more revisions" message

---

## Account Page

**Route**: `/dashboard/account`

Displays:
```
Name:         [full_name from Google OAuth]
Email:        [email]
Plan:         Free / Starter / Pro
Trial ends:   [trial_ends_at if is_trial = true]
Revisions:    4 / 10 used this month | Resets Jun 15
```

**Upgrade button**: Opens Stripe Checkout via `POST /api/billing/create-checkout` with the appropriate `price_id`.

**Manage billing button**: Opens Stripe Customer Portal via `POST /api/billing/portal`. Available after first paid subscription. Allows plan changes, cancellation, invoice downloads.

**Agent 6 model tier**: Shows which Agent 6 model route the user's plan uses. Active trial users are treated as Pro for model gating. Starter users can use GitHub Copilot SDK options when `COPILOT_GITHUB_TOKEN` is configured. Pro users can see OpenAI/Anthropic options, but those provider routes stay disabled until their backend clients exist.

---

## Onboarding State

`users.onboarding_complete = false` on signup. After the user successfully generates their first site, set to `true`.

While `onboarding_complete = false`:
- Show onboarding checklist overlay on dashboard (3 steps: search → confirm → generate)
- Highlight the build flow entry point
- Suppress the upgrade upsell (don't push billing before first value moment)

---

## Plan Limit Enforcement in UI

| User state | Preview | Public URL | Revise | Build new |
|-----------|---------|------------|--------|-----------|
| Trial (any day) | ✅ | ✅ | ✅ unlimited | ✅ up to 3 sites during trial |
| Free (post-trial) | ✅ | ❌ hidden | ✅ 3/month | ✅ 1 site |
| Starter | ✅ | ✅ | ✅ 10/month | ✅ 1 site |
| Pro | ✅ | ✅ | ✅ unlimited | ✅ 3 sites |
| Past due | ✅ | ❌ | ❌ | ❌ |

All enforcement is also in the API (`/api/generate`, `/api/revisions/create`) — the UI state is a UX layer, not the security layer.
