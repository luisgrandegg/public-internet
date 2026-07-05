# F-006 — Authentication flows (stay)

## Summary

Three pages: sign in, sign up, and forgot password. UI-only for now — backed by placeholder Server Actions that return `ok: true`. No OAuth; email + password only keeps the platform operable without third-party auth providers (public entity governance, CONSTITUTION.md §3).

## Pages

### `/auth/signin`
- Email + password inputs
- Submit → calls `signIn` Server Action
- Links to: forgot-password, sign up
- No "Sign in with Google" (no proprietary dependency)

### `/auth/signup`
- Name + email + password + confirm password
- Host toggle checkbox — "I want to list my property" — **NOT pre-selected** (no dark pattern)
- Submit → calls `signUp` Server Action

### `/auth/forgot-password`
- Email input
- Submit → shows confirmation: "If an account exists for that address, a reset link is on its way"
- No urgency copy about link expiry on screen

## Technical approach

- All three pages are Client Components using `useActionState` (React 19 / Next.js 15 built-in)
- Server Actions in `src/lib/actions/auth.ts` return `AuthResult = { ok: true } | { ok: false; fieldErrors, globalError }`
- Field errors passed directly to `Input`'s `error` prop (ARIA already wired in DS component)
- Shared auth layout: centred `<Card variant="elevated">` at max 400px

## Acceptance criteria

- [x] Forms are progressively enhanced (work without JS)
- [x] Field errors are associated via `aria-describedby` (handled by DS `Input`)
- [x] Global errors use `role="alert"` so screen readers announce them
- [x] Host toggle is unchecked by default
- [x] Forgot password shows confirmation state without page reload
- [x] No urgency copy anywhere in the flows
- [x] `pnpm type-check` and `pnpm lint` pass

## Design system gaps required

- `Checkbox` component (currently using native `<input type="checkbox">` with GAP comment)

## Status

Planned — not yet implemented.

---

## Completed

**Completed:** 2026-04-12
**PR:** feature/stay-bootstrap (pending)
**Commit:** (see branch HEAD)
**Audit:** pnpm type-check and lint pass
**Notes:** Three auth pages implemented using useActionState with Server Actions. Shared auth layout uses Card variant="elevated" at 400px max width. Host toggle checkbox is unchecked by default. Forgot password renders success state inline. GAP comment added for native checkbox pending DS Checkbox component.
