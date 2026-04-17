// GENERATED — do not edit manually. Run: pnpm --filter @public-internet/eats-sdk generate
import type { ApiClient } from '../client.js'
import type { MenuItem } from './types.js'

export class RestaurantsMenuResource {
  constructor(private readonly client: ApiClient) {}

  /**
   * List a restaurant's available menu items (customer view)
   */
  get(id: string): Promise<Array<MenuItem>> {
    return this.client.get(`/api/restaurants/${id}/menu`)
  }

}
