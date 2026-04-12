# F-023 — User profile (`/profile`)

## Summary

A settings page where users manage their account and become hosts. Also provides data export — required by the Constitution's no-lock-in principle.

## Acceptance criteria

- [x] Route `/profile` requires authentication; redirect to `/auth/signin` if not signed in
- [x] Editable fields: display name, avatar URL (text input for MVP — no file upload)
- [x] Email shown as read-only (managed by `better-auth`)
- [x] "Become a host" toggle: when enabled, sets `isHost = true` on the User via `POST /api/users/me/become-host`; toggle is an explicit button — not pre-checked
- [x] "Export my data" button: calls `GET /api/users/me/export`; downloads a JSON file with the user's listings, bookings, and account data
- [x] No pre-ticked consent boxes anywhere on the page
- [x] `pnpm typecheck` and `pnpm lint` pass

## Technical approach

- Server Component wrapper (`src/app/profile/page.tsx`) + Client Component form (`ProfileForm`) for editable fields
- `HostToggle` Client Component: explicit "Become a host" button (never pre-checked)
- `DataExport` Client Component: "Export my data" button triggers `window.location.href = '/api/users/me/export'`
- New API routes:
  - `GET /api/users/me` — get current user profile
  - `PATCH /api/users/me` — update name and/or image; requires auth
  - `POST /api/users/me/become-host` — set `isHost = true`; requires auth
  - `GET /api/users/me/export` — returns JSON with user's data; `Content-Disposition: attachment`
- Service layer: `src/lib/services/users.ts` — `getUserProfile`, `updateUserProfile`, `exportUserData`, `becomeHost`
- Server Actions: `src/lib/actions/profile.ts` — `updateProfileAction`, `becomeHostAction`
- OpenAPI `@swagger` annotations on all new endpoints; SDK regenerated (new `usersMe`, `usersMeExport`, `usersMeBecomeHost` resources)
- SDK generator updated to handle kebab-case path segments in class names

## Dependencies

- Independent of the core booking flow
- Data export includes bookings if they exist, but export works even if no bookings

---

## Completed

**Completed:** 2026-04-12
**PR:** feature/F-023-user-profile
**Commit:** (see branch HEAD)
**Audit:** pnpm lint and pnpm build pass with zero errors; 3 successful tasks
**Notes:** SDK generator fixed to produce valid PascalCase identifiers from kebab-case URL segments (e.g. `become-host` → `BecomeHost`). All constitution constraints met: no pre-ticked checkboxes, data export easily accessible, no urgency copy.
