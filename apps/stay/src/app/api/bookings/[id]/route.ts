import { NextRequest } from 'next/server'
import { ok, unauthorized, forbidden, notFound } from '@/lib/api/response'
import { requireSession } from '@/lib/api/auth-guard'
import { getBookingById } from '@/lib/services/bookings'

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * @swagger
 * /api/bookings/{id}:
 *   get:
 *     operationId: bookings_get
 *     summary: Get a booking by ID
 *     description: Only the guest or the listing host can view a booking.
 *     tags:
 *       - bookings
 *     security:
 *       - sessionCookie: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Booking details
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
 *         description: Not the guest or host for this booking
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: Booking not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
export async function GET(req: NextRequest, { params }: RouteContext) {
  const session = await requireSession(req)
  if (!session) return unauthorized()

  const { id } = await params
  const booking = await getBookingById(id)
  if (!booking) return notFound('Booking not found')

  // Only the guest or the listing host can view a booking
  const isGuest = booking.guestId === session.user.id
  const isHost = booking.listing.hostId === session.user.id
  if (!isGuest && !isHost) return forbidden('Access denied')

  return ok(booking)
}
