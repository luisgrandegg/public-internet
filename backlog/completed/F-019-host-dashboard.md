# F-019 — Host dashboard (`/host`)

## Summary

Hosts need a single page to manage their listings and see incoming bookings.

## Acceptance criteria

- [x] Route `/host` requires authentication and `isHost = true`; redirect to `/` if not a host
- [x] **My Listings panel**: shows all host listings with title, city, nightly rate, booking count, and links to edit/view
- [x] **Upcoming Bookings panel**: shows bookings with future check-in dates
- [x] **All Bookings panel**: full booking history with review-guest prompt for completed bookings
- [x] Earnings shown as "You receive 100% of the nightly rate — no commission"
- [x] Empty states for each panel
- [x] Open Enquiries panel from F-021
- [x] `pnpm typecheck` and `pnpm lint` pass

## Dependencies

- Existing host API routes
- F-021 (enquiry system)

---

## Completed

**Completed:** 2026-04-12
**Branch:** feature/F-016-core-booking-flow
**Notes:** Server Component using existing getHostListings and getHostBookings services. EnquiryReplyForm and ReviewGuestForm client components. Commission-free note prominently displayed. Three data sections with empty states.
