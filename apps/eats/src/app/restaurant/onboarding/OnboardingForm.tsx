'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Checkbox } from '@public-internet/design-system'
import {
  becomeRestaurantOwnerAction,
  type RestaurantOwnerOnboardingResult,
} from '@/lib/actions/restaurant-owner'
import styles from './page.module.css'

export function OnboardingForm() {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState<
    RestaurantOwnerOnboardingResult | null,
    FormData
  >(becomeRestaurantOwnerAction, null)

  useEffect(() => {
    if (state?.ok) router.push('/restaurant/register')
  }, [state, router])

  return (
    <form action={formAction} className={styles.form}>
      <h2 className={styles.sectionHeading}>Ready to list your restaurant?</h2>
      {state && !state.ok && (
        <div role="alert" className={styles.globalError}>
          {state.globalError}
        </div>
      )}
      <p className={styles.formIntro}>
        Confirming below adds the restaurant-owner role to your account. Next you&apos;ll
        register your first restaurant — you can manage its menu and orders from your
        dashboard afterwards.
      </p>

      {/* Acknowledgement is explicit — not pre-ticked (constitution §5). */}
      <Checkbox
        name="acknowledge"
        label="I understand the commission-free model: the platform takes no commission and charges my restaurant nothing — a flat, published infrastructure fee is paid by the customer."
        required
      />

      <Button type="submit" variant="primary" disabled={isPending}>
        {isPending ? 'Setting up…' : 'Continue to restaurant registration'}
      </Button>
    </form>
  )
}
