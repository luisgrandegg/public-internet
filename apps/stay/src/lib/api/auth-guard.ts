import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import type { Session, User } from '@/lib/auth'

interface SessionData {
  session: Session['session']
  user: User
}

/**
 * Extract and verify the session from a Route Handler request.
 * Returns null if the request is unauthenticated.
 */
export async function getRequestSession(req: NextRequest): Promise<SessionData | null> {
  return auth.api.getSession({ headers: req.headers })
}

/**
 * Require a valid session. Use this when a 401 should be returned if not signed in.
 * Returns the session data or null (the caller must handle the null case).
 */
export async function requireSession(req: NextRequest): Promise<SessionData | null> {
  return getRequestSession(req)
}
