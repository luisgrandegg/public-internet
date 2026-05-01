# Bootstrap: AI-Assisted Development System

> **Receiving agent: read this whole file before doing anything.** Then walk the user through the steps below in order. The goal is to bootstrap an empty repo with a complete AI-assisted development system: governance docs, ADRs, backlog tracking, and a pre-commit consistency hook. Slash commands are installed separately via a Claude Code plugin (see § 8) and are out of scope for this bootstrap.

---

## What this system is

A repeatable scaffolding for projects worked on by Claude Code (and humans). It has four pillars:

1. **`CLAUDE.md`** — the root context file Claude reads at session start. Points at everything else.
2. **`CONSTITUTION.md`** — durable principles that govern product, design, and technical decisions. Optional but recommended for projects with a strong point of view.
3. **`decisions/`** — Architecture Decision Records (ADRs). Append-only log of significant choices and their reasoning.
4. **`backlog/`** — feature-tracking with `todo/` and `completed/` directories, an index in `backlog.md`, and a pre-commit hook that prevents a feature file from existing in both directories.

The pillars work together: CLAUDE.md tells Claude where to look; CONSTITUTION.md gives binding principles; decisions/ records why architectural choices were made; backlog/ tracks what's left.

---

## Step 0 — Verify the environment

Before writing anything, confirm:

```sh
git rev-parse --is-inside-work-tree   # must print "true"
ls -A                                  # should be roughly empty (an .git/ + maybe README.md)
```

If the repo already has a `CLAUDE.md`, `CONSTITUTION.md`, or `backlog/`, **stop and ask the user** whether to overwrite, merge, or abort. Do not silently overwrite existing AI-governance files.

---

## Step 1 — Discovery questions

Ask the user the following, one at a time, and record the answers. You will substitute them into the templates below.

1. **Project name** — short, hyphenated (e.g. `public-internet`, `acme-platform`). Used in headings.
2. **One-paragraph project description** — what this repo is, who it's for, what "done" looks like. 2–4 sentences.
3. **Stack** — primary language/framework (e.g. "React + TypeScript + pnpm workspaces", "Python + FastAPI", "Go + sqlc"). Used in the CLAUDE.md template.
4. **Does this project need a CONSTITUTION?** Yes if there are durable principles, ethical constraints, or product values that should govern every decision. No for purely technical/internal repos. If unsure, recommend yes — it's cheap to keep empty and expensive to add later.
5. **Branch protection** — does `main` require PRs? (Default: yes.)
6. **Package manager** — `pnpm`, `npm`, `yarn`, `cargo`, `pip`, etc. Used in the lifecycle section of CLAUDE.md.

If the user is unsure on any of these, give a sensible default and proceed — they can edit later.

---

## Step 2 — Scaffold the directory structure

Create these directories (use the `Write` tool to create placeholder files; do not use `mkdir` via Bash):

```
.claude/
backlog/
  todo/
  completed/
decisions/
githooks/
scripts/
```

Empty directories aren't tracked by git. Add a `.gitkeep` in `backlog/todo/` and `backlog/completed/` so the structure survives a fresh clone.

---

## Step 3 — Write `CLAUDE.md` (root)

Create `CLAUDE.md` with the following content. Substitute `{{PROJECT_NAME}}`, `{{DESCRIPTION}}`, `{{STACK}}`, `{{PACKAGE_MANAGER}}` from the discovery answers. **If the user said no to CONSTITUTION**, delete the "Constitution" section and the corresponding row from the ADR table.

````markdown
# CLAUDE.md — {{PROJECT_NAME}}

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

{{DESCRIPTION}}

**Stack:** {{STACK}}

---

## Repository Structure

> Update this section as the repo grows. Keep it accurate — Claude relies on it for orientation.

```
/
├── .claude/                  # Claude Code config (settings, plugin pins)
├── backlog/
│   ├── backlog.md            # Active feature index
│   ├── todo/                 # Open feature files
│   └── completed/            # Finished features (append-only)
├── decisions/                # Architecture Decision Records
├── githooks/                 # Tracked git hooks (activated by setup)
├── scripts/                  # Repo-level scripts (consistency checks, etc.)
├── CLAUDE.md                 # This file
└── CONSTITUTION.md           # Governing principles
```

---

## Architecture Decision Records

Significant architectural decisions live in [`decisions/`](./decisions/).
Before making a choice that touches architecture, conventions, or cross-cutting concerns, read the relevant ADR first.

If you are about to make a decision that contradicts an existing ADR, **stop and flag it** rather than silently overriding. If the decision genuinely needs to change, write a new ADR that supersedes the old one.

---

## Development Lifecycle

**Never commit directly to `main`.** All changes go through a Pull Request.

### Branch Naming

| Type       | Pattern                     |
| ---------- | --------------------------- |
| Feature    | `feature/F-XXX-short-name`  |
| Fix        | `fix/short-description`     |
| Chore      | `chore/short-description`   |

### Workflow

1. Sync main: `git checkout main && git pull origin main`
2. Install dependencies: `{{PACKAGE_MANAGER}} install`
3. Create branch: `git checkout -b feature/F-XXX-description`
4. Work and commit (conventional commits)
5. Open a PR
6. Merge only after CI passes and review is approved

---

## Backlog

Current feature status is in [`backlog/backlog.md`](./backlog/backlog.md).
Check it before starting work to see what's done, in progress, and pending.

### Completing a backlog item

A feature is complete when its code is committed, all gates pass locally, and a PR is about to open. To complete:

1. Append a completion block (date, PR link, summary) to the feature's file in `backlog/todo/`.
2. Move the file to `backlog/completed/` (copy the contents into a new file there using `Write`, then delete the original).
3. Remove the row from `backlog/backlog.md`.
4. Commit: `git commit -m "feat(backlog): complete F-XXX — <feature name>"`.

The pre-commit hook blocks commits where the same filename exists in both `backlog/todo/` and `backlog/completed/`.

---

## Modifying AI Rules

**This section applies only when the current task edits one of:**
- Any `CLAUDE.md` file
- `CONSTITUTION.md`
- Any file in `decisions/`
- Any file in `.claude/`

**If none of those files are being modified, skip this section.**

When modifying AI rules:
1. State the change you intend to make and why.
2. Make it.
3. Verify the change does not contradict an existing ADR. If it does, write a new ADR that supersedes the old one in the same PR.
````

---

## Step 4 — Write `CONSTITUTION.md` (skeleton)

**Skip this step if the user said no in discovery question 4.** Otherwise create `CONSTITUTION.md` with this skeleton — it is intentionally empty and the user fills it in afterwards:

```markdown
# {{PROJECT_NAME}} — Constitution

> This document governs every product, design, and technical decision in this repo.
> Agents: read this before acting. If a request conflicts with these principles, flag it before proceeding.

---

## Mission

<!-- One paragraph: what problem this project exists to solve, and the spirit in which it solves it. -->

---

## Core Principles

<!-- Numbered list of binding principles. Each principle should be:
     - a single short statement (one sentence),
     - followed by a paragraph explaining what it means in practice,
     - and concrete enough that an agent can flag a violation.
     Example shape:

     ### 1. <Principle name>
     <Statement.> <What it forbids.> <What it requires.>
-->

---

## Rules for Agents

When working in this repository, apply the following checks before implementing any feature.

**On every change, ask:**
- <Question derived from each principle above>

---

## Modifying AI Rules

**This block is active only when the current task modifies this file, any `CLAUDE.md`, or any file in `decisions/`. Skip it otherwise.**

Changes to these files must be accompanied by a clear explanation in the PR description of what changed and why. Adding a principle is a high-bar action — discuss with the user before doing it unilaterally.
```

---

## Step 5 — Write the `decisions/` system

### 5a — `decisions/README.md`

```markdown
# Architecture Decision Records

This directory contains Architecture Decision Records (ADRs) for {{PROJECT_NAME}}.

---

## What is an ADR?

A short document capturing a significant architectural choice: **what** was decided, **why**, **what alternatives** were considered, and **what consequences** follow.

ADRs are append-only. If a decision is reversed, the old ADR is marked `Superseded by ADR-00X` and a new ADR is written explaining the new direction.

---

## Format (Nygard-style)

See `ADR-template.md` in this directory.

---

## Index

| ADR | Title | Status |
| --- | ----- | ------ |
| _none yet_ | | |

---

## How to write a new ADR

1. Pick the next number (e.g. `ADR-001`).
2. Copy `ADR-template.md` to `decisions/ADR-00X-short-title.md`.
3. Fill it in. Set **Status: Accepted** for current decisions or **Status: Proposed** for ones under discussion.
4. Add a row to the index table above.
5. If it supersedes an existing ADR, update that ADR's status line.
6. Commit: `docs(decisions): add ADR-00X — <title>`.

## How to supersede an ADR

Never delete. Open the old ADR, change its `**Status:**` to `Superseded by ADR-00X`, write the new ADR referencing the old one in its Context section, and update the index.
```

### 5b — `decisions/ADR-template.md`

```markdown
# ADR-00X — Title

**Status:** Accepted | Superseded by ADR-00Y | Deprecated
**Date:** YYYY-MM-DD

## Context

What forces, constraints, or requirements led to this decision?
What is the problem being solved?

## Decision

What was decided? State it as a clear, direct sentence.

## Alternatives Considered

What other approaches were evaluated? Why were they rejected?

## Consequences

What are the positive and negative outcomes of this decision?
What new constraints does it create?
```

---

## Step 6 — Write the `backlog/` system

### 6a — `backlog/backlog.md`

```markdown
# Backlog

Active features for {{PROJECT_NAME}}. Check this before starting work.

| ID | Feature | Status | Branch |
| -- | ------- | ------ | ------ |
| _none yet_ | | | |
```

### 6b — `backlog/todo/.gitkeep` and `backlog/completed/.gitkeep`

Create both as empty files so the directories survive a fresh clone.

### 6c — `scripts/check-backlog-consistency.js`

```js
#!/usr/bin/env node
// Enforces the backlog rule: no file may exist in both backlog/todo/ and backlog/completed/.
// Run automatically as a pre-commit hook (git always invokes hooks from the repo root).
// Exit 1 blocks the commit.

import { readdirSync, existsSync } from 'fs'
import { join } from 'path'

const root = process.cwd()
const todoDir = join(root, 'backlog', 'todo')
const completedDir = join(root, 'backlog', 'completed')

if (!existsSync(todoDir) || !existsSync(completedDir)) {
  process.exit(0)
}

const todoFiles = new Set(readdirSync(todoDir).filter((f) => !f.startsWith('.')))
const completedFiles = new Set(readdirSync(completedDir).filter((f) => !f.startsWith('.')))

const duplicates = [...todoFiles].filter((f) => completedFiles.has(f))

if (duplicates.length > 0) {
  console.error('\n\x1b[31m✖ Backlog consistency error\x1b[0m')
  console.error('The following files exist in both backlog/todo/ and backlog/completed/:')
  for (const f of duplicates) {
    console.error(`  • ${f}`)
  }
  console.error(
    '\nDelete the file(s) from backlog/todo/ before committing.\n' +
      'See CLAUDE.md § Backlog for the completion workflow.\n'
  )
  process.exit(1)
}
```

> **Note:** the script uses ESM imports. If the repo's `package.json` does not have `"type": "module"`, either add it or convert the script to CommonJS (`const { readdirSync } = require('fs')`). If there is no `package.json` at all, ask the user whether to create one or rewrite the script as a POSIX shell script.

### 6d — `githooks/pre-commit`

```sh
#!/bin/sh
# Tracked pre-commit hook — activated via `git config core.hooksPath githooks`.

node scripts/check-backlog-consistency.js
```

The receiving agent must mark this executable: `chmod +x githooks/pre-commit`.

---

## Step 7 — Write `.claude/settings.json`

Minimal default that pre-allows safe, common operations. The user can extend this later.

```json
{
  "permissions": {
    "allow": [
      "Edit",
      "Bash(git status:*)",
      "Bash(git diff:*)",
      "Bash(git log:*)",
      "Bash(git add:*)",
      "Bash(git commit:*)",
      "Bash(git push:*)",
      "Bash(git pull:*)",
      "Bash(git fetch:*)",
      "Bash(git checkout:*)",
      "Bash(git branch:*)",
      "Bash(git rev-parse:*)",
      "Bash(git config:*)",
      "Bash(chmod:*)"
    ]
  }
}
```

If the user named a package manager in discovery, also add the relevant entries (e.g. `Bash(pnpm install:*)`, `Bash(pnpm build:*)`, `Bash(pnpm lint:*)`).

---

## Step 8 — Wire the git hook

Run:

```sh
git config core.hooksPath githooks
chmod +x githooks/pre-commit
```

Verify by creating a dummy duplicate (touch the same filename in `backlog/todo/` and `backlog/completed/`), attempting `git commit`, and confirming the hook blocks it. Then delete the dummy files.

---

## Step 9 — (Optional) Install the slash-command plugin

The slash commands that pair with this system (`/new-component`, `/audit-component`, `/create-pr`, `/watch-pr`, `/rules-audit`, `/tackle-backlog`, `/discover`, etc.) live in a separate Claude Code plugin and are **not** part of this bootstrap. To install:

```
/plugin marketplace add <owner>/<plugin-repo>
/plugin install <plugin-name>
```

Tell the user the plugin install is optional — the system above works without it. Skip this step if no plugin URL is available yet.

---

## Step 10 — Commit and verify

1. Stage everything: `git add -A`
2. Commit: `git commit -m "chore: bootstrap AI development system"`
3. Verify the hook runs (it should pass with no duplicates).
4. Show the user a summary of what was created and what's next:
   - Fill in `CONSTITUTION.md` (if present) with mission and principles.
   - Add the first ADR documenting any non-obvious architectural choices already made.
   - Add the first backlog feature file to `backlog/todo/` and a row in `backlog.md`.

---

## Receiving-agent checklist (do not skip)

- [ ] Step 0: empty-repo check passed (or user authorised overwrite)
- [ ] Step 1: discovery answers recorded
- [ ] Step 2: directories created
- [ ] Step 3: `CLAUDE.md` written with substitutions
- [ ] Step 4: `CONSTITUTION.md` written (or skipped per user)
- [ ] Step 5: `decisions/README.md` and `decisions/ADR-template.md` written
- [ ] Step 6: `backlog/backlog.md`, `.gitkeep`s, consistency script, and pre-commit hook written
- [ ] Step 7: `.claude/settings.json` written
- [ ] Step 8: `core.hooksPath` set, hook is executable, blocking-test verified
- [ ] Step 9: plugin install offered (optional)
- [ ] Step 10: initial commit made

When all boxes are checked, report back to the user with the file tree and the recommended next actions.
