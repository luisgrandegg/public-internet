# F-025 — Eats: auth UI (sign-in, sign-up, forgot-password)

## Summary

Three auth pages for the eats app. better-auth already handles the API (`/api/auth/[...all]`); this feature is UI-only. All forms must be constitution-compliant: no pre-ticked boxes, no dark patterns, no friction designed to prevent users from leaving.

## Pages

| Route | Purpose |
|---|---|
| `/auth/signup` | Create an account — name, email, password |
| `/auth/signin` | Sign in with email and password |
| `/auth/forgot-password` | Request a password reset email |

## Acceptance criteria

- [x] Sign-up form calls `signUp()` from `auth-client.ts`; on success redirects to `/`
- [x] Sign-in form calls `signIn.email()` from `auth-client.ts`; on success redirects to `/`
- [x] Forgot-password form calls the forgot-password endpoint; always shows success copy regardless of whether the email exists (prevents enumeration)
- [x] All forms show field-level validation errors associated via `aria-describedby`
- [x] No pre-ticked opt-in checkboxes anywhere in the flow
- [x] No urgency or pressure copy ("Sign up now before it's too late!")
- [x] Forms are keyboard-navigable; focus order is logical
- [x] `pnpm --filter @public-internet/eats type-check` passes
- [x] At least one e2e spec covering happy-path sign-up and sign-in (`e2e/auth/`)

## Notes

- Follow the same pattern as `apps/touristical-renting/src/app/auth/`
- Use only design system components: `Input`, `Button`, `Card`, `Stack`, `Text`
- Auth layout can share a wrapper component at `src/app/auth/layout.tsx`
- No social login — email + password only at this stage

---

## Completed

**Completed:** 2026-04-17
**Branch:** claude/food-delivery-missing-features-jo5BM
**Audit:** `pnpm --filter @public-internet/eats type-check` and `lint` pass with zero errors
**Notes:** Auth layout wrapper shared across all three routes. Server Actions delegate to `auth.api.signInEmail` / `signUpEmail` from better-auth. Forgot-password always returns `ok: true` to prevent enumeration. Three e2e specs at `e2e/auth/{signin,signup,forgot-password}.spec.ts` — all assert constitution constraints (no urgency copy, no pre-ticked opt-ins).
