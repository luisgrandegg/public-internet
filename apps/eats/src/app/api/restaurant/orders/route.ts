import { NextRequest } from 'next/server'
import { ok, forbidden, unauthorized, internalError } from '@/lib/api/response'
import { handlePrismaError } from '@/lib/api/prisma-errors'
import { requireSession } from '@/lib/api/auth-guard'
import { listOrdersForOwner } from '@/lib/services/orders'

const ALLOWED_STATUSES = new Set([
  'PENDING',
  'ACCEPTED',
  'PREPARING',
  'READY_FOR_PICKUP',
  'IN_DELIVERY',
  'DELIVERED',
  'CANCELLED',
])

/**
 * @swagger
 * /api/restaurant/orders:
 *   get:
 *     operationId: restaurantOrders_list
 *     summary: List orders for restaurants owned by the signed-in owner
 *     tags:
 *       - restaurant-owner
 *     security:
 *       - sessionCookie: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           $ref: '#/components/schemas/OrderStatus'
 *     responses:
 *       200:
 *         description: List of orders
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       403:
 *         description: User is not a restaurant owner
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
export async function GET(req: NextRequest) {
  const session = await requireSession(req)
  if (!session) return unauthorized()
  const user = session.user as { id: string; isRestaurantOwner?: boolean }
  if (!user.isRestaurantOwner) return forbidden('You are not a restaurant owner')

  const { searchParams } = new URL(req.url)
  const statusParam = searchParams.get('status') ?? undefined
  const status = statusParam && ALLOWED_STATUSES.has(statusParam) ? statusParam : undefined

  try {
    const orders = await listOrdersForOwner(user.id, status)
    return ok(orders)
  } catch (error) {
    return handlePrismaError(error) ?? internalError()
  }
}
