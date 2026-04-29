# CLAUDE.md — voice-bridge

> Rules scoped to `apps/voice-bridge/`. The root `CLAUDE.md` and `apps/CLAUDE.md` apply globally on top of these.
> **This is a developer tool, not a Public Internet platform.** It sits next to the slash-command toolchain. See [ADR-005](../../decisions/ADR-005-voice-input-via-elevenlabs.md) for the scoping decision and the constitution-tension trade-offs.

---

## What this app does

`voice-bridge` lets a designer or PM dictate PR changes by voice. A session is scoped to a PR (`/pr/123`). The browser captures audio, an ElevenLabs Conversational AI agent handles STT, the agent turn, and TTS, and at the end of a session the agent calls `submit_spec` — which writes a structured change spec to `.voice-changes/` for Claude Code's `/voice-changes` slash command to apply.

This app is **not** subject to the federation, public-entity-governance, or worker-rights constraints in `CONSTITUTION.md` (those bind the platforms in `apps/touristical-renting`, `apps/eats`, etc.). It **is** subject to the no-dark-patterns and accessibility principles, and to the import + composition rules in `apps/CLAUDE.md`.

---

## Why a separate app, not part of `touristical-renting`

The voice surface is cross-cutting tooling — it might one day drive PR changes against the design system, the Eats app, or any future app in the monorepo. Keeping it isolated as `apps/voice-bridge` means it has no Prisma schema, no domain model, and no coupling to any platform's data.

---

## Provider boundary — keep it tight

ElevenLabs lives behind exactly one module: `src/lib/voice/elevenlabs-client.ts`.

- **Do not import the ElevenLabs SDK or call `wss://` URLs from anywhere else** — UI components, route handlers, or other libs.
- The signed-URL minting endpoint (`/api/voice/signed-url`) is the only place the API key is touched. The client never sees it.
- If you add new agent tools, register their schemas in `src/lib/voice/agent-tools.ts` first, then add the matching `app/api/voice/tools/<tool>/route.ts` handler. The dashboard tool config and the server handlers must not drift.

The migration path documented in ADR-005 (Whisper + local TTS) only works if this boundary is respected. Don't break it.

---

## Tool handlers

Every tool the ElevenLabs agent can call has a corresponding Route Handler under `src/app/api/voice/tools/<tool>/route.ts`. Rules:

| Rule | Why |
|---|---|
| Validate input with `zod` and return `{ error: { code, message } }` on failure | Match the project-wide REST error shape from `apps/CLAUDE.md` |
| Read files only from inside the monorepo root (`readMonorepoFile` enforces this) | Prevent the agent from reading arbitrary host paths |
| Never write outside `.voice-changes/` | Spec files are the only persistent artefact the agent produces |
| Never shell out beyond the `git` calls already in `list_changed_files` | The agent must not be a remote-code-execution surface |

If a tool needs to read or write outside these rules, that is an architectural change — flag it before implementing.

---

## Spec file format

Spec files live at `.voice-changes/pr-<n>-<iso-timestamp>.md` and are gitignored by default. Format:

```markdown
# Voice change spec — PR #123

Created at: 2026-04-29T10:11:12.000Z

## Summary
One-sentence agent summary of what was discussed.

## Proposed changes

### 1. `apps/touristical-renting/src/components/Hero.tsx`
Drop the urgency banner and place the date picker under the headline.

**Rationale:** removes urgency copy per Constitution principle 5.

```diff
- <Banner variant="urgent">Only 2 left!</Banner>
+ <DateRangePicker />
```

## Transcript
- **user** (...): "drop the urgency banner..."
- **agent** (...): "Confirming — replace the urgency banner with..."
```

`/voice-changes` reads the newest unapplied spec and treats each `### N. \`<file>\`` block as one Edit. Do not change this shape without updating the slash command in lockstep.

---

## Local development

```bash
# 1. Copy env file and fill in your ElevenLabs creds (or leave blank to run in stub mode)
cp apps/voice-bridge/.env.example apps/voice-bridge/.env.local

# 2. From the repo root
pnpm --filter @public-internet/voice-bridge dev
# → http://localhost:3100

# 3. Open a PR-scoped session
#    http://localhost:3100/pr/123
```

In stub mode (no API key configured), `/api/voice/signed-url` returns a placeholder URL. The UI and the tool route handlers still work — useful for testing the spec writer without a live ElevenLabs account.

---

## Testing

The app-wide rule in `apps/CLAUDE.md` requires Playwright e2e tests for every app feature. `voice-bridge` deviates intentionally:

- **No Playwright suite in v1.** The core flow is a websocket session against a live ElevenLabs agent and a microphone. Playwright cannot meaningfully exercise that without mocking out the entire provider, at which point the test only verifies our own mock.
- **What is testable** — the spec writer (`writeSpec`), the path-safety guard in `readMonorepoFile`, and the zod validators on each tool route — should be unit-tested with Vitest before this app is used outside the demo.
- **Manual smoke test** is the gate for now: open `/pr/123`, run a session, confirm `.voice-changes/pr-123-*.md` is written with the expected shape.

If voice-bridge graduates from "demo tool" to "team-wide infra," promote the unit tests above into a Vitest suite and add a Playwright smoke test that loads the home page and the PR session page (without recording audio).

---

## What not to build here

- **No platform domain models.** No Prisma, no Listing/Booking/Order entities. If the demo wants to read those, it does so through the existing app SDKs, not by adding tables here.
- **No user accounts.** The session is scoped by PR number in the URL — that is enough for a developer tool. Auth is a separate ADR if it becomes necessary.
- **No persistence beyond spec files.** Transcripts may contain incidental sensitive content; persisting them in a database is out of scope.
- **No UI dependencies on `@public-internet/touristical-renting-sdk` or `@public-internet/eats-sdk`.** This app is not platform-coupled; importing one of those SDKs would break that property.
