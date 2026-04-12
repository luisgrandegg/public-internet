import { test, expect } from '@playwright/test'

test.describe('Sign up page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/signup')
  })

  test('renders the sign-up form', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Create an account' })).toBeVisible()
    await expect(page.getByLabel('Full name')).toBeVisible()
    await expect(page.getByLabel('Email address')).toBeVisible()
    await expect(page.getByLabel('Password')).toBeVisible()
    await expect(page.getByLabel('Confirm password')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Create account' })).toBeVisible()
  })

  test('has a link to sign in', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible()
  })

  test('host checkbox is NOT pre-selected (constitution requirement)', async ({ page }) => {
    const hostCheckbox = page.getByRole('checkbox', { name: /list my property/i })
    await expect(hostCheckbox).not.toBeChecked()
  })

  test('password fields are type=password', async ({ page }) => {
    await expect(page.getByLabel('Password')).toHaveAttribute('type', 'password')
    await expect(page.getByLabel('Confirm password')).toHaveAttribute('type', 'password')
  })

  test('clicking "Sign in" navigates to sign-in', async ({ page }) => {
    await page.getByRole('link', { name: 'Sign in' }).click()
    await expect(page).toHaveURL('/auth/signin')
  })

  test('submitting with mismatched passwords shows an error', async ({ page }) => {
    await page.getByLabel('Full name').fill('Test User')
    await page.getByLabel('Email address').fill(`e2e-test-${Date.now()}@example.com`)
    await page.getByLabel('Password').fill('password123')
    await page.getByLabel('Confirm password').fill('differentpassword')
    await page.getByRole('button', { name: 'Create account' }).click()
    await expect(page.getByRole('alert')).toBeVisible()
  })
})
