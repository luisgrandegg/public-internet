import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import type { ProposedChange, VoiceSpec } from './types'

/**
 * In-memory accumulator for proposed changes per PR session. The agent tool
 * handlers append here; submit_spec flushes to a file in `.voice-changes/`.
 *
 * The store is process-local: a single dev server hosts a single voice
 * session at a time. That matches the demo workflow.
 */
type SessionState = {
  changes: ProposedChange[]
  transcript: VoiceSpec['transcript']
}

const sessions = new Map<number, SessionState>()

export function getSession(prNumber: number): SessionState {
  const existing = sessions.get(prNumber)
  if (existing) return existing
  const fresh: SessionState = { changes: [], transcript: [] }
  sessions.set(prNumber, fresh)
  return fresh
}

export function appendChange(
  prNumber: number,
  change: ProposedChange,
): ProposedChange {
  const s = getSession(prNumber)
  s.changes.push(change)
  return change
}

export function appendTranscript(
  prNumber: number,
  entry: VoiceSpec['transcript'][number],
): void {
  getSession(prNumber).transcript.push(entry)
}

export function resetSession(prNumber: number): void {
  sessions.delete(prNumber)
}

function getSpecDir(): string {
  const configured = process.env.VOICE_SPEC_DIR ?? '.voice-changes'
  if (path.isAbsolute(configured)) return configured
  return path.resolve(process.cwd(), '..', '..', configured)
}

export async function writeSpec(spec: VoiceSpec): Promise<string> {
  const dir = getSpecDir()
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true })
  }
  const fileName = `pr-${spec.prNumber}-${spec.createdAt.replace(/[:.]/g, '-')}.md`
  const fullPath = path.join(dir, fileName)
  await writeFile(fullPath, formatSpec(spec), 'utf8')
  return path.relative(path.resolve(process.cwd(), '..', '..'), fullPath)
}

export async function readMonorepoFile(relativePath: string): Promise<string> {
  const repoRoot = path.resolve(process.cwd(), '..', '..')
  const safe = path.normalize(relativePath).replace(/^[/\\]+/, '')
  const fullPath = path.join(repoRoot, safe)
  if (!fullPath.startsWith(repoRoot)) {
    throw new Error('Path escapes repository root')
  }
  return readFile(fullPath, 'utf8')
}

function formatSpec(spec: VoiceSpec): string {
  const lines: string[] = []
  lines.push(`# Voice change spec — PR #${spec.prNumber}`)
  lines.push('')
  lines.push(`Created at: ${spec.createdAt}`)
  lines.push('')
  lines.push(`## Summary`)
  lines.push('')
  lines.push(spec.summary || '(no summary captured)')
  lines.push('')
  lines.push(`## Proposed changes`)
  lines.push('')
  if (spec.changes.length === 0) {
    lines.push('_No changes proposed._')
  } else {
    spec.changes.forEach((c, i) => {
      lines.push(`### ${i + 1}. \`${c.file}\``)
      lines.push('')
      lines.push(c.description)
      lines.push('')
      if (c.rationale) {
        lines.push(`**Rationale:** ${c.rationale}`)
        lines.push('')
      }
      if (c.diff) {
        lines.push('```diff')
        lines.push(c.diff)
        lines.push('```')
        lines.push('')
      }
    })
  }
  lines.push(`## Transcript`)
  lines.push('')
  spec.transcript.forEach((t) => {
    lines.push(`- **${t.role}** (${t.at}): ${t.text}`)
  })
  lines.push('')
  return lines.join('\n')
}
