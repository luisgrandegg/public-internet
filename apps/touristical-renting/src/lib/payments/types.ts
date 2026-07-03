export type CheckoutLineItem = { name: string; amountCents: number; quantity: number }
export type CheckoutSessionRequest = {
  paymentId: string
  referenceId: string // the bookingId this payment settles
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
