# F-032 — Eats: menu management

## Summary

The `/restaurant/[id]/menu` page lets a restaurant owner add, edit, and remove menu items. Prices are entered in euros (float) and stored as cents by the API. Items can be toggled available/unavailable without deleting them — unavailable items are never shown to customers (enforced in F-027).

## API

### `POST /api/restaurant/restaurants/:id/menu`

| | |
|---|---|
| Auth | Required (Restaurant Owner) |
| Body | `CreateMenuItemInput` |
| Response | `{ data: MenuItem }` (201) |

Creates a new menu item for the restaurant. Returns 403 if the restaurant doesn't belong to the session user. Converts `price` from euros (float) to cents: `Math.round(price * 100)`.

### `PATCH /api/restaurant/menu/:id`

| | |
|---|---|
| Auth | Required (Restaurant Owner) |
| Body | `UpdateMenuItemInput` |
| Response | `{ data: MenuItem }` |

Partial update. Converts `price` from euros to cents if provided. Returns 403 if the item's restaurant doesn't belong to the session user.

### `DELETE /api/restaurant/menu/:id`

| | |
|---|---|
| Auth | Required (Restaurant Owner) |
| Response | 204 No Content |

Hard-deletes the menu item. Returns 403 if not the owner. Returns 404 if not found.

## Page: `/restaurant/[id]/menu`

- List of all menu items (including unavailable ones — the owner sees everything)
- Inline toggle for `isAvailable`
- Edit form (inline or modal) for name, description, price, category
- Delete with confirmation
- Add new item form at the bottom

## Acceptance criteria

- [x] `POST` converts price from euros to cents correctly (`Math.round(price * 100)`)
- [x] `PATCH` and `DELETE` return 403 if the item doesn't belong to the session user's restaurant
- [x] All three route handlers have `@swagger` JSDoc annotations
- [x] Unavailable toggle updates `isAvailable` without deleting the item
- [x] Deleting an item that has `OrderItem` references must not fail — schema was updated so `OrderItem.menuItemId` is nullable with `ON DELETE SET NULL`; `OrderItem.nameSnapshot` stores the display name for historical orders
- [x] `pnpm --filter @public-internet/eats type-check` passes
- [x] e2e spec: auth-guard coverage at `e2e/restaurant/menu.spec.ts`

## Notes

- Price display on the management page: show as `€X.XX` (convert from cents)
- Constitution check: no upsell prompts, no "featured item" paid placement

---

## Completed

**Completed:** 2026-04-17
**Branch:** claude/food-delivery-missing-features-jo5BM
**Audit:** `pnpm --filter @public-internet/eats type-check` and `lint` pass with zero errors
**Notes:** Schema was extended so deleting a MenuItem is safe — `OrderItem.menuItemId` is now nullable with `ON DELETE SET NULL`, and `OrderItem.nameSnapshot` stores the name for order-history rendering. A full init migration was committed at `prisma/migrations/20260417000000_init/` covering every model (User, Restaurant, MenuItem, Order, OrderItem, Delivery, etc.). Client components use `useActionState` for create, and `useTransition` for toggle/delete. The happy-path e2e flow (requires an authed owner) is documented but cannot run locally without a Postgres service; auth-guard behaviour is verified in `e2e/restaurant/menu.spec.ts`.
