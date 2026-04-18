// GENERATED — do not edit manually. Run: pnpm --filter @public-internet/eats-sdk generate
import type { ApiClient } from '../client.js'
import type { Restaurant, CreateRestaurantInput } from './types.js'

export class RestaurantRestaurantsResource {
  constructor(private readonly client: ApiClient) {}

  /**
   * Register a new restaurant (sets isRestaurantOwner)
   * Requires authentication.
   */
  create(body: CreateRestaurantInput): Promise<Restaurant> {
    return this.client.post('/api/restaurant/restaurants', body)
  }

}
