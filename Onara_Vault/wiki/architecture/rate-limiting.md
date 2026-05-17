# Rate Limiting — Onara

_Three-layer rate limiting strategy: FastAPI (Redis-backed), Next.js middleware (edge sliding window), and frontend 429 handling._

---

## Overview

Rate limiting runs at three independent layers. Each layer protects a different surface:

| Layer | Where | Protects |
|-------|-------|---------|
| 1 | FastAPI | Pipeline abuse — per-plan daily generation limits |
| 2 | Next.js middleware | API route abuse — Google quota, Stripe session spam |
| 3 | Frontend | User experience — shows human messages and upgrade CTAs |

The NIM client already handles 429s with retry logic (built into the AI client library, Phase 16). This doc covers the three new layers.

---

## Layer 1 — FastAPI (Redis-backed slowapi)

### Dependencies

```
slowapi==0.1.9
redis==5.0.0
```

### Setup

```python
# main.py
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

limiter = Limiter(
    key_func=get_remote_address,
    storage_uri="redis://localhost:6379"   # persists across server restarts
)

app = FastAPI()
app.state.limiter = limiter

# Custom 429 handler — returns JSON not HTML
@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    retry_after = exc.headers.get("Retry-After", "3600")
    return JSONResponse(
        status_code=429,
        content={
            "error": "rate_limited",
            "message": f"Generation limit reached for your plan. Try again in {retry_after} seconds.",
            "retryAfter": int(retry_after)
        },
        headers={"Retry-After": retry_after}
    )
```

### Per-Plan Dynamic Limits

```python
# pipeline/routes.py
def get_user_plan_limit(request: Request) -> str:
    """Read plan from request state and return slowapi limit string."""
    user_plan = request.state.user_plan  # set by auth middleware
    limits = {
        "free":    "3/day",
        "starter": "10/day",
        "pro":     "500/day"
    }
    return limits.get(user_plan, "3/day")

def get_user_key(request: Request) -> str:
    """Key on user_id, not IP — shared IPs should not share limits."""
    return request.state.user_id

@app.post("/pipeline/start")
@limiter.limit(get_user_plan_limit, key_func=get_user_key)
async def start_pipeline(request: Request, body: PipelineStartRequest):
    ...
```

**Limit table:**

| Plan | Daily pipeline limit | Resets |
|------|---------------------|--------|
| Free | 3 per day | Midnight UTC |
| Starter | 10 per day | Midnight UTC |
| Pro | 500 per day | Midnight UTC |

_Note: These are pipeline call limits. Revision limits are tracked separately in Supabase (`revisions_used`) and enforced by the Next.js `/api/revision` route before the pipeline is ever called._

### Redis Connection

`REDIS_URL` is already in the env template (`[FAST]`). In dev: `redis://localhost:6379`. In production (DigitalOcean): Redis Cloud URL or local Redis on the same Droplet.

---

## Layer 2 — Next.js Middleware (Sliding Window)

Next.js middleware runs at the Vercel edge before any API route handler. Uses an in-memory `Map` at launch; upgrades to Upstash Redis for production multi-region support (see Production Upgrade Path).

### Implementation

```typescript
// middleware.ts — root of Next.js project
import { NextRequest, NextResponse } from "next/server"

const requestCounts = new Map<string, { count: number; resetAt: number }>()

function getRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now()
  const entry = requestCounts.get(key)

  if (!entry || now > entry.resetAt) {
    requestCounts.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs }
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }

  entry.count++
  return { allowed: true, remaining: limit - entry.count, resetAt: entry.resetAt }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // /api/places: 20/minute per IP — Google Places quota protection
  if (pathname.startsWith("/api/places")) {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown"
    const result = getRateLimit(`places:${ip}`, 20, 60_000)

    if (!result.allowed) {
      return NextResponse.json(
        {
          error: "rate_limited",
          message: "Too many searches. Please wait a moment before trying again.",
          retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000)
        },
        { status: 429 }
      )
    }
  }

  // /api/generate and /api/revision: per-plan daily limits per user
  if (pathname === "/api/generate" || pathname === "/api/revision") {
    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 })
    }

    let userId: string
    let plan: string

    try {
      const payload = JSON.parse(atob(authHeader.replace("Bearer ", "").split(".")[1]))
      userId = payload.sub
      plan = payload.user_metadata?.plan ?? "free"
    } catch {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 })
    }

    const planLimits: Record<string, number> = { free: 3, starter: 10, pro: 50 }
    const dailyLimit = planLimits[plan] ?? 3
    const result = getRateLimit(`generate:${userId}`, dailyLimit, 24 * 60 * 60 * 1000)

    if (!result.allowed) {
      return NextResponse.json(
        {
          error: "rate_limited",
          message: plan === "free"
            ? `You've reached the free plan limit of 3 generations per day. Upgrade for more.`
            : `You've reached your ${plan} plan limit of ${dailyLimit} generations today.`,
          retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000),
          upgradeUrl: "/pricing"
        },
        { status: 429 }
      )
    }
  }

  // /api/billing/create-checkout: 5/hour per user — prevents Stripe session spam
  if (pathname === "/api/billing/create-checkout") {
    const authHeader = request.headers.get("authorization")
    if (authHeader) {
      try {
        const payload = JSON.parse(atob(authHeader.replace("Bearer ", "").split(".")[1]))
        const userId = payload.sub
        const result = getRateLimit(`stripe:${userId}`, 5, 60 * 60 * 1000)

        if (!result.allowed) {
          return NextResponse.json(
            {
              error: "rate_limited",
              message: "Too many checkout attempts. Please wait an hour before trying again.",
              retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000)
            },
            { status: 429 }
          )
        }
      } catch {
        // Let the route handler reject with 401
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/api/places/:path*",
    "/api/generate",
    "/api/revision",
    "/api/billing/create-checkout"
  ]
}
```

### Rate Limit Table

| Route | Key | Limit | Window | Reason |
|-------|-----|-------|--------|--------|
| `/api/places/*` | IP address | 20 requests | 1 minute | Google Places API quota protection |
| `/api/generate` | `user.id` by plan | 3 / 10 / 50 | 24 hours | Plan enforcement — defence-in-depth alongside FastAPI |
| `/api/revision` | `user.id` by plan | 3 / 10 / 50 | 24 hours | Same as generate |
| `/api/billing/create-checkout` | `user.id` | 5 | 1 hour | Prevents Stripe session spam |

### 429 Response Shape

```json
{
  "error": "rate_limited",
  "message": "Human-readable string for display",
  "retryAfter": 3600,
  "upgradeUrl": "/pricing"
}
```

`upgradeUrl` is present only on plan-limit responses. The frontend uses it to show the upgrade CTA.

---

## Layer 3 — Frontend (Graceful 429 Handling)

### Hook

```typescript
// hooks/useGenerateSite.ts
type RateLimitState = {
  limited: boolean
  message: string
  retryAfter: number
  upgradeUrl?: string
}

export function useGenerateSite() {
  const [rateLimitState, setRateLimitState] = useState<RateLimitState | null>(null)

  async function generate(payload: GeneratePayload) {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })

    if (res.status === 429) {
      const data = await res.json()
      setRateLimitState({
        limited: true,
        message: data.message,
        retryAfter: data.retryAfter,
        upgradeUrl: data.upgradeUrl
      })
      return
    }

    setRateLimitState(null)
    // handle success...
  }

  return { generate, rateLimitState }
}
```

### UI Component

```tsx
// components/RateLimitBanner.tsx
export function RateLimitBanner({ message, retryAfter, upgradeUrl }: {
  message: string
  retryAfter: number
  upgradeUrl?: string
}) {
  const router = useRouter()
  const timeLabel = retryAfter < 120
    ? `${retryAfter} seconds`
    : `${Math.ceil(retryAfter / 60)} minutes`

  return (
    <div className="rounded-md bg-amber-50 border border-amber-200 p-4">
      <p className="text-sm text-amber-800">{message}</p>
      <p className="text-xs text-amber-600 mt-1">Try again in {timeLabel}.</p>
      {upgradeUrl && (
        <button
          onClick={() => router.push(upgradeUrl)}
          className="mt-3 text-sm font-medium text-amber-900 underline"
        >
          Upgrade your plan →
        </button>
      )}
    </div>
  )
}
```

### Places Search

```typescript
if (res.status === 429) {
  const data = await res.json()
  setSearchError(`Searching too fast. Please wait ${data.retryAfter} seconds.`)
  return
}
```

**Behaviour by route:**

| 429 source | UI response |
|-----------|-------------|
| `/api/places` | Inline search error with retry countdown |
| `/api/generate` (free limit) | RateLimitBanner with upgrade CTA |
| `/api/generate` (paid limit) | RateLimitBanner with retry time, no CTA |
| `/api/billing/create-checkout` | Toast: "Too many checkout attempts" |

---

## Production Upgrade Path — Upstash Redis

The in-memory `Map` breaks under multiple Vercel edge regions (each has its own Map). Replace with Upstash Redis when deploying to production:

**1. Sign up**: console.upstash.com — free tier: 10,000 requests/day

**2. Install**:
```
npm install @upstash/ratelimit @upstash/redis
```

**3. Replace the Map**:
```typescript
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

const redis = Redis.fromEnv()

const placesLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, "1 m"),
  prefix: "rl:places"
})

const generateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "24 h"),
  prefix: "rl:generate"
})

const stripeLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "1 h"),
  prefix: "rl:stripe"
})
```

**4. New env vars** (`[NEXT]`):
```
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

This is a drop-in replacement — route logic stays identical. Estimated time: ~20 minutes.

---

## Related Files

- `wiki/architecture/security.md` — auth, webhook signing, CORS
- `wiki/integrations/nvidia-nim.md` — NIM client 429 retry (Layer 3 for AI calls)
- `wiki/architecture/env-vars.md` — `REDIS_URL`, future Upstash vars
- `wiki/architecture/api-reference.md` — full error code table
