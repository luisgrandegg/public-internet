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

- [ ] `POST /api/restaurant/restaurants` creates restaurant and sets `isRestaurantOwner` in same transaction
- [ ] No exclusivity agreement or paid tier in the form
- [ ] Route Handler has a `@swagger` JSDoc annotation
- [ ] Returns 401 if not signed in
- [ ] Form shows field-level validation errors associated via `aria-describedby`
- [ ] Redirects unauthenticated users to `/auth/signin`
- [ ] `pnpm --filter @public-internet/eats type-check` passes
- [ ] e2e spec: happy-path restaurant registration (`e2e/restaurant/register.spec.ts`)

## Notes

- `PATCH /api/restaurant/restaurants/:id` (update) can be implemented in the same PR or deferred to F-031
- Constitution check: no copy suggesting the platform takes a commission or requires exclusivity
