# F-026 — Eats: restaurant browse

## Summary

The `/restaurants` page lets customers discover active restaurants in their area. Backed by `GET /api/restaurants`, which supports filtering by city and pagination. No paid ranking, no promoted placements — restaurants are ordered by name within city.

## API

### `GET /api/restaurants`

| | |
|---|---|
| Auth | None |
| Query params | `city` (string), `page` (integer, default 1) |
| Response | `{ data: PaginatedRestaurants }` |

Returns only restaurants where `isActive = true`. Orders alphabetically by name within city. No promoted or paid-ranking logic.

## Page: `/restaurants`

- Search/filter bar: city input (pre-filled from `?city` query param)
- Grid of `RestaurantCard` components (name, city, image, description excerpt)
- Pagination controls
- Empty state when no restaurants exist for a city

## Acceptance criteria

- [x] `GET /api/restaurants` returns paginated list of active restaurants, filtered by `?city`
- [x] Route Handler has a `@swagger` JSDoc annotation
- [x] `/restaurants` page fetches real data from the API — no mock arrays
- [x] Empty state renders correctly when 0 restaurants match
- [x] No promoted or algorithmically ranked restaurants
- [x] `pnpm --filter @public-internet/eats type-check` passes
- [x] e2e spec: page renders heading, empty state behaves correctly (`e2e/restaurants.spec.ts`)

## Notes

- `RestaurantCard` is a local app component (not DS) — it composes DS primitives
- Keep ordering deterministic: `ORDER BY name ASC` to avoid surprising results
- Image is optional — render a placeholder when `imageUrl` is null

---

## Completed

**Completed:** 2026-04-17
**Branch:** claude/food-delivery-missing-features-jo5BM
**Audit:** `pnpm --filter @public-internet/eats type-check` and `lint` pass with zero errors
**Notes:** Page is a Server Component that calls `listRestaurants()` directly (no SDK roundtrip needed server-side). The service sorts `[{ city: 'asc' }, { name: 'asc' }]` for deterministic ordering. Pagination links preserve the `city` filter.
