import { NextRequest } from 'next/server'
import { ok, errorResponse, internalError } from '@/lib/api/response'
import { db } from '@/lib/db'
import { paymentProvider } from '@/lib/payments'

/**
 * @swagger
 * /api/webhooks/payments:
 *   post:
 *     operationId: webhooks_payments
 *     summary: Payment provider webhook receiver
 *     description: >
 *       Receives payment events from the node's configured payment provider
 *       (ADR-006). The request is authenticated by the provider implementation
 *       itself (e.g. Stripe signature verification) — no session cookie is
 *       required. A payment.succeeded event marks the payment SUCCEEDED and
 *       stores the provider's payment reference; payment.canceled marks a
 *       PENDING payment CANCELED. Events that don't affect payment state are
 *       acknowledged and ignored. When no payment provider is configured
 *       (offline settlement mode) the endpoint returns 503.
 *     tags:
 *       - webhooks
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Raw provider event payload (authenticated by the provider)
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
 *         description: Webhook authentication failed (bad or missing signature)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       503:
 *         description: No payment provider configured (offline settlement mode)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
export async function POST(req: NextRequest) {
  if (!paymentProvider) {
    return errorResponse(503, {
      code: 'PAYMENTS_NOT_CONFIGURED',
      message: 'No payment provider is configured — this node runs offline settlement',
    })
  }

  // Webhook authentication needs the exact raw body — never parse first.
  const rawBody = await req.text()

  let event
  try {
    event = await paymentProvider.parseWebhookEvent(rawBody, req.headers)
  } catch {
    return errorResponse(400, {
      code: 'VALIDATION_ERROR',
      message: 'Webhook authentication failed',
    })
  }

  try {
    if (event.type === 'payment.succeeded' || event.type === 'payment.canceled') {
      const payment = await db.payment.findFirst({
        where: { providerSessionId: event.sessionId },
      })

      // Unknown payment: acknowledge with 200 so the provider does not retry
      // an event this node can never process.
      if (payment) {
        if (event.type === 'payment.succeeded') {
          await db.payment.update({
            where: { id: payment.id },
            data: {
              status: 'SUCCEEDED',
              providerPaymentReference: event.paymentReference,
            },
          })
        } else if (payment.status === 'PENDING') {
          // Cancellation only moves a payment out of PENDING — a settled
          // payment is never un-settled by an expiry event.
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
