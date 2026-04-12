import { test, expect } from '@playwright/test'

test.describe('Create listing wizard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/host/listings/new')
  })

  test('renders the first step — property type', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'List your property', exact: true })).toBeVisible()
    // PropertyTypeStep renders a fieldset with a legend — not a heading role
    await expect(page.getByText('What type of property are you listing?')).toBeVisible()
    // Use value attribute selectors to avoid ambiguous regex matching
    // ("flat" appears in the Studio description "self-contained studio flat")
    await expect(page.locator('input[type="radio"][value="flat"]')).toBeVisible()
    await expect(page.locator('input[type="radio"][value="house"]')).toBeVisible()
    await expect(page.locator('input[type="radio"][value="room"]')).toBeVisible()
    await expect(page.locator('input[type="radio"][value="studio"]')).toBeVisible()
  })

  test('renders wizard progress with all step labels', async ({ page }) => {
    const progress = page.getByRole('list')
    await expect(progress).toBeVisible()
    await expect(page.getByText('Property type', { exact: true })).toBeVisible()
    await expect(page.getByText('Location', { exact: true })).toBeVisible()
    await expect(page.getByText('Description', { exact: true })).toBeVisible()
    await expect(page.getByText('Photos', { exact: true })).toBeVisible()
    await expect(page.getByText('Pricing', { exact: true })).toBeVisible()
    await expect(page.getByText('Review', { exact: true })).toBeVisible()
  })

  test('Back button is disabled on the first step', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Back', exact: true })).toBeDisabled()
  })

  test('Next button advances to step 2 after selecting a property type', async ({ page }) => {
    await page.locator('input[type="radio"][value="flat"]').click()
    await page.getByRole('button', { name: 'Next', exact: true }).click()
    // Step 2 — Location
    await expect(page.getByLabel('City', { exact: true })).toBeVisible()
    await expect(page.getByLabel('Country', { exact: true })).toBeVisible()
  })

  test('validation blocks Next on step 1 if no property type selected', async ({ page }) => {
    await page.getByRole('button', { name: 'Next', exact: true }).click()
    await expect(page.getByRole('alert')).toBeVisible()
    await expect(page.getByRole('alert')).toContainText(/select a property type/i)
  })

  test('Back button on step 2 returns to step 1', async ({ page }) => {
    await page.locator('input[type="radio"][value="flat"]').click()
    await page.getByRole('button', { name: 'Next', exact: true }).click()
    await page.getByRole('button', { name: 'Back', exact: true }).click()
    await expect(page.getByText('What type of property are you listing?')).toBeVisible()
  })

  test('navigates through all steps to the review step', async ({ page }) => {
    // Step 1 — Property type
    await page.locator('input[type="radio"][value="flat"]').click()
    await page.getByRole('button', { name: 'Next', exact: true }).click()

    // Step 2 — Location
    await page.getByLabel('City', { exact: true }).fill('Barcelona')
    await page.getByLabel('Country', { exact: true }).fill('Spain')
    await page.getByRole('button', { name: 'Next', exact: true }).click()

    // Step 3 — Description
    await page.getByLabel('Title', { exact: true }).fill('Beautiful flat in the city centre')
    await page.locator('textarea[name="description"]').fill('A lovely place with great views.')
    await page.getByRole('button', { name: 'Next', exact: true }).click()

    // Step 4 — Photos (optional URLs, can skip)
    await page.getByRole('button', { name: 'Next', exact: true }).click()

    // Step 5 — Pricing
    await page.getByLabel(/nightly rate/i).fill('85')
    await page.getByLabel(/max guests/i).fill('4')
    await page.getByLabel(/bedrooms/i).fill('2')
    await page.getByLabel(/bathrooms/i).fill('1')
    await page.getByRole('button', { name: 'Next', exact: true }).click()

    // Step 6 — Review (final)
    await expect(page.getByRole('button', { name: 'Publish listing', exact: true })).toBeVisible()
    // Summary should show the data entered
    await expect(page.getByText('Barcelona')).toBeVisible()
    await expect(page.getByText('Beautiful flat in the city centre')).toBeVisible()
  })

  test('pricing step shows "total price" label (no hidden fees — constitution)', async ({ page }) => {
    // Navigate to pricing step
    await page.locator('input[type="radio"][value="flat"]').click()
    await page.getByRole('button', { name: 'Next', exact: true }).click()
    await page.getByLabel('City', { exact: true }).fill('Test')
    await page.getByLabel('Country', { exact: true }).fill('Test')
    await page.getByRole('button', { name: 'Next', exact: true }).click()
    await page.getByLabel('Title', { exact: true }).fill('Test')
    await page.locator('textarea[name="description"]').fill('Test')
    await page.getByRole('button', { name: 'Next', exact: true }).click()
    await page.getByRole('button', { name: 'Next', exact: true }).click()

    // Pricing step should mention "total price" to make clear there are no hidden fees
    const content = await page.textContent('body')
    expect(content).toMatch(/total price/i)
  })
})
