# @public-internet/node-auth

Shared auth infrastructure for Public Internet nodes (ADR-007). Owns the
better-auth recipe every app used to duplicate: the Prisma adapter, email +
password with password-reset wiring, optional per-node social strategies, and
the `nextCookies()` plugin. Apps configure; they do not reimplement.

**Apps import better-auth only via this package** — the same rule as
`@public-internet/payments` and PSP SDKs. Prisma schema blocks stay per-app
(Prisma has no schema composition); the canonical blocks are documented below.

## Usage

### Server (app's `src/lib/auth.ts`)

```ts
import { createNodeAuth } from '@public-internet/node-auth'
import { db } from './db'
import { emailProvider } from './email'

export const auth = createNodeAuth({
  db,
  emailProvider,
  additionalFields: {
    // App-specific role fields — typed through to auth.$Infer
    isHost: { type: 'boolean', defaultValue: false, required: false },
  },
})

export type Session = typeof auth.$Infer.Session
export type User = typeof auth.$Infer.Session.user
```

`createNodeAuth()` reads `BETTER_AUTH_SECRET` and `NEXT_PUBLIC_APP_URL` from
the environment, enables email + password, wires `sendResetPassword` to the
injected email provider (anything with
`sendPasswordReset({ to, name, resetLink })`), and registers `nextCookies()`
last so Server Actions can set the session cookie.

### Route Handler (app's `src/app/api/auth/[...all]/route.ts`)

```ts
import { auth } from '@/lib/auth'
import { toNextJsHandler } from '@public-internet/node-auth'

export const { GET, POST } = toNextJsHandler(auth)
```

### Browser client (app's `src/lib/auth-client.ts`)

```ts
'use client'

import { createNodeAuthClient } from '@public-internet/node-auth/client'

export const authClient = createNodeAuthClient()
export const { signIn, signUp, signOut, useSession } = authClient
```

The client entry is separate (`@public-internet/node-auth/client`) and never
pulls in server code. It wraps better-auth's React client, so `useSession` is
a hook and `signIn.social(...)` is available.

## Prisma model blocks

Each app keeps these canonical better-auth models in its own
`prisma/schema.prisma` (and its own migrations). Do not rename fields or
remove models; extend `User` with app-specific fields (like `isHost`) below
the required ones and mirror them in `additionalFields`.

```prisma
model User {
  id            String    @id
  name          String
  email         String    @unique
  emailVerified Boolean
  image         String?
  createdAt     DateTime
  updatedAt     DateTime
  sessions      Session[]
  accounts      Account[]
  // ...app-specific fields and relations
}

model Session {
  id        String   @id
  expiresAt DateTime
  token     String   @unique
  createdAt DateTime
  updatedAt DateTime
  ipAddress String?
  userAgent String?
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Account {
  id                    String    @id
  accountId             String
  providerId            String
  userId                String
  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  accessToken           String?
  refreshToken          String?
  idToken               String?
  accessTokenExpiresAt  DateTime?
  refreshTokenExpiresAt DateTime?
  scope                 String?
  password              String?
  createdAt             DateTime
  updatedAt             DateTime
}

model Verification {
  id         String    @id
  identifier String
  value      String
  expiresAt  DateTime
  createdAt  DateTime?
  updatedAt  DateTime?
}
```

The `Account` model already stores OAuth accounts (`providerId`, `accountId`,
tokens) — enabling a social strategy needs **no schema change**.

## Sign in with Google (optional, per node)

Google is a per-node convenience, never a requirement (ADR-004's "no OAuth
dependency" holds — ADR-007 §3). A node with no credentials runs email +
password only, exactly as before.

1. In the node operator's own Google Cloud Console, create an OAuth client
   (type **Web application**).
2. Add the authorized redirect URI:
   `https://<domain>/api/auth/callback/google`
   (plus `http://localhost:<port>/api/auth/callback/google` for local dev).
3. Set both environment variables on the node:

```bash
GOOGLE_CLIENT_ID="<oauth client id>"
GOOGLE_CLIENT_SECRET="<oauth client secret>"
```

When both are set, `createNodeAuth()` registers the Google provider and
`isGoogleAuthEnabled()` returns `true` — use it in a server component to gate
the "Continue with Google" button:

```tsx
import { isGoogleAuthEnabled } from '@public-internet/node-auth'

export default function SignInPage() {
  return <SignInForm googleEnabled={isGoogleAuthEnabled()} />
}
```

```ts
// client-side, on click:
await authClient.signIn.social({ provider: 'google', callbackURL: '/' })
```
