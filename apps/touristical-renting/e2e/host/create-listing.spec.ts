import { test, expect } from '@playwright/test'

test.describe('Create listing wizard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/host/listings/new')
  })

  test('renders the first step — property type', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /property type/i })).toBeVisible()
    await expect(page.getByRole('radio', { name: /flat/i })).toBeVisible()
    await expect(page.getByRole('radio', { name: /house/i })).toBeVisible()
    await expect(page.getByRole('radio', { name: /room/i })).toBeVisible()
    await expect(page.getByRole('radio', { name: /studio/i })).toBeVisible()
  })

  test('renders wizard progress with all step labels', async ({ page }) => {
    const progress = page.getByRole('list')
    await expect(progress).toBeVisible()
    await expect(page.getByText('Property type')).toBeVisible()
    await expect(page.getByText('Location')).toBeVisible()
    await expect(page.getByText('Description')).toBeVisible()
    await expect(page.getByText('Photos')).toBeVisible()
    await expect(page.getByText('Pricing')).toBeVisible()
    await expect(page.getByText('Review')).toBeVisible()
  })

  test('Back button is disabled on the first step', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Back' })).toBeDisabled()
  })

  test('Next button advances to step 2 after selecting a property type', async ({ page }) => {
    await page.getByRole('radio', { name: /flat/i }).click()
    await page.getByRole('button', { name: 'Next' }).click()
    // Step 2 — Location
    await expect(page.getByLabel('City')).toBeVisible()
    await expect(page.getByLabel('Country')).toBeVisible()
  })

  test('validation blocks Next on step 1 if no property type selected', async ({ page }) => {
    await page.getByRole('button', { name: 'Next' }).click()
    await expect(page.getByRole('alert')).toBeVisible()
    await expect(page.getByRole('alert')).toContainText(/select a property type/i)
  })

  test('Back button on step 2 returns to step 1', async ({ page }) => {
    await page.getByRole('radio', { name: /flat/i }).click()
    await page.getByRole('button', { name: 'Next' }).click()
    await page.getByRole('button', { name: 'Back' }).click()
    await expect(page.getByRole('heading', { name: /property type/i })).toBeVisible()
  })

  test('navigates through all steps to the review step', async ({ page }) => {
    // Step 1 — Property type
    await page.getByRole('radio', { name: /flat/i }).click()
    await page.getByRole('button', { name: 'Next' }).click()

    // Step 2 — Location
    await page.getByLabel('City').fill('Barcelona')
    await page.getByLabel('Country').fill('Spain')
    await page.getByRole('button', { name: 'Next' }).click()

    // Step 3 — Description
    await page.getByLabel('Title').fill('Beautiful flat in the city centre')
    // Use a more targeted selector for the textarea
    await page.locator('textarea[name="description"]').fill('A lovely place with great views.')
    await page.getByRole('button', { name: 'Next' }).click()

    // Step 4 — Photos (optional URLs, can skip)
    await page.getByRole('button', { name: 'Next' }).click()

    // Step 5 — Pricing
    await page.getByLabel(/nightly rate/i).fill('85')
    await page.getByLabel(/max guests/i).fill('4')
    await page.getByLabel(/bedrooms/i).fill('2')
    await page.getByLabel(/bathrooms/i).fill('1')
    await page.getByRole('button', { name: 'Next' }).click()

    // Step 6 — Review (final)
    await expect(page.getByRole('button', { name: 'Publish listing' })).toBeVisible()
    // Summary should show the data entered
    await expect(page.getByText('Barcelona')).toBeVisible()
    await expect(page.getByText('Beautiful flat in the city centre')).toBeVisible()
  })

  test('pricing step shows "total price" label (no hidden fees — constitution)', async ({ page }) => {
    // Navigate to pricing step
    await page.getByRole('radio', { name: /flat/i }).click()
    await page.getByRole('button', { name: 'Next' }).click()
    await page.getByLabel('City').fill('Test')
    await page.getByLabel('Country').fill('Test')
    await page.getByRole('button', { name: 'Next' }).click()
    await page.getByLabel('Title').fill('Test')
    await page.locator('textarea[name="description"]').fill('Test')
    await page.getByRole('button', { name: 'Next' }).click()
    await page.getByRole('button', { name: 'Next' }).click()

    // Pricing step should mention "total price" to make clear there are no hidden fees
    const content = await page.textContent('body')
    expect(content).toMatch(/total price/i)
  })
})
