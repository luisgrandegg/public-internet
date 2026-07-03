import { NextRequest } from 'next/server'
import {
  created,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  validationError,
  internalError,
} from '@/lib/api/response'
import { handlePrismaError } from '@/lib/api/prisma-errors'
import { requireSession } from '@/lib/api/auth-guard'
import { flattenZodErrors } from '@/lib/api/zod'
import { CreateReviewSchema } from '@/lib/schemas/reviews'
import { createReviewForOrder } from '@/lib/services/reviews'

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * @swagger
 * /api/orders/{id}/review:
 *   post:
 *     operationId: orders_review_create
 *     summary: Review a delivered order's restaurant (order owner only, once per order)
 *     description: Only the customer who placed the order can review it, only after it was DELIVERED, and only once. Reviews are honest feedback — never incentivised, never removable by the restaurant.
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateReviewInput'
 *     responses:
 *       201:
 *         description: Review created
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
 *         description: Not the order owner
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
 *         description: Order already reviewed, or not yet delivered
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       422:
 *         description: Validation error (rating must be an integer 1–5)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
export async function POST(req: NextRequest, { params }: RouteContext) {
  const session = await requireSession(req)
  if (!session) return unauthorized()

  const { id } = await params

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return validationError({ _: 'Request body must be valid JSON' })
  }

  const parsed = CreateReviewSchema.safeParse(body)
  if (!parsed.success) {
    return validationError(flattenZodErrors(parsed.error))
  }

  try {
    const result = await createReviewForOrder(session.user.id, id, parsed.data)
    if (!result.ok) {
      switch (result.error.code) {
        case 'ORDER_NOT_FOUND':
          return notFound(result.error.message)
        case 'NOT_ORDER_OWNER':
          return forbidden(result.error.message)
        case 'ORDER_NOT_DELIVERED':
        case 'ALREADY_REVIEWED':
          return conflict(result.error.message)
      }
    }
    return created(result.review)
  } catch (error) {
    return handlePrismaError(error) ?? internalError()
  }
}
