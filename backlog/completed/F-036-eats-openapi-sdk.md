# F-036 — Eats: OpenAPI spec annotation and SDK generation

## Summary

Once all business API routes (F-026 through F-034) are implemented, this feature annotates every Route Handler with `@swagger` JSDoc, regenerates `openapi.json`, and regenerates the `eats-sdk` typed resource classes.

## Acceptance criteria

- [x] Every Route Handler export has a `@swagger` annotation
- [x] `openapi.json` contains a path entry for every business endpoint
- [x] `pnpm --filter @public-internet/eats-sdk generate` produces non-placeholder files in `src/generated/`
- [x] `EatsSDK` class has typed methods for all resources: `sdk.restaurants`, `sdk.orders`, `sdk.courier`, `sdk.restaurant`
- [x] `pnpm --filter @public-internet/eats-sdk type-check` passes
- [x] `GET /api/docs` returns the populated spec

## Notes

- Each feature added its `@swagger` annotation in the same PR as the route handler; this feature is the final regeneration step
- Do not edit files in `packages/eats-sdk/src/generated/` manually — they are always overwritten by the generator

---

## Completed

**Completed:** 2026-04-17
**Branch:** claude/food-delivery-missing-features-jo5BM
**Audit:** `pnpm --filter @public-internet/eats type-check`, `pnpm --filter @public-internet/eats lint`, and `pnpm --filter @public-internet/eats-sdk type-check` all pass with zero errors
**Notes:** 12 business endpoints across 13 method exports are annotated (multiple methods share some paths, e.g. `/api/orders` has POST, `/api/orders/{id}` has GET). The SDK exposes `sdk.orders`, `sdk.restaurants`, `sdk.restaurantsMenu`, `sdk.courier.deliveries`, `sdk.restaurant.menu`, `sdk.restaurant.orders`, `sdk.restaurant.restaurants`, and `sdk.restaurant.restaurantsMenu`. The generator was updated to (a) clean stale files before regeneration, (b) use the same `groupToPropertyKey` helper as `touristical-renting-sdk` so dotted groups like `restaurants.menu` become valid camelCase identifiers. The `CLAUDE.md` table in `apps/eats/` listed the auth endpoints (4) + business endpoints (13) = 17, but better-auth handles auth via a catch-all so there is only one route file for all 4 auth methods — that file intentionally has no `@swagger` annotations because the operations come from the upstream library.
