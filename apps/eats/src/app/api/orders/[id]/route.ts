import { NextRequest } from 'next/server'
import {
  ok,
  unauthorized,
  forbidden,
  notFound,
  internalError,
} from '@/lib/api/response'
import { handlePrismaError } from '@/lib/api/prisma-errors'
import { requireSession } from '@/lib/api/auth-guard'
import { findOrderWithDetails } from '@/lib/services/orders'

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     operationId: orders_get
 *     summary: Get an order by ID (owner only)
 *     tags:
 *       - orders
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
 *         description: Order details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       403:
 *         description: Not the order owner
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: Order not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
export async function GET(req: NextRequest, { params }: RouteContext) {
  const session = await requireSession(req)
  if (!session) return unauthorized()

  const { id } = await params
  try {
    const order = await findOrderWithDetails(id)
    if (!order) return notFound('Order not found')
    if (order.customerId !== session.user.id) return forbidden('Not your order')
    return ok(order)
  } catch (error) {
    return handlePrismaError(error) ?? internalError()
  }
}
