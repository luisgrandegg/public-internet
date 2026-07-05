import { test, expect } from '@playwright/test'

test.describe('Restaurant owner onboarding', () => {
  test('redirects unauthenticated users to /auth/signin', async ({ page }) => {
    await page.goto('/restaurant/onboarding')
    await expect(page).toHaveURL(/\/auth\/signin/)
  })

  test('signed-in user sees the commission-free explanation with a NOT pre-checked acknowledgement', async ({
    page,
  }) => {
    // Create a fresh account so the page is reachable (any user can onboard).
    const email = `onboarding-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`
    await page.goto('/auth/signup')
    await page.getByLabel('Full name').fill('Onboarding Tester')
    await page.getByLabel('Email address').fill(email)
    await page.getByLabel('Password', { exact: true }).fill('password123')
    await page.getByLabel('Confirm password').fill('password123')
    await page.getByRole('button', { name: /create account/i }).click()
    await expect(page).toHaveURL('/')

    await page.goto('/restaurant/onboarding')
    await expect(
      page.getByRole('heading', { level: 1, name: /add your restaurant/i }),
    ).toBeVisible()

    // Commission-free model must be explained before opting in
    const body = await page.textContent('body')
    expect(body).toMatch(/zero commission/i)
    expect(body).toMatch(/infrastructure fee/i)

    // Constitution: explicit opt-in — the acknowledgement must NOT be pre-checked
    const checkboxes = page.locator('input[type="checkbox"]')
    const count = await checkboxes.count()
    expect(count).toBeGreaterThan(0)
    for (let i = 0; i < count; i++) {
      await expect(checkboxes.nth(i)).not.toBeChecked()
    }
  })

  test('no urgency or scarcity copy on the onboarding path', async ({ page }) => {
    // Signed-out users land on signin; assert the public surface has no urgency copy.
    await page.goto('/restaurant/onboarding')
    const body = await page.textContent('body')
    expect(body).not.toMatch(/hurry/i)
    expect(body).not.toMatch(/limited spots/i)
    expect(body).not.toMatch(/only \d+ left/i)
  })
})
