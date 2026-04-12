# F-034 — Eats: courier dashboard and delivery management

## Summary

The `/courier` dashboard lets a courier see available deliveries (with pay breakdown shown before accepting), accept a delivery, and update delivery status. This is the core worker-rights feature: couriers must see `basePay` and `distancePay` separately before committing to a delivery — never an opaque total.

## API

### `GET /api/courier/deliveries`

| | |
|---|---|
| Auth | Required (`isCourier = true`) |
| Query params | `status` (optional: `UNASSIGNED`, `ASSIGNED`) |
| Response | `{ data: Delivery[] }` |

- `status=UNASSIGNED` → available deliveries (not yet assigned to anyone)
- `status=ASSIGNED` → current courier's active deliveries
- Always includes `basePay` and `distancePay` separately in the response
- Returns 403 if the user is not a courier

### `PATCH /api/courier/deliveries/:id`

| | |
|---|---|
| Auth | Required (`isCourier = true`) |
| Body | `{ action: 'accept' \| 'picked_up' \| 'delivered' \| 'failed' }` |
| Response | `{ data: Delivery }` |

Valid transitions:
- `accept`: `UNASSIGNED → ASSIGNED` — sets `courierId = session.userId`
- `picked_up`: `ASSIGNED → PICKED_UP` — sets `pickedUpAt`
- `delivered`: `PICKED_UP → DELIVERED` — sets `deliveredAt`; also updates parent `Order.status = DELIVERED`
- `failed`: any → `FAILED`

Returns 403 if the delivery is assigned to a different courier. Returns 422 for invalid transitions.

## Page: `/courier`

- Two tabs: **Available deliveries** and **My deliveries**
- Available delivery card shows: restaurant name, delivery address, `basePay`, `distancePay`, total pay — all visible before accepting
- My deliveries: current status, action button to advance (Picked up → Delivered)
- Full delivery history with pay breakdown per delivery

## Acceptance criteria

- [ ] `basePay` and `distancePay` are shown separately on every delivery card, before accepting
- [ ] `PATCH` enforces valid state machine transitions, returns 422 for invalid ones
- [ ] `PATCH action=delivered` also updates `Order.status = DELIVERED` in the same transaction
- [ ] Returns 403 if the user is not `isCourier = true`
- [ ] Both route handlers have `@swagger` JSDoc annotations
- [ ] Delivery history shows full pay breakdown for every completed delivery
- [ ] Empty states for both tabs
- [ ] `pnpm --filter @public-internet/eats type-check` passes
- [ ] e2e spec: accept delivery, mark picked up, mark delivered; verify pay shown before accept (`e2e/courier/deliveries.spec.ts`)

## Notes

- Constitution (worker rights): pay must never be shown as a single opaque number — `basePay + distancePay` always
- An appeal path for deactivation must be visible in the courier dashboard (even if it is only a link/copy at this stage)
- The `basePay` and `distancePay` values on a `Delivery` record are set when the `Order` is created (F-028)
