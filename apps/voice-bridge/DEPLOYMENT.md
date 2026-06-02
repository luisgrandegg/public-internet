# Deploying voice-bridge

How to run **voice-bridge** — the voice-first PR-change capture companion — in production (or, more realistically, on an internal/team host).

> **voice-bridge is an internal developer/designer tool, not a Public Internet platform.** It is not one of the civic platforms governed by the Platform Registry — it exists to let designers and PMs dictate PR changes by voice. It pairs with the `/voice-changes` Claude Code command. See [ADR-005](../../decisions/ADR-005-voice-input-via-elevenlabs.md) for the scoping decision and the documented migration path away from ElevenLabs.

This guide is self-contained.

---

## What you are deploying

| | |
|---|---|
| **App** | `@public-internet/voice-bridge` |
| **Framework** | Next.js 15 (React 19, TypeScript strict) |
| **Database** | None — stateless except for spec files on disk |
| **Auth** | None — sessions are scoped by PR number in the URL (`/pr/<n>`) |
| **Fixed port** | `3100` (hardcoded in the `start` script) |
| **External service** | ElevenLabs Conversational AI |

Because it has no database and no user auth, voice-bridge is intended for **trusted internal use** (a team VPN, an internal host, or local machines) — not as a public, unauthenticated internet service.

---

## Prerequisites

| Tool | Version | Notes |
|---|---|---|
| Node.js | `22.22.2` | Pinned via [Volta](https://volta.sh); any 22.x works |
| pnpm | `9.15.0` | `corepack enable` or Volta will provision it |
| ElevenLabs account | — | A Conversational AI agent + an API key |

No PostgreSQL, no migrations, no auth secret.

---

## 1. Create the ElevenLabs agent

1. Create an agent at <https://elevenlabs.io/app/conversational-ai> and copy its **Agent ID**.
2. Configure the agent with the tools defined in `apps/voice-bridge/src/lib/voice/agent-tools.ts`.
3. Create a server-side **API key**. It is used only by `/api/voice/signed-url` to mint short-lived signed websocket URLs, so the agent ID is never embedded in the client bundle. The key is never exposed to the browser.

---

## 2. Configure environment

```bash
cp apps/voice-bridge/.env.example apps/voice-bridge/.env
```

| Variable | Required | Purpose |
|---|---|---|
| `ELEVENLABS_AGENT_ID` | ✅ | The Conversational AI agent ID |
| `ELEVENLABS_API_KEY` | ✅ | Server-side key for minting signed URLs. Never sent to the client |
| `VOICE_SPEC_DIR` | ⬜ | Where voice spec files are written, relative to the monorepo root. Default `.voice-changes` |
| `NODE_ENV` | ✅ | Set to `production` |

> There is no stub/fallback mode in production — if the ElevenLabs credentials are missing or wrong, `/api/voice/signed-url` returns an error and voice capture will not work.

> 🔐 Never commit `.env`. `ELEVENLABS_API_KEY` is a secret.

---

## 3. Install and build

From the **monorepo root**:

```bash
pnpm install --frozen-lockfile
pnpm --filter @public-internet/voice-bridge... build
```

The `...` suffix builds the app and its only workspace dependency (`design-system`). To build the whole monorepo instead, run `pnpm build`.

---

## 4. Start the server

The port is **hardcoded to 3100** in the `start` script (`next start --port 3100`):

```bash
NODE_ENV=production pnpm --filter @public-internet/voice-bridge start
# → http://localhost:3100
```

Open `http://<host>:3100/pr/<your-pr-number>`, hold to talk, and the agent confirms intent before writing a spec to `VOICE_SPEC_DIR`.

### Spec files and the `/voice-changes` workflow

voice-bridge **writes** spec files; it does not apply them. The Claude Code `/voice-changes` command reads the newest spec from the same `.voice-changes/` directory, asks for confirmation, applies the edits, and commits. For that handoff to work, voice-bridge must write specs to a directory the machine running Claude Code can read — typically the same checkout. Spec files are gitignored.

If you deploy voice-bridge on a separate host from where Claude Code runs, you must share `VOICE_SPEC_DIR` between them (shared volume, sync, etc.), otherwise the specs never reach the `/voice-changes` step.

### Example: minimal Caddy reverse proxy (internal)

```
voice.internal.yourteam.org {
    reverse_proxy localhost:3100
}
```

Keep this behind your VPN or internal network — the app has no authentication of its own.

---

## 5. Verify the deployment

1. Visit `http://<host>:3100/pr/1` — the PR page renders.
2. Hold to talk — the browser should connect to the ElevenLabs agent (confirms `ELEVENLABS_AGENT_ID` + `ELEVENLABS_API_KEY` and the signed-url route work).
3. Complete a dictation — confirm a spec file appears in `VOICE_SPEC_DIR`.
4. From a Claude Code session in the same checkout, run `/voice-changes` and confirm it picks up the spec.

---

## Upgrades

```bash
git pull
pnpm install --frozen-lockfile
pnpm --filter @public-internet/voice-bridge... build
# restart the service
```

---

## A note on ElevenLabs (ADR-005)

voice-bridge depends on a proprietary third-party service (ElevenLabs), which is acceptable **only because it is an internal tool, not a civic platform** — the constitution's "no proprietary dependency a public entity can't replace" rule applies to the platforms in the Registry, not to internal developer tooling. [ADR-005](../../decisions/ADR-005-voice-input-via-elevenlabs.md) documents this boundary and the migration path to a self-hosted speech alternative if voice capture ever graduates beyond an internal tool.
