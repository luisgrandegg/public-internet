/**
 * ElevenLabs Conversational AI websocket client.
 *
 * Per ADR-005 this is the single module that talks to ElevenLabs directly.
 * Swap this file (behind the same exported surface) to migrate to a
 * self-hosted Whisper + local TTS stack without touching the UI.
 */

import type { VoiceTranscriptEntry } from './types'

export type ElevenLabsSessionEvents = {
  onStatus: (status: 'connecting' | 'open' | 'closed') => void
  onTranscript: (entry: VoiceTranscriptEntry) => void
  onToolCall: (
    name: string,
    input: Record<string, unknown>,
  ) => Promise<Record<string, unknown>>
  onError: (err: Error) => void
}

export type ElevenLabsSession = {
  start: () => Promise<void>
  stop: () => Promise<void>
  isOpen: () => boolean
}

export async function createElevenLabsSession(
  events: ElevenLabsSessionEvents,
): Promise<ElevenLabsSession> {
  let socket: WebSocket | null = null
  let mediaStream: MediaStream | null = null
  let audioContext: AudioContext | null = null
  let workletNode: AudioWorkletNode | null = null

  const start = async () => {
    events.onStatus('connecting')

    const signedUrlRes = await fetch('/api/voice/signed-url', {
      method: 'POST',
    })
    if (!signedUrlRes.ok) {
      throw new Error(
        `Failed to mint signed websocket URL: ${signedUrlRes.status}`,
      )
    }
    const { url } = (await signedUrlRes.json()) as { url: string }

    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true })
    audioContext = new AudioContext({ sampleRate: 16000 })

    socket = new WebSocket(url)
    socket.binaryType = 'arraybuffer'

    socket.addEventListener('open', () => {
      events.onStatus('open')
      pumpMicToSocket().catch(events.onError)
    })

    socket.addEventListener('message', async (ev) => {
      try {
        const payload = parseFrame(ev.data)
        if (!payload) return

        if (payload.type === 'transcript' && payload.role && payload.text) {
          events.onTranscript({
            role: payload.role,
            text: payload.text,
            at: new Date().toISOString(),
          })
          return
        }

        if (
          payload.type === 'tool_call' &&
          typeof payload.name === 'string' &&
          payload.input
        ) {
          const result = await events.onToolCall(payload.name, payload.input)
          socket?.send(
            JSON.stringify({
              type: 'tool_result',
              id: payload.id,
              output: result,
            }),
          )
          return
        }
      } catch (err) {
        events.onError(err instanceof Error ? err : new Error(String(err)))
      }
    })

    socket.addEventListener('close', () => events.onStatus('closed'))
    socket.addEventListener('error', () =>
      events.onError(new Error('Websocket transport error')),
    )
  }

  const pumpMicToSocket = async () => {
    if (!audioContext || !mediaStream || !socket) return
    const source = audioContext.createMediaStreamSource(mediaStream)
    await audioContext.audioWorklet.addModule('/voice/pcm-worklet.js')
    workletNode = new AudioWorkletNode(audioContext, 'pcm-worklet')
    workletNode.port.onmessage = (ev) => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(ev.data as ArrayBuffer)
      }
    }
    source.connect(workletNode)
  }

  const stop = async () => {
    workletNode?.disconnect()
    workletNode = null
    if (audioContext) {
      await audioContext.close()
      audioContext = null
    }
    mediaStream?.getTracks().forEach((t) => t.stop())
    mediaStream = null
    socket?.close()
    socket = null
  }

  const isOpen = () => socket?.readyState === WebSocket.OPEN

  return { start, stop, isOpen }
}

type ParsedFrame = {
  type: string
  id?: string
  role?: 'user' | 'agent'
  text?: string
  name?: string
  input?: Record<string, unknown>
}

function parseFrame(data: unknown): ParsedFrame | null {
  if (typeof data !== 'string') return null
  try {
    const obj = JSON.parse(data) as Record<string, unknown>
    if (typeof obj.type !== 'string') return null
    return obj as ParsedFrame
  } catch {
    return null
  }
}
