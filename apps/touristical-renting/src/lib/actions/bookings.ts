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

    // checkoutUrl is set when the node has a payment provider configured
    // (online mode); null when payment is settled directly with the host
    // (offline mode).
    return { ok: true, bookingId: data.data.id, checkoutUrl: data.data.checkoutUrl ?? null }
  } catch {
    return { ok: false, error: 'Could not create booking. Please try again.' }
  }
}

export type ResumePaymentActionResult =
  | { ok: true; checkoutUrl: string }
  | { ok: false; error: string }

/**
 * Thin wrapper around POST /api/bookings/:id/pay — returns a live hosted
 * checkout URL for a booking's pending online payment (the stored URL may
 * have expired, so the route consults the provider and regenerates it when
 * needed).
 */
export async function resumeBookingPaymentAction(
  bookingId: string,
): Promise<ResumePaymentActionResult> {
  try {
    const cookie = (await headers()).get('cookie') ?? ''
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const res = await fetch(`${appUrl}/api/bookings/${encodeURIComponent(bookingId)}/pay`, {
      method: 'POST',
      headers: { cookie },
    })

    const data = await res.json()

    if (!res.ok) {
      if (data?.error?.code === 'PAYMENT_ALREADY_SETTLING') {
        return {
          ok: false,
          error: 'Your payment is already being confirmed — refresh this page in a moment.',
        }
      }
      return {
        ok: false,
        error: data?.error?.message ?? 'Could not prepare the payment. Please try again.',
      }
    }

    return { ok: true, checkoutUrl: data.data.checkoutUrl }
  } catch {
    return { ok: false, error: 'Could not prepare the payment. Please try again.' }
  }
}
