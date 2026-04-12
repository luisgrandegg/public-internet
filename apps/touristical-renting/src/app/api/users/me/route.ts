import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ok, unauthorized, validationError, internalError } from '@/lib/api/response'
import { handlePrismaError } from '@/lib/api/prisma-errors'
import { requireSession } from '@/lib/api/auth-guard'
import { flattenZodErrors } from '@/lib/api/zod'
import { getUserProfile, updateUserProfile } from '@/lib/services/users'

const UpdateProfileSchema = z.object({
  name: z.string().min(1, 'Name must not be empty').max(120).optional(),
  image: z.string().url('Image must be a valid URL').optional().or(z.literal('')),
})

/**
 * @swagger
 * /api/users/me:
 *   get:
 *     operationId: users_get_me
 *     summary: Get current user profile
 *     tags:
 *       - users
 *     security:
 *       - sessionCookie: []
 *     responses:
 *       200:
 *         description: Current user profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/UserProfile'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
export async function GET(req: NextRequest) {
  const session = await requireSession(req)
  if (!session) return unauthorized()

  try {
    const user = await getUserProfile(session.user.id)
    if (!user) return unauthorized()
    return ok(user)
  } catch (error) {
    return handlePrismaError(error) ?? internalError()
  }
}

/**
 * @swagger
 * /api/users/me:
 *   patch:
 *     operationId: users_update_me
 *     summary: Update current user profile
 *     tags:
 *       - users
 *     security:
 *       - sessionCookie: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProfileInput'
 *     responses:
 *       200:
 *         description: Updated user profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/UserProfileSummary'
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
export async function PATCH(req: NextRequest) {
  const session = await requireSession(req)
  if (!session) return unauthorized()

  const body = await req.json()
  const parsed = UpdateProfileSchema.safeParse(body)
  if (!parsed.success) return validationError(flattenZodErrors(parsed.error))

  // Normalise empty image string to undefined so Prisma ignores it
  const updateData: { name?: string; image?: string } = {}
  if (parsed.data.name !== undefined) updateData.name = parsed.data.name
  if (parsed.data.image !== undefined && parsed.data.image !== '') {
    updateData.image = parsed.data.image
  }

  try {
    const user = await updateUserProfile(session.user.id, updateData)
    return ok(user)
  } catch (error) {
    return handlePrismaError(error) ?? internalError()
  }
}
