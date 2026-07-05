// GENERATED — do not edit manually. Run: pnpm --filter @public-internet/stay-sdk generate
import type { ApiClient } from '../client.js'
import type { HostListing } from './types.js'

export class HostListingsResource {
  constructor(private readonly client: ApiClient) {}

  /**
   * List the authenticated host's listings
   * Requires authentication.
   */
  list(params?: Record<string, string | number | boolean | undefined>): Promise<Array<HostListing>> {
    return this.client.get('/api/host/listings', params)
  }

}
