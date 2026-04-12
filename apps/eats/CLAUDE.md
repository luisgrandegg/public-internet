# CLAUDE.md — eats

> Rules scoped to `apps/eats/`. The root `CLAUDE.md` and `CONSTITUTION.md` apply globally on top of these.
> **This is the Eats platform** described in `CONSTITUTION.md` — commission-free food delivery for restaurants, customers, and couriers.

---

## What this app does

Eats is a commission-free food delivery platform. Restaurants list their menu and receive orders. Customers browse, order, and pay. Couriers pick up and deliver orders. The platform charges restaurants and customers nothing beyond a flat per-order infrastructure fee — transparent and published — covering actual operating costs only.

This is a direct functional replacement for DoorDash and UberEats, built as public infrastructure for municipalities, hospitality associations, and neighbourhood cooperatives to own and operate.

---

## Constitution alignment

This app must satisfy all CONSTITUTION.md principles. The most critical for this domain:

| Principle | What it means here |
|---|---|
| **No extraction** | Zero commission from restaurants. No percentage fee. No advertising tiers. No upsells. A flat per-order infrastructure fee covers operating costs — published and visible to everyone. |
| **No dark patterns** | No surge pricing. Complete cost (items + infrastructure fee) shown before the customer confirms. No pre-selected add-ons. No hidden fees. |
| **Worker rights** | Couriers are workers, not contractors. Pay is transparent: `basePay + distancePay` shown to the courier before they accept a delivery. Deactivation requires a documented appeal process. No arbitrary removal. |
| **Federation-first** | Each deployment is a fully standalone node. A city's hospitality association can run their own Eats instance. Nodes may optionally federate to share restaurant discoverability. |
| **Accessibility-first** | WCAG AA on every page and component. |

---

## Domain vocabulary

Use these terms consistently across code, copy, and comments. Never invent synonyms mid-feature.

| Term | Definition |
|---|---|
| **Restaurant** | A food establishment registered on the platform. Owned by a **Restaurant Owner**. |
| **Restaurant Owner** | A user who registers and manages one or more Restaurants. `User.isRestaurantOwner = true`. |
| **MenuItem** | A dish or drink offered by a Restaurant, with name, description, price, and category. |
| **Customer** | A user who places Orders. Any authenticated user can be a Customer. |
| **Order** | A request from a Customer for one or more MenuItems from a single Restaurant, with a delivery address. |
| **OrderItem** | A single MenuItem entry in an Order, with quantity and unit price snapshotted at order time. |
| **Courier** | A delivery worker who accepts and completes Deliveries. `User.isCourier = true`. |
| **Delivery** | The logistics record for transporting an Order from Restaurant to Customer. Contains transparent pay breakdown for the Courier. |
| **Infrastructure fee** | The flat per-order charge that covers platform operating costs. Never a percentage. Published publicly. Shown to Customer before order confirmation. |
| **Base pay** | The flat per-delivery amount paid to the Courier. Part of the transparent pay breakdown. |
| **Distance pay** | The per-km rate × estimated distance paid to the Courier. Part of the transparent pay breakdown. |
| **Node** | A single deployment of the platform, operated by a municipality, cooperative, or community. |

---

## Route structure

The app uses the Next.js App Router under `src/app/`. Plan routes here before adding pages.

| Route | Page | Status |
|---|---|---|
| `/` | Home — value proposition, search entry point, restaurant/courier CTA | Scaffolded |
| `/restaurants` | Restaurant browse — list by city/category | Planned |
| `/restaurants/[id]` | Restaurant detail — menu, hours, location | Planned |
| `/restaurants/[id]/order` | Order flow — build cart, see complete cost before confirming | Planned |
| `/orders` | Customer order history | Planned |
| `/orders/[id]` | Order detail — status, items, delivery tracking | Planned |
| `/courier` | Courier dashboard — available deliveries, history, pay breakdown | Planned |
| `/courier/register` | Courier registration | Planned |
| `/restaurant` | Restaurant owner dashboard — orders, menu management | Planned |
| `/restaurant/register` | Restaurant registration | Planned |
| `/restaurant/[id]/menu` | Menu item management | Planned |
| `/profile` | User profile and settings | Planned |
| `/auth/signin` | Sign in | Planned |
| `/auth/signup` | Sign up | Planned |

Before adding a new route, add it to this table with its status.

---

## REST API surface

| Method | Path | Auth required | Description |
|---|---|---|---|
| `POST` | `/api/auth/sign-up` | No | Create account; sets session cookie |
| `POST` | `/api/auth/sign-in` | No | Authenticate; sets session cookie |
| `POST` | `/api/auth/sign-out` | Yes | Destroy session |
| `POST` | `/api/auth/forgot-password` | No | Send reset email (always 204 to prevent enumeration) |
| `GET` | `/api/restaurants` | No | List restaurants; supports `?city`, `?page` |
| `GET` | `/api/restaurants/:id` | No | Get restaurant detail |
| `GET` | `/api/restaurants/:id/menu` | No | List menu items for a restaurant |
| `POST` | `/api/orders` | Yes (Customer) | Place an order |
| `GET` | `/api/orders/:id` | Yes (owner) | Get order detail |
| `GET` | `/api/courier/deliveries` | Yes (Courier) | List available and assigned deliveries |
| `PATCH` | `/api/courier/deliveries/:id` | Yes (Courier) | Accept delivery or update delivery status |
| `GET` | `/api/restaurant/orders` | Yes (Restaurant Owner) | List orders for owner's restaurant(s) |
| `PATCH` | `/api/restaurant/orders/:id` | Yes (Restaurant Owner) | Update order status (ACCEPTED, PREPARING, READY_FOR_PICKUP) |
| `POST` | `/api/restaurant/restaurants` | Yes (Restaurant Owner) | Register a new restaurant |
| `PATCH` | `/api/restaurant/restaurants/:id` | Yes (Restaurant Owner) | Update restaurant details |
| `POST` | `/api/restaurant/restaurants/:id/menu` | Yes (Restaurant Owner) | Add a menu item |
| `PATCH` | `/api/restaurant/menu/:id` | Yes (Restaurant Owner) | Update a menu item |
| `DELETE` | `/api/restaurant/menu/:id` | Yes (Restaurant Owner) | Remove a menu item |

---

## Import rules

Always import components from the design system. Never create one-off styled wrappers.

```tsx
// ✅ Correct
import { Button, Card, Stack, Text } from '@public-internet/design-system'

// ❌ Never — relative cross-package import
import { Button } from '../../../packages/design-system/src/components/Button'

// ❌ Never — one-off local component that duplicates a design system primitive
const PriceTag = styled.span`color: var(--ds-color-brand-primary)`
```

If a UI requirement cannot be met with existing design system components, **flag the gap explicitly** and stop:

```tsx
// GAP: This requires a <CartSummary> component not yet in the design system.
// Recommend adding to backlog before proceeding.
```

---

## Data rules

- Every price shown to a customer must be the **total price**: items cost + infrastructure fee. Never reveal additional costs after the customer has started the order flow.
- `MenuItem.price`, `Order.itemsCost`, `Order.infrastructureFee`, `Order.totalCost`, `Delivery.basePay`, and `Delivery.distancePay` are all stored in **cents** (integer) to avoid floating-point rounding. Display as `€${(amount / 100).toFixed(2)}`.
- `OrderItem.unitPrice` is snapshotted at order creation time — it must not be recalculated from the current `MenuItem.price` after the order is placed.
- Courier pay breakdown (`basePay` + `distancePay`) must be visible to the courier **before** they accept a delivery.
- No surge pricing under any circumstances. `infrastructureFee` is a fixed value, not dynamically adjusted by demand.

---

## Worker rights rules (binding)

These are binding implementation constraints derived from CONSTITUTION.md §7 (Worker rights):

1. The Delivery record must always expose `basePay` and `distancePay` separately — never a single opaque total.
2. A courier must be able to view their full delivery history with pay breakdowns at any time.
3. The courier deactivation flow (if ever built) must include a documented appeal path accessible in the UI.
4. No feature may make courier deactivation easier without also making the appeal process clearer.
5. Never use language that classifies couriers as "independent contractors" in copy — use "courier" or "delivery worker".

---

## Accessibility rules

These are binding, not aspirational.

- Every interactive element must be keyboard-reachable and have a visible focus state.
- Every image must have a descriptive `alt` attribute. Decorative images use `alt=""`.
- Price information must not rely on colour alone — use text labels.
- Form error messages must be associated with their input via `aria-describedby`.
- Order status must be conveyed with text, not colour alone.

---

## What not to build

The following patterns are explicitly forbidden by CONSTITUTION.md and must never be implemented:

- Commission taken from restaurants on orders
- Percentage-based fees of any kind charged to either restaurants or customers
- Surge pricing or demand-based fee adjustments
- Urgency or scarcity copy ("Busy period — prices higher now!", "Order before it sells out!")
- Pre-selected add-ons or opt-out checkboxes for insurance, tips, or donations
- Fees revealed for the first time at the final checkout step
- Algorithms that rank restaurants based on paid promotion
- Features that make it harder for a restaurant to leave or export their data
- Any feature that requires a central authority — every feature must work on a standalone node
- Language that classifies couriers as independent contractors

---

## SDK

The typed SDK for this app lives at `packages/eats-sdk/`. After any Route Handler change:

```bash
pnpm --filter @public-internet/eats generate:spec   # regenerate openapi.json
pnpm --filter @public-internet/eats-sdk generate    # regenerate SDK types and classes
```

Usage:
```typescript
import { EatsSDK, FetchApiClient } from '@public-internet/eats-sdk'

const client = new FetchApiClient('http://localhost:3001')
const sdk = new EatsSDK(client)

const { restaurants } = await sdk.restaurants.list({ city: 'Barcelona' })
const order = await sdk.orders.create({ restaurantId: '...', items: [...], deliveryAddress: '...' })
```
