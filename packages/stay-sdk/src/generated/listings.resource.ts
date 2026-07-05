// GENERATED — do not edit manually. Run: pnpm --filter @public-internet/stay-sdk generate
import type { ApiClient } from '../client.js'
import type { Listing, UpdateListingInput, PaginatedListings, CreateListingInput } from './types.js'

export class ListingsResource {
  constructor(private readonly client: ApiClient) {}

  /**
   * Get a listing by ID
   */
  get(id: string): Promise<Listing> {
    return this.client.get(`/api/listings/${id}`)
  }

  /**
   * Update a listing
   * Requires authentication.
   */
  update(id: string, body: UpdateListingInput): Promise<Listing> {
    return this.client.patch(`/api/listings/${id}`, body)
  }

  /**
   * Delete a listing
   * Requires authentication.
   */
  delete(id: string): Promise<void> {
    return this.client.delete(`/api/listings/${id}`)
  }

  /**
   * List listings
   */
  list(params?: Record<string, string | number | boolean | undefined>): Promise<PaginatedListings> {
    return this.client.get('/api/listings', params)
  }

  /**
   * Create a listing
   * Requires authentication.
   */
  create(body: CreateListingInput): Promise<Listing> {
    return this.client.post('/api/listings', body)
  }

}
