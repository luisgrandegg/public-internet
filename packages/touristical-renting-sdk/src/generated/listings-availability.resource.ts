// GENERATED — do not edit manually. Run: pnpm --filter @public-internet/touristical-renting-sdk generate
import type { ApiClient } from '../client.js'

export class ListingsAvailabilityResource {
  constructor(private readonly client: ApiClient) {}

  /**
   * Get blocked date ranges for a listing
   */
  get(id: string): Promise<{
  blockedRanges?: Array<{
    start?: string
    end?: string
  }>
}> {
    return this.client.get(`/api/listings/${id}/availability`)
  }

}
