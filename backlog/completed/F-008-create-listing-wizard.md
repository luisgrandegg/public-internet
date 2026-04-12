# F-008 — Create listing wizard (touristical-renting)

## Summary

A 6-step wizard that guides a Host through creating a new Listing. In-memory draft state throughout; Server Action on final submit. Hosted at `/host/listings/new`.

## Steps

| # | Name | Key inputs | DS gaps |
|---|---|---|---|
| 0 | Property type | Radio-as-card grid (flat, house, room, studio) | `RadioGroup` |
| 1 | Location | City + country text `<Input>` fields | — |
| 2 | Description | Title `<Input>` + description `<textarea>` | `Textarea` |
| 3 | Photos | 3× photo URL `<Input type="url">` (MVP — no file upload yet) | `FileUpload` |
| 4 | Pricing | Nightly rate (€, total — no hidden fees), max guests, bedrooms, bathrooms | `Select` for guest count |
| 5 | Review | Read-only summary of all draft data + Publish button | — |

## Technical approach

- `CreateListingWizard` is a Client Component owning: `currentStep`, `draft: Partial<CreateListingDraft>`, `errors`
- `WizardProgress` renders an accessible `<ol>` with `aria-current="step"` on active step (inline stepper — no DS Stepper yet)
- PropertyTypeStep: visually hidden `<input type="radio">` inside `<label>` wrapping `<Card variant="bordered">` — radio-as-card pattern, keyboard-navigable
- PricingStep label copy: "€ per night — this is the total price guests will see. No additional fees will be added." (constitutionally required)
- PhotosStep: URL inputs for MVP; `FileUpload` component is a DS gap — flagged with comment
- Final submit calls `createListing` Server Action in `src/lib/actions/listings.ts`

## Acceptance criteria

- [x] All 6 steps navigate forward and back
- [x] Draft data persists across step navigation (in-memory)
- [x] Step progress indicator shows current step with `aria-current="step"`
- [x] Pricing step copy explicitly states "total price, no additional fees"
- [x] Property type step is fully keyboard-navigable (radio group semantics)
- [x] Final review step shows all entered data before submission
- [x] `pnpm type-check` and `pnpm lint` pass

## Design system gaps required

- `Textarea` (DescriptionStep)
- `Select` (PricingStep guest count)
- `RadioGroup` (PropertyTypeStep — currently inline radio-as-card)
- `FileUpload` (PhotosStep — currently URL inputs)
- `Stepper` (WizardProgress — currently inline `<ol>`)

## Status

Planned — not yet implemented.

---

## Completed

**Completed:** 2026-04-12
**PR:** feature/touristical-renting-bootstrap (pending)
**Commit:** (see branch HEAD)
**Audit:** pnpm type-check and lint pass
**Notes:** Full 6-step wizard at /host/listings/new. CreateListingWizard Client Component manages currentStep and draft state. WizardProgress uses accessible ol with aria-current="step" and ✓ for completed steps. PropertyTypeStep uses visually-hidden radio inputs with styled card labels. PricingStep label explicitly states total price. ReviewStep shows read-only draft summary before server action submit. All DS gaps flagged with GAP comments.
