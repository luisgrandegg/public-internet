import { NextResponse } from 'next/server'
import { existsSync } from 'node:fs'
import { readdir, stat } from 'node:fs/promises'
import path from 'node:path'

/**
 * Returns the spec files currently waiting to be applied, newest first.
 * Used by the `/voice-changes` slash command in Claude Code.
 */
export async function GET() {
  const repoRoot = path.resolve(process.cwd(), '..', '..')
  const dirName = process.env.VOICE_SPEC_DIR ?? '.voice-changes'
  const dir = path.isAbsolute(dirName) ? dirName : path.join(repoRoot, dirName)

  if (!existsSync(dir)) {
    return NextResponse.json({ specs: [] })
  }

  const entries = await readdir(dir)
  const specs = await Promise.all(
    entries
      .filter((name) => name.endsWith('.md'))
      .map(async (name) => {
        const full = path.join(dir, name)
        const s = await stat(full)
        return {
          path: path.relative(repoRoot, full),
          modifiedAt: s.mtime.toISOString(),
          size: s.size,
        }
      }),
  )
  specs.sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt))
  return NextResponse.json({ specs })
}
