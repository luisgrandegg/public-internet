import { NextRequest } from 'next/server'
import { ok, errorResponse, internalError } from '@/lib/api/response'
import { db } from '@/lib/db'
import {
  isStripeConfigured,
  verifyStripeWebhookEvent,
  extractCheckoutSessionData,
} from '@/lib/payments'
import type Stripe from 'stripe'

/**
 * Stripe delivers events to this endpoint (ADR-006). It is intentionally
 * exempt from session auth — authenticity is established exclusively by
 * verifying the `stripe-signature` header against STRIPE_WEBHOOK_SECRET on
 * the raw request body. Any request that fails verification gets a 400.
 *
 * The success redirect back to the app is never trusted as proof of payment;
 * only `checkout.session.completed` marks a payment SUCCEEDED.
 *
 * @swagger
 * /api/webhooks/stripe:
 *   post:
 *     operationId: webhooks_stripe
 *     summary: Stripe webhook receiver (signature-verified, no session auth)
 *     description: >
 *       Webhook endpoint called by Stripe — not by SDK consumers. Requests are
 *       authenticated by verifying the `stripe-signature` header against
 *       STRIPE_WEBHOOK_SECRET; session cookies are ignored. Handles
 *       `checkout.session.completed` (payment → SUCCEEDED, stores the payment
 *       intent id) and `checkout.session.expired` (payment → CANCELED, which
 *       releases the abandoned checkout per ADR-006 §4). Other event types are
 *       acknowledged without action.
 *     tags:
 *       - webhooks
 *     parameters:
 *       - in: header
 *         name: stripe-signature
 *         required: true
 *         schema:
 *           type: string
 *         description: Stripe webhook signature for the raw request body
 *     requestBody:
 *       required: true
 *       content:
 *         text/plain:
 *           schema:
 *             type: string
 *             description: Raw Stripe event JSON — must not be re-serialised before verification
 *     responses:
 *       200:
 *         description: Event verified and processed (or acknowledged as unhandled)
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
 *         description: Missing or invalid signature, or the node has no Stripe webhook configuration
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
export async function POST(req: NextRequest) {
  // Raw body text — signature verification requires the exact bytes Stripe sent.
  const rawBody = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!isStripeConfigured() || !process.env.STRIPE_WEBHOOK_SECRET || !signature) {
    return errorResponse(400, {
      code: 'VALIDATION_ERROR',
      message: 'Invalid webhook request',
    })
  }

  let event: Stripe.Event
  try {
    event = verifyStripeWebhookEvent(rawBody, signature)
  } catch {
    return errorResponse(400, {
      code: 'VALIDATION_ERROR',
      message: 'Webhook signature verification failed',
    })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const data = extractCheckoutSessionData(event)
        // Match by our payment id from session metadata, falling back to the
        // stored checkout session id. updateMany keeps this idempotent.
        await db.payment.updateMany({
          where: data.paymentId
            ? { id: data.paymentId }
            : { stripeCheckoutSessionId: data.sessionId },
          data: {
            status: 'SUCCEEDED',
            stripePaymentIntentId: data.paymentIntentId,
          },
        })
        break
      }
      case 'checkout.session.expired': {
        // Stripe expires abandoned checkouts after 24h — marking the payment
        // CANCELED keeps the order permanently inert (ADR-006 §4).
        const data = extractCheckoutSessionData(event)
        await db.payment.updateMany({
          where: {
            ...(data.paymentId
              ? { id: data.paymentId }
              : { stripeCheckoutSessionId: data.sessionId }),
            // Never cancel a payment that already succeeded (out-of-order delivery).
            status: 'PENDING',
          },
          data: { status: 'CANCELED' },
        })
        break
      }
      default:
        // Unhandled event types are acknowledged so Stripe stops retrying.
        break
    }
    return ok({ received: true })
  } catch (error) {
    console.error('[webhooks/stripe] failed to process event', error)
    return internalError()
  }
}
