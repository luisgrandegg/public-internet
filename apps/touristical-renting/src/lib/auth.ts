import { betterAuth } from 'better-auth'
import { nextCookies } from 'better-auth/next-js'
import { prismaAdapter } from '@better-auth/prisma-adapter'
import { db } from './db'
import { emailProvider } from './email'

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.NEXT_PUBLIC_APP_URL!,
  database: prismaAdapter(db, { provider: 'postgresql' }),
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      await emailProvider.sendPasswordReset({
        to: user.email,
        name: user.name,
        resetLink: url,
      })
    },
  },
  user: {
    additionalFields: {
      isHost: {
        type: 'boolean',
        defaultValue: false,
        required: false,
      },
    },
  },
  // Must be last — lets auth.api calls inside Server Actions set the session
  // cookie via next/headers. Without it, sign-in/sign-up return ok but the
  // browser never receives a session.
  plugins: [nextCookies()],
})

export type Session = typeof auth.$Infer.Session
export type User = typeof auth.$Infer.Session.user
