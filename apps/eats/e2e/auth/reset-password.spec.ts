import { test, expect } from '@playwright/test'

test.describe('Reset password', () => {
  test('page renders form when a token is present', async ({ page }) => {
    await page.goto('/auth/reset-password?token=e2e-test-token')
    await expect(
      page.getByRole('heading', { level: 1, name: /choose a new password/i }),
    ).toBeVisible()
    await expect(page.getByLabel('New password', { exact: true })).toBeVisible()
    await expect(page.getByLabel('Confirm new password')).toBeVisible()
    await expect(page.getByRole('button', { name: /set new password/i })).toBeVisible()
  })

  test('shows invalid-link state when the token is missing', async ({ page }) => {
    await page.goto('/auth/reset-password')
    await expect(
      page.getByRole('heading', { level: 1, name: /reset link not valid/i }),
    ).toBeVisible()
    await expect(
      page.getByRole('link', { name: /request a new reset link/i }),
    ).toBeVisible()
  })

  test('shows invalid-link state when better-auth redirects with an error', async ({ page }) => {
    await page.goto('/auth/reset-password?error=INVALID_TOKEN')
    await expect(
      page.getByRole('heading', { level: 1, name: /reset link not valid/i }),
    ).toBeVisible()
  })

  test('validates minimum password length', async ({ page }) => {
    await page.goto('/auth/reset-password?token=e2e-test-token')
    // minLength is also enforced natively; fill both fields with a short value and
    // strip the native constraint so the server-action validation is exercised.
    await page
      .getByLabel('New password', { exact: true })
      .evaluate((el) => el.removeAttribute('minlength'))
    await page.getByLabel('New password', { exact: true }).fill('short')
    await page.getByLabel('Confirm new password').fill('short')
    await page.getByRole('button', { name: /set new password/i }).click()
    // The page description also mentions the 8-character minimum, so scope
    // the assertion to the field-level error message.
    await expect(page.getByText(/password must be at least 8 characters/i)).toBeVisible()
  })

  test('validates password mismatch', async ({ page }) => {
    await page.goto('/auth/reset-password?token=e2e-test-token')
    await page.getByLabel('New password', { exact: true }).fill('password123')
    await page.getByLabel('Confirm new password').fill('different456')
    await page.getByRole('button', { name: /set new password/i }).click()
    await expect(page.getByText(/passwords do not match/i)).toBeVisible()
  })

  test('shows expired-link error for an unknown token', async ({ page }) => {
    await page.goto('/auth/reset-password?token=not-a-real-token')
    await page.getByLabel('New password', { exact: true }).fill('password123')
    await page.getByLabel('Confirm new password').fill('password123')
    await page.getByRole('button', { name: /set new password/i }).click()
    await expect(page.getByText(/invalid or has expired/i)).toBeVisible()
  })
})
