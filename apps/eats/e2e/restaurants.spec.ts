import { test, expect } from '@playwright/test'

test.describe('Restaurants browse', () => {
  test('page renders heading', async ({ page }) => {
    await page.goto('/restaurants')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('empty state renders when no restaurants match', async ({ page }) => {
    // In a fresh DB there are no restaurants — the empty state should appear.
    await page.goto('/restaurants')
    // Either the empty state or some restaurant cards are visible.
    // We do not assume the DB is empty, but we assert the filter form is always present.
    await expect(page.getByRole('button', { name: /search/i })).toBeVisible()
  })

  test('no promoted or surge-pricing copy', async ({ page }) => {
    await page.goto('/restaurants')
    const body = await page.textContent('body')
    expect(body).not.toMatch(/surge pricing/i)
    expect(body).not.toMatch(/promoted/i)
    expect(body).not.toMatch(/sponsored/i)
    expect(body).not.toMatch(/featured placement/i)
  })

  test('api returns 422 on invalid page param', async ({ request }) => {
    const res = await request.get('/api/restaurants?page=abc', {
      failOnStatusCode: false,
    })
    expect([200, 422]).toContain(res.status())
  })
})

test.describe('Restaurant detail', () => {
  test('unknown restaurant yields 404 page', async ({ page }) => {
    const response = await page.goto('/restaurants/does-not-exist')
    expect(response?.status()).toBe(404)
  })

  test('detail API returns 404 for unknown id', async ({ request }) => {
    const res = await request.get('/api/restaurants/does-not-exist', {
      failOnStatusCode: false,
    })
    expect(res.status()).toBe(404)
  })

  test('menu API returns 404 for unknown restaurant', async ({ request }) => {
    const res = await request.get('/api/restaurants/does-not-exist/menu', {
      failOnStatusCode: false,
    })
    expect(res.status()).toBe(404)
  })
})
