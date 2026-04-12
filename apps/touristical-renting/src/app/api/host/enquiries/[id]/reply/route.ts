import { NextRequest } from 'next/server'
import { ok, unauthorized, forbidden, notFound, validationError, internalError } from '@/lib/api/response'
import { handlePrismaError } from '@/lib/api/prisma-errors'
import { requireSession } from '@/lib/api/auth-guard'
import { flattenZodErrors } from '@/lib/api/zod'
import { ReplyEnquirySchema } from '@/lib/schemas/enquiries'
import { replyToEnquiry } from '@/lib/services/enquiries'

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * @swagger
 * /api/host/enquiries/{id}/reply:
 *   post:
 *     operationId: host_enquiries_reply
 *     summary: Reply to a guest enquiry
 *     tags:
 *       - host
 *       - enquiries
 *     security:
 *       - sessionCookie: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Enquiry ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reply
 *             properties:
 *               reply:
 *                 type: string
 *                 maxLength: 2000
 *     responses:
 *       200:
 *         description: Enquiry replied successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Enquiry'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       403:
 *         description: Not your enquiry
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: Enquiry not found
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
  const body = await req.json()
  const parsed = ReplyEnquirySchema.safeParse(body)
  if (!parsed.success) return validationError(flattenZodErrors(parsed.error))

  try {
    const enquiry = await replyToEnquiry(session.user.id, id, parsed.data)
    return ok(enquiry)
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'ENQUIRY_NOT_FOUND') return notFound('Enquiry not found')
      if (error.message === 'NOT_YOUR_ENQUIRY') return forbidden('This enquiry does not belong to you')
    }
    return handlePrismaError(error) ?? internalError()
  }
}
