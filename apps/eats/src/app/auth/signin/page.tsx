'use client'

import { useActionState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Input, Button } from '@public-internet/design-system'
import { signIn } from '@/lib/actions/auth'
import type { AuthResult } from '@/lib/actions/auth'
import styles from './page.module.css'

export default function SignInPage() {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState<AuthResult | null, FormData>(
    signIn,
    null,
  )

  useEffect(() => {
    if (state?.ok) router.push('/')
  }, [state, router])

  return (
    <form action={formAction} className={styles.form}>
      <h1 className={styles.heading}>Sign in</h1>

      {state && !state.ok && state.globalError && (
        <div role="alert" className={styles.globalError}>
          {state.globalError}
        </div>
      )}

      <Input
        name="email"
        type="email"
        label="Email address"
        autoComplete="email"
        required
        error={state && !state.ok ? state.fieldErrors.email : undefined}
      />

      <Input
        name="password"
        type="password"
        label="Password"
        autoComplete="current-password"
        required
        error={state && !state.ok ? state.fieldErrors.password : undefined}
      />

      <Button type="submit" variant="primary" disabled={isPending}>
        {isPending ? 'Signing in…' : 'Sign in'}
      </Button>

      <div className={styles.footer}>
        <Link href="/auth/forgot-password" className={styles.link}>
          Forgot your password?
        </Link>
        <span className={styles.divider}>or</span>
        <Link href="/auth/signup" className={styles.link}>
          Create an account
        </Link>
      </div>
    </form>
  )
}
