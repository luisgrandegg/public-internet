import { NextRequest } from 'next/server'
import { created, unauthorized, validationError, internalError } from '@/lib/api/response'
import { handlePrismaError } from '@/lib/api/prisma-errors'
import { requireSession } from '@/lib/api/auth-guard'
import { flattenZodErrors } from '@/lib/api/zod'
import { CreateRestaurantSchema } from '@/lib/schemas/restaurants'
import { createRestaurantForOwner } from '@/lib/services/restaurants'

/**
 * @swagger
 * /api/restaurant/restaurants:
 *   post:
 *     operationId: restaurantRestaurants_create
 *     summary: Register a new restaurant (sets isRestaurantOwner)
 *     tags:
 *       - restaurant-owner
 *     security:
 *       - sessionCookie: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateRestaurantInput'
 *     responses:
 *       201:
 *         description: Restaurant created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Restaurant'
 *       401:
 *         description: Not authenticated
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

  const body = await req.json().catch(() => null)
  if (!body) return validationError({ _: 'Invalid JSON body' })

  const parsed = CreateRestaurantSchema.safeParse(body)
  if (!parsed.success) return validationError(flattenZodErrors(parsed.error))

  try {
    const restaurant = await createRestaurantForOwner(session.user.id, parsed.data)
    return created(restaurant)
  } catch (error) {
    return handlePrismaError(error) ?? internalError()
  }
}
