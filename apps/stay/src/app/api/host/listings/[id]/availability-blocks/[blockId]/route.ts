import { NextRequest } from 'next/server'
import { noContent, unauthorized, forbidden, notFound, internalError } from '@/lib/api/response'
import { handlePrismaError } from '@/lib/api/prisma-errors'
import { requireSession } from '@/lib/api/auth-guard'
import { getAvailabilityBlockById, deleteAvailabilityBlock } from '@/lib/services/availability-blocks'
import { getListingById } from '@/lib/services/listings'

interface RouteContext {
  params: Promise<{ id: string; blockId: string }>
}

/**
 * @swagger
 * /api/host/listings/{id}/availability-blocks/{blockId}:
 *   delete:
 *     operationId: host_listings_availability_blocks_delete
 *     summary: Remove an availability block from one of the host's listings
 *     tags:
 *       - host
 *     security:
 *       - sessionCookie: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Listing ID
 *       - in: path
 *         name: blockId
 *         required: true
 *         schema:
 *           type: string
 *         description: Availability block ID
 *     responses:
 *       204:
 *         description: Availability block deleted
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       403:
 *         description: Not the listing host
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: Listing or availability block not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const session = await requireSession(req)
  if (!session) return unauthorized()

  const { id, blockId } = await params
  const listing = await getListingById(id)
  if (!listing) return notFound('Listing not found')
  if (listing.hostId !== session.user.id) return forbidden('You are not the host of this listing')

  const block = await getAvailabilityBlockById(blockId)
  if (!block || block.listingId !== id) return notFound('Availability block not found')

  try {
    await deleteAvailabilityBlock(blockId)
    return noContent()
  } catch (error) {
    return handlePrismaError(error) ?? internalError()
  }
}
