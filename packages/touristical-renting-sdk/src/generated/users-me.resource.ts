// GENERATED — do not edit manually. Run: pnpm --filter @public-internet/touristical-renting-sdk generate
import type { ApiClient } from '../client.js'
import type { UserProfile, UserProfileSummary, UpdateProfileInput } from './types.js'

export class UsersMeResource {
  constructor(private readonly client: ApiClient) {}

  /**
   * Get current user profile
   * Requires authentication.
   */
  list(params?: Record<string, string | number | boolean | undefined>): Promise<UserProfile> {
    return this.client.get('/api/users/me', params)
  }

  /**
   * Update current user profile
   * Requires authentication.
   */
  update(body: UpdateProfileInput): Promise<UserProfileSummary> {
    return this.client.patch('/api/users/me', body)
  }

}
