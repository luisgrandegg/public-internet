import { NextRequest } from 'next/server'
import { ok, noContent, unauthorized, notFound, internalError } from '@/lib/api/response'
import { handlePrismaError } from '@/lib/api/prisma-errors'
import { requireSession } from '@/lib/api/auth-guard'
import { addFavorite, removeFavorite } from '@/lib/services/favorites'
import { getListingById } from '@/lib/services/listings'

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * @swagger
 * /api/listings/{id}/favorite:
 *   post:
 *     operationId: listings_favorite_create
 *     summary: Save a listing to the signed-in user's favorites
 *     description: Idempotent — saving an already-saved listing is a no-op.
 *     tags:
 *       - favorites
 *     security:
 *       - sessionCookie: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Listing ID
 *     responses:
 *       200:
 *         description: Listing is saved to favorites
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/FavoriteStatus'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: Listing not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
export async function POST(req: NextRequest, { params }: RouteContext) {
  const session = await requireSession(req)
  if (!session) return unauthorized()

  const { id } = await params
  const listing = await getListingById(id)
  if (!listing) return notFound('Listing not found')

  try {
    await addFavorite(session.user.id, id)
    return ok({ listingId: id, favorited: true })
  } catch (error) {
    return handlePrismaError(error) ?? internalError()
  }
}

/**
 * @swagger
 * /api/listings/{id}/favorite:
 *   delete:
 *     operationId: listings_favorite_delete
 *     summary: Remove a listing from the signed-in user's favorites
 *     description: Idempotent — removing a listing that is not saved is a no-op.
 *     tags:
 *       - favorites
 *     security:
 *       - sessionCookie: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Listing ID
 *     responses:
 *       204:
 *         description: Listing removed from favorites
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: Listing not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const session = await requireSession(req)
  if (!session) return unauthorized()

  const { id } = await params
  const listing = await getListingById(id)
  if (!listing) return notFound('Listing not found')

  try {
    await removeFavorite(session.user.id, id)
    return noContent()
  } catch (error) {
    return handlePrismaError(error) ?? internalError()
  }
}
