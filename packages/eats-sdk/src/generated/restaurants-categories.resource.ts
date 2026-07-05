// GENERATED — do not edit manually. Run: pnpm --filter @public-internet/eats-sdk generate
import type { ApiClient } from '../client.js'
import type { MenuCategories } from './types.js'

export class RestaurantsCategoriesResource {
  constructor(private readonly client: ApiClient) {}

  /**
   * List distinct menu categories with available items
   */
  list(params?: Record<string, string | number | boolean | undefined>): Promise<MenuCategories> {
    return this.client.get('/api/restaurants/categories', params)
  }

}
