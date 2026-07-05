// GENERATED — do not edit manually. Run: pnpm --filter @public-internet/eats-sdk generate
import type { ApiClient } from '../client.js'
import type { Review, CreateReviewInput } from './types.js'

export class OrdersReviewResource {
  constructor(private readonly client: ApiClient) {}

  /**
   * Review a delivered order's restaurant (order owner only, once per order)
   * Requires authentication.
   */
  create(id: string, body: CreateReviewInput): Promise<Review> {
    return this.client.post(`/api/orders/${id}/review`, body)
  }

}
