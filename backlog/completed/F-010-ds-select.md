# F-010 — DS: Select component

## Summary

A design-system-level `Select` component (dropdown) following the same conventions as `Input`. Wraps native `<select>` for accessibility and progressive enhancement.

## Props interface (proposed)

```tsx
export interface SelectOption {
  value: string
  label: string
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: SelectOption[]
}
```

## Acceptance criteria

- [x] Passes `/audit-component Select` (all 5 automated checks)
- [x] `label` renders an associated `<label>`
- [x] `error` renders with `aria-describedby` wiring
- [x] `options` renders as `<option>` elements inside `<select>`
- [x] Keyboard-navigable (native `<select>` behaviour preserved)
- [x] Styling uses only `var(--ds-*)` tokens
- [x] Storybook has ≥3 stories: default, with label, error state, disabled
- [x] Axe accessibility test passes
- [x] Exported from `src/index.ts` barrel

## Needed by

F-007 (FiltersSidebar), F-008 (PricingStep guest count)

---

## Completed

**Completed:** 2026-04-12
**PR:** [#4 — feat(design-system): add 6 DS components](https://github.com/luisgrandegg/public-internet/pull/4)
**Commit:** 2493b6d
**Audit:** All 5 checks pass — token audit, story completeness (4 stories), axe test, barrel export, CSS Modules only
**Notes:** `onChange` adapted from native event to string value. Custom SVG chevron via `background-image` data URI. `placeholder` renders as a disabled empty option.
