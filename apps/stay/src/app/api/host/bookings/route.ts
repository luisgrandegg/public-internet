import { NextRequest } from 'next/server'
import { ok, unauthorized } from '@/lib/api/response'
import { requireSession } from '@/lib/api/auth-guard'
import { getHostBookings } from '@/lib/services/host'

/**
 * @swagger
 * /api/host/bookings:
 *   get:
 *     operationId: host_bookings_list
 *     summary: List bookings for all of the authenticated host's listings
 *     tags:
 *       - host
 *     security:
 *       - sessionCookie: []
 *     responses:
 *       200:
 *         description: Bookings for the host's listings
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

  const bookings = await getHostBookings(session.user.id)
  return ok(bookings)
}
