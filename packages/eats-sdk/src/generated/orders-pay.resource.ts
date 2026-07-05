// GENERATED — do not edit manually. Run: pnpm --filter @public-internet/eats-sdk generate
import type { ApiClient } from '../client.js'
import type { CheckoutResume } from './types.js'

export class OrdersPayResource {
  constructor(private readonly client: ApiClient) {}

  /**
   * Resume the online payment for an order (order owner only)
   * Requires authentication.
   */
  create(id: string): Promise<CheckoutResume> {
    return this.client.post(`/api/orders/${id}/pay`)
  }

}
