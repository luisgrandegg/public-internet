'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { Input, Button } from '@public-internet/design-system'
import { forgotPassword } from '@/lib/actions/auth'
import type { AuthResult } from '@/lib/actions/auth'
import styles from './page.module.css'

export default function ForgotPasswordPage() {
  const [state, formAction, isPending] = useActionState<AuthResult | null, FormData>(
    forgotPassword,
    null
  )

  if (state?.ok) {
    return (
      <div className={styles.form}>
        <h1 className={styles.heading}>Check your email</h1>
        <p className={styles.success}>
          If an account exists for that address, a reset link is on its way.
        </p>
        <div className={styles.footer}>
          <Link href="/auth/signin" className={styles.link}>
            Back to sign in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <form action={formAction} className={styles.form}>
      <h1 className={styles.heading}>Reset your password</h1>
      <p className={styles.description}>
        Enter the email address associated with your account and we&apos;ll send you a reset link.
      </p>

      <Input
        name="email"
        type="email"
        label="Email address"
        autoComplete="email"
        required
        error={state && !state.ok ? state.fieldErrors.email : undefined}
      />

      <Button type="submit" variant="primary" disabled={isPending}>
        {isPending ? 'Sending…' : 'Send reset link'}
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
