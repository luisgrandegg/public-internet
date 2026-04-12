# F-011 — DS: Checkbox and CheckboxGroup components

## Summary

Two components: a single `Checkbox` and a `CheckboxGroup` for multiple related checkboxes. Both follow DS conventions — CSS Modules, design tokens, accessible by default.

## Props interfaces (proposed)

```tsx
export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string       // always required — no unlabelled checkboxes
  error?: string
}

export interface CheckboxGroupProps {
  legend: string      // renders a <fieldset> + <legend>
  options: Array<{ value: string; label: string }>
  value: string[]
  onChange: (value: string[]) => void
  error?: string
}
```

## Acceptance criteria

- [x] `Checkbox` passes `/audit-component Checkbox`
- [x] `CheckboxGroup` passes `/audit-component CheckboxGroup`
- [x] `Checkbox` uses visually hidden native `<input type="checkbox">` — custom styling via CSS, native semantics preserved
- [x] `CheckboxGroup` renders `<fieldset>` + `<legend>` for screen reader grouping
- [x] No checkbox is ever pre-selected by default (constitution: no dark patterns)
- [x] Focus ring visible on keyboard navigation
- [x] Axe accessibility tests pass for both
- [x] Exported from `src/index.ts` barrel

## Needed by

F-006 (sign up host toggle), F-007 (FiltersSidebar amenities filter)

---

## Completed

**Completed:** 2026-04-12
**PR:** [#4 — feat(design-system): add 6 DS components](https://github.com/luisgrandegg/public-internet/pull/4)
**Commit:** 2493b6d
**Audit:** All 5 checks pass — token audit, story completeness (6 stories), axe test, barrel export, CSS Modules only
**Notes:** CSS checkmark via `background-image` data URI. `CheckboxGroup.onChange` receives updated string[] array. 22 tests covering both components.
