import { test, expect } from '@playwright/test'

test.describe('Listings search page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/listings')
  })

  test('renders the page without crashing', async ({ page }) => {
    // The page is a Server Component — it will render even with an empty database
    await expect(page).toHaveURL('/listings')
    // Results count is always rendered
    await expect(page.getByText(/\d+ place/)).toBeVisible()
  })

  test('renders the filter sidebar', async ({ page }) => {
    await expect(page.getByRole('form', { name: /filter/i })).toBeVisible()
  })

  test('renders the map loading state or loaded map', async ({ page }) => {
    // Map is loaded dynamically; the loading state or the container must be present
    const mapOrLoading = page.locator('[aria-label="Loading map"], .leaflet-container')
    await expect(mapOrLoading.first()).toBeVisible({ timeout: 10_000 })
  })

  test('shows empty state when no listings match', async ({ page }) => {
    await page.goto('/listings?location=ImaginaryPlaceThatDoesNotExist')
    await expect(page.getByText('No listings match your search')).toBeVisible()
  })

  test('search from home navigates here with location param', async ({ page }) => {
    await page.goto('/')
    await page.getByLabel('Where are you going?').fill('Madrid')
    await page.getByRole('button', { name: 'Search' }).click()
    await expect(page).toHaveURL(/\/listings\?.*location=Madrid/)
    await expect(page.getByText(/\d+ place/)).toBeVisible()
  })
})
