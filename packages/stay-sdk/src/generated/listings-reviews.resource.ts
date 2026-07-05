// GENERATED — do not edit manually. Run: pnpm --filter @public-internet/stay-sdk generate
import type { ApiClient } from '../client.js'
import type { Review } from './types.js'

export class ListingsReviewsResource {
  constructor(private readonly client: ApiClient) {}

  /**
   * Get published reviews for a listing
   */
  get(id: string): Promise<Array<Review>> {
    return this.client.get(`/api/listings/${id}/reviews`)
  }

}
