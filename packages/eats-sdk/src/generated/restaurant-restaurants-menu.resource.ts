// GENERATED — do not edit manually. Run: pnpm --filter @public-internet/eats-sdk generate
import type { ApiClient } from '../client.js'
import type { MenuItem, CreateMenuItemInput } from './types.js'

export class RestaurantRestaurantsMenuResource {
  constructor(private readonly client: ApiClient) {}

  /**
   * Add a menu item to a restaurant
   * Requires authentication.
   */
  create(id: string, body: CreateMenuItemInput): Promise<MenuItem> {
    return this.client.post(`/api/restaurant/restaurants/${id}/menu`, body)
  }

}
