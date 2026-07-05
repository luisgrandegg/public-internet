// GENERATED — do not edit manually. Run: pnpm --filter @public-internet/stay-sdk generate
import type { ApiClient } from '../client.js'
import type { GuestEnquiry } from './types.js'

export class EnquiriesResource {
  constructor(private readonly client: ApiClient) {}

  /**
   * List the authenticated guest's enquiries, newest first
   * Requires authentication.
   */
  list(params?: Record<string, string | number | boolean | undefined>): Promise<Array<GuestEnquiry>> {
    return this.client.get('/api/enquiries', params)
  }

}
