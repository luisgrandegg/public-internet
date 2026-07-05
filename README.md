# Public Internet

Open-source replacements for extractive platforms — built for municipalities, cooperatives, and civic infrastructure.

> Read [MANIFESTO.md](./MANIFESTO.md) for why this project exists, and [CONSTITUTION.md](./CONSTITUTION.md) for the principles that govern every product and technical decision in this repo.

---

## What this is

A generation of platforms was built to connect people who need something with people who can provide it. Most of them became extraction machines — taking ever-larger cuts, manipulating behaviour, locking in users and workers.

**Public Internet builds functional replacements for those platforms.** The software is free, governed by public entities, and designed to run at the smallest meaningful scale while federating with the larger world when it helps.

### Platforms in scope

| Platform | Status | Description | Quickstart |
|---|---|---|---|
| **Stay** | Built | Commission-free accommodation — AirBnB without the extraction | [apps/stay/QUICKSTART.md](./apps/stay/QUICKSTART.md) |
| **Eats** | Built | Food delivery with worker rights — DoorDash without misclassification | [apps/eats/QUICKSTART.md](./apps/eats/QUICKSTART.md) |
| **Agenda** | Planned | Civic participation platform — transparent municipal decisions for everyone | — |

---

## Stack

| Layer | Technology |
|---|---|
| UI framework | React 19 + TypeScript (strict) |
| Apps | Next.js 15 (App Router + REST Route Handlers) |
| Database | PostgreSQL 16 + Prisma |
| Auth | `@public-internet/node-auth` (better-auth; optional per-node Google sign-in) |
| Payments | `@public-internet/payments` (pluggable provider; Stripe built in, offline mode default) |
| Component library | `@public-internet/design-system` (CSS Modules + design tokens) |
| Component preview | Storybook 8 |
| Testing | Vitest + Testing Library + jest-axe; Playwright e2e per app |
| Monorepo | pnpm workspaces + Turborepo |
| CI | GitHub Actions |

---

## Prerequisites

| Tool | Version | Notes |
|---|---|---|
| Node.js | `22.22.2` | Pinned via [Volta](https://volta.sh) — install Volta and it auto-switches |
| pnpm | `9.15.0` | Set via `packageManager` field — Volta or Corepack will manage it |

Install Volta once and it handles the rest:

```bash
# Install Volta (macOS / Linux)
curl https://get.volta.sh | bash

# Windows
winget install Volta.Volta
```

---

## Getting started

Each app has a 5-minute quickstart covering database, env, migrations, and dev server:

- **Stay** — [apps/stay/QUICKSTART.md](./apps/stay/QUICKSTART.md) (http://localhost:3000)
- **Eats** — [apps/eats/QUICKSTART.md](./apps/eats/QUICKSTART.md) (http://localhost:3001)
- **voice-bridge** (dev tool) — [apps/voice-bridge/QUICKSTART.md](./apps/voice-bridge/QUICKSTART.md) (http://localhost:3100)

The short version:

```bash
git clone https://github.com/luisgrandegg/public-internet.git && cd public-internet
pnpm install
docker compose -f apps/stay/docker-compose.yml up -d
cp apps/stay/.env.example apps/stay/.env
pnpm --filter @public-internet/stay db:deploy
pnpm --filter @public-internet/design-system build
pnpm --filter @public-internet/stay dev

# Storybook (design system preview)
pnpm --filter @public-internet/design-system storybook
```

---

## Project structure

```
/
├── apps/
│   ├── stay/                 # Stay platform — commission-free tourist rental (Next.js)
│   ├── eats/                 # Eats platform — commission-free food delivery (Next.js)
│   └── voice-bridge/         # Dev tool — voice-first PR-change capture (Next.js)
├── packages/
│   ├── design-system/        # Component library + design tokens
│   ├── node-auth/            # Shared auth factory (better-auth recipe + optional Google) — ADR-007
│   ├── payments/             # Pluggable PaymentProvider + Stripe + webhook factory — ADR-006/007
│   ├── eats-sdk/             # Typed SDK generated from the eats OpenAPI spec
│   └── stay-sdk/             # Typed SDK generated from the Stay OpenAPI spec
├── .claude/
│   └── commands/             # AI-assisted workflow commands
├── backlog/
│   ├── backlog.md            # Active feature list
│   ├── todo/                 # Individual feature files
│   └── completed/            # Finished features
├── decisions/                # Architecture Decision Records (ADRs)
├── CLAUDE.md                 # AI agent instructions
├── CONSTITUTION.md           # Governing principles
└── turbo.json
```

---

## Common commands

```bash
pnpm build                    # Build all packages
pnpm lint                     # Lint all packages
pnpm type-check               # TypeScript check across the monorepo
pnpm clean                    # Remove all build artifacts

# Scoped to the design system
pnpm --filter @public-internet/design-system storybook
pnpm --filter @public-internet/design-system test:coverage
pnpm --filter @public-internet/design-system build
```

---

## AI-assisted workflows

This repo uses Claude Code with custom slash commands for designer-facing workflows:

| Command | Purpose |
|---|---|
| `/new-component` | Scaffold a new design system component |
| `/ab-variant` | Create an A/B experiment variant |
| `/wireframe-to-component` | Turn a wireframe description into composed components |
| `/audit-component` | Check a component against all lifecycle gates |
| `/brainstorm-variants` | Generate 3 design alternatives with tradeoffs |
| `/create-pr` | Create a PR for the current branch and start CI watch |
| `/watch-pr` | Poll CI; fix failures and resolve review comments automatically |
| `/review-pr` | Review a PR, post inline comments per finding, submit REQUEST_CHANGES |
| `/voice-changes` | Apply the most recent voice spec from `.voice-changes/` to the current branch |
| `/rules-audit` | Score the quality of AI rules across 8 criteria |

### Voice toolchain (optional)

For designers and PMs who want to dictate PR changes instead of typing them, the `apps/voice-bridge` companion captures voice via [ElevenLabs Conversational AI](https://elevenlabs.io/conversational-ai), confirms intent, and writes a structured change spec that `/voice-changes` applies through Claude Code. See [ADR-005](./decisions/ADR-005-voice-input-via-elevenlabs.md) for the scoping decision and the documented migration path to a self-hosted alternative.

```bash
cp apps/voice-bridge/.env.example apps/voice-bridge/.env.local
# fill in ELEVENLABS_AGENT_ID + ELEVENLABS_API_KEY (or leave blank for stub mode)
pnpm --filter @public-internet/voice-bridge dev
# → open http://localhost:3100/pr/<your-pr-number>
```

---

## Contributing

**Never commit directly to `main`.** All changes go through a Pull Request.

### Branch naming

| Type | Pattern |
|---|---|
| Feature | `feature/F-XXX-short-name` |
| Fix | `fix/short-description` |
| Chore | `chore/short-description` |
| Experiment | `experiment/component-name` |

### Workflow

```bash
git checkout main && git pull origin main   # always sync first
pnpm install                                # keep lockfile in sync
git checkout -b feature/F-XXX-description  # branch
# ... make changes and commit ...
# /create-pr                               # use the slash command to open a PR
```

### CI gates

Every PR must pass:

- `pnpm lint` — zero ESLint errors
- `pnpm type-check` — zero TypeScript errors (strict mode)
- `pnpm build` — all packages build cleanly

---

## Deployment

Each app is designed to run as an independent local node — a municipality or cooperative can deploy one without the others. Per-app deployment guides:

| App | Guide |
|---|---|
| **Stay** (`stay`) | [apps/stay/DEPLOYMENT.md](./apps/stay/DEPLOYMENT.md) |
| **Eats** (`eats`) | [apps/eats/DEPLOYMENT.md](./apps/eats/DEPLOYMENT.md) |
| **voice-bridge** (internal tool) | [apps/voice-bridge/DEPLOYMENT.md](./apps/voice-bridge/DEPLOYMENT.md) |

---

## Architecture decisions

Significant decisions are documented in [`decisions/`](./decisions/):

| ADR | Decision |
|---|---|
| [ADR-001](./decisions/ADR-001-css-modules-over-tailwind.md) | CSS Modules over Tailwind / CSS-in-JS |
| [ADR-002](./decisions/ADR-002-static-experiment-isolation.md) | Experiments isolated in `src/experiments/` vs. runtime feature flags |
| [ADR-003](./decisions/ADR-003-claude-md-context-files.md) | CLAUDE.md context files over MCP server or system prompt |
| [ADR-004](./decisions/ADR-004-full-stack-rest-api.md) | Full-stack features with REST API — no placeholder implementations |
| [ADR-005](./decisions/ADR-005-voice-input-via-elevenlabs.md) | Voice input for the designer toolchain via ElevenLabs Conversational AI |
| [ADR-006](./decisions/ADR-006-stripe-payments.md) | Online payments via Stripe Checkout, with an explicit offline mode |
| [ADR-007](./decisions/ADR-007-shared-node-infrastructure-packages.md) | Shared node-auth and payments packages; pluggable per-node auth strategies |

---

## License

[AGPL-3.0-or-later](./LICENSE) — free to use, modify, and deploy. Any network-accessible service built on this code must publish its source.
