// GENERATED — do not edit manually. Run: pnpm --filter @public-internet/touristical-renting-sdk generate
import type { ApiClient } from '../client.js'

export class WebhooksStripeResource {
  constructor(private readonly client: ApiClient) {}

  /**
   * Stripe webhook receiver
   */
  create(): Promise<{
  received?: boolean
}> {
    return this.client.post('/api/webhooks/stripe')
  }

}
