'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Button } from '@public-internet/design-system'
import { becomeHostAction } from '@/lib/actions/profile'
import styles from './HostToggle.module.css'

interface HostToggleProps {
  isHost: boolean
}

export function HostToggle({ isHost: initialIsHost }: HostToggleProps) {
  const [isHost, setIsHost] = useState(initialIsHost)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [confirmed, setConfirmed] = useState(false)

  function handleBecomeHost() {
    setError(null)
    startTransition(async () => {
      const result = await becomeHostAction()
      if (result.ok) {
        setIsHost(true)
        setConfirmed(true)
      } else {
        setError(result.globalError ?? 'Could not enable host status. Please try again.')
      }
    })
  }

  if (isHost) {
    return (
      <div className={styles.root}>
        <h2 className={styles.sectionHeading}>Host status</h2>
        <p className={styles.hostConfirmed}>You are a host.</p>
        <Link href="/host" className={styles.dashboardLink}>
          Go to host dashboard
        </Link>
      </div>
    )
  }

  return (
    <div className={styles.root}>
      <h2 className={styles.sectionHeading}>Become a host</h2>
      <p className={styles.description}>
        List your own property and earn income. You can start listing immediately after enabling this.
      </p>

      {confirmed && (
        <div role="status" className={styles.successMessage}>
          Host status enabled. You can now create listings.
        </div>
      )}

      {error && (
        <div role="alert" className={styles.errorMessage}>
          {error}
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        onClick={handleBecomeHost}
        disabled={isPending}
      >
        {isPending ? 'Enabling…' : 'Become a host'}
      </Button>
    </div>
  )
}
