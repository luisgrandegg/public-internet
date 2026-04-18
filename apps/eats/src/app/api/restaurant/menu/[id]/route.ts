import { NextRequest } from 'next/server'
import { ok, noContent, unauthorized, forbidden, notFound, validationError, internalError } from '@/lib/api/response'
import { handlePrismaError } from '@/lib/api/prisma-errors'
import { requireSession } from '@/lib/api/auth-guard'
import { flattenZodErrors } from '@/lib/api/zod'
import { UpdateMenuItemSchema } from '@/lib/schemas/menu'
import { deleteMenuItem, getMenuItemById, updateMenuItem } from '@/lib/services/menu'
import { getRestaurantById } from '@/lib/services/restaurants'

interface RouteContext {
  params: Promise<{ id: string }>
}

async function loadOwnedItem(itemId: string, userId: string) {
  const item = await getMenuItemById(itemId)
  if (!item) return { kind: 'not-found' as const }
  const restaurant = await getRestaurantById(item.restaurantId, { includeInactive: true })
  if (!restaurant) return { kind: 'not-found' as const }
  if (restaurant.ownerId !== userId) return { kind: 'forbidden' as const }
  return { kind: 'ok' as const, item, restaurant }
}

/**
 * @swagger
 * /api/restaurant/menu/{id}:
 *   patch:
 *     operationId: restaurantMenu_update
 *     summary: Update a menu item
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
 *             $ref: '#/components/schemas/UpdateMenuItemInput'
 *     responses:
 *       200:
 *         description: Menu item updated
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
 *         description: Not the owner of this menu item
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: Menu item not found
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
  const check = await loadOwnedItem(id, session.user.id)
  if (check.kind === 'not-found') return notFound('Menu item not found')
  if (check.kind === 'forbidden') return forbidden('You do not own this menu item')

  const body = await req.json().catch(() => null)
  if (!body) return validationError({ _: 'Invalid JSON body' })

  const parsed = UpdateMenuItemSchema.safeParse(body)
  if (!parsed.success) return validationError(flattenZodErrors(parsed.error))

  try {
    const updated = await updateMenuItem(id, parsed.data)
    return ok(updated)
  } catch (error) {
    return handlePrismaError(error) ?? internalError()
  }
}

/**
 * @swagger
 * /api/restaurant/menu/{id}:
 *   delete:
 *     operationId: restaurantMenu_delete
 *     summary: Remove a menu item
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
 *     responses:
 *       204:
 *         description: Menu item removed
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       403:
 *         description: Not the owner of this menu item
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: Menu item not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const session = await requireSession(req)
  if (!session) return unauthorized()

  const { id } = await params
  const check = await loadOwnedItem(id, session.user.id)
  if (check.kind === 'not-found') return notFound('Menu item not found')
  if (check.kind === 'forbidden') return forbidden('You do not own this menu item')

  try {
    await deleteMenuItem(id)
    return noContent()
  } catch (error) {
    return handlePrismaError(error) ?? internalError()
  }
}
