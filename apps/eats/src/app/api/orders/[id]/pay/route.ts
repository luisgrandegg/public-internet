import { NextRequest } from 'next/server'
import {
  ok,
  unauthorized,
  forbidden,
  notFound,
  internalError,
  errorResponse,
} from '@/lib/api/response'
import { handlePrismaError } from '@/lib/api/prisma-errors'
import { requireSession } from '@/lib/api/auth-guard'
import { resumePaymentForOrder } from '@/lib/services/orders'

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * @swagger
 * /api/orders/{id}/pay:
 *   post:
 *     operationId: orders_pay
 *     summary: Resume the online payment for an order (order owner only)
 *     description: >
 *       Returns a live hosted-checkout URL for an order whose online payment
 *       is still PENDING (ADR-006 §4 — the "Complete payment" path). When the
 *       provider reports the stored checkout session as still open, its URL is
 *       reused; an expired or missing session is replaced with a fresh one
 *       carrying exactly the original line items and total (never recomputed).
 *       A session the provider reports as complete is rejected with 409
 *       PAYMENT_ALREADY_SETTLING — the webhook will confirm the payment, and
 *       the customer is never offered a way to pay twice. Orders settled
 *       offline, or whose payment is not PENDING, are rejected with 409
 *       PAYMENT_NOT_RESUMABLE.
 *     tags:
 *       - orders
 *     security:
 *       - sessionCookie: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Live hosted-checkout URL for completing the payment
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/CheckoutResume'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       403:
 *         description: Not the customer who placed this order
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: Order not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       409:
 *         description: No pending online payment to resume (code PAYMENT_NOT_RESUMABLE), or the checkout already completed and is being confirmed by webhook (code PAYMENT_ALREADY_SETTLING)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       502:
 *         description: The payment provider could not create a checkout session
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       503:
 *         description: No payment provider is configured on this node (code PAYMENTS_NOT_CONFIGURED)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
export async function POST(req: NextRequest, { params }: RouteContext) {
  const session = await requireSession(req)
  if (!session) return unauthorized()

  const { id } = await params

  try {
    const result = await resumePaymentForOrder(session.user.id, id)
    if (!result.ok) {
      switch (result.error.code) {
        case 'ORDER_NOT_FOUND':
          return notFound(result.error.message)
        case 'NOT_ORDER_OWNER':
          return forbidden(result.error.message)
        case 'PAYMENT_NOT_RESUMABLE':
          return errorResponse(409, {
            code: 'PAYMENT_NOT_RESUMABLE',
            message: result.error.message,
          })
        case 'PAYMENT_ALREADY_SETTLING':
          return errorResponse(409, {
            code: 'PAYMENT_ALREADY_SETTLING',
            message: result.error.message,
          })
        case 'PAYMENTS_NOT_CONFIGURED':
          return errorResponse(503, {
            code: 'PAYMENTS_NOT_CONFIGURED',
            message: result.error.message,
          })
        case 'PAYMENT_PROVIDER_ERROR':
          // Mirrors orders_create: upstream provider failure surfaces as 502.
          return errorResponse(502, { code: 'INTERNAL_ERROR', message: result.error.message })
      }
    }
    return ok({ checkoutUrl: result.checkoutUrl })
  } catch (error) {
    return handlePrismaError(error) ?? internalError()
  }
}
