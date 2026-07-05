import { createAuthClient } from 'better-auth/react'

export interface NodeAuthClientOptions {
  /**
   * Base URL of the node. Defaults to `NEXT_PUBLIC_APP_URL`; when neither is
   * available (e.g. the env var was not inlined) better-auth falls back to
   * the current origin, which is always correct for a node — the app and its
   * auth API share one deployment.
   */
  baseURL?: string
}

/** The configured better-auth React client for a node. */
export type NodeAuthClient = ReturnType<
  typeof createAuthClient<{ baseURL?: string }>
>

/**
 * Create the browser auth client for a Public Internet node (ADR-007).
 * Wraps better-auth's React client, so `useSession` is a React hook and
 * `signIn.social({ provider: 'google', callbackURL: '/' })` is available for
 * nodes that enable the optional Google strategy.
 *
 * Import from `@public-internet/node-auth/client` only — this entry never
 * pulls in server code.
 */
export function createNodeAuthClient(
  options: NodeAuthClientOptions = {}
): NodeAuthClient {
  return createAuthClient({
    baseURL: options.baseURL ?? process.env.NEXT_PUBLIC_APP_URL,
  })
}
