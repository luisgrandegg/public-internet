# F-019 — Eats: order history and order detail

## Summary

Two pages that let a customer track their orders. Order status must always be communicated in text — never colour alone. Cost breakdown is shown in full on every order detail view.

## API

### `GET /api/orders/:id`

| | |
|---|---|
| Auth | Required (order owner) |
| Response | `{ data: Order }` |

Returns the full order with items, cost breakdown, restaurant summary, and current delivery status. Returns 404 if not found. Returns 403 if the requesting user is not the order owner.

*(A customer's full order list is served directly from a Server Component reading the DB — no separate `GET /api/orders` list endpoint needed at this stage.)*

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

- [ ] `GET /api/orders/:id` returns 403 for users who don't own the order
- [ ] Route Handler has a `@swagger` JSDoc annotation
- [ ] Order status is displayed as a text label (e.g. "Preparing", "In delivery") — not colour alone
- [ ] Cost breakdown on detail page always shows `itemsCost`, `infrastructureFee`, and `totalCost` separately
- [ ] `/orders` redirects unauthenticated users to `/auth/signin`
- [ ] Empty state on `/orders` renders correctly when the customer has no orders
- [ ] `pnpm --filter @public-internet/eats type-check` passes
- [ ] e2e spec: order history shows placed orders; detail shows cost breakdown (`e2e/orders.spec.ts`)
