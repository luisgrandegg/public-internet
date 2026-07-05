import { test, expect } from '@playwright/test'

test.describe('Sign in page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/signin')
  })

  test('renders the sign-in form', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Sign in', exact: true })).toBeVisible()
    await expect(page.getByLabel('Email address', { exact: true })).toBeVisible()
    await expect(page.getByLabel('Password', { exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeVisible()
  })

  test('has a link to forgot-password', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Forgot your password?', exact: true })).toBeVisible()
  })

  test('has a link to sign up', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Create an account', exact: true })).toBeVisible()
  })

  test('clicking "Create an account" navigates to sign-up', async ({ page }) => {
    await page.getByRole('link', { name: 'Create an account', exact: true }).click()
    await expect(page).toHaveURL('/auth/signup')
  })

  test('clicking "Forgot your password?" navigates to forgot-password', async ({ page }) => {
    await page.getByRole('link', { name: 'Forgot your password?', exact: true }).click()
    await expect(page).toHaveURL('/auth/forgot-password')
  })

  test('password field type is password (not plaintext)', async ({ page }) => {
    const passwordInput = page.getByLabel('Password', { exact: true })
    await expect(passwordInput).toHaveAttribute('type', 'password')
  })

  test('does not offer Google sign-in when the node has no Google credentials', async ({ page }) => {
    // GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET are unset in CI — the optional
    // per-node Google strategy (ADR-007) must leave no trace in the UI.
    await expect(page.getByRole('button', { name: 'Continue with Google' })).toHaveCount(0)
  })

  test('submitting with invalid credentials shows an error', async ({ page }) => {
    await page.getByLabel('Email address', { exact: true }).fill('notauser@example.com')
    await page.getByLabel('Password', { exact: true }).fill('wrongpassword')
    await page.getByRole('button', { name: 'Sign in', exact: true }).click()
    await expect(page.getByRole('alert')).toBeVisible()
  })
})
