## Summary

<!-- What does this PR do? 1–3 bullets. -->

-

## Type of change

- [ ] New component
- [ ] Component update
- [ ] Bug fix
- [ ] Chore / tooling
- [ ] Docs / context files

## Test plan

<!-- How was this tested? -->

- [ ] `pnpm build` passes
- [ ] `pnpm lint` passes
- [ ] `pnpm type-check` passes
- [ ] `pnpm --filter @public-internet/design-system test:coverage` passes (≥70% coverage)

## Design system checklist

<!-- Complete for any new or modified component. -->

- [ ] `/audit-component <ComponentName>` run — all ❌ FAIL items resolved
- [ ] CSS uses only `var(--ds-*)` tokens — no hardcoded hex or px values
- [ ] `.stories.tsx` has ≥3 named story exports
- [ ] `.test.tsx` includes an `axe` accessibility test
- [ ] Component exported from `src/components/index.ts`
- [ ] Changeset added (`pnpm changeset`) if `packages/design-system` was modified
