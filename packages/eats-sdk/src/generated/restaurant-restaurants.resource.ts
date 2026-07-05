// GENERATED — do not edit manually. Run: pnpm --filter @public-internet/eats-sdk generate
import type { ApiClient } from '../client.js'
import type { Restaurant, UpdateRestaurantInput, CreateRestaurantInput } from './types.js'

export class RestaurantRestaurantsResource {
  constructor(private readonly client: ApiClient) {}

  /**
   * Update restaurant details
   * Requires authentication.
   */
  update(id: string, body: UpdateRestaurantInput): Promise<Restaurant> {
    return this.client.patch(`/api/restaurant/restaurants/${id}`, body)
  }

  /**
   * Register a new restaurant (sets isRestaurantOwner)
   * Requires authentication.
   */
  create(body: CreateRestaurantInput): Promise<Restaurant> {
    return this.client.post('/api/restaurant/restaurants', body)
  }

}
