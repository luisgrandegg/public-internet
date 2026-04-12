# F-020 — Edit listing (touristical-renting)

## Summary

A flat pre-populated edit form at `/host/listings/[id]/edit` that lets a host update any of their listing's fields. Auth-guarded server component fetches the listing and verifies ownership; a Client Component form submits to the existing `PATCH /api/listings/:id` route via a Server Action.

## Route

`/host/listings/[id]/edit`

## Technical approach

- `EditListingPage` (Server Component): fetches listing via `getListingById`, checks session with `auth.api.getSession`, redirects to `/auth/signin` if unauthenticated, redirects to `/host` if not the listing's host
- `EditListingForm` (Client Component): single flat form (not a wizard), pre-populated with listing values
- `updateListing` Server Action: reads `_listingId` from a hidden form field, calls `PATCH /api/listings/:id` with JSON body, forwards session cookie, revalidates `/host` on success
- Nightly rate: displayed in euros (`nightlyRate / 100`), converted back to cents on submit
- `RadioGroup` DS component used for property type (controlled with `useState`)
- Native `<textarea>` and `<select>` used as fallbacks for DS components that require controlled state (see GAP comments)

## Acceptance criteria

- [x] Page redirects to `/auth/signin` when not authenticated
- [x] Page redirects to `/host` when authenticated but not the listing's host
- [x] Form pre-populated with current listing values
- [x] Price field label says "€ per night — this is the total price guests will see. No additional fees will be added."
- [x] On success, redirects to `/host`
- [x] Validation errors from API shown inline on relevant fields
- [x] `pnpm type-check` and `pnpm lint` pass (no new errors introduced)

## Design system gaps

- `Textarea`: DS Textarea requires controlled state — native `<textarea>` used with `defaultValue` for uncontrolled form submission
- `Select`: DS Select requires `onChange` handler — native `<select>` used with `defaultValue` for uncontrolled form submission

---

## Completed

**Completed:** 2026-04-12
**PR:** feature/F-020-edit-listing
**Commit:** (see branch HEAD)
**Audit:** pnpm type-check and lint pass (pre-existing design-system module resolution errors unrelated to F-020)
**Notes:** Auth guard in server component, ownership check before rendering form. updateListing action matches (state, formData) signature for useActionState compatibility; listing ID passed via hidden _listingId form field. GAP comments on Textarea and Select fallbacks.
