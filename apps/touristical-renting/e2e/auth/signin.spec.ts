import { test, expect } from '@playwright/test'

test.describe('Sign in page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/signin')
  })

  test('renders the sign-in form', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
    await expect(page.getByLabel('Email address')).toBeVisible()
    await expect(page.getByLabel('Password')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible()
  })

  test('has a link to forgot-password', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Forgot your password?' })).toBeVisible()
  })

  test('has a link to sign up', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Create an account' })).toBeVisible()
  })

  test('clicking "Create an account" navigates to sign-up', async ({ page }) => {
    await page.getByRole('link', { name: 'Create an account' }).click()
    await expect(page).toHaveURL('/auth/signup')
  })

  test('clicking "Forgot your password?" navigates to forgot-password', async ({ page }) => {
    await page.getByRole('link', { name: 'Forgot your password?' }).click()
    await expect(page).toHaveURL('/auth/forgot-password')
  })

  test('password field type is password (not plaintext)', async ({ page }) => {
    const passwordInput = page.getByLabel('Password')
    await expect(passwordInput).toHaveAttribute('type', 'password')
  })

  test('submitting with invalid credentials shows an error', async ({ page }) => {
    await page.getByLabel('Email address').fill('notauser@example.com')
    await page.getByLabel('Password').fill('wrongpassword')
    await page.getByRole('button', { name: 'Sign in' }).click()
    await expect(page.getByRole('alert')).toBeVisible()
  })
})
