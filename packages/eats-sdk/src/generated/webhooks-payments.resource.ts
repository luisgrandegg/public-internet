// GENERATED — do not edit manually. Run: pnpm --filter @public-internet/eats-sdk generate
import type { ApiClient } from '../client.js'

export class WebhooksPaymentsResource {
  constructor(private readonly client: ApiClient) {}

  /**
   * Payment provider webhook receiver (provider-authenticated, no session auth)
   */
  create(): Promise<{
  received?: boolean
}> {
    return this.client.post('/api/webhooks/payments')
  }

}
