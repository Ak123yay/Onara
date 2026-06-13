# UI — Onara

_Design system, build flow UX, and dashboard UX._

Source of truth for frontend look and layout: `Onara_Design/` and `Onara_Vault/Onara_Design/`.

Ignore older raw styling notes when they conflict with `Onara_Design`. The Next.js frontend should closely match the design reference files.

---

## Design System — Onara App Theme

The Onara app (dashboard + marketing) follows the visual system in `Onara_Design/`. Use those files as the implementation reference for layout, spacing, typography, components, and screen composition.

Primary design reference files:
- `Onara_Design/p-landing.jsx` — landing page
- `Onara_Design/p-auth.jsx` — auth screens
- `Onara_Design/p-dash.jsx` — dashboard
- `Onara_Design/p-build.jsx` — build flow
- `Onara_Design/p-generate.jsx` — generation/progress UI
- `Onara_Design/p-sitemocks.jsx` — generated site references
- `Onara_Design/proto.css` — CSS reference

### Color Tokens

| Token | Hex | Usage |
|-------|-----|-------|
| `paper.DEFAULT` | `#faf8f3` | Base app background |
| `paper.2` | `#f4f1ea` | Section backgrounds |
| `paper.3` | `#ebe7df` | Hover / pressed |
| `ink.DEFAULT` | `#1a1a1a` | Primary text |
| `ink.3` | `#6a6a6a` | Secondary text, labels |
| `accent.DEFAULT` | `#c2541f` | Primary CTAs, links, highlights |
| `accent.2` | `#a8451e` | Hover state |
| `accent.soft` | `#f3e0cf` | Accent fill on light bg |
| `leaf` | `#5a7d5a` | Success / live state |
| `warn` | `#d8a85a` | Warning |
| `error` | `#b8423a` | Error state |

### Typography

| Family | Usage |
|--------|-------|
| Fraunces (serif) | Display headings, marketing headlines |
| Inter (sans) | All UI text, body |
| JetBrains Mono | Labels, eyebrows, status text |
| Caveat (hand) | Sparingly — handwritten marketing accents |

### Border Radius

Sharp, low-radius aesthetic. Default: `4px`, cards: `6px`, pills: `9999px`

### Animations

| Name | Usage |
|------|-------|
| `fadein-up` | Entry animation for cards/sections |
| `shimmer` | Loading skeleton |
| `pulse-on` | Live status indicator (terracotta pulse ring) |
| `marquee` | Logo strip / scrolling text |

---

## Build Flow UX (4 Steps)

1. **Search** — type business name → calls `/api/places/search` → shows Google listings
2. **Confirm** — select listing → business confirmation card (name, address, phone, hours, photos) → amber highlight on missing fields + manual input fallback → user edits if needed → confirms
3. **Style Preferences** — color scheme preference (auto / custom), tone (professional / friendly / bold), additional context
4. **Generate** — "Build My Website" → AgentProgress component (10 steps, live status via SSE) → preview iframe streams HTML chunks → on done: public URL shown

**Microcopy**:
- Search placeholder: "Search your business name..."
- Confirm CTA: "Yes, Build My Website →"
- Loading: "Building your website..."
- Success toast: "Your site is live!"
- Error: "Something went wrong. Your revision wasn't used — try again."

---

## Dashboard UX

- **My Sites** — project list with status badge, live URL (plan-gated), last deployed date
- **Site detail** — preview iframe + revision input + revision counter + reset date
- **Account** — plan display, trial countdown, revision usage, upgrade CTA
- **Empty state** — "You haven't built your site yet. It takes 60 seconds." + Build CTA

---

## Landing Page Sections

1. Nav: Logo + How It Works / Pricing / Sign In + "Get Your Free Website →"
2. Hero: "Your professional website, built in 60 seconds." + "Build My Website — It's Free"
3. Logo bar: city trust strip
4. How It Works: 3-step (Search → Confirm → Live)
5. Demo: 60-second screen recording placeholder
6. Features: 6 feature cards
7. Social Proof: 3 testimonials
8. Pricing: Free / Starter $12 / Pro $29 + FAQ
9. Final CTA: "Your competitors already have websites."
10. Footer: product / legal / support links

**SEO meta**:
- Title: `Onara — AI Website Builder for Local Service Businesses`
- Description: `Onara builds a professional website for your business in 60 seconds using your Google Business listing. No code, no design skills. Free 14-day trial.`

---

## Note on User-Generated Site Palettes

The app design system is for the Onara product UI only. Generated user sites use industry-specific palettes selected by Agent 3 (Style Agent) and implemented in `Onara_Code/pipeline/agents/`.
