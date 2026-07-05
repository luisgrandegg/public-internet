'use client'

import { useState, useTransition } from 'react'
import { Button } from '@public-internet/design-system'
import { resumeBookingPaymentAction } from '@/lib/actions/bookings'
import styles from './CompletePaymentButton.module.css'

interface CompletePaymentButtonProps {
  bookingId: string
}

/**
 * "Complete payment" control for a booking with a PENDING online payment.
 *
 * The stored checkout URL is never linked directly — hosted checkout sessions
 * expire. Instead this POSTs to /api/bookings/:id/pay (via a thin server
 * action), which resumes the session if it is still open or creates a fresh
 * one, and then redirects the guest to the returned live URL.
 */
export function CompletePaymentButton({ bookingId }: CompletePaymentButtonProps) {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    setError(null)
    startTransition(async () => {
      const result = await resumeBookingPaymentAction(bookingId)
      if (result.ok) {
        // Provider-hosted checkout is an external URL — full navigation.
        window.location.assign(result.checkoutUrl)
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <div className={styles.root}>
      <Button type="button" variant="primary" onClick={handleClick} disabled={isPending}>
        {isPending ? 'Preparing checkout…' : 'Complete payment'}
      </Button>
      {error && (
        <div className={styles.error} role="alert">
          {error}
        </div>
      )}
    </div>
  )
}
