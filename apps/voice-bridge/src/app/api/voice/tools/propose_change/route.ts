import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { appendChange } from '@/lib/voice/spec-store'

const Body = z.object({
  prNumber: z.number().int().positive(),
  file: z.string().min(1).max(512),
  description: z.string().min(1).max(2000),
  rationale: z.string().min(1).max(500),
  diff: z.string().max(10000).optional(),
})

export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'INVALID_INPUT', message: parsed.error.message } },
      { status: 400 },
    )
  }
  const { prNumber, ...change } = parsed.data
  const stored = appendChange(prNumber, change)
  return NextResponse.json({ change: stored })
}
