# F-024 — Home page real data (ADR-004 fix)

## Summary

The home page at `src/app/page.tsx` imports `MOCK_LISTINGS` for the featured listings section. This is an active ADR-004 violation. Replace with real data from the database using the same `getListings()` service the search page already uses.

## Acceptance criteria

- [ ] `src/app/page.tsx` no longer imports `MOCK_LISTINGS`
- [ ] Featured listings section fetches up to 4 real listings from the database (no filters, ordered by `createdAt` desc)
- [ ] If the database is empty, the featured section shows a graceful empty state ("Be the first to list your property")
- [ ] `pnpm typecheck` and `pnpm lint` pass

## Technical approach

- Convert `HomePage` to an `async` Server Component
- Call `getListings({ limit: 4 })` (already used in `src/app/listings/page.tsx`)
- Handle empty array: conditional render with a CTA to `/host/listings/new`
- Remove the `MOCK_LISTINGS` import entirely

## Dependencies

- Independent — `getListings()` service already exists
- Small fix; no schema or API changes needed

---

## Completed

**Completed:** 2026-04-12
**PR:** fix/F-024-home-page-real-data (pending)
**Commit:** (see branch HEAD)
**Audit:** npx tsc --noEmit passes with zero errors
**Notes:** Converted HomePage to async Server Component. Replaced MOCK_LISTINGS import with getListings({ page: 1, limit: 4 }) call. Normalised DB listings to Listing type using the same pattern as listings/page.tsx. Added empty state with CTA to /host/listings/new when no listings exist. Added .emptyState CSS class to page.module.css.
