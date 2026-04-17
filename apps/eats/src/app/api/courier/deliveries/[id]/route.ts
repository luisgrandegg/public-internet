import { NextRequest } from 'next/server'
import {
  ok,
  forbidden,
  unauthorized,
  validationError,
  internalError,
} from '@/lib/api/response'
import { handlePrismaError } from '@/lib/api/prisma-errors'
import { requireSession } from '@/lib/api/auth-guard'
import { transitionDelivery, type DeliveryAction } from '@/lib/services/deliveries'

interface RouteContext {
  params: Promise<{ id: string }>
}

const ACTIONS: ReadonlyArray<DeliveryAction> = ['accept', 'picked_up', 'delivered', 'failed']

/**
 * @swagger
 * /api/courier/deliveries/{id}:
 *   patch:
 *     operationId: courierDeliveries_update
 *     summary: Transition a delivery (accept / picked_up / delivered / failed)
 *     description: State machine — accept (UNASSIGNED→ASSIGNED, sets courierId), picked_up (ASSIGNED→PICKED_UP, sets pickedUpAt, Order→IN_DELIVERY), delivered (PICKED_UP→DELIVERED, sets deliveredAt, Order→DELIVERED), failed (any→FAILED).
 *     tags:
 *       - courier
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
 *             required: [action]
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [accept, picked_up, delivered, failed]
 *     responses:
 *       200:
 *         description: Delivery updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Delivery'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       403:
 *         description: Forbidden — delivery is assigned to a different courier or the user is not a courier
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       422:
 *         description: Invalid state transition
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const session = await requireSession(req)
  if (!session) return unauthorized()
  const user = session.user as { id: string; isCourier?: boolean }
  if (!user.isCourier) return forbidden('You are not a courier')

  const { id } = await params
  const body = (await req.json().catch(() => null)) as { action?: string } | null
  if (!body || !body.action) return validationError({ action: 'action is required' })
  if (!ACTIONS.includes(body.action as DeliveryAction)) {
    return validationError({ action: `action must be one of: ${ACTIONS.join(', ')}` })
  }

  try {
    const result = await transitionDelivery(id, user.id, body.action as DeliveryAction)
    if (!result.ok) {
      if (result.error.code === 'FORBIDDEN') return forbidden(result.error.message)
      return validationError({ _: result.error.message })
    }
    return ok(result.delivery)
  } catch (error) {
    return handlePrismaError(error) ?? internalError()
  }
}
