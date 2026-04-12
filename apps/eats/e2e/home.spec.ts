import { test, expect } from '@playwright/test'

test.describe('Home page', () => {
  test('renders heading and key content', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible()
  })

  test('has no urgency or dark-pattern copy', async ({ page }) => {
    await page.goto('/')
    const body = await page.textContent('body')
    // Constitution constraint: no urgency language
    expect(body).not.toMatch(/only \d+ left/i)
    expect(body).not.toMatch(/hurry/i)
    expect(body).not.toMatch(/offer ends soon/i)
    expect(body).not.toMatch(/surge pricing/i)
  })

  test('search form navigates to /restaurants', async ({ page }) => {
    await page.goto('/')
    const form = page.locator('form[action="/restaurants"]')
    await expect(form).toBeVisible()
  })

  test('shows infrastructure fee transparency copy', async ({ page }) => {
    await page.goto('/')
    const body = await page.textContent('body')
    // Constitution constraint: fee must be visible and described before order
    expect(body).toMatch(/infrastructure fee/i)
  })

  test('courier pay transparency is mentioned', async ({ page }) => {
    await page.goto('/')
    const body = await page.textContent('body')
    // Constitution constraint: worker rights — transparent pay must be communicated
    expect(body).toMatch(/transparent pay/i)
  })
})
