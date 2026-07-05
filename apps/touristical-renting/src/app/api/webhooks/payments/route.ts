import { createPaymentWebhookHandler } from '@public-internet/payments'
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
 *       required. A payment.succeeded event marks the PENDING payment
 *       SUCCEEDED and stores the provider's payment reference. A
 *       payment.canceled event (canceled/expired checkout — the booking will
 *       never be paid) deletes the still-PENDING booking, releasing its dates
 *       for other guests per ADR-006 §4; the payment record is removed with
 *       it. Events that don't affect payment state are acknowledged and
 *       ignored. When no payment provider is configured (offline settlement
 *       mode) the endpoint returns 503.
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
// Webhook authentication, raw-body handling, and event translation live in
// @public-internet/payments (ADR-007); this route owns only the lifecycle
// effects. Both callbacks are single atomic writes whose state guard lives in
// the WHERE clause itself — no read-then-write window. Replayed or
// out-of-order events, and events for sessions this node doesn't know, match
// zero rows and are acknowledged with 200 so the provider stops retrying.
export const POST = createPaymentWebhookHandler({
  provider: paymentProvider,
  notConfiguredMessage: 'No payment provider is configured — this node runs offline settlement',
  onSucceeded: async (event) => {
    // Only a still-PENDING payment can succeed — idempotent under retries.
    await db.payment.updateMany({
      where: { providerSessionId: event.sessionId, status: 'PENDING' },
      data: {
        status: 'SUCCEEDED',
        providerPaymentReference: event.paymentReference,
      },
    })
  },
  onCanceled: async (event) => {
    // A canceled/expired checkout session will never be paid — delete the
    // booking so its dates are released for other guests (ADR-006 §4).
    // Deleting the booking cascade-deletes its Payment row, so flipping the
    // payment to CANCELED first would be redundant. The PENDING guard is
    // part of the delete's WHERE (not a prior read), so a retried cancel
    // racing a concurrent payment.succeeded can never delete a settled
    // booking — it simply matches zero rows.
    await db.booking.deleteMany({
      where: {
        payment: { providerSessionId: event.sessionId, status: 'PENDING' },
      },
    })
  },
})
