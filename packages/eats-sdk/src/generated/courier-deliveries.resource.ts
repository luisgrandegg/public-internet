// GENERATED — do not edit manually. Run: pnpm --filter @public-internet/eats-sdk generate
import type { ApiClient } from '../client.js'
import type { Delivery } from './types.js'

export class CourierDeliveriesResource {
  constructor(private readonly client: ApiClient) {}

  /**
   * Transition a delivery (accept / picked_up / delivered / failed)
   * Requires authentication.
   */
  update(id: string): Promise<Delivery> {
    return this.client.patch(`/api/courier/deliveries/${id}`)
  }

  /**
   * List deliveries visible to the courier
   * Requires authentication.
   */
  list(params?: Record<string, string | number | boolean | undefined>): Promise<Array<Delivery>> {
    return this.client.get('/api/courier/deliveries', params)
  }

}
