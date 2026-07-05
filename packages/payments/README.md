# @public-internet/payments

Shared payment infrastructure for Public Internet nodes (ADR-006 + amendment, ADR-007).
Owns the `PaymentProvider` interface, the built-in `StripePaymentProvider`, env-driven
provider selection, and the generic payment-webhook route factory. Apps configure;
they do not reimplement.

**Only this package may import a PSP SDK** (`stripe` or any other). App services,
routes, and UI depend exclusively on the interface and their own generic `Payment`
record.

## Usage

### Provider selection (app's `src/lib/payments/index.ts`)

```ts
import { selectPaymentProvider } from '@public-internet/payments'

export type {
  CheckoutLineItem,
  CheckoutSession,
  CheckoutSessionRequest,
  PaymentProvider,
  PaymentWebhookEvent,
} from '@public-internet/payments'

// STRIPE_SECRET_KEY set  → StripePaymentProvider (hosted Stripe Checkout).
// nothing configured     → null: offline settlement mode (ADR-006 §3).
export const paymentProvider = selectPaymentProvider()
```

Everything else in the app keeps importing from `@/lib/payments` — the thin module
above is the single seam.

### Creating a checkout session

```ts
import { paymentProvider } from '@/lib/payments'

if (paymentProvider) {
  const { sessionId, checkoutUrl } = await paymentProvider.createCheckoutSession({
    paymentId: payment.id,
    referenceId: booking.id, // or order.id
    amountCents: totalCost,  // exactly the displayed total — never add fees
    currency: 'eur',
    lineItems: [{ name: 'Two nights at …', amountCents: totalCost, quantity: 1 }],
    successUrl: `${appUrl}/bookings/${booking.id}?paid=1`,
    cancelUrl: `${appUrl}/bookings/${booking.id}`,
  })
}
```

### Webhook route (app's `src/app/api/webhooks/payments/route.ts`)

```ts
import { createPaymentWebhookHandler } from '@public-internet/payments'
import { db } from '@/lib/db'
import { paymentProvider } from '@/lib/payments'

export const POST = createPaymentWebhookHandler({
  provider: paymentProvider,
  onSucceeded: async (event) => {
    await db.payment.updateMany({
      where: { providerSessionId: event.sessionId, status: 'PENDING' },
      data: { status: 'SUCCEEDED', providerPaymentReference: event.paymentReference },
    })
  },
  onCanceled: async (event) => {
    // App-specific lifecycle effect — see "Callback contract" below.
  },
})
```

## Callback contract

`createPaymentWebhookHandler(options)` authenticates and translates the webhook;
the **app owns the database effects** via two callbacks:

| Callback | Fired for | The app must |
|---|---|---|
| `onSucceeded(event)` | `payment.succeeded` (e.g. Stripe `checkout.session.completed`) | Mark the payment `SUCCEEDED` and store `event.paymentReference` (the provider's durable settlement reference). |
| `onCanceled(event)` | `payment.canceled` (canceled/expired checkout — ADR-006 §4) | Release whatever the abandoned checkout was holding. Stay deletes the still-`PENDING` booking so its dates free up; Eats flips the still-`PENDING` payment to `CANCELED` so the order stays inert. |

Rules for both callbacks:

- **Idempotent.** Providers retry, and events can arrive out of order or reference
  sessions this node has never seen. Use a single atomic write whose state guard
  lives in the `WHERE` clause (`updateMany`/`deleteMany` matching
  `providerSessionId` + `status: 'PENDING'`) — never read-then-write.
- **Match by `event.sessionId`** against the `Payment.providerSessionId` column.
- A callback that throws produces a 500 response, and the provider will retry.

Handler responses (HTTP status is the source of truth):

| Status | Body | When |
|---|---|---|
| 503 | `{ error: { code: 'PAYMENTS_NOT_CONFIGURED', message } }` | `options.provider` is `null` (offline settlement mode) |
| 400 | `{ error: { code: 'VALIDATION_ERROR', message: 'Webhook authentication failed' } }` | `parseWebhookEvent()` threw (bad/missing signature) |
| 200 | `{ data: { received: true } }` | Event processed, or acknowledged as `ignored` |
| 500 | `{ error: { code: 'INTERNAL_ERROR', message } }` | A lifecycle callback threw |

## Canonical `Payment` Prisma schema block

Prisma has no schema composition, so each app keeps this block (and its own
migrations) in `prisma/schema.prisma`. Cross-app drift is prevented by this
package's types, not by sharing the schema file. Paste and adapt the relation
(`booking`/`order`) to your money-bearing record:

```prisma
// One Payment per Booking/Order, created in the same transaction (ADR-006).
// provider stores the PaymentProvider id ('stripe', a custom id, …) for
// payments settled online, or 'offline' when settled directly — string
// (not enum) so new providers need no migration (ADR-006 amendment).
model Payment {
  id                       String        @id @default(cuid())
  booking                  Booking       @relation(fields: [bookingId], references: [id], onDelete: Cascade)
  bookingId                String        @unique
  provider                 String        // PaymentProvider id ('stripe', …) or 'offline'
  status                   PaymentStatus
  // Amount in cents — exactly the pre-confirmation total. Never recomputed.
  amount                   Int
  currency                 String        @default("eur")
  // Provider-neutral references (ADR-006 amendment): the hosted checkout
  // session id, the provider's settlement reference (e.g. a Stripe payment
  // intent id), and the checkout URL stored at creation so a pending payment
  // can be resumed without a provider API call.
  providerSessionId        String?
  providerPaymentReference String?
  providerCheckoutUrl      String?
  createdAt                DateTime      @default(now())
  updatedAt                DateTime      @updatedAt
}

enum PaymentStatus {
  PENDING
  SUCCEEDED
  FAILED
  CANCELED
}
```

## Plugging in a custom gateway

1. Implement `PaymentProvider` (from this package) in a file inside your app's
   `src/lib/payments/` — the only app code allowed to import that PSP's SDK.
   `parseWebhookEvent()` MUST authenticate the raw request (throw on a bad or
   missing signature) before mapping events to the generic lifecycle.
2. Select it in the app's `src/lib/payments/index.ts` from your own env vars,
   falling back to `selectPaymentProvider()`.
3. Point the PSP's webhooks at `POST /api/webhooks/payments` — the route is
   provider-agnostic.

Constraints for every provider: the charged amount is exactly the displayed
total (no fees, no surcharges — CONSTITUTION.md), and payment confirmation
comes only from the authenticated webhook, never from the success redirect.
