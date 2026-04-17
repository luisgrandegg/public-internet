// GENERATED — do not edit manually. Run: pnpm --filter @public-internet/eats-sdk generate
import type { ApiClient } from '../client.js'
import type { Restaurant, PaginatedRestaurants } from './types.js'

export class RestaurantsResource {
  constructor(private readonly client: ApiClient) {}

  /**
   * Get a restaurant by ID (only if active)
   */
  get(id: string): Promise<Restaurant> {
    return this.client.get(`/api/restaurants/${id}`)
  }

  /**
   * List active restaurants
   */
  list(params?: Record<string, string | number | boolean | undefined>): Promise<PaginatedRestaurants> {
    return this.client.get('/api/restaurants', params)
  }

}
