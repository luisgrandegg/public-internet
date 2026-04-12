# F-017 — Booking flow (`/listings/[id]/book`)

## Summary

The guest confirmation flow. Guest selects or confirms dates, sees the full price breakdown, and submits a booking.

## Acceptance criteria

- [x] Route `/listings/[id]/book` renders a booking confirmation page
- [x] Check-in and check-out dates are pre-filled from query params and editable
- [x] Date validation: check-out must be after check-in; selected dates must not overlap blocked ranges
- [x] Price summary shown before confirmation: nightly rate × nights, total in euros
- [x] No fees revealed at this step that were not visible on listing detail page
- [x] "Confirm booking" calls `POST /api/bookings`; on success redirects to `/bookings/[id]`
- [x] On 409 (dates unavailable) show a clear error message — no urgency framing
- [x] Unauthenticated guests are redirected to `/auth/signin` with a return URL
- [x] `pnpm typecheck` and `pnpm lint` pass

## Dependencies

- F-016 (availability model)
- F-015 (listing detail page)

---

## Completed

**Completed:** 2026-04-12
**Branch:** feature/F-016-core-booking-flow
**Notes:** Server Component wrapper with auth guard + client BookingForm component. Server Action createBookingAction forwards session cookie. Real-time price calculation client-side. Blocked date validation against availability API data.
