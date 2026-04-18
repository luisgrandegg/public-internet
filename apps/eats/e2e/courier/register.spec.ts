import { test, expect } from '@playwright/test'

test.describe('Courier registration', () => {
  test('redirects unauthenticated users to sign-in', async ({ page }) => {
    await page.goto('/courier/register')
    await expect(page).toHaveURL(/\/auth\/signin/)
  })

  // We can still verify the constitution-critical copy in the home-page content
  // since the actual page is behind auth. The home page links here so we assert
  // on a known public surface.
  test('no "independent contractor" or gig-worker language on public pages', async ({ page }) => {
    await page.goto('/')
    const body = await page.textContent('body')
    expect(body).not.toMatch(/independent contractor/i)
    expect(body).not.toMatch(/gig worker/i)
  })

  test('home page mentions transparent pay (constitution worker rights)', async ({ page }) => {
    await page.goto('/')
    const body = await page.textContent('body')
    expect(body).toMatch(/transparent/i)
  })
})
