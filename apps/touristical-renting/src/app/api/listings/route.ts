import { NextRequest } from 'next/server'
import { ok, created, unauthorized, validationError, internalError } from '@/lib/api/response'
import { handlePrismaError } from '@/lib/api/prisma-errors'
import { requireSession } from '@/lib/api/auth-guard'
import { flattenZodErrors } from '@/lib/api/zod'
import { ListingsQuerySchema, CreateListingSchema } from '@/lib/schemas/listings'
import { getListings, createListing } from '@/lib/services/listings'

/**
 * @swagger
 * /api/listings:
 *   get:
 *     operationId: listings_list
 *     summary: List listings
 *     tags:
 *       - listings
 *     parameters:
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Filter by city or country (case-insensitive substring match)
 *       - in: query
 *         name: propertyType
 *         schema:
 *           $ref: '#/components/schemas/PropertyType'
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: integer
 *         description: Minimum nightly rate in cents
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: integer
 *         description: Maximum nightly rate in cents
 *       - in: query
 *         name: checkIn
 *         schema:
 *           type: string
 *           format: date
 *         description: >
 *           Desired check-in date (YYYY-MM-DD). Must be provided together with checkOut and be
 *           before it. Listings with a Booking or AvailabilityBlock overlapping [checkIn, checkOut)
 *           are excluded from results.
 *       - in: query
 *         name: checkOut
 *         schema:
 *           type: string
 *           format: date
 *         description: Desired check-out date (YYYY-MM-DD). Must be provided together with checkIn and be after it.
 *       - in: query
 *         name: guests
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Number of guests. Only listings with maxGuests >= guests are returned.
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *     responses:
 *       200:
 *         description: Paginated list of listings. Each listing includes its aggregate published-review rating (nullable) and reviewCount.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/PaginatedListings'
 *       422:
 *         description: Invalid query parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const parsed = ListingsQuerySchema.safeParse(Object.fromEntries(searchParams))
  if (!parsed.success) return validationError(flattenZodErrors(parsed.error))

  try {
    const result = await getListings(parsed.data)
    return ok(result)
  } catch (error) {
    return handlePrismaError(error) ?? internalError()
  }
}

/**
 * @swagger
 * /api/listings:
 *   post:
 *     operationId: listings_create
 *     summary: Create a listing
 *     tags:
 *       - listings
 *     security:
 *       - sessionCookie: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateListingInput'
 *     responses:
 *       201:
 *         description: Listing created
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
 *       422:
 *         description: Validation failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
export async function POST(req: NextRequest) {
  const session = await requireSession(req)
  if (!session) return unauthorized()

  const body = await req.json()
  const parsed = CreateListingSchema.safeParse(body)
  if (!parsed.success) return validationError(flattenZodErrors(parsed.error))

  try {
    const listing = await createListing(session.user.id, parsed.data)
    return created(listing)
  } catch (error) {
    return handlePrismaError(error) ?? internalError()
  }
}
