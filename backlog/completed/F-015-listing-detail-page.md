# F-015 — Listing detail page (`/listings/[id]`)

## Summary

The primary guest-facing page. Shows everything a guest needs to decide whether to book: photos, description, amenities, host info, availability calendar, and the full price breakdown. Leads to the booking flow.

## Acceptance criteria

- [x] Route `/listings/[id]` renders a real listing fetched from service layer
- [x] Photo gallery shows all listing photos with descriptive `alt` text
- [x] Property metadata shown: property type, city/country, bedrooms, bathrooms, max guests
- [x] Nightly rate shown as complete price (euros) — no hidden fees
- [x] Host card: name, avatar (or initials fallback), member-since date
- [x] Availability calendar shows blocked dates from `GET /api/listings/:id/availability`
- [x] "Request to book" CTA links to `/listings/[id]/book`
- [x] "Contact host" section renders with enquiry form
- [x] No urgency/scarcity copy anywhere on the page
- [x] 404 page shown if listing ID does not exist
- [x] Reviews section with aggregate rating and published reviews
- [x] `pnpm typecheck` and `pnpm lint` pass

## Dependencies

- F-016 (availability API) must be complete for the calendar to show blocked dates

---

## Completed

**Completed:** 2026-04-12
**Branch:** feature/F-016-core-booking-flow
**Notes:** Server Component at src/app/listings/[id]/page.tsx. AvailabilityCalendar client component with keyboard navigation and aria-disabled on blocked dates. ContactHostForm client component. Reviews section with aggregate rating. Two-month calendar highlighting blocked ranges.
