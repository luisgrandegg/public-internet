# F-035 — Eats: profile page

## Summary

The `/profile` page lets a signed-in user view and update their name and email, see their current roles (customer / restaurant owner / courier), and sign out. Must make it easy to leave — no friction or dark patterns designed to retain the user.

## What this feature includes

- Page: `/profile`
- Displays: name, email, `isRestaurantOwner` flag, `isCourier` flag
- Sign-out button that calls `signOut()` from `auth-client.ts`

## Acceptance criteria

- [x] Profile page shows current user name, email, and role flags
- [x] Sign-out button works and redirects to `/`
- [x] No dark patterns to prevent sign-out or account deletion
- [x] Redirects unauthenticated users to `/auth/signin`
- [x] `pnpm --filter @public-internet/eats type-check` passes
- [x] e2e spec: profile shows user info; sign-out redirects to home (`e2e/auth/profile.spec.ts`)

## Notes

- Keep simple — this is not a settings hub. Extended account management (data export, account deletion) can be a future feature.

---

## Completed

**Completed:** 2026-04-17
**Branch:** claude/food-delivery-missing-features-jo5BM
**Audit:** `pnpm --filter @public-internet/eats type-check` and `lint` pass with zero errors
**Notes:** Server Component reads session from better-auth and shows Identity (name, email) + Roles. Sign-out is a plain `<Button>` that calls `signOut()` from the existing auth-client. No retention shame, no "are you sure?" dark-pattern modal.
