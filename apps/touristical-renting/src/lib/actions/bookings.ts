'use server'

import { headers } from 'next/headers'

export type BookingActionResult =
  | { ok: true; bookingId: string }
  | { ok: false; error: string }

export async function createBookingAction(
  listingId: string,
  checkIn: string,
  checkOut: string,
): Promise<BookingActionResult> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(Object.fromEntries(await headers())),
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

    return { ok: true, bookingId: data.data.id }
  } catch {
    return { ok: false, error: 'Could not create booking. Please try again.' }
  }
}
