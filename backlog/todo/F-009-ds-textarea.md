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

- [ ] Passes `/audit-component Textarea` (all 5 automated checks)
- [ ] `label` renders a `<label>` associated via `id`
- [ ] `error` renders below the textarea with `aria-describedby` wiring
- [ ] `aria-invalid` set when `error` is present
- [ ] Styling uses only `var(--ds-*)` tokens — no hardcoded values
- [ ] Storybook has ≥3 stories: default, with label, error state
- [ ] Axe accessibility test passes
- [ ] Exported from `src/index.ts` barrel

## Needed by

F-008 (DescriptionStep in create listing wizard)

## Status

Planned — gap identified during F-008 planning.
