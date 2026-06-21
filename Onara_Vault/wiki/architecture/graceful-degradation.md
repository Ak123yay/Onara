# Graceful Degradation

_How Onara preserves safe, useful behavior when an external dependency is unavailable._

## Principle

Onara degrades by capability, not by pretending an operation succeeded.

- Read-only pages show a recoverable Onara error state instead of a blank screen.
- Optional integrations fall back to a lower-capability path.
- Billing, authorization, destructive actions, and deployment approval always fail closed.
- Existing user data is preserved.
- Public messages stay short and do not expose stack traces, secrets, or provider internals.

## Service Matrix

| Dependency | Degraded behavior | Never allowed |
| --- | --- | --- |
| Supabase Auth | Show account/dashboard recovery when the auth service errors | Treat an outage as a logged-out user or bypass authorization |
| Supabase Database | Show scoped recovery UI; retain existing remote data | Guess billing state, plan, ownership, or revision credit |
| Google Places Search | Return an empty degraded result and open manual business entry | Block website creation because Google is unavailable |
| Google Places Photos | Render a neutral Onara SVG placeholder | Emit a broken image or use a non-deployable Places reference |
| FastAPI Pipeline | Stop after a 15-second start timeout, preserve form state, and offer retry | Reserve a permanent site slot or claim generation succeeded |
| Pipeline Progress | Fall back from SSE to polling, then saved Supabase project state | Invent generated preview HTML for real jobs |
| Pipeline Browser Audit | Run strict static checks plus deterministic final QA | Label the site desktop/mobile tested or ignore static blockers |
| Stripe | Show saved billing state and a retryable checkout error | Change plan/payment state without Stripe confirmation |
| Resend | Store leads first and mark email delivery failed/delayed | Lose a lead because email delivery failed |
| GitHub | Keep the live deployment and report backup failure | Take a live site offline only because backup failed |
| Cloudflare | Keep project records and return a retryable hosting/domain error | Delete project data or claim a deployment is active |
| Reviews refresh | Keep the last known review badge data | Replace valid cached reviews after a failed refresh |

## Pipeline V2 Static Release Gate

`PIPELINE_V2_STATIC_AUDIT_FALLBACK=true` enables graceful degradation when Node, Chromium,
Playwright, Lighthouse, or the browser audit process is unavailable.

The static gate blocks:

- Incomplete HTML document structure.
- Missing header, hero, primary CTA, or contact form.
- Unlabeled contact controls.
- Scripts other than JSON-LD, inline event handlers, frames, objects, embeds, meta refresh,
  `javascript:` URLs, and unapproved form actions.
- Empty, localhost, Places-reference, or app-proxy image sources.

The static gate contributes at most 65 deterministic points. The unavailable visual review
receives the existing neutral 15 points, so only a perfect blocker-free static result reaches
the default release threshold of 80. Final deterministic SEO, mobile, and QA checks still run.

Degraded releases use these badges:

- Static safety checked.
- Business facts verified.
- Contact form checked.

They do not use desktop-tested or mobile-tested badges.

Set `PIPELINE_V2_STATIC_AUDIT_FALLBACK=false` to require the full browser audit.

## User Interface Boundaries

- `app/error.tsx`: general route recovery.
- `app/global-error.tsx`: root rendering recovery.
- `app/dashboard/error.tsx`: dashboard/Supabase recovery.
- `app/account/error.tsx`: account and billing recovery.
- `app/not-found.tsx`: missing page/project navigation.
- `RecoverableError.tsx`: shared Onara recovery surface.

## Monitoring

`GET /api/health` reports configuration readiness without exposing secret values. It returns
`503` only when core Supabase app configuration is missing. Optional service degradation
returns `200` with `status: "degraded"`.

## Related Code

- `Onara_Code/app/lib/resilience.ts`
- `Onara_Code/app/components/system/RecoverableError.tsx`
- `Onara_Code/app/app/api/health/route.ts`
- `Onara_Code/app/app/api/places/search/route.ts`
- `Onara_Code/app/app/api/places/photo/route.ts`
- `Onara_Code/pipeline/onara_pipeline/v2/browser_quality.py`
- `Onara_Code/pipeline/onara_pipeline/v2/evaluator.py`
