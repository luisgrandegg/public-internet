# F-022 — Eats: menu management

## Summary

The `/restaurant/[id]/menu` page lets a restaurant owner add, edit, and remove menu items. Prices are entered in euros (float) and stored as cents by the API. Items can be toggled available/unavailable without deleting them — unavailable items are never shown to customers (enforced in F-017).

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

- [ ] `POST` converts price from euros to cents correctly (`Math.round(price * 100)`)
- [ ] `PATCH` and `DELETE` return 403 if the item doesn't belong to the session user's restaurant
- [ ] All three route handlers have `@swagger` JSDoc annotations
- [ ] Unavailable toggle updates `isAvailable` without deleting the item
- [ ] Deleting an item that has `OrderItem` references must not fail — `OrderItem.unitPrice` is snapshotted so the item can safely be hard-deleted
- [ ] `pnpm --filter @public-internet/eats type-check` passes
- [ ] e2e spec: add, edit, toggle availability, delete menu item (`e2e/restaurant/menu.spec.ts`)

## Notes

- Price display on the management page: show as `€X.XX` (convert from cents)
- Constitution check: no upsell prompts, no "featured item" paid placement
