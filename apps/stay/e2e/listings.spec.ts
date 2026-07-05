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

  test('a non-numeric page param renders page 1 instead of crashing', async ({ page }) => {
    await page.goto('/listings?page=abc')
    // The invalid value falls back to page 1 — the page renders normally
    await expect(page.getByText(/\d+ place/)).toBeVisible()
  })

  test('search from home navigates here with location param', async ({ page }) => {
    await page.goto('/')
    await page.getByLabel('Where are you going?').fill('Madrid')
    await page.getByRole('button', { name: 'Search' }).click()
    await expect(page).toHaveURL(/\/listings\?.*location=Madrid/)
    await expect(page.getByText(/\d+ place/)).toBeVisible()
  })

  test('search from home carries dates and guests into the URL', async ({ page }) => {
    await page.goto('/')
    await page.getByLabel('Check in').fill('2027-08-01')
    await page.getByLabel('Check out').fill('2027-08-08')
    await page.getByLabel('Guests').fill('2')
    await page.getByRole('button', { name: 'Search' }).click()
    await expect(page).toHaveURL(/\/listings\?.*checkIn=2027-08-01/)
    await expect(page).toHaveURL(/checkOut=2027-08-08/)
    await expect(page).toHaveURL(/guests=2/)
    await expect(page.getByText(/\d+ place/)).toBeVisible()
  })
})

test.describe('Search by dates and guests', () => {
  test('renders results or empty state with date and guest params', async ({ page }) => {
    await page.goto('/listings?guests=2&checkIn=2027-08-01&checkOut=2027-08-08')
    // Page renders without crashing — the results count is always shown
    await expect(page.getByText(/\d+ place/)).toBeVisible()
  })

  test('shows active filters for dates and guests', async ({ page }) => {
    await page.goto('/listings?guests=2&checkIn=2027-08-01&checkOut=2027-08-08')
    const activeFilters = page.getByRole('list', { name: 'Active search filters' })
    await expect(activeFilters).toBeVisible()
    await expect(activeFilters.getByText(/Check in/)).toBeVisible()
    await expect(activeFilters.getByText(/Check out/)).toBeVisible()
    await expect(activeFilters.getByText(/2 guests/)).toBeVisible()
  })

  test('shows no filter chips for a half-filled date range', async ({ page }) => {
    // Only checkIn is set — the query ignores the incomplete range, so the
    // chips must not claim a date filter was applied.
    await page.goto('/listings?checkIn=2027-08-01')
    await expect(page.getByText(/\d+ place/)).toBeVisible()
    await expect(page.getByRole('list', { name: 'Active search filters' })).toHaveCount(0)
  })

  test('API returns 422 for an invalid date range', async ({ request }) => {
    const response = await request.get('/api/listings?checkIn=2027-08-08&checkOut=2027-08-01')
    expect(response.status()).toBe(422)
    const body = await response.json()
    expect(body.error.code).toBe('VALIDATION_ERROR')
  })

  test('API returns 422 when only one end of the date range is provided', async ({ request }) => {
    const response = await request.get('/api/listings?checkIn=2027-08-01')
    expect(response.status()).toBe(422)
    const body = await response.json()
    expect(body.error.code).toBe('VALIDATION_ERROR')
  })

  test('API accepts a valid date range and guests', async ({ request }) => {
    const response = await request.get(
      '/api/listings?checkIn=2027-08-01&checkOut=2027-08-08&guests=2',
    )
    expect(response.status()).toBe(200)
    const body = await response.json()
    expect(Array.isArray(body.data.listings)).toBe(true)
  })
})
