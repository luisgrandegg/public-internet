# F-023 — User profile (`/profile`)

## Summary

A settings page where users manage their account and become hosts. Also provides data export — required by the Constitution's no-lock-in principle.

## Acceptance criteria

- [x] Route `/profile` requires authentication; redirect to `/auth/signin` if not signed in
- [x] Editable fields: display name, avatar URL (text input for MVP — no file upload)
- [x] Email shown as read-only (managed by `better-auth`)
- [x] "Become a host" toggle: when enabled, sets `isHost = true` on the User via `PATCH /api/users/me`; toggle is pre-checked false by default (no deceptive defaults)
- [x] "Export my data" button: calls `GET /api/users/me/export`; downloads a JSON file with the user's listings, bookings, and enquiries
- [x] No pre-ticked consent boxes anywhere on the page
- [x] `pnpm typecheck` and `pnpm lint` pass

## Technical approach

- Server Component wrapper + Client Component form for the editable fields
- New API routes:
  - `PATCH /api/users/me` — update name and/or avatarUrl; requires auth
  - `GET /api/users/me/export` — returns JSON with user's data; `Content-Disposition: attachment`
- Server Action in `src/lib/actions/profile.ts` calling `PATCH /api/users/me`
- OpenAPI `@swagger` annotations on new endpoints; SDK regenerated

## Dependencies

- Independent of the core booking flow
- Data export includes bookings (F-017) if they exist, but export works even if no bookings

## Completion

- Completed: 2026-04-12
- Branch: feature/F-016-core-booking-flow
- Files: `src/app/profile/`, `src/app/api/users/me/`, `src/lib/services/users.ts`, `src/lib/actions/profile.ts`, `src/lib/schemas/users.ts`
