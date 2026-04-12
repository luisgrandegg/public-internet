import { test, expect } from '@playwright/test'

test.describe('Home page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('renders the page heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Find your next place to stay' })).toBeVisible()
  })

  test('renders the search form with all fields', async ({ page }) => {
    await expect(page.getByLabel('Where are you going?')).toBeVisible()
    await expect(page.getByLabel('Check in')).toBeVisible()
    await expect(page.getByLabel('Check out')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Search' })).toBeVisible()
  })

  test('search form navigates to /listings with query params', async ({ page }) => {
    await page.getByLabel('Where are you going?').fill('Barcelona')
    await page.getByRole('button', { name: 'Search' }).click()
    await expect(page).toHaveURL(/\/listings\?.*location=Barcelona/)
  })

  test('renders the "Featured places" section with listing cards', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Featured places' })).toBeVisible()
    // Home page uses MOCK_LISTINGS — cards are always present
    const cards = page.locator('article')
    await expect(cards.first()).toBeVisible()
  })

  test('renders the "How it works" section with 3 steps', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'How it works' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Search' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Contact the host directly' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Stay' })).toBeVisible()
  })

  test('has no urgency copy', async ({ page }) => {
    const content = await page.content()
    expect(content).not.toMatch(/only \d+ left/i)
    expect(content).not.toMatch(/\d+ people are (looking|viewing)/i)
    expect(content).not.toMatch(/limited (time|offer)/i)
  })

  test('site header contains navigation links', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Find a place' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Host your space' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible()
  })

  test('has a skip-to-main-content link', async ({ page }) => {
    // Tab to reveal the skip link (it may be visually hidden until focused)
    await page.keyboard.press('Tab')
    const skipLink = page.getByRole('link', { name: /skip/i })
    await expect(skipLink).toBeFocused()
  })
})
