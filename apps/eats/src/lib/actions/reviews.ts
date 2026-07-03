'use server'

import { revalidatePath } from 'next/cache'
import { forwardAuthHeaders, apiUrl } from './_internal'

export interface SubmitReviewInput {
  orderId: string
  rating: number
  body?: string
}

export type SubmitReviewResult =
  | { ok: true }
  | { ok: false; fieldErrors: Record<string, string>; globalError?: string }

/**
 * Thin wrapper over POST /api/orders/{id}/review — no business logic here.
 */
export async function submitReviewAction(
  input: SubmitReviewInput,
): Promise<SubmitReviewResult> {
  try {
    const res = await fetch(apiUrl(`/api/orders/${input.orderId}/review`), {
      method: 'POST',
      headers: await forwardAuthHeaders(),
      body: JSON.stringify({ rating: input.rating, body: input.body ?? '' }),
      cache: 'no-store',
    })

    if (res.status === 401) {
      return {
        ok: false,
        fieldErrors: {},
        globalError: 'You must be signed in to leave a review.',
      }
    }

    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      return {
        ok: false,
        fieldErrors: json.error?.fields ?? {},
        globalError: json.error?.message ?? 'Could not submit review.',
      }
    }

    revalidatePath(`/orders/${input.orderId}`)
    return { ok: true }
  } catch {
    return {
      ok: false,
      fieldErrors: {},
      globalError: 'Network error. Please try again.',
    }
  }
}
