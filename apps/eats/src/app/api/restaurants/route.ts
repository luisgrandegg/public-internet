import { NextRequest } from 'next/server'
import { ok, validationError, internalError } from '@/lib/api/response'
import { handlePrismaError } from '@/lib/api/prisma-errors'
import { flattenZodErrors } from '@/lib/api/zod'
import { RestaurantsQuerySchema } from '@/lib/schemas/restaurants'
import { listRestaurants } from '@/lib/services/restaurants'

/**
 * @swagger
 * /api/restaurants:
 *   get:
 *     operationId: restaurants_list
 *     summary: List active restaurants
 *     tags:
 *       - restaurants
 *     parameters:
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: Exact-match filter by city (case-insensitive)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *     responses:
 *       200:
 *         description: Paginated list of active restaurants (alphabetical within city)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/PaginatedRestaurants'
 *       422:
 *         description: Invalid query parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const parsed = RestaurantsQuerySchema.safeParse(Object.fromEntries(searchParams))
  if (!parsed.success) return validationError(flattenZodErrors(parsed.error))

  try {
    const result = await listRestaurants(parsed.data)
    return ok(result)
  } catch (error) {
    return handlePrismaError(error) ?? internalError()
  }
}
