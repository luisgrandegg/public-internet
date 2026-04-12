# F-009 — DS: Textarea component

## Summary

A design-system-level `Textarea` component following the same conventions as `Input` — named props interface, `label`, `error`, `aria-describedby` wiring, CSS Modules, design tokens only.

## Props interface (proposed)

```tsx
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}
```

## Acceptance criteria

- [x] Passes `/audit-component Textarea` (all 5 automated checks)
- [x] `label` renders a `<label>` associated via `id`
- [x] `error` renders below the textarea with `aria-describedby` wiring
- [x] `aria-invalid` set when `error` is present
- [x] Styling uses only `var(--ds-*)` tokens — no hardcoded values
- [x] Storybook has ≥3 stories: default, with label, error state
- [x] Axe accessibility test passes
- [x] Exported from `src/index.ts` barrel

## Needed by

F-008 (DescriptionStep in create listing wizard)

---

## Completed

**Completed:** 2026-04-12
**PR:** [#4 — feat(design-system): add 6 DS components](https://github.com/luisgrandegg/public-internet/pull/4)
**Commit:** 2493b6d
**Audit:** All 5 checks pass — token audit, story completeness (4 stories), axe test, barrel export, CSS Modules only
