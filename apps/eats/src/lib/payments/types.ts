/**
 * Pluggable payment provider interface (ADR-006 amendment, 2026-07-03).
 *
 * The payment layer is a provider interface, not a PSP module — mirroring the
 * EmailProvider pattern in src/lib/email/. Services, routes, and UI depend
 * only on these types and the generic Payment record; PSP SDKs are imported
 * exclusively by implementations inside src/lib/payments/.
 *
 * Constitution: the amount charged online is exactly the total shown to the
 * customer before confirmation (items + published flat infrastructure fee).
 * Nothing else is ever added inside the payment path.
 */

export type CheckoutLineItem = { name: string; amountCents: number; quantity: number }

export type CheckoutSessionRequest = {
  paymentId: string
  referenceId: string // the orderId this payment settles
  amountCents: number // exact pre-confirmation total — never recomputed
  currency: string
  lineItems: CheckoutLineItem[]
  successUrl: string
  cancelUrl: string
}

export type CheckoutSession = { sessionId: string; checkoutUrl: string }

export type PaymentWebhookEvent =
  | { type: 'payment.succeeded'; sessionId: string; paymentReference: string | null }
  | { type: 'payment.canceled'; sessionId: string }
  | { type: 'ignored' }

export interface PaymentProvider {
  /** Stored in Payment.provider for every payment this provider creates. */
  readonly id: string
  /** Create a hosted checkout session the customer is redirected to. */
  createCheckoutSession(request: CheckoutSessionRequest): Promise<CheckoutSession>
  /**
   * Authenticate and translate an incoming webhook request.
   * MUST throw on failed authentication (bad/missing signature).
   * Returns { type: 'ignored' } for events that don't affect payment state.
   */
  parseWebhookEvent(rawBody: string, headers: Headers): Promise<PaymentWebhookEvent>
}
