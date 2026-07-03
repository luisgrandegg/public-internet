import { NextRequest } from 'next/server'
import { ok, errorResponse, internalError } from '@/lib/api/response'
import { db } from '@/lib/db'
import { paymentProvider, type PaymentWebhookEvent } from '@/lib/payments'

/**
 * The configured payment provider delivers events to this endpoint (ADR-006
 * amendment). It is intentionally exempt from session auth — authenticity is
 * established exclusively by the active provider's `parseWebhookEvent()`,
 * which MUST authenticate the raw request (signature verification for
 * Stripe) and throws on failure → 400. With no provider configured (offline
 * settlement mode) the endpoint answers 503.
 *
 * The success redirect back to the app is never trusted as proof of payment;
 * only an authenticated `payment.succeeded` event marks a payment SUCCEEDED.
 *
 * @swagger
 * /api/webhooks/payments:
 *   post:
 *     operationId: webhooks_payments
 *     summary: Payment provider webhook receiver (provider-authenticated, no session auth)
 *     description: >
 *       Webhook endpoint called by the node's configured payment provider —
 *       not by SDK consumers. Requests are authenticated by the active
 *       PaymentProvider implementation (e.g. Stripe signature verification
 *       on the raw body); session cookies are ignored. The provider
 *       translates its events to a generic lifecycle: `payment.succeeded`
 *       marks the payment SUCCEEDED and stores the provider's durable payment
 *       reference; `payment.canceled` marks a still-PENDING payment CANCELED,
 *       releasing the abandoned checkout per ADR-006 §4. Events that do not
 *       affect payment state are acknowledged without action.
 *     tags:
 *       - webhooks
 *     requestBody:
 *       required: true
 *       content:
 *         text/plain:
 *           schema:
 *             type: string
 *             description: Raw provider event payload — must not be re-serialised before verification
 *     responses:
 *       200:
 *         description: Event authenticated and processed (or acknowledged as not payment-relevant)
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
 *         description: Webhook authentication failed (bad or missing signature)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       503:
 *         description: No payment provider is configured on this node (offline settlement mode)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
export async function POST(req: NextRequest) {
  if (!paymentProvider) {
    return errorResponse(503, {
      code: 'SERVICE_UNAVAILABLE',
      message: 'No payment provider is configured on this node',
    })
  }

  // Raw body text — webhook authentication requires the exact bytes sent.
  const rawBody = await req.text()

  let event: PaymentWebhookEvent
  try {
    event = await paymentProvider.parseWebhookEvent(rawBody, req.headers)
  } catch {
    return errorResponse(400, {
      code: 'VALIDATION_ERROR',
      message: 'Webhook authentication failed',
    })
  }

  try {
    switch (event.type) {
      case 'payment.succeeded': {
        // Match by the stored provider session id. updateMany keeps this
        // idempotent — replayed events find the row already SUCCEEDED.
        await db.payment.updateMany({
          where: { providerSessionId: event.sessionId },
          data: {
            status: 'SUCCEEDED',
            providerPaymentReference: event.paymentReference,
          },
        })
        break
      }
      case 'payment.canceled': {
        // Marking the payment CANCELED keeps the order permanently inert
        // (ADR-006 §4). Only a PENDING payment can be canceled — never one
        // that already succeeded (out-of-order delivery).
        await db.payment.updateMany({
          where: { providerSessionId: event.sessionId, status: 'PENDING' },
          data: { status: 'CANCELED' },
        })
        break
      }
      case 'ignored':
        // Events that don't affect payment state are acknowledged so the
        // provider stops retrying.
        break
    }
    return ok({ received: true })
  } catch (error) {
    console.error('[webhooks/payments] failed to process event', error)
    return internalError()
  }
}
