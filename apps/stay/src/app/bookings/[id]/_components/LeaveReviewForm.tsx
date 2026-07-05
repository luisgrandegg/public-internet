'use client'

import { useState, useTransition } from 'react'
import { Textarea, Button } from '@public-internet/design-system'
import { createReviewAction } from '@/lib/actions/reviews'
import styles from './LeaveReviewForm.module.css'

interface LeaveReviewFormProps {
  bookingId: string
  targetId: string
  targetRole: 'guest' | 'host'
  targetName: string
}

export function LeaveReviewForm({ bookingId, targetId, targetRole, targetName }: LeaveReviewFormProps) {
  const [rating, setRating] = useState(0)
  const [body, setBody] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  if (submitted) {
    return (
      <div className={styles.success} role="status">
        Your review has been submitted. It will be published once both parties have reviewed, or after 14 days.
      </div>
    )
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (rating === 0) {
      setError('Please select a rating.')
      return
    }
    if (body.trim().length < 10) {
      setError('Your review must be at least 10 characters.')
      return
    }
    setError(null)

    startTransition(async () => {
      const result = await createReviewAction(bookingId, targetId, targetRole, rating, body)
      if (result.ok) {
        setSubmitted(true)
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <p>Share your experience with {targetName}.</p>

      {error && (
        <div className={styles.error} role="alert">
          {error}
        </div>
      )}

      <div>
        <span className={styles.ratingLabel}>Rating</span>
        <div className={styles.ratingGroup} role="group" aria-label="Rating from 1 to 5">
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
        label="Your review"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Describe your experience…"
        rows={4}
        required
        disabled={isPending}
      />

      <Button type="submit" variant="primary" disabled={isPending}>
        {isPending ? 'Submitting…' : 'Submit review'}
      </Button>
    </form>
  )
}
