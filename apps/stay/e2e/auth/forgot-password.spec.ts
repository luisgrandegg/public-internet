import { test, expect } from '@playwright/test'

test.describe('Forgot password page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/forgot-password')
  })

  test('renders the reset password form', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Reset your password', exact: true })).toBeVisible()
    await expect(page.getByLabel('Email address', { exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Send reset link', exact: true })).toBeVisible()
  })

  test('has a link back to sign in', async ({ page }) => {
    // Scope to main content — the SiteHeader also has a "Sign in" link
    await expect(page.getByRole('main').getByRole('link', { name: 'Sign in', exact: true })).toBeVisible()
  })

  test('has descriptive copy without urgency language', async ({ page }) => {
    // Page must not mention link expiry or urgency in the form state
    const content = await page.textContent('body')
    expect(content).not.toMatch(/expires? in/i)
    expect(content).not.toMatch(/hurry/i)
    expect(content).not.toMatch(/limited time/i)
  })

  test('submitting shows confirmation state — no enumeration leak', async ({ page }) => {
    // Response must be identical whether email exists or not
    await page.getByLabel('Email address', { exact: true }).fill('nonexistent@example.com')
    await page.getByRole('button', { name: 'Send reset link', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Check your email', exact: true })).toBeVisible({ timeout: 10_000 })
    // No urgency about link expiry shown on screen
    const content = await page.textContent('body')
    expect(content).not.toMatch(/expires? in/i)
  })
})
