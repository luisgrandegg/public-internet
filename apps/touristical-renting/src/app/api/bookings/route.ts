import { NextRequest } from 'next/server'
import { created, unauthorized, forbidden, notFound, validationError, internalError } from '@/lib/api/response'
import { handlePrismaError } from '@/lib/api/prisma-errors'
import { requireSession } from '@/lib/api/auth-guard'
import { flattenZodErrors } from '@/lib/api/zod'
import { CreateBookingSchema } from '@/lib/schemas/bookings'
import { createBooking } from '@/lib/services/bookings'

/**
 * @swagger
 * /api/bookings:
 *   post:
 *     operationId: bookings_create
 *     summary: Create a booking
 *     tags:
 *       - bookings
 *     security:
 *       - sessionCookie: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateBookingInput'
 *     responses:
 *       201:
 *         description: Booking created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Booking'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       403:
 *         description: Cannot book own listing
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
export async function POST(req: NextRequest) {
  const session = await requireSession(req)
  if (!session) return unauthorized()

  const body = await req.json()
  const parsed = CreateBookingSchema.safeParse(body)
  if (!parsed.success) return validationError(flattenZodErrors(parsed.error))

  try {
    const booking = await createBooking(session.user.id, parsed.data)
    return created(booking)
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'LISTING_NOT_FOUND') return notFound('Listing not found')
      if (error.message === 'CANNOT_BOOK_OWN_LISTING') return forbidden('You cannot book your own listing')
    }
    return handlePrismaError(error) ?? internalError()
  }
}
