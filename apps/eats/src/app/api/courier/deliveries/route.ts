import { NextRequest } from 'next/server'
import { ok, forbidden, unauthorized, internalError } from '@/lib/api/response'
import { handlePrismaError } from '@/lib/api/prisma-errors'
import { requireSession } from '@/lib/api/auth-guard'
import { listDeliveriesForCourier, type DeliveryStatus } from '@/lib/services/deliveries'

const ALLOWED_FILTERS = new Set<DeliveryStatus>(['UNASSIGNED', 'ASSIGNED'])

/**
 * @swagger
 * /api/courier/deliveries:
 *   get:
 *     operationId: courierDeliveries_list
 *     summary: List deliveries visible to the courier
 *     description: With ?status=UNASSIGNED returns available deliveries (anyone can accept). With ?status=ASSIGNED returns this courier's active deliveries. basePay and distancePay are always shown separately — never collapsed into an opaque total (constitution §7 worker rights).
 *     tags:
 *       - courier
 *     security:
 *       - sessionCookie: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           $ref: '#/components/schemas/DeliveryStatus'
 *     responses:
 *       200:
 *         description: Deliveries
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Delivery'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       403:
 *         description: User is not a courier
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
export async function GET(req: NextRequest) {
  const session = await requireSession(req)
  if (!session) return unauthorized()
  const user = session.user as { id: string; isCourier?: boolean }
  if (!user.isCourier) return forbidden('You are not a courier')

  const { searchParams } = new URL(req.url)
  const statusParam = searchParams.get('status') as DeliveryStatus | null
  const status = statusParam && ALLOWED_FILTERS.has(statusParam) ? statusParam : null

  try {
    const deliveries = await listDeliveriesForCourier(user.id, status)
    return ok(deliveries)
  } catch (error) {
    return handlePrismaError(error) ?? internalError()
  }
}
