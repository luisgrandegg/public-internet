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

---

## Monorepo Structure

```
/
├── apps/
│   └── web/                  # Reference app
├── packages/
│   └── design-system/        # Core component library + tokens
│       ├── src/
│       │   ├── components/   # Production components
│       │   ├── experiments/  # A/B variants (never imported by apps)
│       │   ├── tokens/       # Design tokens (CSS vars + TS object)
│       │   └── index.ts      # Barrel export
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
- `apps/CLAUDE.md` — import rules, composition patterns, gap flagging

---

## Architecture Decision Records

Significant architectural decisions are documented in [`decisions/`](./decisions/).
Before making a choice that touches styling strategy, experiment isolation, or context injection, read the relevant ADR first.

| ADR | Decision |
| --- | -------- |
| [ADR-001](./decisions/ADR-001-css-modules-over-tailwind.md) | CSS Modules over Tailwind/CSS-in-JS |
| [ADR-002](./decisions/ADR-002-static-experiment-isolation.md) | Experiments isolated in `src/experiments/` vs. runtime feature flags |
| [ADR-003](./decisions/ADR-003-claude-md-context-files.md) | CLAUDE.md context files over MCP server or system prompt |

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

---

## Backlog

Current feature status is always in [`backlog/backlog.md`](./backlog/backlog.md).
Check it before starting work to understand what's done, in progress, and pending.

When completing a feature, follow these steps **in order** — the pre-commit hook enforces consistency:

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
- **Allowed Bash commands:** `git`, `pnpm`, `gh`, `volta`, `jq`, `npx tsc`.

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
