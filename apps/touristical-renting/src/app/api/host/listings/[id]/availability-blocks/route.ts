import { NextRequest } from 'next/server'
import { ok, created, unauthorized, forbidden, notFound, conflict, validationError, internalError } from '@/lib/api/response'
import { handlePrismaError } from '@/lib/api/prisma-errors'
import { requireSession } from '@/lib/api/auth-guard'
import { flattenZodErrors } from '@/lib/api/zod'
import { CreateAvailabilityBlockSchema } from '@/lib/schemas/availability-blocks'
import { getAvailabilityBlocks, createAvailabilityBlock } from '@/lib/services/availability-blocks'
import { getListingById } from '@/lib/services/listings'

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * @swagger
 * /api/host/listings/{id}/availability-blocks:
 *   get:
 *     operationId: host_listings_availability_blocks_list
 *     summary: List availability blocks for one of the host's listings
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
 *     responses:
 *       200:
 *         description: Availability blocks ordered by start date ascending
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AvailabilityBlock'
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
 *         description: Listing not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
export async function GET(req: NextRequest, { params }: RouteContext) {
  const session = await requireSession(req)
  if (!session) return unauthorized()

  const { id } = await params
  const listing = await getListingById(id)
  if (!listing) return notFound('Listing not found')
  if (listing.hostId !== session.user.id) return forbidden('You are not the host of this listing')

  try {
    const blocks = await getAvailabilityBlocks(id)
    return ok(blocks)
  } catch (error) {
    return handlePrismaError(error) ?? internalError()
  }
}

/**
 * @swagger
 * /api/host/listings/{id}/availability-blocks:
 *   post:
 *     operationId: host_listings_availability_blocks_create
 *     summary: Block a date range on one of the host's listings
 *     description: Marks a date range as unavailable for booking. The range must not overlap an existing confirmed booking.
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateAvailabilityBlockInput'
 *     responses:
 *       201:
 *         description: Availability block created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/AvailabilityBlock'
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
 *         description: Listing not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       409:
 *         description: The range overlaps an existing confirmed booking
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
  const listing = await getListingById(id)
  if (!listing) return notFound('Listing not found')
  if (listing.hostId !== session.user.id) return forbidden('You are not the host of this listing')

  const body = await req.json()
  const parsed = CreateAvailabilityBlockSchema.safeParse(body)
  if (!parsed.success) return validationError(flattenZodErrors(parsed.error))

  try {
    const block = await createAvailabilityBlock(id, parsed.data)
    return created(block)
  } catch (error) {
    if (error instanceof Error && error.message === 'RANGE_OVERLAPS_BOOKING') {
      return conflict(
        'These dates overlap a confirmed booking and cannot be blocked. Choose a range without existing bookings.',
      )
    }
    return handlePrismaError(error) ?? internalError()
  }
}
