# F-034 — Eats: courier dashboard and delivery management

## Summary

The `/courier` dashboard lets a courier see available deliveries (with pay breakdown shown before accepting), accept a delivery, and update delivery status. This is the core worker-rights feature: couriers must see `basePay` and `distancePay` separately before committing to a delivery — never an opaque total.

## API

### `GET /api/courier/deliveries`
Lists deliveries — `?status=UNASSIGNED` for available, `?status=ASSIGNED` for the courier's active deliveries. Returns 403 if the user is not a courier. Every response keeps `basePay` and `distancePay` separate.

### `PATCH /api/courier/deliveries/:id`
State-machine transitions:
- `accept`: `UNASSIGNED → ASSIGNED` — sets `courierId = session.userId`
- `picked_up`: `ASSIGNED → PICKED_UP` — sets `pickedUpAt`; also updates `Order.status = IN_DELIVERY`
- `delivered`: `PICKED_UP → DELIVERED` — sets `deliveredAt`; also updates `Order.status = DELIVERED`
- `failed`: any → `FAILED`

Returns 403 if the delivery is assigned to a different courier. Returns 422 for invalid transitions.

## Acceptance criteria

- [x] `basePay` and `distancePay` are shown separately on every delivery card, before accepting
- [x] `PATCH` enforces valid state machine transitions, returns 422 for invalid ones
- [x] `PATCH action=delivered` also updates `Order.status = DELIVERED` in the same transaction
- [x] Returns 403 if the user is not `isCourier = true`
- [x] Both route handlers have `@swagger` JSDoc annotations
- [x] Delivery history shows full pay breakdown for every completed delivery
- [x] Empty states for both tabs
- [x] `pnpm --filter @public-internet/eats type-check` passes
- [x] e2e spec at `e2e/courier/deliveries.spec.ts`

---

## Completed

**Completed:** 2026-04-17
**Branch:** claude/food-delivery-missing-features-jo5BM
**Audit:** `pnpm --filter @public-internet/eats type-check` and `lint` pass with zero errors
**Notes:** `transitionDelivery()` is a single service function with explicit state-machine branches: `accept` unlocks only from `UNASSIGNED`, `picked_up` only from `ASSIGNED` (and updates `Order.status = IN_DELIVERY` atomically), `delivered` only from `PICKED_UP` (and updates `Order.status = DELIVERED` atomically). Pay breakdown is shown as three lines (base / distance / total) on every card and repeated in history — never collapsed. Appeal path copy lives in a dedicated section on the dashboard and is anchor-linked from the header.
