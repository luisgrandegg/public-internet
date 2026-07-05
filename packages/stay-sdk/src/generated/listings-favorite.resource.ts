// GENERATED — do not edit manually. Run: pnpm --filter @public-internet/stay-sdk generate
import type { ApiClient } from '../client.js'
import type { FavoriteStatus } from './types.js'

export class ListingsFavoriteResource {
  constructor(private readonly client: ApiClient) {}

  /**
   * Save a listing to the signed-in user's favorites
   * Requires authentication.
   */
  create(id: string): Promise<FavoriteStatus> {
    return this.client.post(`/api/listings/${id}/favorite`)
  }

  /**
   * Remove a listing from the signed-in user's favorites
   * Requires authentication.
   */
  delete(id: string): Promise<void> {
    return this.client.delete(`/api/listings/${id}/favorite`)
  }

}
