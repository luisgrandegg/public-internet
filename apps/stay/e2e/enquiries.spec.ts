import { test, expect } from '@playwright/test'

test.describe('Guest enquiries inbox', () => {
  test('redirects to sign-in when logged out', async ({ page }) => {
    await page.goto('/enquiries')
    await expect(page).toHaveURL('/auth/signin')
  })

  test('GET /api/enquiries returns 401 when not authenticated', async ({ request }) => {
    const response = await request.get('/api/enquiries')
    expect(response.status()).toBe(401)
  })

  test('signed-in guest with no enquiries sees the empty state', async ({ page }) => {
    // Create a fresh account via the UI — the session cookie is set by the sign-up action
    await page.goto('/auth/signup')
    await page.getByLabel('Full name', { exact: true }).fill('Enquiries E2E User')
    await page
      .getByLabel('Email address', { exact: true })
      .fill(`e2e-enquiries-${Date.now()}@example.com`)
    await page.getByLabel('Password', { exact: true }).fill('password123')
    await page.getByLabel('Confirm password', { exact: true }).fill('password123')
    await page.getByRole('button', { name: 'Create account', exact: true }).click()

    // Successful sign-up sets the session cookie and redirects to the home page.
    // Waiting for the redirect guarantees the server action has completed —
    // navigating away earlier would abort it and lose the session cookie.
    await expect(page).toHaveURL('/', { timeout: 15_000 })

    await page.goto('/enquiries')
    await expect(page.getByRole('heading', { name: 'My enquiries' })).toBeVisible()

    await expect(page.getByText('You have not sent any enquiries yet.')).toBeVisible()
    // Empty state links back to listings
    await expect(page.getByRole('link', { name: 'Browse listings' })).toBeVisible()
    // The signed-in header now shows the Enquiries link
    await expect(page.getByRole('link', { name: 'Enquiries', exact: true })).toBeVisible()
  })
})
