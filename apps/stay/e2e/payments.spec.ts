import { test, expect } from '@playwright/test'

/**
 * Payments (ADR-006, amended) — generic payment-provider webhook behaviour
 * that can run in CI without any PSP account.
 *
 * CI runs in offline settlement mode (no payment provider configured), so the
 * webhook endpoint must answer 503 to every POST: there is no provider to
 * authenticate or process events. When a provider IS configured, its
 * parseWebhookEvent() is the only line of defence — authentication failures
 * return 400.
 */

test.describe('Payments webhook endpoint (offline mode)', () => {
  test('POST with a garbage body returns 503 — no provider configured', async ({ request }) => {
    const response = await request.post('/api/webhooks/payments', {
      headers: { 'content-type': 'application/json' },
      data: 'not-a-payment-event',
    })
    expect(response.status()).toBe(503)
    const body = await response.json()
    expect(body.error.code).toBe('PAYMENTS_NOT_CONFIGURED')
  })

  test('POST with a forged signature header returns 503 — no provider to verify it', async ({ request }) => {
    const response = await request.post('/api/webhooks/payments', {
      headers: {
        'content-type': 'application/json',
        'stripe-signature': 't=1,v1=deadbeef',
      },
      data: JSON.stringify({ type: 'checkout.session.completed', data: { object: {} } }),
    })
    expect(response.status()).toBe(503)
    const body = await response.json()
    expect(body.error.code).toBe('PAYMENTS_NOT_CONFIGURED')
  })
})

test.describe('Resume payment endpoint', () => {
  test('POST /api/bookings/:id/pay without a session returns 401', async ({ request }) => {
    const response = await request.post('/api/bookings/some-booking-id/pay')
    expect(response.status()).toBe(401)
    const body = await response.json()
    expect(body.error.code).toBe('UNAUTHORIZED')
  })
})
