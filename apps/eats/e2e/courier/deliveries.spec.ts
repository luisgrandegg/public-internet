import { test, expect } from '@playwright/test'

test.describe('Courier dashboard', () => {
  test('unauthenticated users are redirected to sign-in', async ({ page }) => {
    await page.goto('/courier')
    await expect(page).toHaveURL(/\/auth\/signin/)
  })

  test('GET /api/courier/deliveries rejects unauthenticated', async ({ request }) => {
    const res = await request.get('/api/courier/deliveries', { failOnStatusCode: false })
    expect(res.status()).toBe(401)
  })

  test('PATCH /api/courier/deliveries/:id rejects unauthenticated', async ({ request }) => {
    const res = await request.patch('/api/courier/deliveries/any', {
      data: { action: 'accept' },
      failOnStatusCode: false,
    })
    expect(res.status()).toBe(401)
  })
})
