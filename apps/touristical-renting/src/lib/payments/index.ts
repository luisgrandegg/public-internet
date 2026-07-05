import { selectPaymentProvider, type PaymentProvider } from '@public-internet/payments'

export type {
  CheckoutLineItem,
  CheckoutSession,
  CheckoutSessionRequest,
  PaymentProvider,
  PaymentWebhookEvent,
} from '@public-internet/payments'
export { StripePaymentProvider } from '@public-internet/payments'

export const PAYMENT_CURRENCY = 'eur'

/**
 * The active payment provider for this node (ADR-006, amended; ADR-007).
 * The interface, the Stripe implementation, and env-driven selection live in
 * @public-internet/payments — the only module allowed to import a PSP SDK.
 * Mode selection is configuration, not code:
 * - STRIPE_SECRET_KEY set   → online payments via the Stripe provider.
 * - no provider configured  → null: offline settlement mode. Payment records
 *   are created as provider 'offline', SUCCEEDED, and the guest pays at the
 *   property.
 *
 * To plug in another gateway, implement PaymentProvider (from the package) in
 * a sibling file (src/lib/payments/<yourprovider>.ts — the only app file
 * allowed to import that PSP's SDK) and select it here based on your own
 * environment variables, falling back to selectPaymentProvider(). Everything
 * outside the payments layer depends only on the interface.
 */
export const paymentProvider: PaymentProvider | null = selectPaymentProvider()
