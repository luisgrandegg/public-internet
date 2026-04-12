# F-005 — Home page (touristical-renting)

## Summary

The entry point of the platform. Gives guests a clear starting point to search for accommodation and explains the value proposition. Must not contain urgency copy or dark patterns.

## Sections

1. **Search hero** — `<form action="/listings" method="GET">` with location, check-in, check-out inputs and a submit button. GET form encodes search state directly in the URL.
2. **Featured listings** — static grid of 4 listing cards pulled from mock data.
3. **How it works** — 3 steps: "Search" → "Contact the host directly" → "Stay". No manufactured urgency.

## Acceptance criteria

- [x] Search form submits as GET to `/listings` with correct query params
- [x] No urgency/scarcity copy anywhere on the page
- [x] All images have descriptive `alt` text
- [x] Page is usable with keyboard only (tab order is logical)
- [x] `pnpm type-check` and `pnpm lint` pass

## Notes

- Uses only existing design system components: `Button`, `Input`, `Text`, `Card`, `Stack`, `Icon`
- `ListingCard` component is also used here (shared with `/listings`)
- Lives at `apps/touristical-renting/src/app/page.tsx`

## Status

Planned — not yet implemented.

---

## Completed

**Completed:** 2026-04-12
**PR:** feature/touristical-renting-bootstrap (pending)
**Commit:** (see branch HEAD)
**Audit:** pnpm type-check and lint pass
**Notes:** Server Component home page with GET search form, 4 featured ListingCards from mock data, and 3-step How it works section using Card. No urgency copy. All image alt text provided by ListingCard component.
