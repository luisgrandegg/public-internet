import { NextRequest, NextResponse } from 'next/server'
import { unauthorized, internalError } from '@/lib/api/response'
import { handlePrismaError } from '@/lib/api/prisma-errors'
import { requireSession } from '@/lib/api/auth-guard'
import { exportUserData } from '@/lib/services/users'

/**
 * @swagger
 * /api/users/me/export:
 *   get:
 *     operationId: users_export_me
 *     summary: Export all user data as JSON
 *     description: Downloads a JSON file containing the user's profile, listings, and bookings. Required by the platform's no-lock-in principle.
 *     tags:
 *       - users
 *     security:
 *       - sessionCookie: []
 *     responses:
 *       200:
 *         description: JSON file download with all user data
 *         headers:
 *           Content-Disposition:
 *             schema:
 *               type: string
 *               example: 'attachment; filename="my-data.json"'
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserDataExport'
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
    const data = await exportUserData(session.user.id)
    return new NextResponse(JSON.stringify(data, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename="my-data.json"',
      },
    })
  } catch (error) {
    return handlePrismaError(error) ?? internalError()
  }
}
