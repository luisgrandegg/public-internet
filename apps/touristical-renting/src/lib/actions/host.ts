'use server'

import { headers } from 'next/headers'

export type HostActionResult =
  | { ok: true }
  | { ok: false; error: string }

export async function replyToEnquiryAction(
  enquiryId: string,
  reply: string,
): Promise<HostActionResult> {
  try {
    // Forward only the session cookie — spreading all incoming headers into a
    // new request deadlocks the self-fetch (stale content-length/connection).
    const cookie = (await headers()).get('cookie') ?? ''
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/host/enquiries/${enquiryId}/reply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie,
      },
      body: JSON.stringify({ reply }),
    })

    const data = await res.json()

    if (!res.ok) {
      return { ok: false, error: data?.error?.message ?? 'Could not send reply.' }
    }

    return { ok: true }
  } catch {
    return { ok: false, error: 'Could not send reply. Please try again.' }
  }
}
