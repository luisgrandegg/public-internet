import { NextRequest } from 'next/server'
import { ok, unauthorized } from '@/lib/api/response'
import { requireSession } from '@/lib/api/auth-guard'
import { getHostListings } from '@/lib/services/host'

/**
 * @swagger
 * /api/host/listings:
 *   get:
 *     operationId: host_listings_list
 *     summary: List the authenticated host's listings
 *     tags:
 *       - host
 *     security:
 *       - sessionCookie: []
 *     responses:
 *       200:
 *         description: The host's listings with booking counts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/HostListing'
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

  const listings = await getHostListings(session.user.id)
  return ok(listings)
}
