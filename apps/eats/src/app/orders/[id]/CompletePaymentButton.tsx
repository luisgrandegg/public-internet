'use client'

import { useState, useTransition } from 'react'
import { Button } from '@public-internet/design-system'
import { resumeOrderPaymentAction } from '@/lib/actions/orders'
import styles from './page.module.css'

interface Props {
  orderId: string
}

/**
 * "Complete payment" control for a PENDING online payment (ADR-006 §4).
 *
 * Instead of linking to the stored checkout URL — which may have expired —
 * it asks the server for a live one (POST /api/orders/{id}/pay, via a thin
 * server action) and redirects there. The amount behind the URL is exactly
 * the order total already shown — never recomputed, nothing added.
 */
export function CompletePaymentButton({ orderId }: Props) {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    setError(null)
    startTransition(async () => {
      const result = await resumeOrderPaymentAction(orderId)
      if (!result.ok) {
        setError(result.globalError)
        return
      }
      window.location.assign(result.checkoutUrl)
    })
  }

  return (
    <div>
      {/* Errors are announced to assistive technology and shown as text. */}
      {error && (
        <p role="alert" className={styles.reviewError}>
          {error}
        </p>
      )}
      <Button type="button" variant="primary" onClick={handleClick} disabled={isPending}>
        {isPending ? 'Preparing secure checkout…' : 'Complete payment'}
      </Button>
    </div>
  )
}
