// GENERATED — do not edit manually. Run: pnpm --filter @public-internet/touristical-renting-sdk generate
import type { ApiClient } from '../client.js'
import type { BookingPaymentResume } from './types.js'

export class BookingsPayResource {
  constructor(private readonly client: ApiClient) {}

  /**
   * Get a live checkout URL for a booking's pending online payment
   * Requires authentication.
   */
  create(id: string): Promise<BookingPaymentResume> {
    return this.client.post(`/api/bookings/${id}/pay`)
  }

}
