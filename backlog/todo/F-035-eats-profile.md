# F-035 — Eats: profile page

## Summary

The `/profile` page lets a signed-in user view and update their name and email, see their current roles (customer / restaurant owner / courier), and sign out. Must make it easy to leave — no friction or dark patterns designed to retain the user.

## What this feature includes

- Page: `/profile`
- Displays: name, email, `isRestaurantOwner` flag, `isCourier` flag
- Edit form for name (email-change can be deferred — better-auth handles it but may require verification flow)
- Sign-out button that calls `signOut()` from `auth-client.ts`

## Acceptance criteria

- [ ] Profile page shows current user name, email, and role flags
- [ ] Sign-out button works and redirects to `/`
- [ ] No dark patterns to prevent sign-out or account deletion
- [ ] Redirects unauthenticated users to `/auth/signin`
- [ ] `pnpm --filter @public-internet/eats type-check` passes
- [ ] e2e spec: profile shows user info; sign-out redirects to home (`e2e/auth/profile.spec.ts`)

## Notes

- Keep simple — this is not a settings hub. Extended account management (data export, account deletion) can be a future feature.
- Constitution: no friction designed to prevent users from leaving; data must be exportable in a future feature
