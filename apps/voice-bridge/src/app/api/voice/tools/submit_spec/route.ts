import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  getSession,
  resetSession,
  writeSpec,
} from '@/lib/voice/spec-store'

const Body = z.object({
  prNumber: z.number().int().positive(),
  summary: z.string().min(1).max(500),
})

export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'INVALID_INPUT', message: parsed.error.message } },
      { status: 400 },
    )
  }
  const { prNumber, summary } = parsed.data
  const session = getSession(prNumber)
  if (session.changes.length === 0) {
    return NextResponse.json(
      {
        error: {
          code: 'NO_CHANGES',
          message:
            'The session has no proposed changes. Call propose_change at least once before submitting.',
        },
      },
      { status: 400 },
    )
  }
  const specPath = await writeSpec({
    prNumber,
    createdAt: new Date().toISOString(),
    summary,
    changes: session.changes,
    transcript: session.transcript,
  })
  resetSession(prNumber)
  return NextResponse.json({ specPath })
}
