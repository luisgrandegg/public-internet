// GENERATED — do not edit manually. Run: pnpm --filter @public-internet/stay-sdk generate
import type { ApiClient } from '../client.js'
import type { Enquiry } from './types.js'

export class HostEnquiriesResource {
  constructor(private readonly client: ApiClient) {}

  /**
   * List open (unreplied) enquiries for the authenticated host
   * Requires authentication.
   */
  list(params?: Record<string, string | number | boolean | undefined>): Promise<Array<Enquiry>> {
    return this.client.get('/api/host/enquiries', params)
  }

}
