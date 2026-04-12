# F-012 — DS: RadioGroup component

## Summary

A `RadioGroup` component that wraps a set of mutually exclusive radio options in a `<fieldset>` + `<legend>`. Used for property type selection in the create listing wizard and any future exclusive-choice UI.

## Props interface (proposed)

```tsx
export interface RadioGroupProps {
  legend: string
  name: string
  options: Array<{ value: string; label: string; description?: string }>
  value: string
  onChange: (value: string) => void
  error?: string
  layout?: 'vertical' | 'grid'    // grid for card-style selection
}
```

## Acceptance criteria

- [x] Passes `/audit-component RadioGroup`
- [x] Renders `<fieldset>` + `<legend>` (required for screen reader grouping of radio inputs)
- [x] Native `<input type="radio">` semantics preserved (arrow-key navigation between options)
- [x] `layout="grid"` renders a card-style grid suitable for property type selection
- [x] Focus ring visible on keyboard navigation
- [x] Axe accessibility test passes
- [x] Storybook has ≥3 stories: vertical list, grid layout, with error
- [x] Exported from `src/index.ts` barrel

## Needed by

F-008 (PropertyTypeStep in create listing wizard)

---

## Completed

**Completed:** 2026-04-12
**PR:** [#4 — feat(design-system): add 6 DS components](https://github.com/luisgrandegg/public-internet/pull/4)
**Commit:** 2493b6d
**Audit:** All 5 checks pass — token audit, story completeness (3 stories), axe test, barrel export, CSS Modules only
**Notes:** Vertical layout uses radio indicator circle (CSS sibling selector). Grid layout uses card-style labels with border highlighting on selection. Arrow-key navigation works natively via shared `name` attribute.
