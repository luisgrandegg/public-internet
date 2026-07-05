import type { PaymentProvider, PaymentWebhookEvent } from './types'

export type PaymentSucceededEvent = Extract<PaymentWebhookEvent, { type: 'payment.succeeded' }>
export type PaymentCanceledEvent = Extract<PaymentWebhookEvent, { type: 'payment.canceled' }>

export interface PaymentWebhookHandlerOptions {
  /**
   * The node's active payment provider (usually the app's `paymentProvider`
   * from its src/lib/payments/index.ts). `null` → offline settlement mode:
   * every request is answered with 503 PAYMENTS_NOT_CONFIGURED.
   */
  provider: PaymentProvider | null
  /**
   * Lifecycle effect for `payment.succeeded` — the app owns the DB write
   * (e.g. flip the PENDING payment to SUCCEEDED and store the provider's
   * durable payment reference). MUST be idempotent: providers retry, and
   * events can arrive out of order or reference sessions this node doesn't
   * know — guard state in the WHERE clause of a single atomic write.
   */
  onSucceeded: (event: PaymentSucceededEvent) => Promise<void>
  /**
   * Lifecycle effect for `payment.canceled` (canceled/expired checkout —
   * ADR-006 §4). The app owns the effect: Stay deletes the still-PENDING
   * booking to release its dates; Eats marks the still-PENDING payment
   * CANCELED so the order stays inert. Same idempotency rules as onSucceeded.
   */
  onCanceled: (event: PaymentCanceledEvent) => Promise<void>
  /** Message for the 503 PAYMENTS_NOT_CONFIGURED response body. */
  notConfiguredMessage?: string
}

function json(status: number, body: unknown): Response {
  return Response.json(body, { status })
}

/**
 * Factory for the generic `POST /api/webhooks/payments` route handler
 * (ADR-006 amendment, ADR-007). The returned function is a valid Next.js
 * Route Handler export.
 *
 * The endpoint is intentionally exempt from session auth — authenticity is
 * established exclusively by the active provider's `parseWebhookEvent()`,
 * which authenticates the raw request (signature verification for Stripe)
 * and throws on failure → 400. The success redirect back to the app is never
 * trusted as proof of payment; only an authenticated `payment.succeeded`
 * event settles a payment.
 *
 * Responses:
 *   503 { error: { code: 'PAYMENTS_NOT_CONFIGURED' } } — no provider (offline mode)
 *   400 { error: { code: 'VALIDATION_ERROR' } }        — webhook authentication failed
 *   200 { data: { received: true } }                   — event processed or acknowledged
 *   500 { error: { code: 'INTERNAL_ERROR' } }          — a lifecycle callback threw
 */
export function createPaymentWebhookHandler(
  options: PaymentWebhookHandlerOptions,
): (req: Request) => Promise<Response> {
  return async (req: Request): Promise<Response> => {
    const { provider } = options
    if (!provider) {
      return json(503, {
        error: {
          code: 'PAYMENTS_NOT_CONFIGURED',
          message: options.notConfiguredMessage ?? 'No payment provider is configured on this node',
        },
      })
    }

    // Webhook authentication needs the exact raw body — never parse first.
    const rawBody = await req.text()

    let event: PaymentWebhookEvent
    try {
      event = await provider.parseWebhookEvent(rawBody, req.headers)
    } catch {
      return json(400, {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Webhook authentication failed',
        },
      })
    }

    try {
      if (event.type === 'payment.succeeded') {
        await options.onSucceeded(event)
      } else if (event.type === 'payment.canceled') {
        await options.onCanceled(event)
      }
      // 'ignored' events are acknowledged so the provider stops retrying.
      return json(200, { data: { received: true } })
    } catch (error) {
      console.error('[webhooks/payments] failed to process event', error)
      return json(500, {
        error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
      })
    }
  }
}
