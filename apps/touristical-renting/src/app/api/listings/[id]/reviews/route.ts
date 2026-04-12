import { NextRequest } from 'next/server'
import { ok, notFound, internalError } from '@/lib/api/response'
import { handlePrismaError } from '@/lib/api/prisma-errors'
import { getListingById } from '@/lib/services/listings'
import { getListingReviews } from '@/lib/services/reviews'

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * @swagger
 * /api/listings/{id}/reviews:
 *   get:
 *     operationId: listings_get_reviews
 *     summary: Get published reviews for a listing
 *     description: Returns only reviews that have been published (both parties reviewed, or 14-day timeout passed).
 *     tags:
 *       - reviews
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Listing ID
 *     responses:
 *       200:
 *         description: Published reviews for the listing
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Review'
 *       404:
 *         description: Listing not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
export async function GET(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params

  const listing = await getListingById(id)
  if (!listing) return notFound('Listing not found')

  try {
    const reviews = await getListingReviews(id)
    return ok(reviews)
  } catch (error) {
    return handlePrismaError(error) ?? internalError()
  }
}
