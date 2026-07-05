import { NextRequest } from 'next/server'
import {
  created,
  unauthorized,
  validationError,
  internalError,
  errorResponse,
} from '@/lib/api/response'
import { handlePrismaError } from '@/lib/api/prisma-errors'
import { requireSession } from '@/lib/api/auth-guard'
import { flattenZodErrors } from '@/lib/api/zod'
import { CreateOrderSchema } from '@/lib/schemas/orders'
import { createOrderForCustomer } from '@/lib/services/orders'

/**
 * @swagger
 * /api/orders:
 *   post:
 *     operationId: orders_create
 *     summary: Place an order
 *     tags:
 *       - orders
 *     security:
 *       - sessionCookie: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateOrderInput'
 *     responses:
 *       201:
 *         description: >
 *           Order placed. On a node with an online payment provider configured
 *           the payment is PENDING and `checkoutUrl` points to the provider's
 *           hosted checkout page (the client must redirect there); on an
 *           offline node the payment is created as provider `offline` /
 *           SUCCEEDED and `checkoutUrl` is null.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/PlacedOrder'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       422:
 *         description: Validation failed or menu item conflict
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       502:
 *         description: The payment provider could not create a checkout session
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
export async function POST(req: NextRequest) {
  const session = await requireSession(req)
  if (!session) return unauthorized()

  const body = await req.json().catch(() => null)
  if (!body) return validationError({ _: 'Invalid JSON body' })

  const parsed = CreateOrderSchema.safeParse(body)
  if (!parsed.success) return validationError(flattenZodErrors(parsed.error))

  try {
    const result = await createOrderForCustomer(session.user.id, parsed.data)
    if (!result.ok) {
      if (result.error.code === 'PAYMENT_PROVIDER_ERROR') {
        return errorResponse(502, { code: 'INTERNAL_ERROR', message: result.error.message })
      }
      return validationError({ _: result.error.message })
    }
    return created({ ...result.order, checkoutUrl: result.checkoutUrl })
  } catch (error) {
    return handlePrismaError(error) ?? internalError()
  }
}
