import { selectPaymentProvider, type PaymentProvider } from '@public-internet/payments'

export type {
  PaymentProvider,
  CheckoutLineItem,
  CheckoutSessionRequest,
  CheckoutSession,
  PaymentWebhookEvent,
} from '@public-internet/payments'
export { StripePaymentProvider } from '@public-internet/payments'

/**
 * Payment.provider value for direct settlement (pay on delivery) — a
 * first-class operating mode for a commission-free node, not a stub.
 */
export const PAYMENT_PROVIDER_OFFLINE = 'offline' as const

/**
 * The active payment provider for this node (ADR-006 + amendment; ADR-007).
 * The interface, the Stripe implementation, and env-driven selection live in
 * @public-internet/payments — the only module allowed to import a PSP SDK.
 *
 * Provider selection is configuration, not code:
 *
 *   - STRIPE_SECRET_KEY set   → hosted Stripe Checkout via StripePaymentProvider.
 *   - no provider configured  → null: the node runs offline settlement
 *     (pay on delivery). Payments are recorded as provider 'offline',
 *     SUCCEEDED, and POST /api/webhooks/payments answers 503.
 *
 * Plugging in another gateway (a regional PSP, a co-op banking partner):
 *   1. Implement the PaymentProvider interface from @public-internet/payments
 *      in a new file in this directory (e.g. ./myprovider.ts) — it is the
 *      ONLY app file allowed to import that PSP's SDK. `id` is stored in
 *      Payment.provider; `parseWebhookEvent` MUST authenticate the request
 *      (throw on a bad or missing signature) before mapping events to the
 *      generic lifecycle.
 *   2. Select it below from your provider's own env vars, e.g.
 *        process.env.MYPROVIDER_API_KEY ? new MyPaymentProvider() : selectPaymentProvider()
 *   3. Point the PSP's webhooks at POST /api/webhooks/payments — the route is
 *      provider-agnostic and delegates authentication + translation to
 *      parseWebhookEvent.
 * Nothing outside src/lib/payments/ changes.
 */
export const paymentProvider: PaymentProvider | null = selectPaymentProvider()
