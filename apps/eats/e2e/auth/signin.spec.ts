import { test, expect } from '@playwright/test'

test.describe('Sign in', () => {
  test('page renders heading and form', async ({ page }) => {
    await page.goto('/auth/signin')
    await expect(page.getByRole('heading', { level: 1, name: 'Sign in' })).toBeVisible()
    await expect(page.getByLabel('Email address')).toBeVisible()
    await expect(page.getByLabel('Password')).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
  })

  test('links to signup and forgot-password', async ({ page }) => {
    await page.goto('/auth/signin')
    await expect(page.getByRole('link', { name: /forgot your password/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /create an account/i })).toBeVisible()
  })

  test('does not offer Google sign-in when the node has no Google credentials', async ({ page }) => {
    // GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET are unset in CI — the optional
    // per-node Google strategy (ADR-007) must leave no trace in the UI.
    await page.goto('/auth/signin')
    await expect(page.getByRole('button', { name: 'Continue with Google' })).toHaveCount(0)
  })

  test('has no urgency copy', async ({ page }) => {
    await page.goto('/auth/signin')
    const body = await page.textContent('body')
    expect(body).not.toMatch(/only \d+ left/i)
    expect(body).not.toMatch(/hurry/i)
    expect(body).not.toMatch(/offer ends soon/i)
  })
})
