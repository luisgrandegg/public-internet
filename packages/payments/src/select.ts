import type { PaymentProvider } from './types'
import { StripePaymentProvider } from './stripe'

/**
 * Provider selection (ADR-006, amended; ADR-007). Mode selection is
 * configuration, not code:
 *
 *   - STRIPE_SECRET_KEY set   → online payments via the Stripe provider.
 *   - no provider configured  → null: offline settlement mode. Payment
 *     records are created as provider 'offline', SUCCEEDED, and the money is
 *     settled directly (pay on delivery / pay at the property). The webhook
 *     endpoint answers 503.
 *
 * To plug in another gateway (a regional PSP, a co-op banking partner),
 * implement the PaymentProvider interface from this package in a file inside
 * your app's src/lib/payments/ — that file is the only app code allowed to
 * import the PSP's SDK — and select it in the app's src/lib/payments/index.ts
 * based on your own environment variables, e.g.
 *
 *   export const paymentProvider: PaymentProvider | null =
 *     process.env.MYPROVIDER_API_KEY
 *       ? new MyPaymentProvider()
 *       : selectPaymentProvider()
 *
 * Everything outside the payments layer depends only on the interface — no
 * PSP SDK may be imported elsewhere.
 */
export function selectPaymentProvider(): PaymentProvider | null {
  return process.env.STRIPE_SECRET_KEY ? new StripePaymentProvider() : null
}
