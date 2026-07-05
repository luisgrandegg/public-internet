// GENERATED — do not edit manually. Run: pnpm --filter @public-internet/stay-sdk generate
import type { ApiClient } from '../client.js'
import type { AvailabilityBlock, CreateAvailabilityBlockInput } from './types.js'

export class HostListingsAvailabilityBlocksResource {
  constructor(private readonly client: ApiClient) {}

  /**
   * Remove an availability block from one of the host's listings
   * Requires authentication.
   */
  delete(id: string, blockId: string): Promise<void> {
    return this.client.delete(`/api/host/listings/${id}/availability-blocks/${blockId}`)
  }

  /**
   * List availability blocks for one of the host's listings
   * Requires authentication.
   */
  get(id: string): Promise<Array<AvailabilityBlock>> {
    return this.client.get(`/api/host/listings/${id}/availability-blocks`)
  }

  /**
   * Block a date range on one of the host's listings
   * Requires authentication.
   */
  create(id: string, body: CreateAvailabilityBlockInput): Promise<AvailabilityBlock> {
    return this.client.post(`/api/host/listings/${id}/availability-blocks`, body)
  }

}
