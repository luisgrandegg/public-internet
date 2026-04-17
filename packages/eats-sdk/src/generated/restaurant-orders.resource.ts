// GENERATED — do not edit manually. Run: pnpm --filter @public-internet/eats-sdk generate
import type { ApiClient } from '../client.js'
import type { Order } from './types.js'

export class RestaurantOrdersResource {
  constructor(private readonly client: ApiClient) {}

  /**
   * Update an order status (owner workflow only)
   * Requires authentication.
   */
  update(id: string): Promise<Order> {
    return this.client.patch(`/api/restaurant/orders/${id}`)
  }

  /**
   * List orders for restaurants owned by the signed-in owner
   * Requires authentication.
   */
  list(params?: Record<string, string | number | boolean | undefined>): Promise<Array<Order>> {
    return this.client.get('/api/restaurant/orders', params)
  }

}
