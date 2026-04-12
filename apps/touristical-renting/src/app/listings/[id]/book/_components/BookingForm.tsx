'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Input, Button } from '@public-internet/design-system'
import { createBookingAction } from '@/lib/actions/bookings'
import styles from './BookingForm.module.css'

interface BlockedRange {
  start: string
  end: string
}

interface BookingFormProps {
  listingId: string
  nightlyRate: number // in cents
  initialCheckIn?: string
  initialCheckOut?: string
  blockedRanges: BlockedRange[]
}

function isRangeBlocked(checkIn: string, checkOut: string, blockedRanges: BlockedRange[]): boolean {
  if (!checkIn || !checkOut) return false
  return blockedRanges.some(
    (range) => checkIn < range.end && checkOut > range.start,
  )
}

function countNights(checkIn: string, checkOut: string): number {
  if (!checkIn || !checkOut) return 0
  const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

export function BookingForm({
  listingId,
  nightlyRate,
  initialCheckIn = '',
  initialCheckOut = '',
  blockedRanges,
}: BookingFormProps) {
  const router = useRouter()
  const [checkIn, setCheckIn] = useState(initialCheckIn)
  const [checkOut, setCheckOut] = useState(initialCheckOut)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const nights = countNights(checkIn, checkOut)
  const totalCents = nights * nightlyRate
  const totalEur = (totalCents / 100).toFixed(2)
  const nightlyRateEur = (nightlyRate / 100).toFixed(2)

  function validate(): string | null {
    if (!checkIn) return 'Please select a check-in date.'
    if (!checkOut) return 'Please select a check-out date.'
    if (new Date(checkOut) <= new Date(checkIn)) return 'Check-out must be after check-in.'
    if (isRangeBlocked(checkIn, checkOut, blockedRanges)) {
      return 'The selected dates are not available. Please choose different dates.'
    }
    return null
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }
    setError(null)

    startTransition(async () => {
      const result = await createBookingAction(listingId, checkIn, checkOut)
      if (result.ok) {
        router.push(`/bookings/${result.bookingId}`)
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      {error && (
        <div className={styles.error} role="alert">
          {error}
        </div>
      )}

      <div className={styles.dateRow}>
        <Input
          name="checkIn"
          type="date"
          label="Check-in"
          value={checkIn}
          onChange={(e) => setCheckIn(e.target.value)}
          required
          disabled={isPending}
        />
        <Input
          name="checkOut"
          type="date"
          label="Check-out"
          value={checkOut}
          onChange={(e) => setCheckOut(e.target.value)}
          required
          disabled={isPending}
        />
      </div>

      {nights > 0 && (
        <div className={styles.priceBreakdown} aria-live="polite">
          <div className={styles.priceRow}>
            <span>€{nightlyRateEur} × {nights} night{nights !== 1 ? 's' : ''}</span>
            <span>€{totalEur}</span>
          </div>
          <div className={styles.priceTotal}>
            <span>Total</span>
            <span>€{totalEur}</span>
          </div>
          <p className={styles.noFeeNote}>No additional fees — this is the complete price.</p>
        </div>
      )}

      <Button type="submit" variant="primary" disabled={isPending || nights === 0}>
        {isPending ? 'Confirming…' : 'Confirm booking'}
      </Button>
    </form>
  )
}
