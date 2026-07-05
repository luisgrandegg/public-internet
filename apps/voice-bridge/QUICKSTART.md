# Quickstart — voice-bridge

Developer tool: dictate PR changes by voice instead of typing prompts (see [ADR-005](../../decisions/ADR-005-voice-input-via-elevenlabs.md)). Not a Public Internet platform — no database, no auth.

## Prerequisites

- **Node.js 22.x**, **pnpm 9** (as for the other apps)
- An **ElevenLabs** account with a Conversational AI agent configured with the tools listed in `src/lib/voice/agent-tools.ts`

## 1. Install and configure

From the monorepo root:

```bash
pnpm install
cp apps/voice-bridge/.env.example apps/voice-bridge/.env
```

Fill in `ELEVENLABS_AGENT_ID` and `ELEVENLABS_API_KEY` (the API key stays server-side; the client only ever receives short-lived signed URLs). Leave `VOICE_SPEC_DIR` as `.voice-changes`.

## 2. Run

```bash
pnpm --filter @public-internet/voice-bridge dev
```

Open **http://localhost:3100/pr/\<n\>** for the PR you're working on, hold to talk, and confirm the intent with the agent. The captured spec is written to `.voice-changes/`.

## 3. Apply the spec

In a Claude Code session on the same branch:

```
/voice-changes
```

Claude reads the newest spec, asks for confirmation, applies the edits, runs the checks, and commits.
