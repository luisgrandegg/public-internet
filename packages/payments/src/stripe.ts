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
 * The entire Stripe surface lives in this package — no module outside
 * @public-internet/payments may import 'stripe' (ADR-007). Uses the hosted
 * Checkout Session flow: no card data ever touches the app, and the redirect
 * back is never trusted as proof of payment — only the signature-verified
 * `checkout.session.completed` webhook settles a payment.
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
      throw new Error('Stripe is not configured on this node (STRIPE_SECRET_KEY is unset)')
    }
    if (!this.client) {
      this.client = new Stripe(secretKey)
    }
    return this.client
  }

  /**
   * Creates a hosted Stripe Checkout Session. The line items sum to exactly
   * request.amountCents, the displayed pre-confirmation total — no fees, no
   * surcharges (ADR-006).
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
   * Reports the live status of a previously created Checkout Session so the
   * app never offers a dead link: Stripe's `open` sessions are still payable,
   * `complete` means the money is settling (only the webhook confirms it),
   * and `expired` sessions must be regenerated.
   */
  async getCheckoutSession(
    sessionId: string,
  ): Promise<{ status: 'open' | 'complete' | 'expired'; checkoutUrl: string | null }> {
    const session = await this.getClient().checkout.sessions.retrieve(sessionId)
    // Stripe reports 'open' | 'complete' | 'expired' | null — anything that is
    // not resumable or already settling is treated as expired (regenerate).
    const status =
      session.status === 'open' || session.status === 'complete' ? session.status : 'expired'
    return { status, checkoutUrl: session.url ?? null }
  }

  /**
   * Verifies the `stripe-signature` header against STRIPE_WEBHOOK_SECRET on
   * the exact raw body Stripe sent (no re-serialisation), then translates the
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

    // Signature verification requires the exact raw body — never parse first.
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
