import { NextRequest } from 'next/server'
import { created, unauthorized, forbidden, notFound, validationError, internalError } from '@/lib/api/response'
import { handlePrismaError } from '@/lib/api/prisma-errors'
import { requireSession } from '@/lib/api/auth-guard'
import { flattenZodErrors } from '@/lib/api/zod'
import { CreateMenuItemSchema } from '@/lib/schemas/menu'
import { createMenuItem } from '@/lib/services/menu'
import { getRestaurantById } from '@/lib/services/restaurants'

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * @swagger
 * /api/restaurant/restaurants/{id}/menu:
 *   post:
 *     operationId: restaurantRestaurantsMenu_create
 *     summary: Add a menu item to a restaurant
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
 *             $ref: '#/components/schemas/CreateMenuItemInput'
 *     responses:
 *       201:
 *         description: Menu item created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/MenuItem'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       403:
 *         description: Not the restaurant owner
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
export async function POST(req: NextRequest, { params }: RouteContext) {
  const session = await requireSession(req)
  if (!session) return unauthorized()

  const { id } = await params
  const restaurant = await getRestaurantById(id, { includeInactive: true })
  if (!restaurant) return notFound('Restaurant not found')
  if (restaurant.ownerId !== session.user.id) return forbidden('You do not own this restaurant')

  const body = await req.json().catch(() => null)
  if (!body) return validationError({ _: 'Invalid JSON body' })

  const parsed = CreateMenuItemSchema.safeParse(body)
  if (!parsed.success) return validationError(flattenZodErrors(parsed.error))

  try {
    const item = await createMenuItem(id, parsed.data)
    return created(item)
  } catch (error) {
    return handlePrismaError(error) ?? internalError()
  }
}
