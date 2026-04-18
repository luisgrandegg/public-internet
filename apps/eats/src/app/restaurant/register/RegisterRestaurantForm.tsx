'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Input, Button, Textarea, Stack } from '@public-internet/design-system'
import { createRestaurant } from '@/lib/actions/restaurants'
import type { ActionResult } from '@/lib/actions/restaurants'
import styles from './page.module.css'

export function RegisterRestaurantForm() {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState<
    ActionResult<{ id: string }> | null,
    FormData
  >(createRestaurant, null)

  useEffect(() => {
    if (state?.ok) {
      router.push('/restaurant')
    }
  }, [state, router])

  const fieldError = (key: string) =>
    state && !state.ok ? state.fieldErrors[key] : undefined

  return (
    <form action={formAction} className={styles.form}>
      {state && !state.ok && state.globalError && (
        <div role="alert" className={styles.globalError}>
          {state.globalError}
        </div>
      )}

      <Stack gap={4}>
        <Input name="name" label="Restaurant name" required error={fieldError('name')} />
        <Textarea
          name="description"
          label="Description"
          rows={4}
          required
          error={fieldError('description')}
        />
        <Input name="address" label="Street address" required error={fieldError('address')} />
        <Input name="city" label="City" required error={fieldError('city')} />
        <Input name="country" label="Country" required error={fieldError('country')} />
        <Input
          name="phone"
          label="Phone (optional)"
          type="tel"
          error={fieldError('phone')}
        />
        <Input
          name="imageUrl"
          label="Image URL (optional)"
          type="url"
          placeholder="https://…"
          error={fieldError('imageUrl')}
        />
      </Stack>

      <Button type="submit" variant="primary" disabled={isPending}>
        {isPending ? 'Registering…' : 'Register restaurant'}
      </Button>
    </form>
  )
}
