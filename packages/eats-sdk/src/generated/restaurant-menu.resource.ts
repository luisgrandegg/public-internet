// GENERATED — do not edit manually. Run: pnpm --filter @public-internet/eats-sdk generate
import type { ApiClient } from '../client.js'
import type { MenuItem, UpdateMenuItemInput } from './types.js'

export class RestaurantMenuResource {
  constructor(private readonly client: ApiClient) {}

  /**
   * Update a menu item
   * Requires authentication.
   */
  update(id: string, body: UpdateMenuItemInput): Promise<MenuItem> {
    return this.client.patch(`/api/restaurant/menu/${id}`, body)
  }

  /**
   * Remove a menu item
   * Requires authentication.
   */
  delete(id: string): Promise<void> {
    return this.client.delete(`/api/restaurant/menu/${id}`)
  }

}
