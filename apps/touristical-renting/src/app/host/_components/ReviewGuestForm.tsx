'use client'

import { useState, useTransition } from 'react'
import { Textarea, Button } from '@public-internet/design-system'
import { createReviewAction } from '@/lib/actions/reviews'
import styles from './ReviewGuestForm.module.css'

interface ReviewGuestFormProps {
  bookingId: string
  guestId: string
  guestName: string
}

export function ReviewGuestForm({ bookingId, guestId, guestName }: ReviewGuestFormProps) {
  const [rating, setRating] = useState(0)
  const [body, setBody] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  if (submitted) {
    return <p className={styles.success}>Review submitted. It will be published after {guestName} reviews as well.</p>
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (rating === 0) {
      setError('Please select a rating.')
      return
    }
    if (body.trim().length < 10) {
      setError('Review must be at least 10 characters.')
      return
    }
    setError(null)

    startTransition(async () => {
      const result = await createReviewAction(bookingId, guestId, 'guest', rating, body)
      if (result.ok) {
        setSubmitted(true)
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      {error && <p className={styles.error} role="alert">{error}</p>}

      <div>
        <div role="group" aria-label="Rating" className={styles.ratingGroup}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className={`${styles.ratingButton} ${star <= rating ? styles.ratingButtonSelected : ''}`}
              onClick={() => setRating(star)}
              aria-label={`${star} star${star !== 1 ? 's' : ''}`}
              aria-pressed={star === rating}
              disabled={isPending}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      <Textarea
        name="body"
        label={`Review of ${guestName}`}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        required
        disabled={isPending}
      />

      <Button type="submit" variant="primary" disabled={isPending}>
        {isPending ? 'Submitting…' : 'Submit review'}
      </Button>
    </form>
  )
}
