import { NextRequest } from 'next/server'
import { ok, notFound, internalError } from '@/lib/api/response'
import { handlePrismaError } from '@/lib/api/prisma-errors'
import { getListingById, getListingAvailability } from '@/lib/services/listings'

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * @swagger
 * /api/listings/{id}/availability:
 *   get:
 *     operationId: listings_get_availability
 *     summary: Get blocked date ranges for a listing
 *     description: Returns merged blocked ranges from confirmed bookings and host availability blocks. Public endpoint — no authentication required.
 *     tags:
 *       - listings
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Listing ID
 *     responses:
 *       200:
 *         description: Blocked date ranges
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     blockedRanges:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           start:
 *                             type: string
 *                             format: date
 *                             example: "2026-07-01"
 *                           end:
 *                             type: string
 *                             format: date
 *                             example: "2026-07-05"
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
    const availability = await getListingAvailability(id)
    return ok(availability)
  } catch (error) {
    return handlePrismaError(error) ?? internalError()
  }
}
