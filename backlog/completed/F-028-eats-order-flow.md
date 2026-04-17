# F-028 — Eats: order flow

## Summary

The `/restaurants/[id]/order` page lets a customer build a cart and place an order. This is the most constitution-critical page in the app: the complete cost — itemsCost + infrastructureFee = totalCost — must be shown to the customer **before** they confirm. No fees may be revealed for the first time at the final step.

## API

### `POST /api/orders`

| | |
|---|---|
| Auth | Required (Customer) |
| Body | `CreateOrderInput` |
| Response | `{ data: Order }` (201) |

**Server-side responsibilities:**
1. Validate that all `menuItemId`s belong to the same restaurant and are `isAvailable = true`
2. Snapshot `unitPrice` from `MenuItem.price` at the time of order creation — never recalculate later
3. Compute `itemsCost = sum(quantity × unitPrice)` for each item
4. Set `infrastructureFee` from the platform's fixed published rate (config, not hardcoded)
5. Set `totalCost = itemsCost + infrastructureFee`
6. Create `Delivery` record in `UNASSIGNED` status with pre-calculated `basePay` and `distancePay` (can be zero at this stage — updated when a courier accepts)
7. Return the full `Order` with all cost fields

## Acceptance criteria

- [x] `unitPrice` in `OrderItem` is snapshotted from `MenuItem.price` at creation time
- [x] `infrastructureFee` is a flat fixed value — not a percentage, not demand-adjusted
- [x] `totalCost = itemsCost + infrastructureFee` — no other charges
- [x] The pre-confirm screen shows all three cost lines before the customer submits
- [x] `POST /api/orders` returns 401 if not signed in; redirects unauthenticated customers to `/auth/signin`
- [x] Returns 422 if a `menuItemId` is from a different restaurant or is unavailable
- [x] Route Handler has a `@swagger` JSDoc annotation
- [x] `pnpm --filter @public-internet/eats type-check` passes
- [x] e2e spec at `e2e/orders.spec.ts`

## Notes

- Cart state lives in client-side React state (no server persistence until order is confirmed)
- `infrastructureFee` value comes from `INFRASTRUCTURE_FEE_CENTS` env config — never hardcoded in the route
- The `Delivery` record is created atomically with the `Order` in a Prisma transaction

---

## Completed

**Completed:** 2026-04-17
**Branch:** claude/food-delivery-missing-features-jo5BM
**Audit:** `pnpm --filter @public-internet/eats type-check` and `lint` pass with zero errors
**Notes:** Two-step cart → summary flow enforced in client state. The summary screen shows `itemsCost`, `infrastructureFee`, and `totalCost` on separate lines before "Confirm and pay" is clickable. `createOrderForCustomer()` runs inside a single Prisma `$transaction`: validates restaurant + menu items, snapshots `unitPrice` and `nameSnapshot` on every `OrderItem`, creates the Order, and creates the Delivery in `UNASSIGNED` with `basePay + distancePay` pre-populated from env config so the courier can see the breakdown as soon as it enters their queue.
