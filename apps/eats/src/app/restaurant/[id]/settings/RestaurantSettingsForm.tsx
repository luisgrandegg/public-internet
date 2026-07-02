'use client'

import { useActionState } from 'react'
import { Input, Button, Textarea, Stack, Checkbox } from '@public-internet/design-system'
import { updateRestaurantAction, type ActionResult } from '@/lib/actions/restaurants'
import styles from './page.module.css'

export interface RestaurantSettings {
  id: string
  name: string
  description: string
  address: string
  city: string
  country: string
  phone: string | null
  imageUrl: string | null
  isActive: boolean
}

interface Props {
  restaurant: RestaurantSettings
}

export function RestaurantSettingsForm({ restaurant }: Props) {
  const boundUpdate = updateRestaurantAction.bind(null, restaurant.id)
  const [state, formAction, isPending] = useActionState<ActionResult | null, FormData>(
    boundUpdate,
    null,
  )

  const fieldError = (key: string) =>
    state && !state.ok ? state.fieldErrors[key] : undefined

  return (
    <form action={formAction} className={styles.form}>
      {state && !state.ok && state.globalError && (
        <div role="alert" className={styles.globalError}>
          {state.globalError}
        </div>
      )}
      {state?.ok && (
        <p role="status" className={styles.success}>
          Changes saved.
        </p>
      )}

      <Stack gap={4}>
        <Input
          name="name"
          label="Restaurant name"
          defaultValue={restaurant.name}
          required
          error={fieldError('name')}
        />
        <Textarea
          name="description"
          label="Description"
          rows={4}
          defaultValue={restaurant.description}
          required
          error={fieldError('description')}
        />
        <Input
          name="address"
          label="Street address"
          defaultValue={restaurant.address}
          required
          error={fieldError('address')}
        />
        <Input
          name="city"
          label="City"
          defaultValue={restaurant.city}
          required
          error={fieldError('city')}
        />
        <Input
          name="country"
          label="Country"
          defaultValue={restaurant.country}
          required
          error={fieldError('country')}
        />
        <Input
          name="phone"
          label="Phone (optional)"
          type="tel"
          defaultValue={restaurant.phone ?? ''}
          error={fieldError('phone')}
        />
        <Input
          name="imageUrl"
          label="Image URL (optional)"
          type="url"
          placeholder="https://…"
          defaultValue={restaurant.imageUrl ?? ''}
          error={fieldError('imageUrl')}
        />
        <Checkbox
          name="isActive"
          label="Listing is active — visible to customers"
          defaultChecked={restaurant.isActive}
          error={fieldError('isActive')}
        />
      </Stack>

      <Button type="submit" variant="primary" disabled={isPending}>
        {isPending ? 'Saving…' : 'Save changes'}
      </Button>
    </form>
  )
}
