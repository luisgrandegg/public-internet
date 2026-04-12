'use server'

import { headers } from 'next/headers'

export type ReviewResult =
  | { ok: true }
  | { ok: false; error: string }

export async function createReviewAction(
  bookingId: string,
  targetId: string,
  targetRole: 'guest' | 'host',
  rating: number,
  body: string,
): Promise<ReviewResult> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/bookings/${bookingId}/review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(Object.fromEntries(await headers())),
      },
      body: JSON.stringify({ targetId, targetRole, rating, body }),
    })

    const data = await res.json()

    if (res.status === 409) {
      return { ok: false, error: 'You have already submitted a review for this booking.' }
    }

    if (!res.ok) {
      return { ok: false, error: data?.error?.message ?? 'Could not submit review. Please try again.' }
    }

    return { ok: true }
  } catch {
    return { ok: false, error: 'Could not submit review. Please try again.' }
  }
}
