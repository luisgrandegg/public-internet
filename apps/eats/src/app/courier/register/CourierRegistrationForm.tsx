'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Checkbox } from '@public-internet/design-system'
import {
  registerAsCourierAction,
  type CourierRegisterResult,
} from '@/lib/actions/courier'
import styles from './page.module.css'

export function CourierRegistrationForm() {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState<
    CourierRegisterResult | null,
    FormData
  >(registerAsCourierAction, null)

  useEffect(() => {
    if (state?.ok) router.push('/courier')
  }, [state, router])

  return (
    <form action={formAction} className={styles.form}>
      <h2 className={styles.sectionHeading}>Ready to start?</h2>
      {state && !state.ok && (
        <div role="alert" className={styles.globalError}>
          {state.globalError}
        </div>
      )}
      <p className={styles.formIntro}>
        Confirming below adds the courier role to your account. You can accept deliveries
        whenever you want — there is no minimum commitment.
      </p>

      {/* Acknowledgement is explicit — not pre-ticked (constitution §5). */}
      <Checkbox
        name="acknowledge"
        label="I understand how pay is calculated (base pay + distance pay) and that I can appeal any account decision."
        required
      />

      <Button type="submit" variant="primary" disabled={isPending}>
        {isPending ? 'Registering…' : 'Register as a courier'}
      </Button>
    </form>
  )
}
