import { NextRequest } from 'next/server'
import { ok, unauthorized, forbidden, notFound, validationError, internalError } from '@/lib/api/response'
import { handlePrismaError } from '@/lib/api/prisma-errors'
import { requireSession } from '@/lib/api/auth-guard'
import { flattenZodErrors } from '@/lib/api/zod'
import { UpdateRestaurantSchema } from '@/lib/schemas/restaurants'
import { getRestaurantById, updateRestaurant } from '@/lib/services/restaurants'

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * @swagger
 * /api/restaurant/restaurants/{id}:
 *   patch:
 *     operationId: restaurantRestaurants_update
 *     summary: Update restaurant details
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
 *             $ref: '#/components/schemas/UpdateRestaurantInput'
 *     responses:
 *       200:
 *         description: Restaurant updated
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
 *       403:
 *         description: Not the owner of this restaurant
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: Restaurant not found
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
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const session = await requireSession(req)
  if (!session) return unauthorized()

  const { id } = await params
  const restaurant = await getRestaurantById(id, { includeInactive: true })
  if (!restaurant) return notFound('Restaurant not found')
  if (restaurant.ownerId !== session.user.id) {
    return forbidden('You do not own this restaurant')
  }

  const body = await req.json().catch(() => null)
  if (!body) return validationError({ _: 'Invalid JSON body' })

  const parsed = UpdateRestaurantSchema.safeParse(body)
  if (!parsed.success) return validationError(flattenZodErrors(parsed.error))

  try {
    const updated = await updateRestaurant(id, parsed.data)
    return ok(updated)
  } catch (error) {
    return handlePrismaError(error) ?? internalError()
  }
}
