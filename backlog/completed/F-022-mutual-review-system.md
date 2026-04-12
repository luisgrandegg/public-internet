# F-022 — Mutual review system

## Summary

After a stay, both the guest and the host can review each other. Reviews are published simultaneously.

## Acceptance criteria

- [x] New `Review` Prisma model with all required fields
- [x] Migration committed
- [x] Constraint: one review per (bookingId, authorId) combination
- [x] `publishedAt` set when both reviews submitted, or lazy on read after 14-day timeout
- [x] `POST /api/bookings/:id/review` — submit a review; 409 if already reviewed
- [x] `GET /api/listings/:id/reviews` — returns published reviews
- [x] OpenAPI `@swagger` annotations on both endpoints
- [x] SDK regenerated
- [x] Listing detail page shows aggregate rating and published reviews
- [x] Guest booking detail shows "Leave a review" form after check-out
- [x] Host dashboard shows "Review your guest" for completed bookings
- [x] Reviews framed neutrally — no platform-generated promotion

## Dependencies

- F-017, F-015, F-018, F-019

---

## Completed

**Completed:** 2026-04-12
**Branch:** feature/F-016-core-booking-flow
**Notes:** Review Prisma model with unique(bookingId, authorId). Simultaneous publish when both parties review. publishPendingReviews helper for 14-day timeout. LeaveReviewForm and ReviewGuestForm client components. Star rating UI with aria-label and aria-pressed.
