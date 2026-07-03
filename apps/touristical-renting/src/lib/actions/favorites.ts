'use server'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'

export type FavoriteActionResult =
  | { ok: true; favorited: boolean }
  | { ok: false; error: string }

/**
 * Save or unsave a listing for the signed-in user.
 * Thin wrapper over POST/DELETE /api/listings/:id/favorite.
 */
export async function setFavoriteAction(
  listingId: string,
  favorited: boolean,
): Promise<FavoriteActionResult> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  try {
    const res = await fetch(`${baseUrl}/api/listings/${listingId}/favorite`, {
      method: favorited ? 'POST' : 'DELETE',
      headers: { cookie: (await headers()).get('cookie') ?? '' },
    })

    if (res.ok) {
      revalidatePath('/favorites')
      return { ok: true, favorited }
    }

    const json = await res.json().catch(() => ({}))
    return { ok: false, error: json?.error?.message ?? 'Could not update your favorites. Please try again.' }
  } catch {
    return { ok: false, error: 'Could not update your favorites. Please try again.' }
  }
}
