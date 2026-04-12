# F-017 — Eats: restaurant detail and menu

## Summary

The `/restaurants/[id]` page shows a restaurant's full profile and menu. Backed by two API endpoints. All prices displayed are real menu prices — no hidden service charges added on this page. This is a read-only view for customers; menu editing lives in F-022.

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

- [ ] `GET /api/restaurants/:id` returns 404 for unknown or inactive restaurants
- [ ] `GET /api/restaurants/:id/menu` returns only available items, grouped by category
- [ ] Both route handlers have `@swagger` JSDoc annotations
- [ ] Prices displayed as `€X.XX` — never as raw cents
- [ ] No hidden fees or service charges mentioned on this page
- [ ] Unavailable menu items are never shown to customers
- [ ] Page is server-rendered (Server Component) — no client-side data fetching
- [ ] `pnpm --filter @public-internet/eats type-check` passes
- [ ] e2e spec: restaurant detail renders menu categories and items (`e2e/restaurants.spec.ts`)
