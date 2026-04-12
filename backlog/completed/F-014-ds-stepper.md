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

- [x] Passes `/audit-component Stepper`
- [x] Renders as `<ol>` with one `<li>` per step
- [x] Current step has `aria-current="step"`
- [x] Completed steps have a visual checkmark and are distinguishable without colour alone
- [x] Upcoming steps are visually distinct from current and completed
- [x] Horizontal layout: steps in a row with connecting line
- [x] Vertical layout: steps stacked with connecting line
- [x] All states (pending, active, complete) meet WCAG AA contrast ratios
- [x] Storybook has ≥3 stories: step 1 of 4, middle step, final step
- [x] Axe accessibility test passes
- [x] Exported from `src/index.ts` barrel

## Needed by

F-008 (CreateListingWizard progress indicator)

---

## Completed

**Completed:** 2026-04-12
**PR:** [#4 — feat(design-system): add 6 DS components](https://github.com/luisgrandegg/public-internet/pull/4)
**Commit:** 2493b6d
**Audit:** All 5 checks pass — token audit, story completeness (4 stories), axe test, barrel export, CSS Modules only
**Notes:** Connecting lines via CSS `::after` pseudo-elements. Checkmark is an inline SVG (shape distinction, not colour alone). `aria-label="Progress"` on the `<ol>`.
