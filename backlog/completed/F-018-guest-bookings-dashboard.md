# F-018 — Guest bookings dashboard (`/bookings` + `/bookings/[id]`)

## Summary

Guests need a place to see their past, current, and upcoming stays. Two pages: a list view and a detail view.

## Acceptance criteria

- [x] `/bookings` lists all bookings for the signed-in guest, ordered by check-in date descending
- [x] Each row shows: listing title, city, check-in date, check-out date, total cost, status (Upcoming/Completed)
- [x] Empty state shown when guest has no bookings
- [x] Unauthenticated users redirected to `/auth/signin`
- [x] `/bookings/[id]` shows full booking detail: listing card, dates, price breakdown, host name
- [x] 404 if booking does not belong to the signed-in guest
- [x] `GET /api/bookings` endpoint added with @swagger annotation
- [x] SDK regenerated

## Dependencies

- F-017 (booking flow)

---

## Completed

**Completed:** 2026-04-12
**Branch:** feature/F-016-core-booking-flow
**Notes:** Server Components for both pages. getGuestBookings service function added. Booking detail page shows leave-a-review form after checkout (implemented in F-022). Derived status from dates.
