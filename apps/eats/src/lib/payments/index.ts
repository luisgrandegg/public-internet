import type { PaymentProvider } from './types'
import { StripePaymentProvider } from './stripe'

export type {
  PaymentProvider,
  CheckoutLineItem,
  CheckoutSessionRequest,
  CheckoutSession,
  PaymentWebhookEvent,
} from './types'
export { StripePaymentProvider } from './stripe'

/**
 * Payment.provider value for direct settlement (pay on delivery) — a
 * first-class operating mode for a commission-free node, not a stub.
 */
export const PAYMENT_PROVIDER_OFFLINE = 'offline' as const

/**
 * The active payment provider for this node (ADR-006 + amendment).
 *
 * Provider selection is configuration, not code:
 *
 *   - STRIPE_SECRET_KEY set   → hosted Stripe Checkout via StripePaymentProvider.
 *   - no provider configured  → null: the node runs offline settlement
 *     (pay on delivery). Payments are recorded as provider 'offline',
 *     SUCCEEDED, and POST /api/webhooks/payments answers 503.
 *
 * Plugging in another gateway (a regional PSP, a co-op banking partner):
 *   1. Implement the PaymentProvider interface from ./types in a new file in
 *      this directory (e.g. ./myprovider.ts) — it is the ONLY place allowed
 *      to import that PSP's SDK. `id` is stored in Payment.provider;
 *      `parseWebhookEvent` MUST authenticate the request (throw on a bad or
 *      missing signature) before mapping events to the generic lifecycle.
 *   2. Select it below from your provider's own env vars, e.g.
 *        process.env.MYPROVIDER_API_KEY ? new MyPaymentProvider() : ...
 *   3. Point the PSP's webhooks at POST /api/webhooks/payments — the route is
 *      provider-agnostic and delegates authentication + translation to
 *      parseWebhookEvent.
 * Nothing outside src/lib/payments/ changes.
 */
export const paymentProvider: PaymentProvider | null = process.env.STRIPE_SECRET_KEY
  ? new StripePaymentProvider()
  : null
