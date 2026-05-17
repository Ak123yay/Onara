# E2E Tests — Scenarios

Golden-path and critical edge-case scenarios. Framework: **Playwright**.

---

## Setup

```typescript
// playwright.config.ts
export default {
  baseURL: 'http://localhost:3000',
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  globalSetup: './tests/global-setup.ts', // seeds test user in Supabase
}
```

Test user: `test@onara.dev` — seeded with a known plan state in Supabase test project.

---

## Scenario 1 — Full Build Flow (Golden Path)

**Coverage**: Landing → Sign in → Search → Confirm → Generate → Live site

```typescript
test('user builds a site end-to-end in under 90 seconds', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: /get started/i }).click()

  // Auth
  await page.getByRole('button', { name: /continue with google/i }).click()
  // (OAuth handled in global-setup via Supabase test credentials)

  // Build flow — step 1: Search
  await page.getByPlaceholder(/search your google business/i).fill("Mike's Plumbing Austin")
  await page.waitForSelector('[data-testid="search-results"]')
  await page.getByText("Mike's Plumbing").click()

  // Step 2: Confirm
  await expect(page.getByText('123 Main St')).toBeVisible()
  await page.getByRole('button', { name: /looks right/i }).click()

  // Step 3: Style (default selections are fine)
  await page.getByRole('button', { name: /generate my site/i }).click()

  // Step 4: Progress timeline
  await expect(page.getByText(/analyzing your business/i)).toBeVisible()

  // Wait for pipeline to complete (up to 90s)
  await expect(page.getByText(/your site is live/i)).toBeVisible({ timeout: 90000 })

  // Verify preview
  const previewFrame = page.frameLocator('iframe[data-testid="preview"]')
  await expect(previewFrame.getByText(/mike's plumbing/i)).toBeVisible()
})
```

---

## Scenario 2 — Trial Expiry Downgrade

**Coverage**: Free tier limits applied after trial ends

```typescript
test('free user after trial cannot see public URL', async ({ page }) => {
  // Log in as trial-expired test user
  await loginAs(page, 'trial-expired@onara.dev')
  await page.goto('/dashboard')

  // Public URL should be hidden
  await expect(page.getByText(/pages\.dev/)).not.toBeVisible()

  // Preview still works
  await page.getByRole('button', { name: /preview/i }).click()
  await expect(page.locator('iframe')).toBeVisible()

  // Upgrade CTA visible
  await expect(page.getByText(/upgrade to see your live url/i)).toBeVisible()
})
```

---

## Scenario 3 — Revision Limit Enforcement

**Coverage**: Correct error when user hits monthly revision cap

```typescript
test('shows revision limit message when cap reached', async ({ page }) => {
  // User with revisions_used = revisions_limit
  await loginAs(page, 'revision-maxed@onara.dev')
  await page.goto('/dashboard')

  await page.getByRole('button', { name: /revise/i }).click()
  await page.getByRole('textbox').fill('Change the phone number')
  await page.getByRole('button', { name: /submit revision/i }).click()

  await expect(page.getByText(/revision limit reached/i)).toBeVisible()
  await expect(page.getByText(/resets/i)).toBeVisible() // shows reset date
})
```

---

## Scenario 4 — Stripe Upgrade Flow

**Coverage**: Checkout session created and redirects correctly

```typescript
test('clicking upgrade opens Stripe Checkout', async ({ page, context }) => {
  await loginAs(page, 'free@onara.dev')
  await page.goto('/dashboard/account')

  // Listen for new tab (Stripe Checkout opens in same tab or redirect)
  const [response] = await Promise.all([
    page.waitForResponse('/api/billing/create-checkout'),
    page.getByRole('button', { name: /upgrade/i }).click()
  ])

  const body = await response.json()
  expect(body.checkout_url).toMatch(/checkout\.stripe\.com/)
})
```

---

## Scenario 5 — Pipeline Failure Recovery

**Coverage**: Retry button appears on failed job, no revision deducted

```typescript
test('retry button shows on failed job and does not decrement revisions', async ({ page }) => {
  // Seed a project with a failed pipeline job
  await loginAs(page, 'failed-job@onara.dev')
  await page.goto('/dashboard')

  await expect(page.getByText(/generation failed/i)).toBeVisible()
  await expect(page.getByRole('button', { name: /retry/i })).toBeVisible()

  // Note revision count before
  const revisionsBefore = await page.getByTestId('revisions-used').textContent()

  await page.getByRole('button', { name: /retry/i }).click()
  await expect(page.getByText(/analyzing your business/i)).toBeVisible()

  // Revision count should not change
  const revisionsAfter = await page.getByTestId('revisions-used').textContent()
  expect(revisionsBefore).toBe(revisionsAfter)
})
```

---

## Scenario 6 — Duplicate Job Prevention

**Coverage**: Second generate request while first is running returns 429

```typescript
test('cannot submit two generations for the same project simultaneously', async ({ page }) => {
  await loginAs(page, 'test@onara.dev')

  // Start a generation
  await startBuildFlow(page)
  await page.getByRole('button', { name: /generate/i }).click()

  // Wait for queued state
  await expect(page.getByText(/in queue/i)).toBeVisible()

  // Try to navigate back and start again — button should be disabled
  await page.goto('/dashboard/build')
  const generateBtn = page.getByRole('button', { name: /generate/i })
  await expect(generateBtn).toBeDisabled()
})
```

---

## Scenario 7 — SSE Stream Reconnect

**Coverage**: Frontend reconnects after SSE drop and shows correct state

```typescript
test('reconnects SSE and shows current state after drop', async ({ page }) => {
  await loginAs(page, 'test@onara.dev')
  await startActiveGeneration(page)

  // Simulate network drop by blocking SSE requests
  await page.route('/api/stream/**', route => route.abort())
  await page.waitForTimeout(2000)  // wait for reconnect attempt

  // Unblock
  await page.unroute('/api/stream/**')

  // Progress should resume from correct step
  await expect(page.getByText(/analyzing/i).or(page.getByText(/writing/i))).toBeVisible()
})
```

---

## Running E2E Tests

```bash
# Install Playwright
pnpm dlx playwright install

# Run all tests
pnpm playwright test

# Run specific scenario
pnpm playwright test e2e/build-flow.spec.ts

# Run with UI (for debugging)
pnpm playwright test --ui

# Generate test report
pnpm playwright show-report
```

---

## Test Data Management

Test users are seeded in `tests/global-setup.ts` using `SUPABASE_SERVICE_ROLE_KEY`. Each test user has a stable UUID and known state (plan, revision count, projects). Never use production credentials in E2E tests.

```typescript
// tests/global-setup.ts
export default async function globalSetup() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Seed test users
  await seedTestUser(supabase, 'test@onara.dev', { plan: 'trial', revisions_used: 0 })
  await seedTestUser(supabase, 'trial-expired@onara.dev', { plan: 'free', is_trial: false })
  await seedTestUser(supabase, 'revision-maxed@onara.dev', { plan: 'free', revisions_used: 3 })
}
```
