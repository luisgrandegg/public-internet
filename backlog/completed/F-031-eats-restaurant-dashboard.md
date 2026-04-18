# F-031 — Eats: restaurant dashboard and order management

## Summary

The `/restaurant` dashboard lets a restaurant owner see incoming orders and update their status through the kitchen workflow. Order status transitions are: `PENDING → ACCEPTED → PREPARING → READY_FOR_PICKUP`. The `IN_DELIVERY` and `DELIVERED` transitions are owned by the courier (F-034).

## API

### `GET /api/restaurant/orders`
Returns orders for all restaurants owned by the session user. Newest first. Returns 403 if the user is not a restaurant owner.

### `PATCH /api/restaurant/orders/:id`
Allows the owner to advance order status to `ACCEPTED`, `PREPARING`, or `READY_FOR_PICKUP` only. Returns 403 if the order doesn't belong to one of the owner's restaurants. Returns 422 if the requested status transition is invalid.

## Page: `/restaurant`

- Four columns: Incoming, In progress, Ready for pickup, Completed
- Each order card shows customer note, items, totalCost, time, current status badge
- Action buttons per-status: Accept → Mark preparing → Ready for pickup
- Redirects unauthenticated users to `/auth/signin`; redirects non-owners to `/`

## Acceptance criteria

- [x] `PATCH /api/restaurant/orders/:id` rejects status transitions outside allowed set with 422
- [x] Returns 403 if the order belongs to a different owner's restaurant
- [x] Both route handlers have `@swagger` JSDoc annotations
- [x] Dashboard shows real orders from the database — no mock data
- [x] Empty state when no orders exist
- [x] `pnpm --filter @public-internet/eats type-check` passes
- [x] e2e spec: order status update flow (`e2e/restaurant/orders.spec.ts`)

---

## Completed

**Completed:** 2026-04-17
**Branch:** claude/food-delivery-missing-features-jo5BM
**Audit:** `pnpm --filter @public-internet/eats type-check` and `lint` pass with zero errors
**Notes:** Dashboard is a Server Component that reads `listOrdersForOwner()` directly. Orders are bucketed by status on the server so the client just renders four columns. Status transitions go through a Server Action `updateOrderStatusAction` which calls the PATCH endpoint — the endpoint rejects anything outside `ACCEPTED / PREPARING / READY_FOR_PICKUP` with 422.
