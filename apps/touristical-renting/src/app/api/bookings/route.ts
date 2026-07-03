import { NextRequest } from 'next/server'
import { ok, created, unauthorized, forbidden, notFound, conflict, validationError, internalError } from '@/lib/api/response'
import { handlePrismaError } from '@/lib/api/prisma-errors'
import { requireSession } from '@/lib/api/auth-guard'
import { flattenZodErrors } from '@/lib/api/zod'
import { CreateBookingSchema } from '@/lib/schemas/bookings'
import { createBooking, getGuestBookings } from '@/lib/services/bookings'

/**
 * @swagger
 * /api/bookings:
 *   get:
 *     operationId: bookings_list
 *     summary: List bookings for the authenticated guest
 *     tags:
 *       - bookings
 *     security:
 *       - sessionCookie: []
 *     responses:
 *       200:
 *         description: Guest's bookings ordered by check-in date descending
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Booking'
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
    const bookings = await getGuestBookings(session.user.id)
    return ok(bookings)
  } catch (error) {
    return handlePrismaError(error) ?? internalError()
  }
}

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
 *         description: >
 *           Booking created, together with its payment record (ADR-006).
 *           In offline mode the payment is settled directly with the host
 *           (provider 'offline', status SUCCEEDED) and checkoutUrl is null.
 *           In Stripe mode the payment is PENDING and checkoutUrl is the
 *           hosted Stripe Checkout URL to redirect the guest to.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/BookingCreated'
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
 *       409:
 *         description: Selected dates are not available
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
    const { booking, checkoutUrl } = await createBooking(session.user.id, parsed.data)
    return created({ ...booking, checkoutUrl })
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'LISTING_NOT_FOUND') return notFound('Listing not found')
      if (error.message === 'CANNOT_BOOK_OWN_LISTING') return forbidden('You cannot book your own listing')
      if (error.message === 'DATES_UNAVAILABLE') return conflict('Selected dates are not available')
    }
    return handlePrismaError(error) ?? internalError()
  }
}
