import { ok, internalError } from '@/lib/api/response'
import { handlePrismaError } from '@/lib/api/prisma-errors'
import { listMenuItemCategories } from '@/lib/services/restaurants'

// NOTE: In the Next.js App Router, predefined (static) segments take precedence
// over dynamic ones, so this route is matched before /api/restaurants/[id].

/**
 * @swagger
 * /api/restaurants/categories:
 *   get:
 *     operationId: restaurants_categories_list
 *     summary: List distinct menu categories with available items
 *     description: Distinct categories of available menu items across active restaurants, sorted alphabetically. Feeds the category filter on the restaurant browse page. Neutral ordering — no promoted categories.
 *     tags:
 *       - restaurants
 *     responses:
 *       200:
 *         description: Alphabetical list of distinct menu categories
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/MenuCategories'
 */
export async function GET() {
  try {
    const categories = await listMenuItemCategories()
    return ok({ categories })
  } catch (error) {
    return handlePrismaError(error) ?? internalError()
  }
}
