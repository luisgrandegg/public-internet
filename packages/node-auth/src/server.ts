import { betterAuth } from 'better-auth'
import type { BetterAuthOptions } from 'better-auth'
import { prismaAdapter } from '@better-auth/prisma-adapter'
import { nextCookies } from 'better-auth/next-js'

/**
 * The `additionalFields` map accepted by better-auth's `user` config.
 * Each app passes its own role fields (e.g. Stay's `isHost`, Eats'
 * `isRestaurantOwner` / `isCourier`) — they flow through generically so
 * `typeof auth.$Infer.Session.user` keeps the app-specific fields.
 */
export type NodeAuthAdditionalUserFields = NonNullable<
  NonNullable<BetterAuthOptions['user']>['additionalFields']
>

/**
 * The Prisma client instance injected by the app. Structural — each app
 * generates its own client to `src/__generated__/prisma/`, so this package
 * never imports a concrete `PrismaClient` type.
 */
export type NodeAuthDatabase = Parameters<typeof prismaAdapter>[0]

/**
 * Minimal structural slice of the app's `EmailProvider` that auth needs —
 * only password-reset delivery. Both apps' providers satisfy this shape.
 */
export interface NodeAuthEmailProvider {
  sendPasswordReset(data: {
    to: string
    name: string
    resetLink: string
  }): Promise<void>
}

export interface NodeAuthOptions<
  TFields extends NodeAuthAdditionalUserFields,
> {
  /** The app's Prisma client instance (from `src/lib/db.ts`). */
  db: NodeAuthDatabase
  /** The app's email provider (from `src/lib/email/`). */
  emailProvider: NodeAuthEmailProvider
  /** App-specific `user.additionalFields` (role flags etc.). */
  additionalFields: TFields
}

/**
 * Whether the optional Google social strategy is enabled on this node.
 *
 * True only when BOTH `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set
 * in the environment. Per ADR-007 (and ADR-004's "no OAuth dependency"),
 * Google sign-in is a per-node convenience, never a requirement — a node
 * without the credentials behaves exactly as before, email + password only.
 * Use this in server components to gate "Continue with Google" UI.
 */
export function isGoogleAuthEnabled(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
  )
}

/**
 * Create the configured better-auth instance for a Public Internet node
 * (ADR-007). Owns the recipe every app used to duplicate:
 *
 * - secret + baseURL from `BETTER_AUTH_SECRET` / `NEXT_PUBLIC_APP_URL`
 * - Prisma adapter over the injected db client (PostgreSQL)
 * - email + password always enabled, password reset wired to the injected
 *   email provider
 * - Google social strategy, only when the node's env carries credentials
 * - the `nextCookies()` plugin, last
 *
 * Apps keep their better-auth Prisma model blocks (User/Session/Account/
 * Verification — see this package's README) and their own type re-exports
 * (`export type Session = typeof auth.$Infer.Session`).
 */
export function createNodeAuth<TFields extends NodeAuthAdditionalUserFields>(
  options: NodeAuthOptions<TFields>
) {
  return betterAuth({
    secret: process.env.BETTER_AUTH_SECRET!,
    baseURL: process.env.NEXT_PUBLIC_APP_URL!,
    database: prismaAdapter(options.db, { provider: 'postgresql' }),
    emailAndPassword: {
      enabled: true,
      sendResetPassword: async ({ user, url }) => {
        await options.emailProvider.sendPasswordReset({
          to: user.email,
          name: user.name,
          resetLink: url,
        })
      },
    },
    // Optional per-node social strategies (ADR-007 §3). Enabled purely by
    // configuration — no credentials, no Google, and the node keeps working.
    socialProviders: isGoogleAuthEnabled()
      ? {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          },
        }
      : undefined,
    user: {
      additionalFields: options.additionalFields,
    },
    // Must be last — lets auth.api calls inside Server Actions set the session
    // cookie via next/headers. Without it, sign-in/sign-up return ok but the
    // browser never receives a session.
    plugins: [nextCookies()],
  })
}

/**
 * Re-exported so apps mount the auth Route Handler without importing
 * better-auth directly (ADR-007: apps import better-auth only via this
 * package).
 */
export { toNextJsHandler } from 'better-auth/next-js'
