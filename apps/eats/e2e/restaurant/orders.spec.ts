import { test, expect } from '@playwright/test'

test.describe('Restaurant dashboard', () => {
  test('unauthenticated users are redirected to sign-in', async ({ page }) => {
    await page.goto('/restaurant')
    await expect(page).toHaveURL(/\/auth\/signin/)
  })

  test('GET /api/restaurant/orders requires auth', async ({ request }) => {
    const res = await request.get('/api/restaurant/orders', { failOnStatusCode: false })
    expect(res.status()).toBe(401)
  })

  test('PATCH /api/restaurant/orders/:id requires auth', async ({ request }) => {
    const res = await request.patch('/api/restaurant/orders/any', {
      data: { status: 'ACCEPTED' },
      failOnStatusCode: false,
    })
    expect(res.status()).toBe(401)
  })
})
