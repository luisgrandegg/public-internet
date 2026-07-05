import { NextRequest } from 'next/server'
import { ok, unauthorized, internalError } from '@/lib/api/response'
import { handlePrismaError } from '@/lib/api/prisma-errors'
import { requireSession } from '@/lib/api/auth-guard'
import { getHostEnquiries } from '@/lib/services/enquiries'

/**
 * @swagger
 * /api/host/enquiries:
 *   get:
 *     operationId: host_enquiries_list
 *     summary: List open (unreplied) enquiries for the authenticated host
 *     tags:
 *       - host
 *       - enquiries
 *     security:
 *       - sessionCookie: []
 *     responses:
 *       200:
 *         description: Open enquiries for the host's listings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Enquiry'
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
    const enquiries = await getHostEnquiries(session.user.id)
    return ok(enquiries)
  } catch (error) {
    return handlePrismaError(error) ?? internalError()
  }
}
