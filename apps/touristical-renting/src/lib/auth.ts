import { createNodeAuth } from '@public-internet/node-auth'
import { db } from './db'
import { emailProvider } from './email'

// Shared node auth recipe (ADR-007): Prisma adapter, email + password with
// reset wired to the app's email provider, optional per-node Google strategy
// (GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET), nextCookies last.
export const auth = createNodeAuth({
  db,
  emailProvider,
  additionalFields: {
    isHost: {
      type: 'boolean',
      defaultValue: false,
      required: false,
    },
  },
})

export type Session = typeof auth.$Infer.Session
export type User = typeof auth.$Infer.Session.user
