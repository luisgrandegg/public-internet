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

## Page: `/restaurants/[id]/order`

Two views in one route:

1. **Cart builder** — menu items from the restaurant with +/- quantity controls; running `itemsCost` subtotal shown live
2. **Order summary** — pre-confirm screen with itemised list, `itemsCost`, `infrastructureFee` (labelled "Platform infrastructure fee"), and `totalCost`. Customer must see this screen before submitting.

The customer confirms on the summary screen. No fees are introduced after the cart screen.

## Acceptance criteria

- [ ] `unitPrice` in `OrderItem` is snapshotted from `MenuItem.price` at creation time
- [ ] `infrastructureFee` is a flat fixed value — not a percentage, not demand-adjusted
- [ ] `totalCost = itemsCost + infrastructureFee` — no other charges
- [ ] The pre-confirm screen shows all three cost lines before the customer submits
- [ ] `POST /api/orders` returns 401 if not signed in; redirects unauthenticated customers to `/auth/signin`
- [ ] Returns 422 if a `menuItemId` is from a different restaurant or is unavailable
- [ ] Route Handler has a `@swagger` JSDoc annotation
- [ ] `pnpm --filter @public-internet/eats type-check` passes
- [ ] e2e spec: happy-path order placement; verify cost summary screen is shown before confirm; verify no hidden fees (`e2e/orders.spec.ts`)

## Notes

- Cart state lives in client-side React state (no server persistence until order is confirmed)
- `infrastructureFee` value should come from an env var or config constant — never hardcoded in the route
- The `Delivery` record is created atomically with the `Order` in a Prisma transaction
