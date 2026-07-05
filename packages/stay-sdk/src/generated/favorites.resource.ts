// GENERATED — do not edit manually. Run: pnpm --filter @public-internet/stay-sdk generate
import type { ApiClient } from '../client.js'
import type { Listing } from './types.js'

export class FavoritesResource {
  constructor(private readonly client: ApiClient) {}

  /**
   * List the signed-in user's favorited listings
   * Requires authentication.
   */
  list(params?: Record<string, string | number | boolean | undefined>): Promise<Array<Listing>> {
    return this.client.get('/api/favorites', params)
  }

}
