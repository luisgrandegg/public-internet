// GENERATED — do not edit manually. Run: pnpm --filter @public-internet/touristical-renting-sdk generate
import type { ApiClient } from '../client.js'
import type { Booking } from './types.js'

export class HostBookingsResource {
  constructor(private readonly client: ApiClient) {}

  /**
   * List bookings for all of the authenticated host's listings
   * Requires authentication.
   */
  list(params?: Record<string, string | number | boolean | undefined>): Promise<Array<Booking>> {
    return this.client.get('/api/host/bookings', params)
  }

}
