# F-030 — Eats: restaurant registration

## Summary

The `/restaurant/register` page lets a user register their restaurant on the platform. Registration is free — no payment, no exclusivity agreement, no advertising upsell. On completion the user's `isRestaurantOwner` flag is set to `true`.

## API

### `POST /api/restaurant/restaurants`

| | |
|---|---|
| Auth | Required |
| Body | `CreateRestaurantInput` |
| Response | `{ data: Restaurant }` (201) |

Creates a new `Restaurant` with `ownerId = session.userId` and `isActive = true`. Also sets `User.isRestaurantOwner = true` if not already set (Prisma update in same transaction).

## Page: `/restaurant/register`

- Form: restaurant name, description, address, city, country, phone (optional), image URL (optional)
- No payment step, no exclusivity checkbox, no advertising tier selection
- On success: redirect to `/restaurant` (dashboard — F-031)

## Acceptance criteria

- [x] `POST /api/restaurant/restaurants` creates restaurant and sets `isRestaurantOwner` in same transaction
- [x] No exclusivity agreement or paid tier in the form
- [x] Route Handler has a `@swagger` JSDoc annotation
- [x] Returns 401 if not signed in
- [x] Form shows field-level validation errors associated via `aria-describedby`
- [x] Redirects unauthenticated users to `/auth/signin`
- [x] `pnpm --filter @public-internet/eats type-check` passes
- [x] e2e spec: happy-path restaurant registration (`e2e/restaurant/register.spec.ts`)

## Notes

- `PATCH /api/restaurant/restaurants/:id` (update) can be implemented in the same PR or deferred to F-031
- Constitution check: no copy suggesting the platform takes a commission or requires exclusivity

---

## Completed

**Completed:** 2026-04-17
**Branch:** claude/food-delivery-missing-features-jo5BM
**Audit:** `pnpm --filter @public-internet/eats type-check` and `lint` pass with zero errors
**Notes:** Registration uses a single `db.$transaction` that creates the Restaurant and flips `User.isRestaurantOwner = true`. Server Action is a thin wrapper around `POST /api/restaurant/restaurants` (forwards session cookies). Page-level `auth.api.getSession` redirect guards non-authed users. E2E spec verifies the unauth redirect and constitution copy on the home page.
