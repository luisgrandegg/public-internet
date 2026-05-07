import Link from 'next/link'

export default function HomePage() {
  return (
    <article>
      <h1>Voice Bridge</h1>
      <p>
        Voice-first companion to the Public Internet design toolchain. Open a
        PR-scoped session, hold to talk, and let Claude Code apply the change.
      </p>

      <h2>Start a session</h2>
      <p>
        Voice sessions are scoped to a Pull Request so the agent has the right
        context. Visit <code>/pr/&lt;number&gt;</code> on this app to begin.
      </p>

      <p>
        Example: <Link href="/pr/123">/pr/123</Link>
      </p>

      <h2>How it works</h2>
      <ol>
        <li>
          You hold the mic button and describe the change you want
          (&quot;drop the urgency banner from the Hero, pull the date picker
          under the headline&quot;).
        </li>
        <li>
          The ElevenLabs agent confirms intent and may ask one clarifying
          question. It can read files from the repo to ground its answer.
        </li>
        <li>
          On confirm, a structured change spec is written to{' '}
          <code>.voice-changes/&lt;pr&gt;-&lt;timestamp&gt;.md</code>.
        </li>
        <li>
          In Claude Code, run <code>/voice-changes</code> — the latest spec is
          applied through the existing <code>/audit-component</code> and{' '}
          <code>/watch-pr</code> loop.
        </li>
      </ol>

      <p>
        See <code>decisions/ADR-005-voice-input-via-elevenlabs.md</code> for the
        scope and trade-offs of this tool.
      </p>
    </article>
  )
}
