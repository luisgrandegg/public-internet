import { test, expect } from '@playwright/test'

test.describe('Home page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('renders the page heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Find your next place to stay', exact: true })).toBeVisible()
  })

  test('renders the search form with all fields', async ({ page }) => {
    await expect(page.getByLabel('Where are you going?', { exact: true })).toBeVisible()
    await expect(page.getByLabel('Check in', { exact: true })).toBeVisible()
    await expect(page.getByLabel('Check out', { exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Search', exact: true })).toBeVisible()
  })

  test('search form navigates to /listings with query params', async ({ page }) => {
    await page.getByLabel('Where are you going?', { exact: true }).fill('Barcelona')
    await page.getByRole('button', { name: 'Search', exact: true }).click()
    await expect(page).toHaveURL(/\/listings\?.*location=Barcelona/)
  })

  test('renders the "Featured places" section with listing cards', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Featured places', exact: true })).toBeVisible()
    // ListingCard renders as <a> links to /listings/:id
    const cards = page.locator('a[href^="/listings/"]')
    await expect(cards.first()).toBeVisible()
  })

  test('renders the "How it works" section with 3 steps', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'How it works', exact: true })).toBeVisible()
    // Use exact: true to avoid matching the h1 hero heading which contains "stay"
    await expect(page.getByRole('heading', { name: 'Search', exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Contact the host directly', exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Stay', exact: true })).toBeVisible()
  })

  test('has no urgency copy', async ({ page }) => {
    const content = await page.content()
    expect(content).not.toMatch(/only \d+ left/i)
    expect(content).not.toMatch(/\d+ people are (looking|viewing)/i)
    expect(content).not.toMatch(/limited (time|offer)/i)
  })

  test('site header contains navigation links', async ({ page }) => {
    const header = page.getByRole('banner')
    await expect(header.getByRole('link', { name: 'Find a place', exact: true })).toBeVisible()
    await expect(header.getByRole('link', { name: 'Host your space', exact: true })).toBeVisible()
    await expect(header.getByRole('link', { name: 'Sign in', exact: true })).toBeVisible()
  })

  test('has a skip-to-main-content link', async ({ page }) => {
    // Tab to reveal the skip link (it may be visually hidden until focused)
    await page.keyboard.press('Tab')
    const skipLink = page.getByRole('link', { name: /skip/i })
    await expect(skipLink).toBeFocused()
  })
})
