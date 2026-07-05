'use client'

import { useState } from 'react'
import { Button } from '@public-internet/design-system'
import { authClient } from '@/lib/auth-client'
import styles from './continue-with-google.module.css'

/**
 * "Continue with Google" — rendered only when this node has Google OAuth
 * credentials configured (`isGoogleAuthEnabled()` in the server page).
 * Google is a per-node convenience, never a requirement (ADR-007): email +
 * password stays first, nothing is preselected, and a node without
 * credentials never shows this button.
 */
export function ContinueWithGoogle() {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleClick = async () => {
    setIsPending(true)
    setError(null)
    const { error: socialError } = await authClient.signIn.social({
      provider: 'google',
      callbackURL: '/',
    })
    if (socialError) {
      setError('Could not start Google sign-in. Please try again.')
      setIsPending(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.divider} aria-hidden="true">
        or
      </div>
      {error && (
        <div role="alert" className={styles.error}>
          {error}
        </div>
      )}
      <Button
        type="button"
        variant="secondary"
        disabled={isPending}
        onClick={handleClick}
      >
        {isPending ? 'Redirecting to Google…' : 'Continue with Google'}
      </Button>
    </div>
  )
}
