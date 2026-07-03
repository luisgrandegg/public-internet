import { test, expect, type Page } from '@playwright/test'

/**
 * Full booking flow, end to end against a real database:
 *   1. Sign up a host (host toggle checked), publish a listing via the wizard
 *   2. Sign out, sign up a guest
 *   3. Guest books a date range, sees the confirmation, and finds it in /bookings
 *   4. Booking the same range again is rejected with a clear message
 *
 * The test seeds all of its own data via the UI, uses unique emails/titles per
 * run, and picks a far-future date range so it is safe on any database state.
 */

const runId = Date.now()
const hostEmail = `e2e-booking-host-${runId}@example.com`
const guestEmail = `e2e-booking-guest-${runId}@example.com`
const password = 'password123'
const listingTitle = `E2E booking flat ${runId}`
const listingCity = `Bookington-${runId}`

// Far-future range to avoid colliding with any existing data
function futureDate(daysFromNow: number): string {
  const d = new Date()
  d.setDate(d.getDate() + daysFromNow)
  return d.toISOString().split('T')[0]
}
const checkIn = futureDate(120)
const checkOut = futureDate(123)

async function signUp(page: Page, opts: { name: string; email: string; isHost: boolean }) {
  await page.goto('/auth/signup')
  await page.getByLabel('Full name', { exact: true }).fill(opts.name)
  await page.getByLabel('Email address', { exact: true }).fill(opts.email)
  await page.getByLabel('Password', { exact: true }).fill(password)
  await page.getByLabel('Confirm password', { exact: true }).fill(password)
  if (opts.isHost) {
    await page.getByRole('checkbox', { name: /list my property/i }).check()
  }
  await page.getByRole('button', { name: 'Create account', exact: true }).click()
  // Wait for the post-signup redirect to complete before navigating anywhere
  // else — navigating away earlier aborts the server action and the session
  // cookie is never set.
  await expect(page).toHaveURL('/', { timeout: 15_000 })
  await expect(page.getByRole('button', { name: /sign out/i })).toBeVisible()
}

async function signOut(page: Page) {
  await page.getByRole('button', { name: /sign out/i }).click()
  await expect(page.getByRole('link', { name: 'Sign in', exact: true })).toBeVisible()
}

test.describe.serial('Booking flow', () => {
  let listingUrl: string
  let listingId: string

  test('host signs up and publishes a listing through the wizard', async ({ page }) => {
    await signUp(page, { name: 'E2E Booking Host', email: hostEmail, isHost: true })

    await page.goto('/host/listings/new')

    // Step 1 — Property type
    await page.locator('label[for="propertyType-flat"]').click()
    await page.getByRole('button', { name: 'Next', exact: true }).click()

    // Step 2 — Location
    await page.getByLabel('City', { exact: true }).fill(listingCity)
    await page.getByLabel('Country', { exact: true }).fill('Spain')
    await page.getByRole('button', { name: 'Next', exact: true }).click()

    // Step 3 — Description (min lengths: title 5, description 20)
    await page.getByLabel('Listing title', { exact: true }).fill(listingTitle)
    await page
      .locator('textarea[name="description"]')
      .fill('A lovely self-seeded test flat with plenty of room and great light.')
    await page.getByRole('button', { name: 'Next', exact: true }).click()

    // Step 4 — Photos (at least one valid URL is required to publish)
    await page.getByLabel(/Photo URL 1/).fill('https://example.com/e2e-booking-photo.jpg')
    await page.getByRole('button', { name: 'Next', exact: true }).click()

    // Step 5 — Pricing
    await page.getByLabel(/per night/i).fill('80')
    await page.locator('select[name="maxGuests"]').selectOption('2')
    await page.getByLabel('Bedrooms', { exact: true }).fill('1')
    await page.getByLabel('Bathrooms', { exact: true }).fill('1')
    await page.getByRole('button', { name: 'Next', exact: true }).click()

    // Step 6 — Review + publish
    await page.getByRole('button', { name: 'Publish listing', exact: true }).click()
    await expect(page.getByText('Your listing is published!')).toBeVisible({ timeout: 15_000 })

    // Locate the published listing via search to capture its URL
    await page.goto(`/listings?location=${listingCity}`)
    await page.getByRole('heading', { name: listingTitle }).click()
    await expect(page).toHaveURL(/\/listings\/[^/]+$/)
    listingUrl = new URL(page.url()).pathname
    listingId = listingUrl.split('/').pop() as string
    expect(listingId).toBeTruthy()

    await signOut(page)
  })

  test('guest signs up, books the listing, and sees it confirmed', async ({ page }) => {
    await signUp(page, { name: 'E2E Booking Guest', email: guestEmail, isHost: false })

    // Visit the listing and start the booking flow
    await page.goto(listingUrl)
    await expect(page.getByRole('heading', { name: listingTitle })).toBeVisible()
    await page.getByRole('link', { name: /request to book/i }).click()
    await expect(page).toHaveURL(`${listingUrl}/book`)

    await page.getByLabel('Check-in', { exact: true }).fill(checkIn)
    await page.getByLabel('Check-out', { exact: true }).fill(checkOut)

    // Complete price shown before committing — no hidden fees (constitution)
    await expect(page.getByText(/no additional fees/i)).toBeVisible()

    await page.getByRole('button', { name: 'Confirm booking', exact: true }).click()

    // Booking confirmation page
    await expect(page).toHaveURL(/\/bookings\/[^/]+$/, { timeout: 15_000 })
    await expect(page.getByRole('heading', { name: 'Booking details', exact: true })).toBeVisible()
    await expect(page.getByText(listingTitle)).toBeVisible()

    // Offline settlement (ADR-006): with no payment provider configured the
    // payment is settled directly with the host — the copy says so plainly,
    // and no online payment step ever appears.
    await expect(page.getByRole('heading', { name: 'Payment', exact: true })).toBeVisible()
    await expect(page.getByText('Pay at the property', { exact: true })).toBeVisible()
    await expect(page.getByText(/settled directly with the host/i)).toBeVisible()

    // The booking appears in the guest's booking history with its payment state
    await page.goto('/bookings')
    await expect(page.getByRole('heading', { name: 'My bookings', exact: true })).toBeVisible()
    await expect(page.getByText(listingTitle)).toBeVisible()
    await expect(page.getByText('Pay at the property', { exact: true })).toBeVisible()
  })

  test('booking the same date range again is rejected with a clear message', async ({ page }) => {
    // Sign in as the same guest — page.request shares the session cookie
    await page.goto('/auth/signin')
    await page.getByLabel('Email address', { exact: true }).fill(guestEmail)
    await page.getByLabel('Password', { exact: true }).fill(password)
    await page.getByRole('button', { name: /sign in/i }).click()
    await expect(page.getByRole('button', { name: /sign out/i })).toBeVisible({ timeout: 15_000 })

    const response = await page.request.post('/api/bookings', {
      data: { listingId, checkIn, checkOut },
    })
    expect(response.status()).toBe(409)
    const body = await response.json()
    expect(body.error.code).toBe('CONFLICT')
    expect(body.error.message).toMatch(/dates are not available/i)
  })

  test('resume-payment endpoint answers 503 in offline settlement mode', async ({ page }) => {
    // Sign in as the guest again — CI runs without a payment provider, so
    // there is never an online payment to resume: the endpoint must say so
    // with 503 PAYMENTS_NOT_CONFIGURED rather than hand out a checkout URL.
    await page.goto('/auth/signin')
    await page.getByLabel('Email address', { exact: true }).fill(guestEmail)
    await page.getByLabel('Password', { exact: true }).fill(password)
    await page.getByRole('button', { name: /sign in/i }).click()
    await expect(page.getByRole('button', { name: /sign out/i })).toBeVisible({ timeout: 15_000 })

    const bookingsRes = await page.request.get('/api/bookings')
    expect(bookingsRes.status()).toBe(200)
    const bookings = (await bookingsRes.json()).data
    expect(bookings.length).toBeGreaterThan(0)

    const payRes = await page.request.post(`/api/bookings/${bookings[0].id}/pay`)
    expect(payRes.status()).toBe(503)
    const payBody = await payRes.json()
    expect(payBody.error.code).toBe('PAYMENTS_NOT_CONFIGURED')
  })
})
