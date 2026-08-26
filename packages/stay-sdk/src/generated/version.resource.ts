// GENERATED — do not edit manually. Run: pnpm --filter @public-internet/stay-sdk generate
import type { ApiClient } from '../client.js'
import type { NodeVersion } from './types.js'

export class VersionResource {
  constructor(private readonly client: ApiClient) {}

  /**
   * Report the release this node is running
   */
  list(params?: Record<string, string | number | boolean | undefined>): Promise<NodeVersion> {
    return this.client.get('/api/version', params)
  }

}
