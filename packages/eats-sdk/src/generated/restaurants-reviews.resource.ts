// GENERATED — do not edit manually. Run: pnpm --filter @public-internet/eats-sdk generate
import type { ApiClient } from '../client.js'
import type { PaginatedReviews } from './types.js'

export class RestaurantsReviewsResource {
  constructor(private readonly client: ApiClient) {}

  /**
   * List reviews for a restaurant (public, recent first)
   */
  get(id: string): Promise<PaginatedReviews> {
    return this.client.get(`/api/restaurants/${id}/reviews`)
  }

}
