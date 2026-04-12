// GENERATED — do not edit manually. Run: pnpm --filter @public-internet/touristical-renting-sdk generate
import type { ApiClient } from '../client.js'
import type { Booking, CreateBookingInput } from './types.js'

export class BookingsResource {
  constructor(private readonly client: ApiClient) {}

  /**
   * Get a booking by ID
   * Requires authentication.
   */
  get(id: string): Promise<Booking> {
    return this.client.get(`/api/bookings/${id}`)
  }

  /**
   * Create a booking
   * Requires authentication.
   */
  create(body: CreateBookingInput): Promise<Booking> {
    return this.client.post('/api/bookings', body)
  }

}
