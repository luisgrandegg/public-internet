import { test, expect } from '@playwright/test'

test.describe('Menu management', () => {
  test('unauthenticated users are redirected to sign-in', async ({ page }) => {
    await page.goto('/restaurant/does-not-exist/menu')
    await expect(page).toHaveURL(/\/auth\/signin/)
  })

  test('menu API rejects unauthenticated POST', async ({ request }) => {
    const res = await request.post('/api/restaurant/restaurants/does-not-exist/menu', {
      data: { name: 'X', description: 'Y', price: 1, category: 'Starters' },
      failOnStatusCode: false,
    })
    expect(res.status()).toBe(401)
  })

  test('menu PATCH rejects unauthenticated', async ({ request }) => {
    const res = await request.patch('/api/restaurant/menu/does-not-exist', {
      data: { name: 'X' },
      failOnStatusCode: false,
    })
    expect(res.status()).toBe(401)
  })

  test('menu DELETE rejects unauthenticated', async ({ request }) => {
    const res = await request.delete('/api/restaurant/menu/does-not-exist', {
      failOnStatusCode: false,
    })
    expect(res.status()).toBe(401)
  })
})
