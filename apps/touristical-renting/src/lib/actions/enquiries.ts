'use server'

import { headers } from 'next/headers'
import { auth } from '@/lib/auth'

export type EnquiryResult =
  | { ok: true }
  | { ok: false; error: string }

export async function createEnquiryAction(
  listingId: string,
  message: string,
): Promise<EnquiryResult> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return { ok: false, error: 'You must be signed in to contact the host.' }
  }

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/listings/${listingId}/enquiries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(Object.fromEntries(await headers())),
      },
      body: JSON.stringify({ message }),
    })

    if (!res.ok) {
      const data = await res.json()
      return { ok: false, error: data?.error?.message ?? 'Failed to send message.' }
    }

    return { ok: true }
  } catch {
    return { ok: false, error: 'Could not send your message. Please try again.' }
  }
}
