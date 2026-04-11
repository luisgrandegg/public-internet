# ADR-002 — Experiments Isolated in src/experiments/ vs. Runtime Feature Flags

**Status:** Accepted
**Date:** 2026-04-11

## Context

The design system needs to support A/B variant exploration — designers should be able to create experimental versions of components (e.g. a pill-shaped button, a card with a new shadow) and preview them in Storybook without those variants ever shipping to production.

The core tension is:
- Designers need creative freedom to experiment without fear
- Production apps must never accidentally import an experimental component
- The mechanism for isolation must have zero infrastructure dependencies (this is a POC, not a live product)
- Claude Code must know which components are safe to auto-generate and which are experiments

## Decision

Experimental components live in `packages/design-system/src/experiments/` and are **never exported from `index.ts`**. The barrel export is the enforcement mechanism: apps that import from `@public-internet/design-system` cannot reach experiment files because they are not in the public API. Storybook, which scans the full `src/` tree, can still discover and render experiment stories.

Each experiment story must include a hypothesis, a description of what changed, and a status field (Testing / Validated / Abandoned) in its Storybook docs block.

## Alternatives Considered

**LaunchDarkly or a similar feature flag service**
- Rejected because it introduces an external SaaS dependency, requires API keys, and adds SDK overhead to the bundle. For a POC with no live users, this is significant infrastructure for zero benefit.

**Environment-variable feature flags (`NEXT_PUBLIC_ENABLE_PILL_BUTTON=true`)**
- Rejected because it requires the experimental component to be imported into production code — the flag only controls rendering, not bundling. A mistake in the flag logic could expose an experimental component to all users. It also creates flag debt.

**Runtime A/B frameworks (e.g. Optimizely, Split.io)**
- Rejected for the same reasons as LaunchDarkly, with the added downside that these frameworks typically require wrapping components in provider HOCs, complicating the component API and Storybook setup.

**A separate `experiments` package in the monorepo**
- A reasonable alternative. Rejected in favor of a directory within the existing package because the overhead of a new `package.json`, workspace entry, and build config is disproportionate to the need.

## Consequences

**Positive:**
- Zero infrastructure dependency — no flags service, no API keys, no SDK
- Production apps are structurally incapable of importing experiments (barrel export enforcement)
- No flag debt accumulates — when an experiment is abandoned, delete the directory
- Designers can freely create variants in Storybook without coordinating with engineering
- Claude Code can be instructed to never import from `src/experiments/` in application code

**Negative:**
- Cannot A/B test experiments against real production traffic — this solution is design-preview only
- Enforcement relies on discipline (not importing from internals) rather than a hard module boundary
- Experiment lifecycle is tracked only in Storybook docs, not in a structured system
- If the project evolves to need real A/B testing in production, this ADR will need to be superseded by a runtime flag solution
