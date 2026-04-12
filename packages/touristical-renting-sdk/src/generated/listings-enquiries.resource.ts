// GENERATED — do not edit manually. Run: pnpm --filter @public-internet/touristical-renting-sdk generate
import type { ApiClient } from '../client.js'
import type { Enquiry } from './types.js'

export class ListingsEnquiriesResource {
  constructor(private readonly client: ApiClient) {}

  /**
   * Send an enquiry to a listing's host
   * Requires authentication.
   */
  create(id: string): Promise<Enquiry> {
    return this.client.post(`/api/listings/${id}/enquiries`)
  }

}
