'use server'

import { headers } from 'next/headers'

export type BookingActionResult =
  | { ok: true; bookingId: string; checkoutUrl: string | null }
  | { ok: false; error: string }

export async function createBookingAction(
  listingId: string,
  checkIn: string,
  checkOut: string,
): Promise<BookingActionResult> {
  try {
    // Forward only the session cookie — spreading all incoming headers
    // (content-length, connection, …) into a new request deadlocks the
    // self-fetch, since they describe the original action POST body.
    const cookie = (await headers()).get('cookie') ?? ''
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie,
      },
      body: JSON.stringify({ listingId, checkIn, checkOut }),
    })

    const data = await res.json()

    if (res.status === 409) {
      return { ok: false, error: 'These dates are not available. Please choose different dates.' }
    }

    if (!res.ok) {
      return { ok: false, error: data?.error?.message ?? 'Could not create booking. Please try again.' }
    }

    // checkoutUrl is set when the node runs online payments (Stripe mode);
    // null when payment is settled directly with the host (offline mode).
    return { ok: true, bookingId: data.data.id, checkoutUrl: data.data.checkoutUrl ?? null }
  } catch {
    return { ok: false, error: 'Could not create booking. Please try again.' }
  }
}
