'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { Input, Button } from '@public-internet/design-system'
import { resetPassword } from '@/lib/actions/auth'
import type { AuthResult } from '@/lib/actions/auth'
import styles from './page.module.css'

interface ResetPasswordFormProps {
  token: string
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [state, formAction, isPending] = useActionState<AuthResult | null, FormData>(
    resetPassword,
    null
  )

  if (state?.ok) {
    return (
      <div className={styles.form}>
        <h1 className={styles.heading}>Password updated</h1>
        <p className={styles.success}>
          Your password has been changed. You can now sign in with your new password.
        </p>
        <div className={styles.footer}>
          <Link href="/auth/signin" className={styles.link}>
            Go to sign in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <form action={formAction} className={styles.form}>
      <h1 className={styles.heading}>Choose a new password</h1>
      <p className={styles.description}>
        Enter a new password for your account. It must be at least 8 characters long.
      </p>

      {state && !state.ok && state.globalError && (
        <div role="alert" className={styles.globalError}>
          {state.globalError}{' '}
          <Link href="/auth/forgot-password" className={styles.link}>
            Request a new reset link
          </Link>
        </div>
      )}

      <input type="hidden" name="token" value={token} />

      <Input
        name="password"
        type="password"
        label="New password"
        autoComplete="new-password"
        required
        error={state && !state.ok ? state.fieldErrors.password : undefined}
      />

      <Input
        name="confirmPassword"
        type="password"
        label="Confirm new password"
        autoComplete="new-password"
        required
        error={state && !state.ok ? state.fieldErrors.confirmPassword : undefined}
      />

      <Button type="submit" variant="primary" disabled={isPending}>
        {isPending ? 'Updating…' : 'Update password'}
      </Button>

      <div className={styles.footer}>
        <span>Remember your password?</span>
        <Link href="/auth/signin" className={styles.link}>
          Sign in
        </Link>
      </div>
    </form>
  )
}
