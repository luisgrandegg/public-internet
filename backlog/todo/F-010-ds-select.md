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

- [ ] Passes `/audit-component Select` (all 5 automated checks)
- [ ] `label` renders an associated `<label>`
- [ ] `error` renders with `aria-describedby` wiring
- [ ] `options` renders as `<option>` elements inside `<select>`
- [ ] Keyboard-navigable (native `<select>` behaviour preserved)
- [ ] Styling uses only `var(--ds-*)` tokens
- [ ] Storybook has ≥3 stories: default, with label, error state, disabled
- [ ] Axe accessibility test passes
- [ ] Exported from `src/index.ts` barrel

## Needed by

F-007 (FiltersSidebar), F-008 (PricingStep guest count)

## Status

Planned — gap identified during F-007 and F-008 planning.
