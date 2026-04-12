# F-014 — DS: Stepper component

## Summary

A `Stepper` component for visualising progress through a multi-step flow. Used by the create listing wizard and any future multi-step flows (booking, onboarding). Renders as an accessible `<ol>` with step labels and visual state.

## Props interface (proposed)

```tsx
export interface StepperStep {
  label: string
  description?: string
}

export interface StepperProps {
  steps: StepperStep[]
  currentStep: number     // 0-indexed
  orientation?: 'horizontal' | 'vertical'
}
```

## Acceptance criteria

- [ ] Passes `/audit-component Stepper`
- [ ] Renders as `<ol>` with one `<li>` per step
- [ ] Current step has `aria-current="step"`
- [ ] Completed steps have a visual checkmark and are distinguishable without colour alone
- [ ] Upcoming steps are visually distinct from current and completed
- [ ] Horizontal layout: steps in a row with connecting line
- [ ] Vertical layout: steps stacked with connecting line
- [ ] All states (pending, active, complete) meet WCAG AA contrast ratios
- [ ] Storybook has ≥3 stories: step 1 of 4, middle step, final step
- [ ] Axe accessibility test passes
- [ ] Exported from `src/index.ts` barrel

## Needed by

F-008 (CreateListingWizard progress indicator)

## Status

Planned — gap identified during F-008 planning.
