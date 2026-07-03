import Stripe from 'stripe'

/**
 * Payment provider integration (ADR-006).
 *
 * The entire Stripe surface of the app lives in this module — no other file
 * may import 'stripe' directly. Mode selection is configuration, not code:
 *
 *   - STRIPE_SECRET_KEY set   → online payments via hosted Stripe Checkout.
 *   - STRIPE_SECRET_KEY unset → offline settlement (pay on delivery). This is
 *     a legitimate operating mode for a commission-free node, not a stub.
 *
 * Constitution: the amount charged online is exactly the total shown to the
 * customer before confirmation (items + published flat infrastructure fee).
 * Nothing else is ever added inside the payment path.
 */

export const PAYMENT_PROVIDER_STRIPE = 'stripe' as const
export const PAYMENT_PROVIDER_OFFLINE = 'offline' as const

/** True when this node is configured to take online card payments via Stripe. */
export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY)
}

let stripeClient: Stripe | null = null

/**
 * Lazily construct the Stripe client. Throws if the node is not configured
 * for Stripe — callers must check isStripeConfigured() first.
 */
function getStripeClient(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    throw new Error('Stripe is not configured on this node (STRIPE_SECRET_KEY is unset)')
  }
  if (!stripeClient) {
    stripeClient = new Stripe(secretKey)
  }
  return stripeClient
}

export interface CheckoutLineItem {
  /** Human-readable label shown on the Stripe-hosted checkout page. */
  name: string
  /** Unit price in cents — snapshotted at order time, never recomputed. */
  unitAmount: number
  quantity: number
}

export interface CreateCheckoutSessionInput {
  orderId: string
  paymentId: string
  currency: string
  /**
   * One line per order item (unitPrice snapshot) plus exactly one line for the
   * flat infrastructure fee. The sum MUST equal order.totalCost — the payment
   * path never adds anything on top of the pre-confirmation total.
   */
  lineItems: CheckoutLineItem[]
}

export interface CheckoutSessionResult {
  sessionId: string
  /** Hosted checkout URL the customer is redirected to. */
  url: string
}

/**
 * Create a hosted Stripe Checkout Session for an order. The redirect back to
 * the app is never trusted as proof of payment — only the signature-verified
 * webhook (checkout.session.completed) marks the payment SUCCEEDED.
 */
export async function createCheckoutSession(
  input: CreateCheckoutSessionInput,
): Promise<CheckoutSessionResult> {
  const stripe = getStripeClient()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3001'

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: input.lineItems.map((item) => ({
      price_data: {
        currency: input.currency,
        product_data: { name: item.name },
        unit_amount: item.unitAmount,
      },
      quantity: item.quantity,
    })),
    success_url: `${appUrl}/orders/${input.orderId}?checkout=success`,
    cancel_url: `${appUrl}/orders/${input.orderId}?checkout=canceled`,
    metadata: {
      orderId: input.orderId,
      paymentId: input.paymentId,
    },
  })

  if (!session.url) {
    throw new Error('Stripe did not return a checkout URL for the session')
  }
  return { sessionId: session.id, url: session.url }
}

/**
 * Verify and parse a Stripe webhook payload against STRIPE_WEBHOOK_SECRET.
 * Throws on a missing secret or an invalid signature — callers respond 400.
 * `rawBody` must be the exact request body text (no re-serialisation).
 */
export function verifyStripeWebhookEvent(rawBody: string, signature: string): Stripe.Event {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not configured — cannot verify webhook signature')
  }
  return getStripeClient().webhooks.constructEvent(rawBody, signature, webhookSecret)
}

/** Narrowed shape of the checkout session fields the webhook handler consumes. */
export interface StripeCheckoutSessionEventData {
  sessionId: string
  orderId: string | null
  paymentId: string | null
  paymentIntentId: string | null
}

/** Extract the fields we persist from a checkout.session.* event object. */
export function extractCheckoutSessionData(event: Stripe.Event): StripeCheckoutSessionEventData {
  const session = event.data.object as Stripe.Checkout.Session
  return {
    sessionId: session.id,
    orderId: session.metadata?.orderId ?? null,
    paymentId: session.metadata?.paymentId ?? null,
    paymentIntentId:
      typeof session.payment_intent === 'string'
        ? session.payment_intent
        : session.payment_intent?.id ?? null,
  }
}
