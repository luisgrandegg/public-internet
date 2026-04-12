// GENERATED — do not edit manually. Run: pnpm --filter @public-internet/touristical-renting-sdk generate
import type { ApiClient } from '../client.js'
import type { Enquiry } from './types.js'

export class HostEnquiriesReplyResource {
  constructor(private readonly client: ApiClient) {}

  /**
   * Reply to a guest enquiry
   * Requires authentication.
   */
  create(id: string): Promise<Enquiry> {
    return this.client.post(`/api/host/enquiries/${id}/reply`)
  }

}
