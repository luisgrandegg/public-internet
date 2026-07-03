'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { RadioGroup, Textarea, Button } from '@public-internet/design-system'
import { submitReviewAction } from '@/lib/actions/reviews'
import styles from './page.module.css'

const RATING_OPTIONS = [
  { value: '1', label: '1 — Poor' },
  { value: '2', label: '2 — Fair' },
  { value: '3', label: '3 — Good' },
  { value: '4', label: '4 — Very good' },
  { value: '5', label: '5 — Excellent' },
]

interface Props {
  orderId: string
  restaurantName: string
}

/**
 * Review form shown once an order is DELIVERED and not yet reviewed.
 * Constitution: honest feedback only — no discounts, prompts, or incentives
 * are ever attached to leaving a review.
 */
export function ReviewForm({ orderId, restaurantName }: Props) {
  const router = useRouter()
  const [rating, setRating] = useState('')
  const [body, setBody] = useState('')
  const [ratingError, setRatingError] = useState<string | null>(null)
  const [globalError, setGlobalError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!rating) {
      setRatingError('Please choose a rating')
      return
    }
    setRatingError(null)
    setGlobalError(null)
    startTransition(async () => {
      const result = await submitReviewAction({
        orderId,
        rating: Number(rating),
        body: body.trim(),
      })
      if (!result.ok) {
        setGlobalError(result.globalError ?? 'Could not submit review.')
        return
      }
      router.refresh()
    })
  }

  return (
    <form onSubmit={handleSubmit} className={styles.reviewForm}>
      {globalError && (
        <div role="alert" className={styles.reviewError}>
          {globalError}
        </div>
      )}
      <RadioGroup
        legend={`How was your order from ${restaurantName}?`}
        name="rating"
        options={RATING_OPTIONS}
        value={rating}
        onChange={setRating}
        error={ratingError ?? undefined}
      />
      <Textarea
        label="Tell others about it (optional)"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        maxLength={2000}
      />
      <div>
        <Button type="submit" variant="primary" disabled={isPending}>
          {isPending ? 'Submitting…' : 'Submit review'}
        </Button>
      </div>
    </form>
  )
}
