# Slash Commands — Designer's Guide

These commands give you guided, step-by-step workflows without needing to know prompt engineering or project conventions. Type any command into Claude Code to get started.

---

## Building components

### `/new-component`

**Use when:** You need a new UI component that doesn't exist yet.

Claude will ask you for the component name, what it does, and which variants you need — then scaffold the full component with TypeScript, styles, and Storybook stories, ready to preview.

> Example: `/new-component` → "I need a Toast notification component with success, warning, and error variants"

---

### `/audit-component`

**Use when:** You want to check if an existing component is production-ready.

Claude reviews the component against all quality gates (TypeScript, token usage, stories, accessibility) and fixes what it can automatically.

> Example: `/audit-component` → "Check the Badge component"

---

## Exploring design directions

### `/brainstorm-variants`

**Use when:** You're not sure which design direction to take for a component or flow.

Claude generates 3 meaningfully different alternatives with tradeoffs, then creates Storybook story stubs for each so you can document the options before committing to one.

> Example: `/brainstorm-variants` → "I want to improve the checkout CTA button for mobile"

---

### `/ab-variant`

**Use when:** You've chosen a direction and want to build an experimental variant alongside the production component.

The variant lives in `src/experiments/` and is never shipped until you explicitly promote it — safe to explore.

> Example: `/ab-variant` → "Create a pill-shaped variant of the Button for A/B testing"

---

## Building screens

### `/wireframe-to-component`

**Use when:** You have a layout or screen in mind and want to turn it into real code using the design system.

Describe the layout in plain language. Claude maps each section to existing components and builds the view. If something's missing from the design system, it flags the gap rather than inventing one-off code.

> Example: `/wireframe-to-component` → "Page with a header, 3 stat cards at the top, and a transaction list below"

---

## Managing your work

### `/create-pr`

**Use when:** You're done with a piece of work and want to open a Pull Request.

Claude checks for uncommitted changes, pushes your branch, creates the PR with the right template, then immediately starts monitoring CI.

---

### `/watch-pr`

**Use when:** A PR is open and you want to know if CI has passed.

Claude polls GitHub every 30 seconds. If CI passes, it tells you the PR is ready to review. If something fails, it reads the logs and fixes it. If there are merge conflicts, it resolves them.

---

### `/complete-feature`

**Use when:** You've finished a backlog feature and want to mark it as done.

Claude verifies the acceptance criteria are met, moves the feature file to `backlog/completed/`, updates the backlog index, and creates the completion commit.

> Example: `/complete-feature` → "F-004 is done"

---

## Environment setup

### `/setup-environment`

**Use when:** Setting up a new machine to work on this project.

Walks you through installing Volta, Node, pnpm, GitHub CLI, and verifying all hooks are working — step by step, tailored to your OS.

---

## Auditing AI rules

### `/rules-audit`

**Use when:** You've modified (or are about to modify) any of the AI-governing files — CLAUDE.md files, CONSTITUTION.md, decisions/, or .claude/commands/.

Claude reads every rule source, scores 8 quality criteria (Clarity, Completeness, Consistency, Actionability, Enforcement, Mission alignment, .claude/ coverage, Freshness) from 0–10, and produces a concrete improvement report for anything below 8. For mechanical issues (stale component table, orphaned command file), Claude offers to apply fixes automatically.

> Example: `/rules-audit` — run before opening a PR that touches any CLAUDE.md
