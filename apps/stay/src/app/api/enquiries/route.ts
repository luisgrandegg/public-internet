import { NextRequest } from 'next/server'
import { ok, unauthorized, internalError } from '@/lib/api/response'
import { handlePrismaError } from '@/lib/api/prisma-errors'
import { requireSession } from '@/lib/api/auth-guard'
import { getGuestEnquiries } from '@/lib/services/enquiries'

/**
 * @swagger
 * /api/enquiries:
 *   get:
 *     operationId: enquiries_list
 *     summary: List the authenticated guest's enquiries, newest first
 *     tags:
 *       - enquiries
 *     security:
 *       - sessionCookie: []
 *     responses:
 *       200:
 *         description: Enquiries sent by the guest, each including the listing it concerns and the host reply (null until the host replies)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/GuestEnquiry'
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
    const enquiries = await getGuestEnquiries(session.user.id)
    return ok(enquiries)
  } catch (error) {
    return handlePrismaError(error) ?? internalError()
  }
}
