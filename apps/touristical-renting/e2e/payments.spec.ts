import { test, expect } from '@playwright/test'

/**
 * Payments (ADR-006) — Stripe-mode route behaviour that can run in CI
 * without a Stripe account.
 *
 * The webhook endpoint must reject anything that does not carry a valid
 * Stripe signature: it is exempt from session auth, so the signature is its
 * only line of defence.
 */

test.describe('Stripe webhook endpoint', () => {
  test('POST with a garbage body and no signature returns 400', async ({ request }) => {
    const response = await request.post('/api/webhooks/stripe', {
      headers: { 'content-type': 'application/json' },
      data: 'not-a-stripe-event',
    })
    expect(response.status()).toBe(400)
    const body = await response.json()
    expect(body.error.code).toBe('VALIDATION_ERROR')
  })

  test('POST with a forged signature header returns 400', async ({ request }) => {
    const response = await request.post('/api/webhooks/stripe', {
      headers: {
        'content-type': 'application/json',
        'stripe-signature': 't=1,v1=deadbeef',
      },
      data: JSON.stringify({ type: 'checkout.session.completed', data: { object: {} } }),
    })
    expect(response.status()).toBe(400)
    const body = await response.json()
    expect(body.error.code).toBe('VALIDATION_ERROR')
  })
})
