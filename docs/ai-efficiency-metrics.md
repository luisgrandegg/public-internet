# AI Efficiency Metrics — Proposal

**Status:** Proposal (not yet accepted — see ADR-003 for how proposals graduate to ADRs)
**Date:** 2026-04-19
**Branch:** `claude/ai-efficiency-metrics-L1Vsw`

---

## Why measure AI efficiency

This monorepo is a proof-of-concept for an AI-assisted design-to-code pipeline (designers + Claude Code → production React). The system already has strong **correctness** gates: CI (`pnpm build`/`lint`/`type-check`/`test`/`test:e2e`), `/audit-component`, `/ai-audit`, `/rules-audit`, and the rules in [`CONSTITUTION.md`](../CONSTITUTION.md) and [`CLAUDE.md`](../CLAUDE.md). Those gates tell us whether a PR is safe to merge. They do **not** tell us:

- Are we shipping more features per week than last month?
- Is the rate of constitution violations on first-pass AI output going down?
- Is the AI getting better at avoiding design-system violations as the rules mature?
- How much rework do we do per feature?

This document proposes a four-tier framework to measure those things using signals the repo already produces. **It does not implement anything** — it is a design artefact intended to anchor follow-up PRs.

Rule adherence (Tier 1) is the primary dimension, in line with §1, §5, §6, §7 of [`CONSTITUTION.md`](../CONSTITUTION.md): the constitution exists precisely to constrain AI output, so the most important efficiency metric is whether AI output respects it on the first try.

---

## Signals the repo already emits

| Signal | Where it lives | What it tells us |
|---|---|---|
| CI gate results | `.github/workflows/ci.yml` (`build`, `lint`, `typecheck`, `test`, `e2e`) | Pass/fail per commit and per PR |
| Unit coverage | `packages/design-system/coverage/` (uploaded as artifact, retention 7d) | Coverage % per package, ≥70% threshold |
| Playwright report | `apps/touristical-renting/playwright-report/` (uploaded on failure) | E2E results |
| `/ai-audit` output | Stdout: GROUP 1 (constitution), GROUP 2 (design system), GROUP 3 (app composition), GROUP 4 (lifecycle gates) | Per-PR rule adherence |
| `/audit-component` output | 5 automated checks + manual gates per DS component | Per-component quality |
| `/rules-audit` output | 8-criterion score (C1 Clarity, C2 Completeness, C3 Consistency, C4 Actionability, C5 Enforcement, C6 Mission alignment, C7 `.claude/` coverage, C8 Freshness) | Quality of the rules themselves |
| Backlog completion records | `backlog/completed/F-XXX-*.md` with `Completed:`, `PR:`, `Commit:`, `Audit:`, `Notes:` fields | Per-feature completion timestamp |
| Git history | `git log main..<branch>`, branch reflog, GitHub PR metadata | Commit count, branch lifetime, CI wall time |

Notably **absent**: a `Started:` field on backlog items, machine-readable audit output, any persisted history of audit scores or coverage trends.

---

## Tier 1 — Rule adherence (primary)

These metrics measure how often AI output respects the rules without needing human intervention. Sources are existing audit groups so no new infrastructure is required to compute them.

| Metric | Definition | Source | Target |
|---|---|---|---|
| **Constitution compliance rate** | % of merged PRs where `/ai-audit` GROUP 1 (Value direction, Exit freedom, Public governance, Federation safety, Worker compliance, No dark patterns, Platform scope) returns all ✅ on first run | `/ai-audit --pr` per PR | 100% on merge; ≥80% on first run |
| **Design-system violation density** | Count of GROUP 2 ❌ FAIL items (hardcoded hex/px/font-weight, inline styles, Tailwind classes, `console.log`) per 1k LOC added | `/ai-audit` GROUP 2 + `git diff --shortstat` | 0 on merge; trending down on first run |
| **`any` type drift** | Count of `:\s*any\b` and `as any` introduced per PR | `/ai-audit` GROUP 2 ⚠️ WARN (`any` types) | 0 net new |
| **Composition-rule fidelity** | Count of GROUP 3 ❌ FAIL items (relative cross-package imports, one-off DS wrappers without GAP comments) per PR | `/ai-audit` GROUP 3 | 0 |
| **Full-stack rule violations** | PRs that ship `{ ok: true }` stubs, `MOCK_*` arrays in production paths, or skip a Prisma migration for new data | Code review against [ADR-004](../decisions/ADR-004-full-stack-rest-api.md); confirmed by `/ai-audit` reviewer | 0 |
| **E2E constitutional coverage** | % of app feature spec files (`apps/*/e2e/**/*.spec.ts`) that assert at least one constitutional constraint (no urgency copy, no pre-checked consent, no late-fee reveal, complete pricing before commit) | grep over spec files | 100% of specs covering user flows |
| **Gap-flagging precision** | Ratio of gaps flagged by AI (`// GAP:` or `{/* GAP: */}` comments) to gaps caught later in review | `git grep "GAP:"` + PR review comments mentioning a missing component | ≥0.8 |

These map directly to existing `/ai-audit` output, so a future `/ai-audit --json` flag would make them trivially aggregable across PRs.

---

## Tier 2 — Output quality

How often AI output passes the gates without rework, and how the audit scores trend.

| Metric | Definition | Source |
|---|---|---|
| **First-time CI pass rate** | % of PRs whose initial push passes all five CI jobs (build, lint, typecheck, test, e2e) | GitHub Actions run history |
| **Rework ratio** | (Commits pushed after the first failed CI run) / (total commits on the branch) | `git log main..<branch>` cross-referenced with Actions history |
| **Unit coverage trend** | Coverage % from `pnpm --filter @public-internet/design-system test:coverage` over time, per package | CI `coverage` artifact (retention 7d — extend or persist for longer windows) |
| **`/audit-component` first-pass rate** | % of new DS components passing all 5 automated checks (token audit, story completeness, axe test presence, barrel export, CSS modules only) on first run | `/audit-component` output |
| **`/rules-audit` overall score** | Sum of C1–C8 (max 80) over time; per-PR delta when AI rules change | `/rules-audit` output |
| **Backlog audit-note quality** | % of `backlog/completed/*.md` files whose `Audit:` field cites at least one CI gate (typecheck, lint, build, test) | grep over `backlog/completed/` |

---

## Tier 3 — Throughput & velocity

How fast features move through the pipeline.

| Metric | Definition | Source |
|---|---|---|
| **Cycle time** | Hours from branch creation (first commit on the branch) to PR merge | `git log --reverse <branch>` first-commit timestamp + GitHub PR `merged_at` |
| **Feature throughput** | Backlog items completed per week (rolling 4-week window) | Files in `backlog/completed/` grouped by `Completed:` date |
| **Commits per feature** | Average commit count between branch and merge | `git log main..<branch>` count |
| **CI wall time** | P50 / P95 duration of full CI runs | GitHub Actions run metadata |
| **First-commit latency** | Hours from a backlog item being picked up to the first commit on its branch | Requires new `Started:` field on `backlog/todo/` items (see Gaps) |

The `Started:` gap means cycle time is currently approximated by branch-creation time. Adding `Started:` to the backlog schema is listed under Next Steps.

---

## Tier 4 — Cost & token usage

Out of scope for the first implementation pass — Claude Code does not yet expose per-session token telemetry to the repo. Documented here so the framework is complete and so reviewers see the intended shape.

Proposed metrics (to wire up when telemetry is available):

- **Tokens per completed backlog item** — total input + output tokens spent across all sessions on a feature, divided into prompt vs. completion vs. cached.
- **Cache hit rate per session** — share of input tokens served from prompt cache. Higher is better; this is the primary lever for cost control on large CLAUDE.md context (see ADR-003).
- **Sessions per feature** — how many distinct Claude Code sessions a feature took to complete. Lower indicates better single-session task completion.
- **Token spend per merged PR** — total cost divided by merged PRs as a rough efficiency yardstick.

---

## Composite "AI Efficiency Score" (AIES)

A single weighted number to track on the project dashboard:

```
AIES = 0.40 × T1_RuleAdherence
     + 0.30 × T2_OutputQuality
     + 0.20 × T3_Throughput
     + 0.10 × T4_Cost
```

Each tier normalises to 0–1 by averaging its metrics against their targets. Tier 4 contributes 0 until cost telemetry is wired; the remaining weights re-normalise to keep AIES on a 0–1 scale.

Rule adherence is weighted highest because:
- Constitution breaches are the most expensive to unwind once shipped.
- Adherence is the most direct measure of whether the AI rules are working.
- The other tiers are means to the end of producing constitutionally-aligned software, not ends in themselves.

---

## Data-collection gaps to close

The metrics above are computable today **except** for the items below. Each is a small, scoped change that should land in its own follow-up PR.

1. **Backlog `Started:` field.** Add `Started:` (date) to `backlog/todo/*.md` files alongside the existing `Completed:` field that backlog/completed entries already carry. Update `/tackle-backlog` to set it when an agent picks up a feature. Without this, cycle time is approximated by branch-creation timestamp.
2. **Machine-readable `/ai-audit` output.** Add `--json` flag to `/ai-audit` that emits a structured result `{ group: 1, check: "Value direction", status: "PASS"|"FAIL"|"WARN", evidence: [...] }`. Aggregating compliance-rate metrics by hand is impractical; a JSON sidecar makes a script trivial.
3. **Persistence layer.** Audit and coverage results currently live only in CI artifacts (7-day retention) and Claude Code stdout (ephemeral). A follow-up should decide between (a) committing a `metrics/` directory of JSON snapshots per merged PR, (b) emitting to a separate metrics repo, or (c) using GitHub Actions cache + a scheduled rollup job. Recommendation: start with (a) for simplicity and federation-friendliness — a public entity operating this codebase can read the metrics without external services, in line with [`CONSTITUTION.md`](../CONSTITUTION.md) §3.

---

## Next steps

This proposal does not implement any of the below. Each is a candidate follow-up PR.

| # | Change | Estimated size |
|---|---|---|
| 1 | Add `Started:` field to backlog schema; update `/tackle-backlog` to populate it | Small |
| 2 | `/ai-audit --json` flag emitting structured results | Small |
| 3 | New `/ai-efficiency` slash command that produces a Markdown report from git log + `backlog/completed/` + CI artifacts | Medium |
| 4 | Snapshot JSON metrics into `metrics/<yyyy-mm-dd>-<sha>.json` on each merge to `main` | Small (Action) |
| 5 | CI job posting AIES delta as a PR comment | Small |
| 6 | When Claude Code exposes session telemetry, wire Tier 4 metrics | Deferred |

If this framework is accepted after team review, it should graduate into an ADR (per [ADR-003](../decisions/ADR-003-claude-md-context-files.md), architectural choices live as ADRs in `decisions/`).

---

## Out of scope for this proposal

- No code, schema, slash command, or workflow changes — this branch ships only this document.
- No Tier 4 implementation — deferred until per-session telemetry is available.
- No ADR — this is a proposal under discussion, not an accepted decision. A separate PR will create the ADR if approved.
- No metric for "developer satisfaction" or other survey-based measures — those are valuable but require a different collection mechanism than this framework.
