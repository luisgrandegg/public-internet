'use client'

import { useActionState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Input, Button } from '@public-internet/design-system'
import { signUp } from '@/lib/actions/auth'
import type { AuthResult } from '@/lib/actions/auth'
import styles from './page.module.css'

export default function SignUpPage() {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState<AuthResult | null, FormData>(
    signUp,
    null,
  )

  useEffect(() => {
    if (state?.ok) router.push('/')
  }, [state, router])

  return (
    <form action={formAction} className={styles.form}>
      <h1 className={styles.heading}>Create an account</h1>
      <p className={styles.description}>
        Order food, list a restaurant, or deliver — all from one account. No extraction,
        no surge pricing, no hidden fees.
      </p>

      {state && !state.ok && state.globalError && (
        <div role="alert" className={styles.globalError}>
          {state.globalError}
        </div>
      )}

      <Input
        name="name"
        type="text"
        label="Full name"
        autoComplete="name"
        required
        error={state && !state.ok ? state.fieldErrors.name : undefined}
      />

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
        autoComplete="new-password"
        required
        error={state && !state.ok ? state.fieldErrors.password : undefined}
      />

      <Input
        name="confirmPassword"
        type="password"
        label="Confirm password"
        autoComplete="new-password"
        required
        error={state && !state.ok ? state.fieldErrors.confirmPassword : undefined}
      />

      <Button type="submit" variant="primary" disabled={isPending}>
        {isPending ? 'Creating account…' : 'Create account'}
      </Button>

      <div className={styles.footer}>
        <span>Already have an account?</span>
        <Link href="/auth/signin" className={styles.link}>
          Sign in
        </Link>
      </div>
    </form>
  )
}
