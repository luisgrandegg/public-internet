import { NextRequest } from 'next/server'
import {
  ok,
  forbidden,
  unauthorized,
  notFound,
  validationError,
  internalError,
  errorResponse,
} from '@/lib/api/response'
import { handlePrismaError } from '@/lib/api/prisma-errors'
import { requireSession } from '@/lib/api/auth-guard'
import { updateOrderStatusForOwner, type OwnerOrderStatus } from '@/lib/services/orders'

interface RouteContext {
  params: Promise<{ id: string }>
}

// Only these transitions are allowed from the restaurant dashboard.
// IN_DELIVERY and DELIVERED are courier-driven (F-034).
const OWNER_ALLOWED_STATUSES = new Set<OwnerOrderStatus>([
  'ACCEPTED',
  'PREPARING',
  'READY_FOR_PICKUP',
])

/**
 * @swagger
 * /api/restaurant/orders/{id}:
 *   patch:
 *     operationId: restaurantOrders_update
 *     summary: Update an order status (owner workflow only)
 *     description: >
 *       Restaurant owners can advance orders to ACCEPTED, PREPARING, or
 *       READY_FOR_PICKUP. IN_DELIVERY and DELIVERED are driven by the courier
 *       workflow. An order whose online payment has not SUCCEEDED is inert
 *       (ADR-006 §4) and cannot be advanced — the request is rejected with 409
 *       ORDER_UNPAID.
 *     tags:
 *       - restaurant-owner
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
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 $ref: '#/components/schemas/OrderStatus'
 *     responses:
 *       200:
 *         description: Order updated
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
 *         description: Not the owner of this order's restaurant
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
 *       409:
 *         description: The order's online payment has not completed (code ORDER_UNPAID) — the order is inert per ADR-006 §4
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       422:
 *         description: Invalid or disallowed status transition
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const session = await requireSession(req)
  if (!session) return unauthorized()

  const { id } = await params
  const body = (await req.json().catch(() => null)) as { status?: string } | null
  if (!body || !body.status) return validationError({ status: 'status is required' })
  if (!OWNER_ALLOWED_STATUSES.has(body.status as OwnerOrderStatus)) {
    return validationError({
      status: `Status must be one of: ${[...OWNER_ALLOWED_STATUSES].join(', ')}`,
    })
  }

  try {
    const result = await updateOrderStatusForOwner(
      session.user.id,
      id,
      body.status as OwnerOrderStatus,
    )
    if (!result.ok) {
      switch (result.error.code) {
        case 'ORDER_NOT_FOUND':
          return notFound(result.error.message)
        case 'NOT_ORDER_OWNER':
          return forbidden(result.error.message)
        case 'ORDER_UNPAID':
          return errorResponse(409, { code: 'ORDER_UNPAID', message: result.error.message })
      }
    }
    return ok(result.order)
  } catch (error) {
    return handlePrismaError(error) ?? internalError()
  }
}
