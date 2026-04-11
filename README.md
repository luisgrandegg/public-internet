# Public Internet

Open-source replacements for extractive platforms — built for municipalities, cooperatives, and civic infrastructure.

> Read [CONSTITUTION.md](./CONSTITUTION.md) for the principles that govern every product and technical decision in this repo.

---

## What this is

A generation of platforms was built to connect people who need something with people who can provide it. Most of them became extraction machines — taking ever-larger cuts, manipulating behaviour, locking in users and workers.

**Public Internet builds functional replacements for those platforms.** The software is free, governed by public entities, and designed to run at the smallest meaningful scale while federating with the larger world when it helps.

### Platforms in scope

| Platform | Status | Description |
|---|---|---|
| **Stay** | Planned | Commission-free accommodation — AirBnB without the extraction |
| **Eats** | Planned | Food delivery with worker rights — DoorDash without misclassification |
| **Agenda** | Planned | Civic participation platform — transparent municipal decisions for everyone |

---

## Stack

| Layer | Technology |
|---|---|
| UI framework | React 19 + TypeScript (strict) |
| Reference app | Next.js 15 (`apps/web`) |
| Component library | `@public-internet/design-system` (CSS Modules + design tokens) |
| Component preview | Storybook 8 |
| Testing | Vitest + Testing Library + jest-axe |
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

```bash
# 1. Clone
git clone https://github.com/luisgrandegg/public-internet.git
cd public-internet

# 2. Install dependencies
pnpm install

# 3. Build all packages
pnpm build

# 4. Start the reference app
pnpm --filter @public-internet/web dev

# 5. Start Storybook (design system preview)
pnpm --filter @public-internet/design-system storybook
```

---

## Project structure

```
/
├── apps/
│   └── web/                  # Reference app (Next.js)
├── packages/
│   └── design-system/        # Component library + design tokens
│       ├── src/
│       │   ├── components/   # Production components
│       │   ├── experiments/  # A/B variants (never imported by apps)
│       │   ├── tokens/       # Design tokens (CSS vars + TS object)
│       │   └── index.ts      # Barrel export
│       └── package.json
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
| `/rules-audit` | Score the quality of AI rules across 8 criteria |

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

## Architecture decisions

Significant decisions are documented in [`decisions/`](./decisions/):

| ADR | Decision |
|---|---|
| [ADR-001](./decisions/ADR-001-css-modules-over-tailwind.md) | CSS Modules over Tailwind / CSS-in-JS |
| [ADR-002](./decisions/ADR-002-static-experiment-isolation.md) | Experiments isolated in `src/experiments/` vs. runtime feature flags |
| [ADR-003](./decisions/ADR-003-claude-md-context-files.md) | CLAUDE.md context files over MCP server or system prompt |

---

## License

[AGPL-3.0-or-later](./LICENSE) — free to use, modify, and deploy. Any network-accessible service built on this code must publish its source.
