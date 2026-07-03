import Stripe from 'stripe'
import type {
  CheckoutSession,
  CheckoutSessionRequest,
  PaymentProvider,
  PaymentWebhookEvent,
} from './types'

/**
 * Stripe implementation of the PaymentProvider interface (ADR-006, amended).
 *
 * The entire Stripe surface lives in this file — no module outside
 * src/lib/payments/ may import 'stripe'.
 */
export class StripePaymentProvider implements PaymentProvider {
  readonly id = 'stripe'

  private client: Stripe | null = null

  /**
   * Lazy Stripe client — constructed on first use so that offline nodes
   * (no STRIPE_SECRET_KEY) never touch the Stripe SDK at runtime.
   * Throws if called while Stripe is not configured.
   */
  private getClient(): Stripe {
    const secretKey = process.env.STRIPE_SECRET_KEY
    if (!secretKey) {
      throw new Error('STRIPE_NOT_CONFIGURED')
    }
    if (!this.client) {
      this.client = new Stripe(secretKey)
    }
    return this.client
  }

  /**
   * Creates a hosted Stripe Checkout Session. The line items sum to exactly
   * the displayed total — no fees, no surcharges (ADR-006).
   */
  async createCheckoutSession(request: CheckoutSessionRequest): Promise<CheckoutSession> {
    const stripe = this.getClient()

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: request.lineItems.map((item) => ({
        quantity: item.quantity,
        price_data: {
          currency: request.currency,
          unit_amount: item.amountCents,
          product_data: { name: item.name },
        },
      })),
      success_url: request.successUrl,
      cancel_url: request.cancelUrl,
      metadata: { paymentId: request.paymentId, referenceId: request.referenceId },
    })

    if (!session.url) throw new Error('STRIPE_SESSION_URL_MISSING')
    return { sessionId: session.id, checkoutUrl: session.url }
  }

  /**
   * Verifies the Stripe-Signature header against STRIPE_WEBHOOK_SECRET and
   * maps the Stripe event onto the generic payment lifecycle:
   * - checkout.session.completed → payment.succeeded (payment_intent as reference)
   * - checkout.session.expired   → payment.canceled
   * - anything else              → ignored
   * Throws on a missing/invalid signature or missing webhook secret.
   */
  async parseWebhookEvent(rawBody: string, headers: Headers): Promise<PaymentWebhookEvent> {
    const signature = headers.get('stripe-signature')
    if (!signature) {
      throw new Error('STRIPE_SIGNATURE_MISSING')
    }
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET_NOT_CONFIGURED')
    }

    // Signature verification requires the exact raw body — never parse first.
    const event = this.getClient().webhooks.constructEvent(rawBody, signature, webhookSecret)

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      return {
        type: 'payment.succeeded',
        sessionId: session.id,
        paymentReference:
          typeof session.payment_intent === 'string'
            ? session.payment_intent
            : session.payment_intent?.id ?? null,
      }
    }

    if (event.type === 'checkout.session.expired') {
      const session = event.data.object as Stripe.Checkout.Session
      return { type: 'payment.canceled', sessionId: session.id }
    }

    return { type: 'ignored' }
  }
}
