import { NextRequest } from 'next/server'
import {
  ok,
  errorResponse,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  internalError,
} from '@/lib/api/response'
import { handlePrismaError } from '@/lib/api/prisma-errors'
import { requireSession } from '@/lib/api/auth-guard'
import { resumeBookingPayment } from '@/lib/services/bookings'

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * @swagger
 * /api/bookings/{id}/pay:
 *   post:
 *     operationId: bookings_pay
 *     summary: Get a live checkout URL for a booking's pending online payment
 *     description: >
 *       Returns a hosted-checkout URL the guest can be redirected to in order
 *       to complete a PENDING online payment. The stored checkout URL is never
 *       handed out blindly — providers expire hosted sessions, so when the
 *       provider can report the stored session's live status it is consulted
 *       first: an open session is resumed as-is; a completed session means the
 *       payment is already settling and the webhook will confirm it shortly
 *       (409 PAYMENT_ALREADY_SETTLING); an expired or unknown session is
 *       replaced with a fresh checkout session for exactly the stored payment
 *       amount. Only the booking's guest may call this, the payment must be
 *       PENDING with an online (non-offline) provider, and a node in offline
 *       settlement mode answers 503.
 *     tags:
 *       - bookings
 *     security:
 *       - sessionCookie: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     responses:
 *       200:
 *         description: Live hosted-checkout URL to redirect the guest to
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/BookingPaymentResume'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       403:
 *         description: Not the guest of this booking
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: Booking not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       409:
 *         description: >
 *           No pending online payment to complete (CONFLICT), or the checkout
 *           session is already completing and the webhook will confirm it
 *           (PAYMENT_ALREADY_SETTLING)
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
export async function POST(req: NextRequest, { params }: RouteContext) {
  const session = await requireSession(req)
  if (!session) return unauthorized()

  const { id } = await params

  try {
    const { checkoutUrl } = await resumeBookingPayment(id, session.user.id)
    return ok({ checkoutUrl })
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'PAYMENTS_NOT_CONFIGURED') {
        return errorResponse(503, {
          code: 'PAYMENTS_NOT_CONFIGURED',
          message: 'No payment provider is configured — this node runs offline settlement',
        })
      }
      if (error.message === 'BOOKING_NOT_FOUND') return notFound('Booking not found')
      if (error.message === 'NOT_BOOKING_GUEST') {
        return forbidden('Only the booking guest can complete this payment')
      }
      if (error.message === 'NO_PENDING_ONLINE_PAYMENT') {
        return conflict('This booking has no pending online payment to complete')
      }
      if (error.message === 'PAYMENT_ALREADY_SETTLING') {
        return errorResponse(409, {
          code: 'PAYMENT_ALREADY_SETTLING',
          message:
            'This payment is already completing — confirmation arrives via the provider webhook shortly',
        })
      }
    }
    return handlePrismaError(error) ?? internalError()
  }
}
