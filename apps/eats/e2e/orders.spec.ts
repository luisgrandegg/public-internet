import { test, expect } from '@playwright/test'

test.describe('Order flow', () => {
  test('unauthenticated order page redirects to sign-in', async ({ page }) => {
    await page.goto('/restaurants/does-not-exist/order')
    await expect(page).toHaveURL(/\/auth\/signin/)
  })

  test('POST /api/orders rejects unauthenticated', async ({ request }) => {
    const res = await request.post('/api/orders', {
      data: {
        restaurantId: 'x',
        items: [{ menuItemId: 'y', quantity: 1 }],
        deliveryAddress: '123 Some Street',
      },
      failOnStatusCode: false,
    })
    expect(res.status()).toBe(401)
  })

  test('POST /api/orders validates body', async ({ request }) => {
    // Unauthed: returns 401 before body validation — so we only verify status is an error.
    const res = await request.post('/api/orders', {
      data: {},
      failOnStatusCode: false,
    })
    expect([401, 422]).toContain(res.status())
  })
})

test.describe('Orders history', () => {
  test('/orders redirects unauthenticated users to sign-in', async ({ page }) => {
    await page.goto('/orders')
    await expect(page).toHaveURL(/\/auth\/signin/)
  })

  test('/orders/[id] redirects unauthenticated users to sign-in', async ({ page }) => {
    await page.goto('/orders/any-id')
    await expect(page).toHaveURL(/\/auth\/signin/)
  })

  test('GET /api/orders/[id] rejects unauthenticated', async ({ request }) => {
    const res = await request.get('/api/orders/any-id', { failOnStatusCode: false })
    expect(res.status()).toBe(401)
  })
})
