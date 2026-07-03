import Stripe from 'stripe'

/**
 * Single owner of the Stripe surface (ADR-006).
 *
 * Mode selection is configuration, not code:
 * - STRIPE_SECRET_KEY set   → online payments via Stripe Checkout Sessions.
 * - STRIPE_SECRET_KEY unset → offline settlement: payment records are created
 *   as provider 'offline', SUCCEEDED, and the guest pays at the property.
 *
 * No other module may import 'stripe' directly.
 */

export const PAYMENT_CURRENCY = 'eur'

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY)
}

let stripeClient: Stripe | null = null

/**
 * Lazy Stripe client — constructed on first use so that offline nodes
 * (no STRIPE_SECRET_KEY) never touch the Stripe SDK at runtime.
 * Throws if called while Stripe is not configured.
 */
export function getStripeClient(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    throw new Error('STRIPE_NOT_CONFIGURED')
  }
  if (!stripeClient) {
    stripeClient = new Stripe(secretKey)
  }
  return stripeClient
}

interface CheckoutSessionParams {
  bookingId: string
  paymentId: string
  /** Product line label, e.g. "Seaside flat — 3 nights" */
  label: string
  /** Exactly the pre-confirmation total, in cents. Nothing is ever added. */
  amount: number
}

/**
 * Creates a Stripe Checkout Session for a booking. A single line item whose
 * amount equals the displayed total exactly — no fees, no surcharges (ADR-006).
 */
export async function createCheckoutSession({
  bookingId,
  paymentId,
  label,
  amount,
}: CheckoutSessionParams): Promise<{ sessionId: string; checkoutUrl: string }> {
  const stripe = getStripeClient()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: PAYMENT_CURRENCY,
          unit_amount: amount,
          product_data: { name: label },
        },
      },
    ],
    success_url: `${appUrl}/bookings/${bookingId}?checkout=success`,
    cancel_url: `${appUrl}/bookings/${bookingId}?checkout=canceled`,
    metadata: { bookingId, paymentId },
  })

  if (!session.url) throw new Error('STRIPE_SESSION_URL_MISSING')
  return { sessionId: session.id, checkoutUrl: session.url }
}

/**
 * Returns the hosted checkout URL for a pending session, so a guest can
 * complete an interrupted payment. Null if the session is no longer open
 * (paid, expired) or Stripe is not configured/reachable.
 */
export async function getCheckoutSessionUrl(sessionId: string): Promise<string | null> {
  if (!isStripeConfigured()) return null
  try {
    const session = await getStripeClient().checkout.sessions.retrieve(sessionId)
    return session.status === 'open' ? session.url : null
  } catch {
    return null
  }
}

/**
 * Verifies a Stripe webhook signature and returns the parsed event.
 * Throws if STRIPE_WEBHOOK_SECRET is unset or the signature is invalid.
 */
export function constructWebhookEvent(rawBody: string, signature: string): Stripe.Event {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET_NOT_CONFIGURED')
  }
  const stripe = getStripeClient()
  return stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
}
