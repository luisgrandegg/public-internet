import { test, expect } from '@playwright/test'

test.describe('Profile', () => {
  test('unauthenticated users are redirected to sign-in', async ({ page }) => {
    await page.goto('/profile')
    await expect(page).toHaveURL(/\/auth\/signin/)
  })

  test('no dark-pattern retention copy', async ({ page }) => {
    // Constitution: no friction designed to prevent the user from leaving
    await page.goto('/profile')
    // Redirected to signin — check that signin page doesn't retain-shame the user
    const body = await page.textContent('body')
    expect(body).not.toMatch(/are you sure you want to leave/i)
    expect(body).not.toMatch(/don't go/i)
    expect(body).not.toMatch(/come back/i)
  })
})
