'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  createElevenLabsSession,
  type ElevenLabsSession,
} from '@/lib/voice/elevenlabs-client'
import type {
  ProposedChange,
  VoiceSessionStatus,
  VoiceTranscriptEntry,
} from '@/lib/voice/types'
import styles from './PushToTalk.module.css'

type Props = {
  prNumber: number
}

export function PushToTalk({ prNumber }: Props) {
  const [status, setStatus] = useState<VoiceSessionStatus>('idle')
  const [transcript, setTranscript] = useState<VoiceTranscriptEntry[]>([])
  const [proposed, setProposed] = useState<ProposedChange[]>([])
  const [specPath, setSpecPath] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const sessionRef = useRef<ElevenLabsSession | null>(null)

  const handleToolCall = useCallback(
    async (name: string, input: Record<string, unknown>) => {
      const res = await fetch(`/api/voice/tools/${name}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...input, prNumber }),
      })
      const body = (await res.json()) as Record<string, unknown>

      if (name === 'propose_change' && body.change) {
        setProposed((prev) => [...prev, body.change as ProposedChange])
      }
      if (name === 'submit_spec' && typeof body.specPath === 'string') {
        setSpecPath(body.specPath)
        setStatus('done')
      }
      return body
    },
    [prNumber],
  )

  const start = useCallback(async () => {
    setError(null)
    setStatus('connecting')
    try {
      const session = await createElevenLabsSession({
        onStatus: (s) => {
          if (s === 'open') setStatus('listening')
          if (s === 'closed' && status !== 'done') setStatus('idle')
        },
        onTranscript: (entry) => {
          setTranscript((prev) => [...prev, entry])
          setStatus(entry.role === 'agent' ? 'agent_speaking' : 'listening')
        },
        onToolCall: handleToolCall,
        onError: (err) => {
          setError(err.message)
          setStatus('error')
        },
      })
      sessionRef.current = session
      await session.start()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setStatus('error')
    }
  }, [handleToolCall, status])

  const stop = useCallback(async () => {
    await sessionRef.current?.stop()
    sessionRef.current = null
    if (status !== 'done') setStatus('idle')
  }, [status])

  useEffect(() => {
    return () => {
      sessionRef.current?.stop().catch(() => {})
    }
  }, [])

  const isLive = status !== 'idle' && status !== 'error' && status !== 'done'

  return (
    <section className={styles.root}>
      <div className={styles.controls}>
        <button
          type="button"
          className={styles.talk}
          onPointerDown={start}
          onPointerUp={stop}
          onPointerLeave={() => isLive && stop()}
          aria-pressed={isLive}
          disabled={status === 'submitting' || status === 'done'}
        >
          {isLive ? 'Listening — release to stop' : 'Hold to talk'}
        </button>
        <p className={styles.status} role="status" aria-live="polite">
          Status: {humanStatus(status)}
        </p>
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
      </div>

      <details className={styles.panel} open>
        <summary>Transcript</summary>
        {transcript.length === 0 ? (
          <p className={styles.muted}>No turns yet.</p>
        ) : (
          <ol className={styles.transcript}>
            {transcript.map((t, i) => (
              <li key={i} data-role={t.role}>
                <span className={styles.role}>{t.role}</span>
                <span>{t.text}</span>
              </li>
            ))}
          </ol>
        )}
      </details>

      <details className={styles.panel} open>
        <summary>Proposed changes ({proposed.length})</summary>
        {proposed.length === 0 ? (
          <p className={styles.muted}>The agent hasn&apos;t proposed any changes yet.</p>
        ) : (
          <ul className={styles.changes}>
            {proposed.map((c, i) => (
              <li key={i}>
                <code>{c.file}</code>
                <p>{c.description}</p>
                {c.rationale && (
                  <p className={styles.muted}>Rationale: {c.rationale}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </details>

      {specPath && (
        <div className={styles.success} role="status">
          Spec written to <code>{specPath}</code>. In Claude Code run{' '}
          <code>/voice-changes</code> to apply it.
        </div>
      )}
    </section>
  )
}

function humanStatus(s: VoiceSessionStatus): string {
  switch (s) {
    case 'idle':
      return 'idle'
    case 'connecting':
      return 'connecting'
    case 'listening':
      return 'listening'
    case 'agent_speaking':
      return 'agent speaking'
    case 'awaiting_confirmation':
      return 'awaiting confirmation'
    case 'submitting':
      return 'submitting'
    case 'done':
      return 'spec written'
    case 'error':
      return 'error'
  }
}
