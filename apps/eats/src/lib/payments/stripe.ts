import Stripe from 'stripe'
import type {
  CheckoutSession,
  CheckoutSessionRequest,
  PaymentProvider,
  PaymentWebhookEvent,
} from './types'

/**
 * Stripe implementation of the PaymentProvider interface (ADR-006).
 *
 * The entire Stripe surface of the app lives in this module — no file outside
 * src/lib/payments/ may import 'stripe'. Uses the hosted Checkout Session
 * flow: no card data ever touches the app, and the redirect back is never
 * trusted as proof of payment — only the signature-verified
 * `checkout.session.completed` webhook settles a payment.
 */
export class StripePaymentProvider implements PaymentProvider {
  readonly id = 'stripe'

  private client: Stripe | null = null

  /**
   * Lazily construct the Stripe client. Throws if the node is not configured
   * for Stripe — src/lib/payments/index.ts only selects this provider when
   * STRIPE_SECRET_KEY is set.
   */
  private getClient(): Stripe {
    const secretKey = process.env.STRIPE_SECRET_KEY
    if (!secretKey) {
      throw new Error('Stripe is not configured on this node (STRIPE_SECRET_KEY is unset)')
    }
    if (!this.client) {
      this.client = new Stripe(secretKey)
    }
    return this.client
  }

  /**
   * Create a hosted Stripe Checkout Session. One line item per order item
   * (unitPrice snapshot) plus exactly one line for the published flat
   * infrastructure fee — the lines sum to request.amountCents, the exact
   * pre-confirmation total. The payment path never adds anything on top.
   */
  async createCheckoutSession(request: CheckoutSessionRequest): Promise<CheckoutSession> {
    const stripe = this.getClient()

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: request.lineItems.map((item) => ({
        price_data: {
          currency: request.currency,
          product_data: { name: item.name },
          unit_amount: item.amountCents,
        },
        quantity: item.quantity,
      })),
      success_url: request.successUrl,
      cancel_url: request.cancelUrl,
      metadata: {
        referenceId: request.referenceId,
        paymentId: request.paymentId,
      },
    })

    if (!session.url) {
      throw new Error('Stripe did not return a checkout URL for the session')
    }
    return { sessionId: session.id, checkoutUrl: session.url }
  }

  /**
   * Verify the `stripe-signature` header against STRIPE_WEBHOOK_SECRET on the
   * exact raw body Stripe sent (no re-serialisation), then translate the
   * Stripe event to the generic payment lifecycle:
   *
   *   checkout.session.completed → payment.succeeded (payment_intent id as
   *                                the durable payment reference)
   *   checkout.session.expired   → payment.canceled (Stripe expires abandoned
   *                                checkouts after 24h — ADR-006 §4)
   *   anything else              → ignored
   *
   * Throws on a missing/invalid signature or missing webhook secret — the
   * webhook route responds 400.
   */
  async parseWebhookEvent(rawBody: string, headers: Headers): Promise<PaymentWebhookEvent> {
    const signature = headers.get('stripe-signature')
    if (!signature) {
      throw new Error('Missing stripe-signature header')
    }
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not configured — cannot verify webhook signature')
    }

    const event = this.getClient().webhooks.constructEvent(rawBody, signature, webhookSecret)

    switch (event.type) {
      case 'checkout.session.completed': {
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
      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session
        return { type: 'payment.canceled', sessionId: session.id }
      }
      default:
        return { type: 'ignored' }
    }
  }
}
