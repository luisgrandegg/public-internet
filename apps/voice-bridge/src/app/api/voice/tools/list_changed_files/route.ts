import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import path from 'node:path'

const execFileAsync = promisify(execFile)

const Body = z.object({
  prNumber: z.number().int().positive(),
})

/**
 * Returns the files changed on the current branch versus origin/main. We rely
 * on the dev's local git state — the demo runs against the branch the
 * designer is reviewing, so this is sufficient. A production version would
 * call the GitHub API for the PR by number.
 */
export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'INVALID_INPUT', message: parsed.error.message } },
      { status: 400 },
    )
  }

  const repoRoot = path.resolve(process.cwd(), '..', '..')
  try {
    const { stdout } = await execFileAsync(
      'git',
      ['diff', '--name-only', 'origin/main...HEAD'],
      { cwd: repoRoot },
    )
    const files = stdout
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
    return NextResponse.json({ prNumber: parsed.data.prNumber, files })
  } catch (err) {
    return NextResponse.json(
      {
        error: {
          code: 'GIT_FAILED',
          message: err instanceof Error ? err.message : 'Unknown error',
        },
      },
      { status: 500 },
    )
  }
}
