// GENERATED — do not edit manually. Run: pnpm --filter @public-internet/eats-sdk generate
import type { ApiClient } from '../client.js'

export class WebhooksStripeResource {
  constructor(private readonly client: ApiClient) {}

  /**
   * Stripe webhook receiver (signature-verified, no session auth)
   */
  create(): Promise<{
  received?: boolean
}> {
    return this.client.post('/api/webhooks/stripe')
  }

}
