import { NextRequest } from 'next/server'
import type Stripe from 'stripe'
import { ok, errorResponse, internalError } from '@/lib/api/response'
import { db } from '@/lib/db'
import { constructWebhookEvent } from '@/lib/payments'

/**
 * @swagger
 * /api/webhooks/stripe:
 *   post:
 *     operationId: webhooks_stripe
 *     summary: Stripe webhook receiver
 *     description: >
 *       Receives Stripe events for online payments (ADR-006). The request is
 *       authenticated by verifying the Stripe-Signature header against
 *       STRIPE_WEBHOOK_SECRET — no session cookie is required.
 *       checkout.session.completed marks the booking's payment SUCCEEDED and
 *       stores the payment intent id; checkout.session.expired marks it
 *       CANCELED. Other event types are acknowledged and ignored.
 *     tags:
 *       - webhooks
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Raw Stripe event payload (signature-verified)
 *     responses:
 *       200:
 *         description: Event received and processed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     received:
 *                       type: boolean
 *       400:
 *         description: Missing or invalid Stripe signature
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
export async function POST(req: NextRequest) {
  // Signature verification requires the exact raw body — never parse first.
  const rawBody = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return errorResponse(400, {
      code: 'VALIDATION_ERROR',
      message: 'Missing Stripe-Signature header',
    })
  }

  let event: Stripe.Event
  try {
    event = constructWebhookEvent(rawBody, signature)
  } catch {
    return errorResponse(400, {
      code: 'VALIDATION_ERROR',
      message: 'Invalid Stripe webhook signature',
    })
  }

  try {
    if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.expired') {
      const session = event.data.object as Stripe.Checkout.Session
      const paymentId = session.metadata?.paymentId

      // Locate the payment by our own id from metadata, falling back to the
      // stored checkout session id.
      const where = paymentId
        ? { id: paymentId }
        : { stripeCheckoutSessionId: session.id }
      const payment = await db.payment.findFirst({ where })

      // Unknown payment: acknowledge with 200 so Stripe does not retry an
      // event this node can never process.
      if (payment) {
        if (event.type === 'checkout.session.completed') {
          await db.payment.update({
            where: { id: payment.id },
            data: {
              status: 'SUCCEEDED',
              stripePaymentIntentId:
                typeof session.payment_intent === 'string'
                  ? session.payment_intent
                  : session.payment_intent?.id ?? null,
            },
          })
        } else {
          await db.payment.update({
            where: { id: payment.id },
            data: { status: 'CANCELED' },
          })
        }
      }
    }

    return ok({ received: true })
  } catch {
    return internalError()
  }
}
