// GENERATED — do not edit manually. Run: pnpm --filter @public-internet/stay-sdk generate
import type { ApiClient } from '../client.js'
import type { UserDataExport } from './types.js'

export class UsersMeExportResource {
  constructor(private readonly client: ApiClient) {}

  /**
   * Export all user data as JSON
   * Requires authentication.
   */
  list(params?: Record<string, string | number | boolean | undefined>): Promise<UserDataExport> {
    return this.client.get('/api/users/me/export', params)
  }

}
