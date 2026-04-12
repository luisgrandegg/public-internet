import { NextRequest } from 'next/server'
import { created, unauthorized, forbidden, notFound, conflict, validationError, internalError } from '@/lib/api/response'
import { handlePrismaError } from '@/lib/api/prisma-errors'
import { requireSession } from '@/lib/api/auth-guard'
import { flattenZodErrors } from '@/lib/api/zod'
import { CreateReviewSchema } from '@/lib/schemas/reviews'
import { createReview } from '@/lib/services/reviews'

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * @swagger
 * /api/bookings/{id}/review:
 *   post:
 *     operationId: bookings_create_review
 *     summary: Submit a review for a completed booking
 *     description: Reviews are published simultaneously when both parties have reviewed the same booking, preventing retaliation.
 *     tags:
 *       - reviews
 *     security:
 *       - sessionCookie: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateReviewInput'
 *     responses:
 *       201:
 *         description: Review submitted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Review'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       403:
 *         description: Not a participant in this booking
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
 *         description: Already reviewed this booking
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       422:
 *         description: Validation failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
export async function POST(req: NextRequest, { params }: RouteContext) {
  const session = await requireSession(req)
  if (!session) return unauthorized()

  const { id } = await params
  const body = await req.json()
  const parsed = CreateReviewSchema.safeParse(body)
  if (!parsed.success) return validationError(flattenZodErrors(parsed.error))

  try {
    const review = await createReview(session.user.id, id, parsed.data)
    return created(review)
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'BOOKING_NOT_FOUND') return notFound('Booking not found')
      if (error.message === 'NOT_BOOKING_PARTICIPANT') return forbidden('You are not a participant in this booking')
      if (error.message === 'ALREADY_REVIEWED') return conflict('You have already reviewed this booking')
    }
    return handlePrismaError(error) ?? internalError()
  }
}
