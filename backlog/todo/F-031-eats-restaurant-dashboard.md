# F-031 — Eats: restaurant dashboard and order management

## Summary

The `/restaurant` dashboard lets a restaurant owner see incoming orders and update their status through the kitchen workflow. Order status transitions are: `PENDING → ACCEPTED → PREPARING → READY_FOR_PICKUP`. The `IN_DELIVERY` and `DELIVERED` transitions are owned by the courier (F-034).

## API

### `GET /api/restaurant/orders`

| | |
|---|---|
| Auth | Required (Restaurant Owner) |
| Query params | `status` (optional filter), `page` |
| Response | `{ data: PaginatedOrders }` |

Returns orders for all restaurants owned by the session user. Newest first. Returns 403 if the user is not a restaurant owner.

### `PATCH /api/restaurant/orders/:id`

| | |
|---|---|
| Auth | Required (Restaurant Owner) |
| Body | `{ status: OrderStatus }` |
| Response | `{ data: Order }` |

Allows the owner to advance order status to `ACCEPTED`, `PREPARING`, or `READY_FOR_PICKUP` only. Returns 403 if the order doesn't belong to one of the owner's restaurants. Returns 422 if the requested status transition is invalid.

## Page: `/restaurant`

- Tabbed or filtered view: incoming (PENDING), in progress (ACCEPTED/PREPARING), ready (READY_FOR_PICKUP)
- Each order card: customer note, items summary, totalCost, time placed, current status
- Action buttons to advance status (e.g. "Accept", "Mark preparing", "Ready for pickup")
- Redirects unauthenticated users to `/auth/signin`; redirects non-owners to `/`

## Acceptance criteria

- [ ] `PATCH /api/restaurant/orders/:id` rejects status transitions outside allowed set with 422
- [ ] Returns 403 if the order belongs to a different owner's restaurant
- [ ] Both route handlers have `@swagger` JSDoc annotations
- [ ] Dashboard shows real orders from the database — no mock data
- [ ] Empty state when no orders exist
- [ ] `pnpm --filter @public-internet/eats type-check` passes
- [ ] e2e spec: order status update flow (`e2e/restaurant/orders.spec.ts`)
