import { NextResponse } from 'next/server'

/**
 * GET /api/docs
 * Returns the OpenAPI 3.0 spec as JSON.
 * CORS is open so Swagger UI, Postman, and the SDK generator can access it directly.
 */
export async function GET() {
  // Dynamic import so Next.js treats this as a server-only route
  // and the JSON is not bundled into client JS.
  const spec = await import('@/lib/openapi.json')
  return NextResponse.json(spec.default ?? spec, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
