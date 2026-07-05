import { NextRequest } from 'next/server'
import { ok, unauthorized, internalError } from '@/lib/api/response'
import { handlePrismaError } from '@/lib/api/prisma-errors'
import { requireSession } from '@/lib/api/auth-guard'
import { getFavoriteListings } from '@/lib/services/favorites'

/**
 * @swagger
 * /api/favorites:
 *   get:
 *     operationId: favorites_list
 *     summary: List the signed-in user's favorited listings
 *     description: Returns favorited listings in the same card shape as the listings search — including photos, host summary, rating, and reviewCount.
 *     tags:
 *       - favorites
 *     security:
 *       - sessionCookie: []
 *     responses:
 *       200:
 *         description: Favorited listings, most recently saved first
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Listing'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
export async function GET(req: NextRequest) {
  const session = await requireSession(req)
  if (!session) return unauthorized()

  try {
    const listings = await getFavoriteListings(session.user.id)
    return ok(listings)
  } catch (error) {
    return handlePrismaError(error) ?? internalError()
  }
}
