# F-004 — /ai-audit skill (PR code review)

## Summary

A slash command that audits AI-generated code in a PR or diff against all project rules. Companion to `/rules-audit`, which audits the rules themselves — this one audits the *code* produced under those rules.

## Invocation

```
/ai-audit              # current git diff (staged + unstaged)
/ai-audit <path>       # specific file or directory
/ai-audit --pr         # all changes in the current branch vs. main
```

## Check groups

**GROUP 1 — Constitution (judgment):**
- Does this feature extract value or deliver it?
- Does it make leaving harder or easier?
- Could a public entity govern this without a private intermediary?
- Is the data schema federation-safe (exportable, no vendor lock-in)?
- Are worker-facing features compliant (transparent pay, appeal path, no easy deactivation without appeal)?
- No dark patterns in UI or copy (urgency language, pre-ticked boxes, hidden fees)
- Is the scope within the Platform Registry?

**GROUP 2 — Design system (automated grep):**
- Hardcoded hex colors, px font sizes, or raw font weights in `.module.css`
- Inline `style={{` props in component `.tsx` files
- Tailwind utility classes in any component file
- `any` types in TypeScript
- `console.log` statements

**GROUP 3 — App composition (automated grep):**
- Relative cross-package imports (e.g., `../../packages/design-system`)
- One-off component wrappers (components defined in `apps/` that duplicate design system components)
- Design system gaps not flagged with a `// GAP:` comment

**GROUP 4 — Lifecycle gates:**
- `pnpm type-check` — zero TypeScript errors
- `pnpm lint` — zero ESLint errors
- `pnpm build` — all packages build cleanly
- `pnpm --filter @public-internet/design-system test:coverage` — zero failures, ≥70% coverage

## Report format

Same structure as `/rules-audit`:
- ✅ PASS / ❌ FAIL / ⚠️ WARN per check, grouped by group
- Auto-fix offered for: `console.log` removal (GROUP 2), lifecycle gate errors (GROUP 4)
- All ❌ FAIL items must be resolved before a PR can be opened

## Status

Planned — not yet implemented.

Created as part of the `/rules-audit` PR (the original `/ai-audit` concept was split: rules audit → `/rules-audit`, code audit → this file).

---

## Completed

**Completed:** 2026-04-12
**PR:** feature/F-004-ai-audit-skill (pending)
**Commit:** 9acf9d7
**Audit:** N/A — command file only, no components
**Notes:** Full instruction set covering all 4 check groups. Auto-fix offered for console.log removal and lifecycle gate failures. Report format mirrors /rules-audit for consistency.
