import { cookies } from 'next/headers'

/**
 * Forward the session cookie header when calling our own REST API from a Server Action.
 * better-auth uses cookies, so we must pass them through.
 */
export async function forwardAuthHeaders(): Promise<Record<string, string>> {
  const cookieStore = await cookies()
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join('; ')
  return {
    'Content-Type': 'application/json',
    ...(cookieHeader && { cookie: cookieHeader }),
  }
}

/**
 * Build an absolute URL to the app's own REST API.
 * Uses the public app URL so the fetch respects better-auth's cookie domain config.
 */
export function apiUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3001'
  return `${base}${path}`
}
