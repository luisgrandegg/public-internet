// GENERATED — do not edit manually. Run: pnpm --filter @public-internet/stay-sdk generate
import type { ApiClient } from '../client.js'

export class UsersMeBecomeHostResource {
  constructor(private readonly client: ApiClient) {}

  /**
   * Enable host status for the current user
   * Requires authentication.
   */
  create(): Promise<{
  isHost?: boolean
}> {
    return this.client.post('/api/users/me/become-host')
  }

}
