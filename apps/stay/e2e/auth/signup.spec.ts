import { test, expect } from '@playwright/test'

test.describe('Sign up page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/signup')
  })

  test('renders the sign-up form', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Create an account', exact: true })).toBeVisible()
    await expect(page.getByLabel('Full name', { exact: true })).toBeVisible()
    await expect(page.getByLabel('Email address', { exact: true })).toBeVisible()
    // Use exact: true — "Confirm password" also contains "password" so a substring match would find 2
    await expect(page.getByLabel('Password', { exact: true })).toBeVisible()
    await expect(page.getByLabel('Confirm password', { exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Create account', exact: true })).toBeVisible()
  })

  test('has a link to sign in', async ({ page }) => {
    // Scope to the main content to avoid matching the SiteHeader "Sign in" link
    await expect(page.getByRole('main').getByRole('link', { name: 'Sign in', exact: true })).toBeVisible()
  })

  test('host checkbox is NOT pre-selected (constitution requirement)', async ({ page }) => {
    const hostCheckbox = page.getByRole('checkbox', { name: /list my property/i })
    await expect(hostCheckbox).not.toBeChecked()
  })

  test('password fields are type=password', async ({ page }) => {
    await expect(page.getByLabel('Password', { exact: true })).toHaveAttribute('type', 'password')
    await expect(page.getByLabel('Confirm password', { exact: true })).toHaveAttribute('type', 'password')
  })

  test('clicking "Sign in" navigates to sign-in', async ({ page }) => {
    // Scope to the main content to avoid the SiteHeader "Sign in" link
    await page.getByRole('main').getByRole('link', { name: 'Sign in', exact: true }).click()
    await expect(page).toHaveURL('/auth/signin')
  })

  test('submitting with mismatched passwords shows an error', async ({ page }) => {
    await page.getByLabel('Full name', { exact: true }).fill('Test User')
    await page.getByLabel('Email address', { exact: true }).fill(`e2e-test-${Date.now()}@example.com`)
    await page.getByLabel('Password', { exact: true }).fill('password123')
    await page.getByLabel('Confirm password', { exact: true }).fill('differentpassword')
    await page.getByRole('button', { name: 'Create account', exact: true }).click()
    // Scope by text to avoid strict-mode violation from Next.js route announcer
    // (__next-route-announcer__ also has role="alert" and is always in the DOM)
    await expect(page.locator('[role="alert"]', { hasText: /passwords do not match/i })).toBeVisible()
  })
})
