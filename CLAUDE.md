# CLAUDE.md — public-internet

> This file is automatically read by Claude Code at session start.
> It provides full project context so every session begins with shared understanding.
> **Read this before doing anything else.**

---

## Constitution

**Read [`CONSTITUTION.md`](./CONSTITUTION.md) before anything else.**
Every product, design, and technical decision in this repo is governed by the constitution.
If a request conflicts with the constitution's principles, flag it explicitly before proceeding.

---

## Project Overview

This monorepo is a proof-of-concept for an AI-assisted design-to-code pipeline.
It enables UX designers to iterate on components using Claude Code, within a
structured environment that guarantees production-quality output.

**Goal:** A designer can go from wireframe description → functional React component
→ Storybook preview → PR-ready code, without needing a dedicated engineer.

**Stack:** React, TypeScript (strict), CSS Modules, Storybook 8, pnpm workspaces, Turborepo.
**Backend:** Next.js Route Handlers (REST API), PostgreSQL, Prisma ORM, better-auth. See [ADR-004](./decisions/ADR-004-full-stack-rest-api.md).

---

## Monorepo Structure

```
/
├── apps/
│   ├── touristical-renting/  # Stay platform — commission-free tourist rental
│   ├── eats/                 # Eats platform — commission-free food delivery
│   └── voice-bridge/         # Dev tool — voice-first PR-change capture (see ADR-005)
├── packages/
│   ├── design-system/        # Core component library + tokens
│   │   ├── src/
│   │   │   ├── components/   # Production components
│   │   │   ├── experiments/  # A/B variants (never imported by apps)
│   │   │   ├── tokens/       # Design tokens (CSS vars + TS object)
│   │   │   └── index.ts      # Barrel export
│   │   └── package.json
│   └── touristical-renting-sdk/  # Auto-generated typed SDK for the touristical-renting API
│       ├── src/
│       │   ├── client.ts         # ApiClient interface + FetchApiClient
│       │   ├── index.ts          # Barrel export
│       │   └── generated/        # Generated from openapi.json — do not edit manually
│       ├── generate.mjs          # SDK generator script
│       └── package.json
├── .claude/
│   └── commands/             # Custom slash commands for designers
├── backlog/
│   ├── backlog.md            # Active feature list — check this for project state
│   ├── todo/                 # Individual feature files
│   └── completed/            # Finished features with timestamps
├── CLAUDE.md                 # This file
├── decisions/                # Architecture Decision Records
├── turbo.json
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

Each subdirectory has its own `CLAUDE.md` with context scoped to that area:

- `packages/design-system/CLAUDE.md` — tokens, components, conventions, Storybook
- `apps/CLAUDE.md` — app registry, import rules, composition patterns, gap flagging, OpenAPI + SDK rules
- `apps/touristical-renting/CLAUDE.md` — domain vocabulary, routes, constitution alignment for the Stay platform
- `apps/voice-bridge/CLAUDE.md` — voice toolchain rules, ElevenLabs provider boundary, spec format

---

## Architecture Decision Records

Significant architectural decisions are documented in [`decisions/`](./decisions/).
Before making a choice that touches styling strategy, experiment isolation, or context injection, read the relevant ADR first.

| ADR | Decision |
| --- | -------- |
| [ADR-001](./decisions/ADR-001-css-modules-over-tailwind.md) | CSS Modules over Tailwind/CSS-in-JS |
| [ADR-002](./decisions/ADR-002-static-experiment-isolation.md) | Experiments isolated in `src/experiments/` vs. runtime feature flags |
| [ADR-003](./decisions/ADR-003-claude-md-context-files.md) | CLAUDE.md context files over MCP server or system prompt |
| [ADR-004](./decisions/ADR-004-full-stack-rest-api.md) | Full-stack features with REST API — no placeholder implementations |
| [ADR-005](./decisions/ADR-005-voice-input-via-elevenlabs.md) | Voice input for the designer toolchain via ElevenLabs Conversational AI |

If you are about to make a decision that contradicts an existing ADR, stop and flag it explicitly rather than silently overriding it. If the decision genuinely needs to change, write a new ADR that supersedes the old one.

---

## Development Lifecycle

**Never commit directly to `main`.** All changes go through a Pull Request. Branch protection enforces this — direct pushes to main are blocked.

### Branch Naming

| Type       | Pattern                     |
| ---------- | --------------------------- |
| Feature    | `feature/F-XXX-short-name`  |
| Fix        | `fix/short-description`     |
| Chore      | `chore/short-description`   |
| Experiment | `experiment/component-name` |

### Workflow

1. **Sync main first** — always fetch and pull the latest main before branching:
   ```
   git checkout main && git pull origin main
   ```
2. **Install dependencies** — always run after syncing main to keep the lockfile in sync:
   ```
   pnpm install
   ```
3. **Start a branch** — `git checkout -b feature/F-XXX-description`
4. **Work and commit** — conventional commits on the branch
5. **Create a PR** — use `/create-pr` at the end of the session (Claude will also prompt you)
6. **Wait for CI** — use `/watch-pr` to monitor; Claude polls every 30 seconds
7. **Merge** — only after CI passes and PR is approved

### CI Gates (run on every PR)

- `pnpm lint` — zero ESLint errors
- `pnpm typecheck` — zero TypeScript errors (strict mode)
- `pnpm build` — all packages build cleanly
- `pnpm --filter <app> test:e2e` — e2e suite passes (app features only)

### Package Tagging

When a PR merges to `main`, a workflow automatically creates git tags for any packages whose `package.json` version changed (e.g. `@public-internet/design-system@0.1.1`).

---

## Custom Commands

Slash commands for designers live in `.claude/commands/`. Use them to start guided workflows:

| Command                   | Purpose                                               |
| ------------------------- | ----------------------------------------------------- |
| `/new-component`          | Scaffold a new design system component                                        |
| `/ab-variant`             | Create an A/B experiment variant                                              |
| `/wireframe-to-component` | Turn a wireframe description into composed components                         |
| `/audit-component`        | Check a component against all lifecycle gates                                 |
| `/brainstorm-variants`    | Generate 3 design alternatives with tradeoffs                                 |
| `/create-pr`              | Create a PR for the current branch and start CI watch                         |
| `/watch-pr`               | Poll CI on the current PR; fix failures automatically                         |
| `/rules-audit`            | Score the quality of AI rules (CLAUDE.md, CONSTITUTION.md) across 8 criteria |
| `/review-pr`              | Review a PR, post inline comments per finding, submit REQUEST_CHANGES         |
| `/tackle-backlog`         | Spawn one agent per backlog feature (coordinator for dependent features)       |
| `/discover`               | Explore a project's architecture, data model, API surface, and UI             |
| `/voice-changes`          | Apply the most recent voice spec from `.voice-changes/` to the current branch |

---

## Voice Toolchain

Designers and PMs can dictate PR changes by voice instead of typing prompts. The flow has two halves:

1. **`apps/voice-bridge`** — Next.js companion app at `http://localhost:3100`. Open `/pr/<n>`, hold to talk, the ElevenLabs Conversational AI agent confirms intent, and writes a spec to `.voice-changes/`.
2. **`/voice-changes`** — Claude Code slash command that reads the newest spec, asks for confirmation, applies the edits, runs `pnpm type-check && pnpm lint`, and commits.

Spec files are gitignored. Read [ADR-005](./decisions/ADR-005-voice-input-via-elevenlabs.md) for the scoping decision and the documented migration path away from ElevenLabs.

---

## Full-Stack Rule

**Every feature that touches data must be implemented end-to-end before it is considered done.**

This is a hard rule. It is not acceptable to:
- Return `{ ok: true }` from a Server Action without persisting anything
- Use `MOCK_LISTINGS` or any in-memory array as the data source for a user-facing page
- Mark a feature complete in the backlog when the backend is a stub

A feature is done when:
1. A Prisma schema entry and migration exist for any new data it introduces
2. A REST Route Handler exists at `app/api/**/route.ts` implementing the operation
3. The Server Action (if used) calls that Route Handler — it does not duplicate the logic
4. The UI reflects real data from the database, not mock data

**Backend stack (per ADR-004):**

| Layer | Choice |
|---|---|
| API | Next.js Route Handlers (`app/api/**/route.ts`) following REST conventions |
| Database | PostgreSQL |
| ORM | Prisma — schema at `prisma/schema.prisma`, migrations committed to repo |
| Auth | `better-auth` — email + password, session-based, no OAuth dependency |

**REST response shape:**
```typescript
// Success
{ data: T }

// Error
{ error: { code: string; message: string; fields?: Record<string, string> } }
```

HTTP status codes are the source of truth. Never return `{ ok: false }` with a 200 status.

Environment variables for DB connections must appear in `.env.example` with explanatory comments. Never hardcode connection strings.

---

## E2E Testing Rule

**Every backlog feature that touches an app must ship with Playwright e2e tests.** Tests live in `apps/<app>/e2e/` and run against the built app in CI.

### What to test

| Scenario | What to cover |
|---|---|
| Page renders | Heading, key content, no JS crash |
| Form submission | Happy path + validation errors |
| Navigation | Links and redirects land on the correct route |
| Constitution constraints | No urgency copy, no hidden fees, host opt-in not pre-checked |
| Empty state | Pages that fetch data behave correctly when the database is empty |

### What NOT to test in e2e

- Implementation details (CSS class names, component internals)
- Unit-level logic already covered by unit tests
- Third-party integrations that cannot run in CI (email delivery, payment providers)

### E2E test location and naming

```
apps/<app>/
├── e2e/
│   ├── home.spec.ts
│   ├── listings.spec.ts
│   ├── auth/
│   │   ├── signin.spec.ts
│   │   ├── signup.spec.ts
│   │   └── forgot-password.spec.ts
│   └── host/
│       └── create-listing.spec.ts
├── playwright.config.ts        ← webServer points to `pnpm start`
└── package.json                ← "test:e2e": "playwright test"
```

One spec file per feature area. Group related pages (auth, host) into subdirectories.

### Running e2e tests locally

```bash
# Requires a running built app: pnpm build && pnpm start
pnpm --filter @public-internet/<app> test:e2e

# Interactive UI mode (useful when writing tests)
pnpm --filter @public-internet/<app> test:e2e:ui
```

### CI setup for e2e

The e2e CI job runs after `build` and requires a PostgreSQL service. See `.github/workflows/ci.yml` — the `e2e` job uses `services: postgres:16` and runs `prisma migrate deploy` before tests. The Playwright report is uploaded as a CI artifact on failure.

---

## Backlog

Current feature status is always in [`backlog/backlog.md`](./backlog/backlog.md).
Check it before starting work to understand what's done, in progress, and pending.

### When to complete a backlog item

**"Completing a feature" means: all code for the feature is committed, all lifecycle gates pass locally, and you are about to open a PR.** Do this before running `/create-pr` — not after, not in a separate session.

Specifically, complete the backlog item when **all of the following are true**:
- The feature's code is committed on the current branch
- `pnpm typecheck` and `pnpm lint` report zero errors
- `/audit-component` has passed (for DS components)
- You are about to run `/create-pr`

If you forget and open the PR first, complete the backlog item in a follow-up commit on the same branch before it merges.

### How to complete a backlog item

Follow these steps **in order** — the pre-commit hook enforces consistency:

1. Append the completion block to the feature file (see `backlog/completed/README.md`)
2. Copy the file to `backlog/completed/`
3. **Delete** the original from `backlog/todo/` — leaving it in both places will block the commit
4. Remove the row from `backlog/backlog.md`
5. **Create a git commit** — every completed feature gets its own commit:
   ```
   git commit -m "feat(backlog): complete F-XXX — <feature name>"
   ```

> The pre-commit hook checks that no file exists in both `backlog/todo/` and `backlog/completed/`.
> If you see a backlog consistency error at commit time, delete the file from `backlog/todo/`.

---

## Shell Command Rules

This project is used by non-developer designers. Unexpected permission prompts break their flow.
**Follow these rules to avoid triggering permission prompts:**

- **Never prefix commands with `cd path && ...`** — run commands directly from the working directory.
  The shell is already in the project root; chaining `cd` causes the permission system to misclassify the command.
- **Use `git -C <path>` if an explicit path is needed**, not `cd <path> && git ...`.
- **Avoid shell builtins or utilities not in the allow list** (`cp`, `mv`, `mkdir`, `rm`, etc.).
  Use the dedicated file tools (`Write`, `Edit`, `Read`, `Glob`) instead — they never prompt.
- **Allowed Bash commands and the subcommands used in this project:**

  | Command | Allowed subcommands |
  | ------- | ------------------- |
  | `git`   | `status`, `diff`, `add`, `commit`, `push`, `pull`, `fetch`, `merge`, `log`, `checkout`, `branch`, `rev-parse`, `stash`, `cherry-pick`, `config`, `rm` |
  | `pnpm`  | `install`, `build`, `lint`, `type-check`, `test`, `test:coverage`, `changeset`, `--filter <pkg> <script>`, `add`, `remove` |
  | `gh`    | `pr view`, `pr create`, `pr checks --watch --interval 30`, `run view --log-failed`, `repo edit`, `api` |
  | `volta` | `install` |
  | `jq`    | any — for parsing JSON output from `gh` commands |
  | `npx tsc` | type-check without a global install |

  Commands not in this table require user confirmation before running.

---

## Modifying AI Rules

**This section applies only when the current task involves editing one of these files:**
- Any `CLAUDE.md` file (root, `apps/`, `packages/*/`)
- `CONSTITUTION.md`
- Any file in `decisions/`
- Any file in `.claude/commands/`

**If none of those files are being modified, skip this section — it is irrelevant context.**

When modifying AI rules:

1. Run `/rules-audit` before making changes to record the baseline score.
2. Make your changes.
3. Run `/rules-audit` again to confirm the score improved or did not regress.
4. Include the before/after scores in the PR description.
