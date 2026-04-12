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

- [ ] Passes `/audit-component RadioGroup`
- [ ] Renders `<fieldset>` + `<legend>` (required for screen reader grouping of radio inputs)
- [ ] Native `<input type="radio">` semantics preserved (arrow-key navigation between options)
- [ ] `layout="grid"` renders a card-style grid suitable for property type selection
- [ ] Focus ring visible on keyboard navigation
- [ ] Axe accessibility test passes
- [ ] Storybook has ≥3 stories: vertical list, grid layout, with error
- [ ] Exported from `src/index.ts` barrel

## Needed by

F-008 (PropertyTypeStep in create listing wizard)

## Status

Planned — gap identified during F-008 planning.
