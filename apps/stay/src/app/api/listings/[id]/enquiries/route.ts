import { NextRequest } from 'next/server'
import { created, unauthorized, forbidden, notFound, validationError, internalError } from '@/lib/api/response'
import { handlePrismaError } from '@/lib/api/prisma-errors'
import { requireSession } from '@/lib/api/auth-guard'
import { flattenZodErrors } from '@/lib/api/zod'
import { CreateEnquirySchema } from '@/lib/schemas/enquiries'
import { createEnquiry } from '@/lib/services/enquiries'
import { getListingById } from '@/lib/services/listings'

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * @swagger
 * /api/listings/{id}/enquiries:
 *   post:
 *     operationId: listings_create_enquiry
 *     summary: Send an enquiry to a listing's host
 *     tags:
 *       - enquiries
 *     security:
 *       - sessionCookie: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Listing ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 2000
 *     responses:
 *       201:
 *         description: Enquiry created
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
 *         description: Cannot enquire about own listing
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: Listing not found
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
  const listing = await getListingById(id)
  if (!listing) return notFound('Listing not found')

  const body = await req.json()
  const parsed = CreateEnquirySchema.safeParse(body)
  if (!parsed.success) return validationError(flattenZodErrors(parsed.error))

  try {
    const enquiry = await createEnquiry(session.user.id, id, parsed.data)
    return created(enquiry)
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'CANNOT_ENQUIRE_OWN_LISTING') return forbidden('You cannot enquire about your own listing')
    }
    return handlePrismaError(error) ?? internalError()
  }
}
