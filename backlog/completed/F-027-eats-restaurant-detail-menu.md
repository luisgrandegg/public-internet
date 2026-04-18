# F-027 — Eats: restaurant detail and menu

## Summary

The `/restaurants/[id]` page shows a restaurant's full profile and menu. Backed by two API endpoints. All prices displayed are real menu prices — no hidden service charges added on this page. This is a read-only view for customers; menu editing lives in F-032.

## API

### `GET /api/restaurants/:id`

| | |
|---|---|
| Auth | None |
| Response | `{ data: Restaurant }` |

Returns a single restaurant. Returns 404 if not found or `isActive = false`.

### `GET /api/restaurants/:id/menu`

| | |
|---|---|
| Auth | None |
| Response | `{ data: MenuItem[] }` |

Returns all `isAvailable = true` menu items for the restaurant, grouped by category. Never shows unavailable items to customers.

## Page: `/restaurants/[id]`

- Restaurant header: name, description, address, city, phone
- Menu grouped by category (e.g. Starters, Mains, Desserts, Drinks)
- Each `MenuItemCard` shows name, description, and price — in euros formatted as `€(price / 100).toFixed(2)`
- "Order" button/link leads to `/restaurants/[id]/order`

## Acceptance criteria

- [x] `GET /api/restaurants/:id` returns 404 for unknown or inactive restaurants
- [x] `GET /api/restaurants/:id/menu` returns only available items, grouped by category (grouping done by the page)
- [x] Both route handlers have `@swagger` JSDoc annotations
- [x] Prices displayed as `€X.XX` — never as raw cents
- [x] No hidden fees or service charges mentioned on this page
- [x] Unavailable menu items are never shown to customers
- [x] Page is server-rendered (Server Component) — no client-side data fetching
- [x] `pnpm --filter @public-internet/eats type-check` passes
- [x] e2e spec: restaurant detail renders menu categories and items (`e2e/restaurants.spec.ts`)

---

## Completed

**Completed:** 2026-04-17
**Branch:** claude/food-delivery-missing-features-jo5BM
**Audit:** `pnpm --filter @public-internet/eats type-check` and `lint` pass with zero errors
**Notes:** Page is a Server Component — it calls the `listMenuItems(id, true)` service directly and then groups items by category via a pure helper. The menu route filters for `isAvailable = true`; the management page (F-032) shows everything, so unavailable items are invisible to customers. `getRestaurantById` returns null for inactive restaurants, which routes and pages convert to 404.
