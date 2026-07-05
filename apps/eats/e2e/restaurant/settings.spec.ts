import { test, expect } from '@playwright/test'

test.describe('Restaurant settings', () => {
  test('unauthenticated users are redirected to sign-in', async ({ page }) => {
    await page.goto('/restaurant/does-not-exist/settings')
    await expect(page).toHaveURL(/\/auth\/signin/)
  })

  test('restaurant PATCH rejects unauthenticated', async ({ request }) => {
    const res = await request.patch('/api/restaurant/restaurants/does-not-exist', {
      data: { name: 'New name' },
      failOnStatusCode: false,
    })
    expect(res.status()).toBe(401)
  })
})
