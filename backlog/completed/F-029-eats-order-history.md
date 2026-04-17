# F-029 — Eats: order history and order detail

## Summary

Two pages that let a customer track their orders. Order status must always be communicated in text — never colour alone. Cost breakdown is shown in full on every order detail view.

## API

### `GET /api/orders/:id`

| | |
|---|---|
| Auth | Required (order owner) |
| Response | `{ data: Order }` |

Returns the full order with items, cost breakdown, restaurant summary, and current delivery status. Returns 404 if not found. Returns 403 if the requesting user is not the order owner.

## Pages

### `/orders`

- Lists all orders for the signed-in customer, newest first
- Each row: restaurant name, date, status label (text), totalCost
- Empty state when no orders exist
- Redirects unauthenticated users to `/auth/signin`

### `/orders/[id]`

- Full order detail: restaurant, items with quantities and unit prices, itemsCost, infrastructureFee, totalCost
- Delivery status (text label, not just colour)
- All three cost lines always visible — no collapsed totals

## Acceptance criteria

- [x] `GET /api/orders/:id` returns 403 for users who don't own the order
- [x] Route Handler has a `@swagger` JSDoc annotation
- [x] Order status is displayed as a text label (e.g. "Preparing", "In delivery") — not colour alone
- [x] Cost breakdown on detail page always shows `itemsCost`, `infrastructureFee`, and `totalCost` separately
- [x] `/orders` redirects unauthenticated users to `/auth/signin`
- [x] Empty state on `/orders` renders correctly when the customer has no orders
- [x] `pnpm --filter @public-internet/eats type-check` passes
- [x] e2e spec at `e2e/orders.spec.ts`

---

## Completed

**Completed:** 2026-04-17
**Branch:** claude/food-delivery-missing-features-jo5BM
**Audit:** `pnpm --filter @public-internet/eats type-check` and `lint` pass with zero errors
**Notes:** Order history and detail are Server Components reading the DB directly for faster renders. The detail page uses the shared `orderStatusLabel` and `deliveryStatusLabel` maps from `src/lib/format.ts` so the status is always rendered as text. Non-owner access on `/orders/[id]` is converted to `notFound()` to avoid leaking order existence — the REST endpoint still returns a clean 403 for programmatic callers.
