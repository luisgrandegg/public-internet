import { NextRequest } from 'next/server'
import { ok, unauthorized, internalError } from '@/lib/api/response'
import { handlePrismaError } from '@/lib/api/prisma-errors'
import { requireSession } from '@/lib/api/auth-guard'
import { becomeHost } from '@/lib/services/users'

/**
 * @swagger
 * /api/users/me/become-host:
 *   post:
 *     operationId: users_become_host
 *     summary: Enable host status for the current user
 *     description: Explicitly opts the user in to host mode so they can list properties. This is an irreversible action in the MVP — once a host, always a host.
 *     tags:
 *       - users
 *     security:
 *       - sessionCookie: []
 *     responses:
 *       200:
 *         description: Host status enabled
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     isHost:
 *                       type: boolean
 *                       example: true
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
export async function POST(req: NextRequest) {
  const session = await requireSession(req)
  if (!session) return unauthorized()

  try {
    const result = await becomeHost(session.user.id)
    return ok(result)
  } catch (error) {
    return handlePrismaError(error) ?? internalError()
  }
}
