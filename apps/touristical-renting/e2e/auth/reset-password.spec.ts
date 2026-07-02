import { test, expect } from '@playwright/test'

test.describe('Reset password page', () => {
  test('renders the new-password form when a token is present', async ({ page }) => {
    await page.goto('/auth/reset-password?token=e2e-test-token')
    await expect(page.getByRole('heading', { name: 'Choose a new password', exact: true })).toBeVisible()
    await expect(page.getByLabel('New password', { exact: true })).toBeVisible()
    await expect(page.getByLabel('Confirm new password', { exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Update password', exact: true })).toBeVisible()
  })

  test('shows validation errors for a short password', async ({ page }) => {
    await page.goto('/auth/reset-password?token=e2e-test-token')
    await page.getByLabel('New password', { exact: true }).fill('short')
    await page.getByLabel('Confirm new password', { exact: true }).fill('short')
    await page.getByRole('button', { name: 'Update password', exact: true }).click()
    await expect(page.getByText('Password must be at least 8 characters')).toBeVisible({ timeout: 10_000 })
  })

  test('shows a validation error when passwords do not match', async ({ page }) => {
    await page.goto('/auth/reset-password?token=e2e-test-token')
    await page.getByLabel('New password', { exact: true }).fill('a-valid-password')
    await page.getByLabel('Confirm new password', { exact: true }).fill('a-different-password')
    await page.getByRole('button', { name: 'Update password', exact: true }).click()
    await expect(page.getByText('Passwords do not match')).toBeVisible({ timeout: 10_000 })
  })

  test('shows the invalid-link state when the token is missing', async ({ page }) => {
    await page.goto('/auth/reset-password')
    await expect(page.getByRole('heading', { name: 'Reset link not valid', exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Request a new reset link', exact: true })).toBeVisible()
    await expect(page.getByRole('main').getByRole('link', { name: 'Back to sign in', exact: true })).toBeVisible()
  })

  test('shows an error when submitting with an invalid token', async ({ page }) => {
    // A token the server has never issued must be rejected gracefully
    await page.goto('/auth/reset-password?token=not-a-real-token')
    await page.getByLabel('New password', { exact: true }).fill('a-valid-password')
    await page.getByLabel('Confirm new password', { exact: true }).fill('a-valid-password')
    await page.getByRole('button', { name: 'Update password', exact: true }).click()
    await expect(page.getByText('This reset link is invalid')).toBeVisible({ timeout: 10_000 })
  })

  test('has no urgency copy', async ({ page }) => {
    await page.goto('/auth/reset-password?token=e2e-test-token')
    const content = await page.textContent('body')
    expect(content).not.toMatch(/hurry/i)
    expect(content).not.toMatch(/limited time/i)
    expect(content).not.toMatch(/expires? in/i)
  })
})
