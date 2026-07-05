# ADR-005 — Voice Input for the Designer Toolchain via ElevenLabs Conversational AI

**Status:** Accepted
**Date:** 2026-04-29
**Supersedes:** —

## Context

The text-based agent toolchain (`/new-component`, `/wireframe-to-component`, `/review-pr`, `/create-pr`, `/watch-pr`) removed the engineering bottleneck for designers and PMs working on the design system and the Stay app. Iteration cycles dropped from a multi-day developer hand-off to a session inside Claude Code.

The remaining friction is the keyboard. A PM watching a PR preview wants to say *"On the Hero, drop the urgency banner and pull the date picker up under the headline"* — not type a paragraph that re-describes what they're already pointing at. Designers reviewing a Storybook variant in a meeting cannot multi-task between the screen and the keyboard.

Voice closes that gap. It also lets us evaluate **ElevenLabs Conversational AI** end-to-end — STT, agent turn, TTS, and tool calling in one websocket session — against a realistic developer-tool surface, rather than a contrived demo.

## Decision

Add **`apps/voice-bridge`** — a Next.js companion app that captures voice input from a designer or PM, runs it through an ElevenLabs Conversational AI agent, and emits a structured **change spec** that the existing Claude Code slash-command toolchain consumes via the new `/voice-changes` command.

**Scope and constraints:**

1. **Developer-tool scope only.** `voice-bridge` is part of the *toolchain* used to build Public Internet platforms. It is not part of any user-facing platform (Stay, Eats, Agenda) and is not subject to the federation or public-entity-governance constraints that bind those platforms.
2. **Spec-file handoff.** A voice session writes a single file under `.voice-changes/<pr>-<timestamp>.md` containing the structured intent. Claude Code reads it via `/voice-changes`. Posting to a PR comment is a documented future option; spec files are sufficient for the demo and keep the loop offline-after-capture.
3. **Provider lock-in is contained.** ElevenLabs integration lives behind a single client module (`src/lib/voice/elevenlabs-client.ts`). Swapping to a self-hosted Whisper + local TTS stack is a documented escape hatch (see *Consequences* below).
4. **No platform data.** `voice-bridge` does not read or write the `stay` Postgres database. Its only persisted artefact is the spec file under `.voice-changes/`, which is gitignored by default.

## Constitution alignment

This decision sits inside an explicit tension with the constitution that needs to be acknowledged, not glossed over.

| Principle | How `voice-bridge` relates |
|---|---|
| **No extraction** | Not user-facing; no user-paid surface. |
| **Free software** | App code is AGPL-licensed like the rest of the repo. The proprietary dependency is the ElevenLabs API, not the integration code. |
| **Public-entity governance** | A developer tool used by the team building the platforms is not the same as infrastructure a municipality must operate. The Stay platform itself remains free of proprietary dependencies. |
| **Federation-first** | N/A — `voice-bridge` is a single-operator developer tool, not a federated user-facing service. |
| **No dark patterns** | The app's UI must never use urgency or coercive copy. Standard accessibility and consent rules apply (mic permission must be explicit and revocable). |
| **Accessibility-first** | The voice surface must always have a typed-text fallback; voice is an addition, never a replacement, so the toolchain remains usable without a microphone. |

If a public entity later wants to operate `voice-bridge` itself, they can replace the ElevenLabs client with a self-hosted alternative without changing the rest of the toolchain.

## Alternatives considered

**Browser `Web Speech API` + Anthropic-only loop**
Free, no SaaS dependency, runs entirely in the browser. Rejected for v1: the Web Speech API has wildly inconsistent quality across browsers, no first-class tool-calling loop, and would not exercise ElevenLabs Conversational AI — which is the explicit demo target. Documented as the long-term self-hosted path.

**Whisper (self-hosted) + ElevenLabs TTS + Anthropic agent**
Cleaner constitutionally; we'd own STT and only rent voice synthesis. Rejected for v1 because it means writing the agent loop from scratch (turn detection, interruption, tool routing). The point of the demo is exactly that ElevenLabs already provides this loop. Marked as the migration target if the team decides to remove the proprietary STT dependency.

**Push intent directly into Claude Code via stdin / a hook**
Tighter integration, no spec file. Rejected because it tightly couples the voice surface to a specific Claude Code session; spec files let multiple voice sessions queue up safely and let any Claude Code session pick them up later (matching how the rest of the slash commands work).

**Post intent as a PR comment with a magic prefix (`/voice:`)**
`/watch-pr` already polls PR comments, so the voice intent could ride that loop. Rejected for v1 because it requires a GitHub round-trip per utterance and clutters the PR conversation with raw transcripts. Documented as the production path once spec output is stable.

## Consequences

**Positive:**
- Closes the keyboard-bound friction on the existing text-agent toolchain without rewriting any of it. `/voice-changes` plugs into the same backlog/PR/audit flow.
- Demoable end-to-end with one provider. No glue code between STT, agent, and TTS providers.
- Spec-file handoff is debuggable (cat the file) and replayable (re-run `/voice-changes`).
- Provider integration is one module — switching to Whisper + a local TTS later is a contained change.

**Negative:**
- Introduces a proprietary runtime dependency to the toolchain. Documented and scoped to the developer surface, but real.
- Microphone access requires HTTPS in production; the dev workflow needs `localhost` permission setup for designers.
- Voice transcripts may contain incidental sensitive content (a PM thinking out loud about an unrelated bug). Spec files are gitignored by default, but designers must be reminded not to commit them.
- No offline mode. A flaky network during a session loses the in-progress spec.

**Migration path away from ElevenLabs (if the team chooses to take it):**

1. Implement a `VoiceClient` interface alongside `elevenlabs-client.ts`.
2. Add `whisper-client.ts` that uses a self-hosted Whisper endpoint for STT and Anthropic for the agent turn.
3. Swap the `lib/voice/index.ts` export to the new client. No callers in `voice-bridge` change.
4. Update this ADR with a follow-up status note (or supersede it with ADR-NNN).
