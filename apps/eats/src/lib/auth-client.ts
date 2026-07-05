'use client'

import { createNodeAuthClient } from '@public-internet/node-auth/client'

export const authClient = createNodeAuthClient()

export const { signIn, signUp, signOut, useSession } = authClient
