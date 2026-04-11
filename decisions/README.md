# Architecture Decision Records

This directory contains Architecture Decision Records (ADRs) for the public-internet monorepo.

---

## What is an ADR?

An Architecture Decision Record documents a significant architectural choice made during the life of the project. It captures:

- **What** was decided
- **Why** it was decided (context and forces at play)
- **What alternatives** were considered and ruled out
- **What consequences** — positive and negative — follow from the decision

ADRs are written once and never deleted. If a decision is reversed, the old ADR is marked "Superseded" and a new ADR is written explaining the new direction.

---

## Why This Project Uses ADRs

This repo is designed to be maintained partly by Claude Code and partly by designers who are not full-time engineers. Without documented reasoning, architectural constraints are invisible — every new session risks accidentally undoing a considered decision.

ADRs solve this by making intent explicit and durable. They live in version control alongside the code they govern.

---

## ADR Format (Nygard-style)

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

## Index

| ADR | Title | Status |
| --- | ----- | ------ |
| [ADR-001](./ADR-001-css-modules-over-tailwind.md) | CSS Modules over Tailwind/CSS-in-JS | Accepted |
| [ADR-002](./ADR-002-static-experiment-isolation.md) | Experiments isolated in src/experiments/ vs. runtime feature flags | Accepted |
| [ADR-003](./ADR-003-claude-md-context-files.md) | CLAUDE.md context files over MCP server or system prompt | Accepted |

---

## How to Write a New ADR

1. Pick the next number in sequence (e.g. `ADR-004`).
2. Create `decisions/ADR-004-short-title.md` using the format above.
3. Set **Status: Accepted** if it is a current decision, or **Status: Proposed** if it is under discussion.
4. Add a row to the index table in this README.
5. If it supersedes an existing ADR, update that ADR's status line to read `Superseded by ADR-004`.
6. Commit with message `docs(decisions): add ADR-004 — <title>`.

## How to Supersede an ADR

Never delete an old ADR. Instead:

1. Open the old ADR and change its `**Status:**` line to `Superseded by ADR-00X`.
2. Write the new ADR referencing the old one in its Context section.
3. Update the index table in this README.
