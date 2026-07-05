import { NextRequest } from 'next/server'
import { ok, notFound, validationError, internalError } from '@/lib/api/response'
import { handlePrismaError } from '@/lib/api/prisma-errors'
import { flattenZodErrors } from '@/lib/api/zod'
import { ReviewsQuerySchema } from '@/lib/schemas/reviews'
import { listReviewsForRestaurant } from '@/lib/services/reviews'
import { getRestaurantById } from '@/lib/services/restaurants'

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * @swagger
 * /api/restaurants/{id}/reviews:
 *   get:
 *     operationId: restaurants_reviews_list
 *     summary: List reviews for a restaurant (public, recent first)
 *     description: Paginated, recent-first list of verified-order reviews with the author's name. Reviews cannot be hidden or reordered by the restaurant.
 *     tags:
 *       - reviews
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *     responses:
 *       200:
 *         description: Paginated list of reviews, newest first
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/PaginatedReviews'
 *       404:
 *         description: Restaurant not found or inactive
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       422:
 *         description: Invalid pagination parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
export async function GET(req: NextRequest, { params }: RouteContext) {
  const { id } = await params
  const { searchParams } = new URL(req.url)

  const parsed = ReviewsQuerySchema.safeParse({
    page: searchParams.get('page') ?? undefined,
    limit: searchParams.get('limit') ?? undefined,
  })
  if (!parsed.success) {
    return validationError(flattenZodErrors(parsed.error))
  }

  try {
    const restaurant = await getRestaurantById(id)
    if (!restaurant) return notFound('Restaurant not found')

    const result = await listReviewsForRestaurant(id, parsed.data)
    return ok(result)
  } catch (error) {
    return handlePrismaError(error) ?? internalError()
  }
}
