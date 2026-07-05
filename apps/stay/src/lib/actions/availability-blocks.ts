'use server'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'

export type AvailabilityBlockActionResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string> }

export async function createAvailabilityBlockAction(
  _prev: AvailabilityBlockActionResult | null,
  formData: FormData,
): Promise<AvailabilityBlockActionResult> {
  const listingId = String(formData.get('_listingId') ?? '')
  if (!listingId) return { ok: false, error: 'Missing listing ID' }

  const reason = String(formData.get('reason') ?? '').trim()
  const body = {
    startDate: String(formData.get('startDate') ?? ''),
    endDate: String(formData.get('endDate') ?? ''),
    ...(reason && { reason }),
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  try {
    const res = await fetch(`${baseUrl}/api/host/listings/${listingId}/availability-blocks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: (await headers()).get('cookie') ?? '',
      },
      body: JSON.stringify(body),
    })

    if (res.ok) {
      revalidatePath(`/host/listings/${listingId}/availability`)
      return { ok: true }
    }

    const json = await res.json().catch(() => ({}))
    const apiError = json?.error

    if (res.status === 422 && apiError?.fields) {
      return { ok: false, error: apiError.message ?? 'Validation failed', fieldErrors: apiError.fields }
    }

    return { ok: false, error: apiError?.message ?? 'Could not block these dates. Please try again.' }
  } catch {
    return { ok: false, error: 'Could not block these dates. Please try again.' }
  }
}

export async function deleteAvailabilityBlockAction(
  listingId: string,
  blockId: string,
): Promise<AvailabilityBlockActionResult> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  try {
    const res = await fetch(
      `${baseUrl}/api/host/listings/${listingId}/availability-blocks/${blockId}`,
      {
        method: 'DELETE',
        headers: { cookie: (await headers()).get('cookie') ?? '' },
      },
    )

    if (res.ok) {
      revalidatePath(`/host/listings/${listingId}/availability`)
      return { ok: true }
    }

    const json = await res.json().catch(() => ({}))
    return { ok: false, error: json?.error?.message ?? 'Could not remove this block. Please try again.' }
  } catch {
    return { ok: false, error: 'Could not remove this block. Please try again.' }
  }
}
