# ADR-003 — CLAUDE.md Context Files over MCP Server or System Prompt

**Status:** Accepted
**Date:** 2026-04-11

## Context

Claude Code needs project-specific knowledge to generate consistent, convention-following output across sessions. Without persistent context, every session risks:

- Inventing hex values instead of using design tokens
- Creating components outside the established folder structure
- Importing from wrong paths
- Missing lifecycle gate requirements (stories, tests, axe checks)

The project is designed for non-engineer UX designers. The context injection mechanism must:
- Work out of the box with any Claude Code installation
- Be readable and editable by designers without developer tooling
- Be versioned alongside the code it describes
- Not require external services, authentication, or infrastructure
- Scale to directory-level scoping (different rules for `packages/design-system/` vs `apps/`)

## Decision

Use **CLAUDE.md files** at each directory level that needs scoped context. Claude Code automatically reads `CLAUDE.md` at session start and when entering a directory. The file hierarchy mirrors the monorepo:

- `CLAUDE.md` (repo root) — project overview, dev lifecycle, backlog workflow, shell rules
- `packages/design-system/CLAUDE.md` — tokens, component conventions, Storybook patterns, test rules
- `apps/CLAUDE.md` — import rules, composition patterns, gap flagging convention

Each file is Markdown, versioned in git, and readable by anyone.

## Alternatives Considered

**Custom MCP (Model Context Protocol) server**
- Would allow querying design tokens programmatically, searching component APIs, and returning structured data. Rejected because it requires running a local server process, maintaining server code, and configuring Claude Code to connect to it. For a POC targeting designers, this is significant infrastructure overhead.

**Single global system prompt (injected via Claude API or settings)**
- A system prompt is not visible in the repository, not versioned with the code, and cannot vary by directory. A designer modifying component conventions would need to update the system prompt separately from the code — the two would drift.

**VSCode workspace settings (`.vscode/settings.json`)**
- Editor-specific and not read by Claude Code. Would lock the workflow to VSCode and exclude designers using other editors or the Claude Code web interface.

**Comments in source files**
- Too scattered. A designer would need to read dozens of files to reconstruct the conventions that CLAUDE.md summarizes in one place. Comments cannot provide cross-cutting rules.

## Consequences

**Positive:**
- Zero infrastructure dependency — no server, no API key, no configuration beyond the file itself
- Works with any Claude Code installation out of the box
- Versioned in git — convention changes are tracked with the code changes they affect
- Designers can read and edit CLAUDE.md without developer tooling
- Directory-level scoping means design system sessions get token/component rules without loading app-level rules
- Human-readable: a new engineer onboarding can read CLAUDE.md as documentation

**Negative:**
- Context must be maintained manually — when conventions evolve, CLAUDE.md must be updated separately from the code
- CLAUDE.md can drift from reality if not kept in sync
- No structured querying — Claude Code reads the file as prose, not as a machine-readable schema
- Large CLAUDE.md files can push toward the context window limit in long sessions
- No programmatic enforcement — CLAUDE.md is advisory; Claude Code can still deviate if the instructions conflict with a user prompt
