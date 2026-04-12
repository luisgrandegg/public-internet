# F-021 — Enquiry system (Guest → Host messaging)

## Summary

Guests need a channel to ask the host a question before committing to a booking.

## Acceptance criteria

- [x] New `Enquiry` Prisma model with all required fields
- [x] Migration committed
- [x] `POST /api/listings/:id/enquiries` — guest sends enquiry; requires authentication
- [x] `GET /api/host/enquiries` — host sees open (unreplied) enquiries
- [x] `POST /api/host/enquiries/:id/reply` — host replies to an enquiry
- [x] OpenAPI `@swagger` annotations on all three endpoints
- [x] SDK regenerated
- [x] "Contact host" section on `/listings/[id]` with Textarea + "Send enquiry" button
- [x] Sign-in prompt for unauthenticated users
- [x] Success state: "Your message has been sent"
- [x] Enquiries panel on `/host` with inline reply form
- [x] No urgency copy

## Dependencies

- F-015 (listing detail page)
- F-019 (host dashboard)

---

## Completed

**Completed:** 2026-04-12
**Branch:** feature/F-016-core-booking-flow
**Notes:** Enquiry Prisma model with guest/host relations. ContactHostForm client component with Server Action. EnquiryReplyForm in host dashboard. Service functions: createEnquiry, getHostEnquiries, replyToEnquiry.
