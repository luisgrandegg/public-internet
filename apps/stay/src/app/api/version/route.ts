import { NextResponse } from 'next/server'
import { APP_VERSION, APP_NAME } from '@/lib/version'

/**
 * @swagger
 * /api/version:
 *   get:
 *     operationId: version_get
 *     summary: Report the release this node is running
 *     description: >
 *       Returns the release of the node software this deployment was built from
 *       (ADR-008). Public and unauthenticated so an operator can confirm what a
 *       node is actually running without shell access. Reports only — the node
 *       never checks for, announces, or acts on the availability of a newer
 *       release.
 *     tags:
 *       - meta
 *     responses:
 *       200:
 *         description: The node's release
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/NodeVersion'
 */
export async function GET() {
  return NextResponse.json(
    { data: { app: APP_NAME, version: APP_VERSION } },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
