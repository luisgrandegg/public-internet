# F-020 — Edit listing (`/host/listings/[id]/edit`)

## Summary

Hosts need to update their listings after creation. The `PATCH /api/listings/:id` route already exists. This feature builds the edit UI — a pre-populated form matching the create wizard fields.

## Acceptance criteria

- [ ] Route `/host/listings/[id]/edit` renders a form pre-populated with the listing's current data
- [ ] Fields: title, description, property type, city, country, nightly rate (€), max guests, bedrooms, bathrooms
- [ ] Submitting calls `PATCH /api/listings/:id` via a Server Action
- [ ] On success, redirect to `/host` with a success message
- [ ] Only the listing's own host can access this page; 403 if another user accesses it
- [ ] Unauthenticated users redirected to `/auth/signin`
- [ ] Validation errors from the API shown inline on the relevant fields
- [ ] `pnpm typecheck` and `pnpm lint` pass

## Technical approach

- Server Component wrapper (fetches existing listing data) + Client Component form
- Reuse field structure from `CreateListingWizard` but as a single flat form (no stepper)
- Server Action in `src/lib/actions/listings.ts` — `updateListing(id, formData)` — calls `PATCH /api/listings/:id`
- Auth check: compare session userId with listing.hostId server-side

## Dependencies

- `PATCH /api/listings/:id` route already exists
- Independent of the core booking flow (F-015–F-018)
