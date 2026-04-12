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

- [ ] `Checkbox` passes `/audit-component Checkbox`
- [ ] `CheckboxGroup` passes `/audit-component CheckboxGroup`
- [ ] `Checkbox` uses visually hidden native `<input type="checkbox">` — custom styling via CSS, native semantics preserved
- [ ] `CheckboxGroup` renders `<fieldset>` + `<legend>` for screen reader grouping
- [ ] No checkbox is ever pre-selected by default (constitution: no dark patterns)
- [ ] Focus ring visible on keyboard navigation
- [ ] Axe accessibility tests pass for both
- [ ] Exported from `src/index.ts` barrel

## Needed by

F-006 (sign up host toggle), F-007 (FiltersSidebar amenities filter)

## Status

Planned — gap identified during F-006 and F-007 planning.
