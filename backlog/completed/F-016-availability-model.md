# F-016 — Availability model & double-booking prevention

## Summary

The current `Booking` model stores check-in/check-out dates but has no mechanism to block already-booked dates or prevent overlapping bookings. This feature adds the availability layer required by the listing detail page (F-015) and booking flow (F-017).

## Acceptance criteria

- [x] `POST /api/bookings` rejects a new booking if its dates overlap any existing confirmed booking for the same listing (HTTP 409 Conflict)
- [x] New API endpoint `GET /api/listings/:id/availability` returns an array of blocked date ranges `{ start: string; end: string }[]` (ISO 8601 dates)
- [x] Blocked ranges include: confirmed bookings + optional host-blocked dates
- [x] New Prisma model `AvailabilityBlock` for host-managed blackout dates (maintenance, personal use)
- [x] Migration committed to `prisma/migrations/`
- [x] OpenAPI `@swagger` annotation on the new endpoint
- [x] SDK regenerated after spec update
- [x] `pnpm typecheck` and `pnpm lint` pass

## Dependencies

None — this is a foundational feature that unblocks F-015 and F-017.

---

## Completed

**Completed:** 2026-04-12
**Branch:** feature/F-016-core-booking-flow
**Notes:** AvailabilityBlock Prisma model added. Double-booking prevention added to createBooking service (409 on overlap). GET /api/listings/:id/availability endpoint returns merged blocked ranges from Booking and AvailabilityBlock tables. OpenAPI spec and SDK regenerated.
