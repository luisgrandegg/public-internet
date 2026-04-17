import { NextRequest } from 'next/server'
import { ok, notFound, internalError } from '@/lib/api/response'
import { handlePrismaError } from '@/lib/api/prisma-errors'
import { getRestaurantById } from '@/lib/services/restaurants'

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * @swagger
 * /api/restaurants/{id}:
 *   get:
 *     operationId: restaurants_get
 *     summary: Get a restaurant by ID (only if active)
 *     tags:
 *       - restaurants
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Restaurant details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Restaurant'
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
    return ok(restaurant)
  } catch (error) {
    return handlePrismaError(error) ?? internalError()
  }
}
