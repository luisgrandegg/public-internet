import { test, expect } from '@playwright/test'

test.describe('Forgot password', () => {
  test('page renders form', async ({ page }) => {
    await page.goto('/auth/forgot-password')
    await expect(
      page.getByRole('heading', { level: 1, name: /reset your password/i }),
    ).toBeVisible()
    await expect(page.getByLabel('Email address')).toBeVisible()
    await expect(page.getByRole('button', { name: /send reset link/i })).toBeVisible()
  })

  test('always shows generic success (prevents enumeration)', async ({ page }) => {
    await page.goto('/auth/forgot-password')
    await page.getByLabel('Email address').fill('never-registered@example.com')
    await page.getByRole('button', { name: /send reset link/i }).click()
    await expect(
      page.getByRole('heading', { level: 1, name: /check your email/i }),
    ).toBeVisible()
    // Must NOT reveal whether the account exists
    const body = await page.textContent('body')
    expect(body).not.toMatch(/no account found/i)
    expect(body).not.toMatch(/user does not exist/i)
  })
})
