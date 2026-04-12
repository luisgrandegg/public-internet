// GENERATED — do not edit manually. Run: pnpm --filter @public-internet/touristical-renting-sdk generate
import type { ApiClient } from '../client.js'
import type { Review, CreateReviewInput } from './types.js'

export class BookingsReviewResource {
  constructor(private readonly client: ApiClient) {}

  /**
   * Submit a review for a completed booking
   * Requires authentication.
   */
  create(id: string, body: CreateReviewInput): Promise<Review> {
    return this.client.post(`/api/bookings/${id}/review`, body)
  }

}
