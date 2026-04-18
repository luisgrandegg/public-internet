import { test, expect } from '@playwright/test'

test.describe('Sign up', () => {
  test('page renders form fields', async ({ page }) => {
    await page.goto('/auth/signup')
    await expect(
      page.getByRole('heading', { level: 1, name: /create an account/i }),
    ).toBeVisible()
    await expect(page.getByLabel('Full name')).toBeVisible()
    await expect(page.getByLabel('Email address')).toBeVisible()
    await expect(page.getByLabel('Password', { exact: true })).toBeVisible()
    await expect(page.getByLabel('Confirm password')).toBeVisible()
  })

  test('no pre-ticked opt-in checkboxes', async ({ page }) => {
    await page.goto('/auth/signup')
    // Constitution: no pre-ticked opt-ins
    const checkboxes = page.locator('input[type="checkbox"]')
    const count = await checkboxes.count()
    for (let i = 0; i < count; i++) {
      await expect(checkboxes.nth(i)).not.toBeChecked()
    }
  })

  test('has no urgency copy', async ({ page }) => {
    await page.goto('/auth/signup')
    const body = await page.textContent('body')
    expect(body).not.toMatch(/only \d+ left/i)
    expect(body).not.toMatch(/hurry/i)
    expect(body).not.toMatch(/sign up now before/i)
  })

  test('validates password mismatch client-side via server action', async ({ page }) => {
    await page.goto('/auth/signup')
    await page.getByLabel('Full name').fill('Pat Person')
    await page.getByLabel('Email address').fill('pat@example.com')
    await page.getByLabel('Password', { exact: true }).fill('password123')
    await page.getByLabel('Confirm password').fill('different1')
    await page.getByRole('button', { name: /create account/i }).click()
    await expect(page.getByText(/passwords do not match/i)).toBeVisible()
  })
})
