import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { readMonorepoFile } from '@/lib/voice/spec-store'

const Body = z.object({
  path: z.string().min(1).max(512),
})

export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'INVALID_INPUT', message: parsed.error.message } },
      { status: 400 },
    )
  }
  try {
    const content = await readMonorepoFile(parsed.data.path)
    return NextResponse.json({ path: parsed.data.path, content })
  } catch (err) {
    return NextResponse.json(
      {
        error: {
          code: 'READ_FAILED',
          message: err instanceof Error ? err.message : 'Unknown error',
        },
      },
      { status: 404 },
    )
  }
}
