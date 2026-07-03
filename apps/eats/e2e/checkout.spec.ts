import { test, expect, type Page } from '@playwright/test'

/**
 * Checkout / payments e2e (ADR-006).
 *
 * CI and local test runs have no STRIPE_SECRET_KEY, so the node runs in
 * offline-settlement mode: placing an order creates a Payment record with
 * provider 'offline' / status SUCCEEDED and the UI states plainly that the
 * total is paid on delivery. This spec drives the full offline happy path
 * end-to-end (owner onboarding → restaurant → menu → customer order) and
 * verifies the generic payments webhook endpoint answers 503 when no
 * PaymentProvider is configured (ADR-006 amendment).
 */

const PASSWORD = 'password-123456'

async function signUp(page: Page, name: string, email: string) {
  await page.goto('/auth/signup')
  await page.getByLabel('Full name').fill(name)
  await page.getByLabel('Email address').fill(email)
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD)
  await page.getByLabel('Confirm password').fill(PASSWORD)
  await page.getByRole('button', { name: /create account/i }).click()
  // Wait for the redirect to '/' before navigating anywhere else — navigating
  // earlier aborts the server action and loses the session cookie.
  await expect(page).toHaveURL('/', { timeout: 20_000 })
}

async function signOut(page: Page) {
  await page.goto('/profile')
  await page.getByRole('button', { name: /sign out/i }).click()
  await expect(page).toHaveURL('/', { timeout: 20_000 })
}

test.describe('Checkout — offline settlement happy path', () => {
  test('customer sees the complete cost, places an order, and the payment is settled directly', async ({
    page,
  }) => {
    test.setTimeout(180_000)

    const suffix = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`
    const ownerEmail = `checkout-owner-${suffix}@example.com`
    const customerEmail = `checkout-customer-${suffix}@example.com`
    const restaurantName = `Checkout Bistro ${suffix}`
    const itemName = `Paella Valenciana ${suffix}`

    // ── Restaurant owner: sign up, onboard, register, add a menu item ──────
    await signUp(page, 'Checkout Owner', ownerEmail)

    await page.goto('/restaurant/onboarding')
    await expect(
      page.getByRole('heading', { level: 1, name: /add your restaurant/i }),
    ).toBeVisible()
    // Explicit opt-in — the acknowledgement is never pre-checked.
    const acknowledgement = page.getByRole('checkbox')
    await expect(acknowledgement).not.toBeChecked()
    await acknowledgement.check()
    await page.getByRole('button', { name: /continue to restaurant registration/i }).click()
    // Depending on whether the client push or the server-side owner redirect
    // wins, we land on /restaurant/register or /restaurant — both prove the
    // owner role was granted. Navigate to registration explicitly.
    await expect(page).toHaveURL(/\/restaurant(\/register)?$/, { timeout: 20_000 })
    await page.goto('/restaurant/register')
    await expect(page.getByLabel('Restaurant name')).toBeVisible({ timeout: 20_000 })

    await page.getByLabel('Restaurant name').fill(restaurantName)
    await page
      .getByLabel('Description')
      .fill('Family-run test bistro serving generous rice dishes.')
    await page.getByLabel('Street address').fill('1 Test Square')
    await page.getByLabel('City').fill('Testville')
    await page.getByLabel('Country').fill('Testland')
    await page.getByRole('button', { name: /register restaurant/i }).click()
    await expect(page).toHaveURL(/\/restaurant$/, { timeout: 20_000 })
    await expect(page.getByText(restaurantName)).toBeVisible()

    // Open menu management and capture the restaurant id from the URL.
    await page.getByRole('link', { name: /manage menu/i }).click()
    await expect(page).toHaveURL(/\/restaurant\/[^/]+\/menu/, { timeout: 20_000 })
    const menuUrlMatch = page.url().match(/\/restaurant\/([^/]+)\/menu/)
    expect(menuUrlMatch).not.toBeNull()
    const restaurantId = menuUrlMatch![1]

    await page.getByLabel('Name', { exact: true }).fill(itemName)
    await page.getByLabel('Description').fill('Saffron rice with vegetables and beans.')
    await page.getByLabel('Price (€)').fill('12.50')
    await page.getByLabel(/^Category/).fill('Mains')
    await page.getByRole('button', { name: /add item/i }).click()
    await expect(page.getByText(itemName)).toBeVisible({ timeout: 20_000 })

    await signOut(page)

    // ── Customer: order from that restaurant ────────────────────────────────
    await signUp(page, 'Checkout Customer', customerEmail)

    await page.goto(`/restaurants/${restaurantId}/order`)
    await expect(
      page.getByRole('heading', { level: 1, name: `Order from ${restaurantName}` }),
    ).toBeVisible({ timeout: 20_000 })

    await page.getByRole('button', { name: `Add one ${itemName}` }).click()

    // The cart already shows the complete cost: items + flat infrastructure fee.
    const cart = page.getByRole('complementary', { name: 'Order summary' })
    // €12.50 appears both as the line subtotal and the Items total.
    await expect(cart.getByText('€12.50').first()).toBeVisible()
    await expect(cart.getByText('Platform infrastructure fee')).toBeVisible()
    await expect(cart.getByText('€0.99')).toBeVisible()
    await expect(cart.getByText('€13.49')).toBeVisible()

    await page.getByLabel('Delivery address').fill('42 Delivery Lane, Testville')
    await page.getByRole('button', { name: /review order/i }).click()

    // ── Complete cost breakdown is visible BEFORE confirmation ─────────────
    await expect(page.getByRole('heading', { name: /review your order/i })).toBeVisible()
    const confirmButton = page.getByRole('button', { name: 'Confirm and pay €13.49' })
    await expect(confirmButton).toBeVisible()
    await expect(page.getByText(`1 × ${itemName}`)).toBeVisible()
    await expect(page.getByText('Platform infrastructure fee')).toBeVisible()
    await expect(
      page.getByText(/no service charges, no surge pricing, and no\s+hidden fees/i),
    ).toBeVisible()

    await confirmButton.click()

    // Offline node: no external redirect — straight to the order detail page.
    await expect(page).toHaveURL(/\/orders\/[A-Za-z0-9]+$/, { timeout: 30_000 })
    await expect(
      page.getByRole('heading', { level: 1, name: `Order from ${restaurantName}` }),
    ).toBeVisible()

    // Order status is PENDING, conveyed as text.
    await expect(page.getByRole('status')).toContainText('Status: Pending')

    // Payment section: offline settlement copy, plainly worded — no dark patterns.
    const paymentSection = page.getByRole('region', { name: 'Payment' })
    await expect(paymentSection.getByText('Settled directly — pay on delivery')).toBeVisible()
    await expect(
      paymentSection.getByText(/you pay the total above on delivery/i),
    ).toBeVisible()

    // The detail page repeats the complete breakdown.
    const costSection = page.getByRole('region', { name: 'Cost breakdown' })
    await expect(costSection.getByText('€12.50')).toBeVisible()
    await expect(costSection.getByText('€0.99')).toBeVisible()
    await expect(costSection.getByText('€13.49')).toBeVisible()

    // ── The order appears in the customer's history with its payment state ─
    await page.goto('/orders')
    await expect(page.getByText(restaurantName)).toBeVisible()
    await expect(page.getByText('€13.49')).toBeVisible()
    await expect(page.getByText('Settled directly — pay on delivery')).toBeVisible()
  })
})

test.describe('Payments webhook endpoint', () => {
  // CI and local test runs configure no PaymentProvider, so the generic
  // webhook endpoint must answer 503 for every request — nothing is ever
  // processed on an offline-settlement node.
  test('answers 503 for a garbage body when no provider is configured', async ({ request }) => {
    const res = await request.post('/api/webhooks/payments', {
      headers: { 'content-type': 'text/plain' },
      data: 'garbage-not-a-provider-event',
      failOnStatusCode: false,
    })
    expect(res.status()).toBe(503)
  })

  test('answers 503 even for a signed-looking payload when no provider is configured', async ({
    request,
  }) => {
    const res = await request.post('/api/webhooks/payments', {
      headers: {
        'content-type': 'application/json',
        'stripe-signature': 't=1,v1=deadbeef',
      },
      data: JSON.stringify({ type: 'checkout.session.completed' }),
      failOnStatusCode: false,
    })
    expect(res.status()).toBe(503)
  })
})
