import { NextResponse } from 'next/server'

/**
 * Mints a short-lived signed websocket URL for the ElevenLabs Conversational
 * AI agent. The browser never sees the API key — only the signed URL.
 *
 * In dev, if ELEVENLABS_API_KEY is missing, returns a stub URL so the rest of
 * the pipeline can be tested without a live ElevenLabs account.
 */
export async function POST() {
  const agentId = process.env.ELEVENLABS_AGENT_ID
  const apiKey = process.env.ELEVENLABS_API_KEY

  if (!agentId || !apiKey) {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        {
          error: {
            code: 'MISSING_CREDENTIALS',
            message:
              'ELEVENLABS_AGENT_ID and ELEVENLABS_API_KEY must be set in production.',
          },
        },
        { status: 500 },
      )
    }
    return NextResponse.json({
      url: 'wss://stub.local/elevenlabs-not-configured',
      stub: true,
    })
  }

  const res = await fetch(
    `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${encodeURIComponent(agentId)}`,
    { headers: { 'xi-api-key': apiKey } },
  )

  if (!res.ok) {
    const detail = await res.text()
    return NextResponse.json(
      {
        error: {
          code: 'ELEVENLABS_SIGN_FAILED',
          message: `ElevenLabs returned ${res.status}: ${detail}`,
        },
      },
      { status: 502 },
    )
  }

  const { signed_url } = (await res.json()) as { signed_url: string }
  return NextResponse.json({ url: signed_url })
}
