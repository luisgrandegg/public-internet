// GENERATED — do not edit manually. Run: pnpm --filter @public-internet/stay-sdk generate
import type { ApiClient } from '../client.js'

export class WebhooksPaymentsResource {
  constructor(private readonly client: ApiClient) {}

  /**
   * Payment provider webhook receiver
   */
  create(): Promise<{
  received?: boolean
}> {
    return this.client.post('/api/webhooks/payments')
  }

}
