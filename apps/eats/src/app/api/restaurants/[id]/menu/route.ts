import { NextRequest } from 'next/server'
import { ok, notFound, internalError } from '@/lib/api/response'
import { handlePrismaError } from '@/lib/api/prisma-errors'
import { getRestaurantById } from '@/lib/services/restaurants'
import { listMenuItems } from '@/lib/services/menu'

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * @swagger
 * /api/restaurants/{id}/menu:
 *   get:
 *     operationId: restaurantsMenu_list
 *     summary: List a restaurant's available menu items (customer view)
 *     tags:
 *       - menu
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Available menu items
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/MenuItem'
 *       404:
 *         description: Restaurant not found or inactive
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
export async function GET(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params
  try {
    const restaurant = await getRestaurantById(id)
    if (!restaurant) return notFound('Restaurant not found')
    // Customer view — only isAvailable = true.
    const items = await listMenuItems(id, true)
    return ok(items)
  } catch (error) {
    return handlePrismaError(error) ?? internalError()
  }
}
