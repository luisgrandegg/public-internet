import { NextRequest } from 'next/server'
import { ok, noContent, unauthorized, forbidden, notFound, validationError, internalError } from '@/lib/api/response'
import { handlePrismaError } from '@/lib/api/prisma-errors'
import { requireSession } from '@/lib/api/auth-guard'
import { flattenZodErrors } from '@/lib/api/zod'
import { UpdateListingSchema } from '@/lib/schemas/listings'
import { getListingById, updateListing, deleteListing } from '@/lib/services/listings'

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * @swagger
 * /api/listings/{id}:
 *   get:
 *     operationId: listings_get
 *     summary: Get a listing by ID
 *     tags:
 *       - listings
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Listing details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Listing'
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
  return ok(listing)
}

/**
 * @swagger
 * /api/listings/{id}:
 *   patch:
 *     operationId: listings_update
 *     summary: Update a listing
 *     tags:
 *       - listings
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
 *             $ref: '#/components/schemas/UpdateListingInput'
 *     responses:
 *       200:
 *         description: Updated listing
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Listing'
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
 *       422:
 *         description: Validation failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const session = await requireSession(req)
  if (!session) return unauthorized()

  const { id } = await params
  const listing = await getListingById(id)
  if (!listing) return notFound('Listing not found')
  if (listing.hostId !== session.user.id) return forbidden('You are not the host of this listing')

  const body = await req.json()
  const parsed = UpdateListingSchema.safeParse(body)
  if (!parsed.success) return validationError(flattenZodErrors(parsed.error))

  try {
    const updated = await updateListing(id, parsed.data)
    return ok(updated)
  } catch (error) {
    return handlePrismaError(error) ?? internalError()
  }
}

/**
 * @swagger
 * /api/listings/{id}:
 *   delete:
 *     operationId: listings_delete
 *     summary: Delete a listing
 *     tags:
 *       - listings
 *     security:
 *       - sessionCookie: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Listing deleted
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
export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const session = await requireSession(req)
  if (!session) return unauthorized()

  const { id } = await params
  const listing = await getListingById(id)
  if (!listing) return notFound('Listing not found')
  if (listing.hostId !== session.user.id) return forbidden('You are not the host of this listing')

  try {
    await deleteListing(id)
    return noContent()
  } catch (error) {
    return handlePrismaError(error) ?? internalError()
  }
}
