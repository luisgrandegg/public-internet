// GENERATED — do not edit manually. Run: pnpm --filter @public-internet/eats-sdk generate
import type { ApiClient } from '../client.js'
import type { Order, PlacedOrder, CreateOrderInput } from './types.js'

export class OrdersResource {
  constructor(private readonly client: ApiClient) {}

  /**
   * Get an order by ID (owner only)
   * Requires authentication.
   */
  get(id: string): Promise<Order> {
    return this.client.get(`/api/orders/${id}`)
  }

  /**
   * Place an order
   * Requires authentication.
   */
  create(body: CreateOrderInput): Promise<PlacedOrder> {
    return this.client.post('/api/orders', body)
  }

}
