export type {
  CheckoutLineItem,
  CheckoutSession,
  CheckoutSessionRequest,
  PaymentProvider,
  PaymentWebhookEvent,
} from './types'
export { StripePaymentProvider } from './stripe'

import type { PaymentProvider } from './types'
import { StripePaymentProvider } from './stripe'

export const PAYMENT_CURRENCY = 'eur'

/**
 * Provider selection (ADR-006, amended). Mode selection is configuration,
 * not code:
 * - STRIPE_SECRET_KEY set   → online payments via the Stripe provider.
 * - no provider configured  → null: offline settlement mode. Payment records
 *   are created as provider 'offline', SUCCEEDED, and the guest pays at the
 *   property.
 *
 * To plug in another gateway, implement PaymentProvider in a sibling file
 * (src/lib/payments/<yourprovider>.ts) and select it here based on your own
 * environment variables. Everything outside src/lib/payments/ depends only on
 * the interface — no PSP SDK may be imported elsewhere.
 */
export const paymentProvider: PaymentProvider | null = process.env.STRIPE_SECRET_KEY
  ? new StripePaymentProvider()
  : null
