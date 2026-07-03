# ADR-006 — Online payments via Stripe Checkout, with an explicit offline mode

**Status:** Accepted
**Date:** 2026-07-03

## Context

Both platforms create money-bearing records (Bookings on the Stay platform, Orders on Eats) without capturing any payment. The "Confirm and pay" button on Eats and the booking confirmation on touristical-renting write a database row and stop — money settlement happens entirely off-platform, invisibly, with no record of whether it happened at all.

For the platforms to be a real functional replacement for AirBnB and UberEats, an operator must be able to take card payments. At the same time:

- **CONSTITUTION.md forbids extraction.** The platform must not add commission, percentage fees, or any surcharge on top of the listed price. Whatever is charged online must equal exactly what the UI showed before confirmation (nightly rate × nights; items cost + published flat infrastructure fee).
- **Federation-first (CONSTITUTION.md).** Every node is standalone and operator-owned. Payment credentials belong to the node operator — a municipality's own Stripe account — never to a central authority. A node must remain fully functional without any payment processor at all (many co-op nodes will settle in person: pay on delivery, pay at the property).
- **CI/e2e cannot depend on a third party.** The root CLAUDE.md e2e rules exclude third-party integrations that cannot run in CI. The test suites must stay green with no Stripe account.

## Decision

**Stripe Checkout Sessions, configured per node, with a first-class offline mode.**

1. **Provider: Stripe, via the hosted Checkout Session flow.** No card data ever touches the app (no PCI surface, no Stripe Elements). The app creates a session server-side and redirects; Stripe redirects back to a success/cancel URL. Confirmation arrives via webhook — the redirect alone is never trusted.

2. **A `Payment` record accompanies every Booking/Order** (1:1, created in the same transaction):

   | Field | Meaning |
   |---|---|
   | `provider` | `'stripe'` or `'offline'` |
   | `status` | `PENDING` → `SUCCEEDED` / `FAILED` / `CANCELED` |
   | `amount`, `currency` | Cents, exactly the pre-confirmation total. Never recomputed after creation. |
   | `stripeCheckoutSessionId`, `stripePaymentIntentId` | Set only for `provider: 'stripe'` |

3. **Mode selection is configuration, not code.** If `STRIPE_SECRET_KEY` is set, confirmations create a `pending` Stripe payment and redirect to Checkout; the `checkout.session.completed` webhook (`POST /api/webhooks/stripe`, signature-verified with `STRIPE_WEBHOOK_SECRET`) marks it `SUCCEEDED`. If unset, the node runs **offline settlement**: the payment record is created as `provider: 'offline'`, `SUCCEEDED`, and the UI says plainly that payment is settled directly (pay on delivery / pay at the property). Offline mode is a legitimate operating mode for a commission-free node — not a stub: the record documents how the money flows.

4. **Unpaid online orders/bookings are inert.** An Eats order whose Stripe payment is still `PENDING`/`FAILED` does not appear in the restaurant's incoming orders and produces no courier-visible delivery. A Stay booking with a non-settled payment still blocks its dates (so a paying guest is never double-booked mid-checkout) but is labeled unpaid with a "Complete payment" path. Expiring abandoned checkouts (Stripe expires sessions after 24h; the webhook `checkout.session.expired` marks the payment `CANCELED`) releases order flow; automatic cleanup of stale unpaid bookings is future work.

5. **The charged amount is the displayed total — nothing else.** No platform fee is added inside the payment path. Stripe's own processing fees are borne by the node operator as an infrastructure cost (Eats nodes may cover them from the published flat infrastructure fee). Surge, tips-by-default, or percentage add-ons remain forbidden.

6. **Keys in `.env.example`, documented, never committed.** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`. The webhook route is exempt from session auth but verifies the Stripe signature on every request.

## Alternatives considered

- **Stripe Elements / Payment Intents in-page** — full UI control, but adds a client-side Stripe dependency, a publishable key, and a larger integration surface for no functional gain at this stage.
- **Stripe Connect marketplace payouts** (charge guest → payout host minus nothing) — the right long-term shape for Stay nodes, but requires host onboarding to Stripe and KYC flows; deferred until a real node needs it. The `Payment` abstraction does not preclude it.
- **No integration, document-only** — rejected: the user explicitly asked for Stripe, and "confirm and pay" with no payment path is the single largest parity gap.
- **A different PSP (Adyen, Mollie)** — Stripe has the broadest operator familiarity and the simplest hosted checkout; the provider column keeps the door open.

## Consequences

- CI and local dev run in offline mode by default; e2e suites assert the offline copy and record. Stripe-mode logic is covered by unit-style route behavior (signature rejection, mode selection) without calling Stripe.
- Each app's OpenAPI spec documents the webhook route and the payment fields on Booking/Order responses; SDKs regenerate accordingly.
- Refunds, partial refunds, and Connect payouts are explicitly out of scope for this ADR.

## Amendment (2026-07-03) — pluggable `PaymentProvider` interface

Nodes deploy everywhere, and "everywhere" does not always mean Stripe (regional PSPs, public-sector procurement, co-op banking partners). The payment layer is therefore a **provider interface, not a Stripe module** — mirroring the existing `EmailProvider` pattern:

- Each app has `src/lib/payments/` containing `types.ts` (the `PaymentProvider` interface: `id`, `createCheckoutSession()`, `parseWebhookEvent()`, plus optional `getCheckoutSession()` for session-liveness checks — used to resume or regenerate pending checkouts instead of offering stale links), `stripe.ts` (the Stripe implementation), and `index.ts` (provider selection from environment: Stripe when `STRIPE_SECRET_KEY` is set, otherwise `null` → offline settlement mode).
- No module outside `src/lib/payments/` may import a PSP SDK. Services, routes, and UI depend only on the interface and the generic `Payment` record.
- The `Payment` columns are provider-neutral: `providerSessionId`, `providerPaymentReference`, `providerCheckoutUrl`. `Payment.provider` stores the implementation's `id` (`'stripe'`, `'offline'`, or a custom id).
- The webhook route is `POST /api/webhooks/payments` for every provider. It hands the raw body and headers to the active provider's `parseWebhookEvent()`, which authenticates the event (signature verification for Stripe) and maps it to the generic lifecycle (`payment.succeeded` / `payment.canceled` / ignored). With no provider configured it returns 503.
- Plugging in a gateway = implementing the interface in one file and selecting it in `index.ts`. Each app's `DEPLOYMENT.md` documents the steps.
