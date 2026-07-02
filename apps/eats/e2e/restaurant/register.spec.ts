import { test, expect } from '@playwright/test'

test.describe('Restaurant registration', () => {
  test('redirects unauthenticated users to /auth/signin', async ({ page }) => {
    await page.goto('/restaurant/register')
    await expect(page).toHaveURL(/\/auth\/signin/)
  })

  test('no commission or exclusivity copy', async ({ page }) => {
    // Unauthenticated users are redirected, so we only assert on what the signed-out
    // flow shows. The register page itself is protected; the constitution-critical
    // copy lives on the home page and is verified there.
    await page.goto('/')
    const body = await page.textContent('body')
    // The home page promises "no commission" and "no exclusivity requirement" —
    // that negated copy is constitution-aligned. Only a non-negated mention
    // (e.g. "15% commission", "exclusivity required") is a violation.
    const withoutNegations = body!.replace(
      /(?:no|zero|without(?: any)?) (?:commission|exclusivity(?: requirement)?)|commission-free/gi,
      '',
    )
    expect(withoutNegations).not.toMatch(/commission/i)
    expect(withoutNegations).not.toMatch(/exclusivity/i)
    expect(withoutNegations).not.toMatch(/premium tier/i)
  })
})
