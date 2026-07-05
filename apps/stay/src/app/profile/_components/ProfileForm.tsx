'use client'

import { useActionState } from 'react'
import { Input, Button } from '@public-internet/design-system'
import { updateProfileAction } from '@/lib/actions/profile'
import type { ProfileActionResult } from '@/lib/actions/profile'
import styles from './ProfileForm.module.css'

interface ProfileFormProps {
  name: string
  email: string
  image: string | null
}

export function ProfileForm({ name, email, image }: ProfileFormProps) {
  const [state, formAction, isPending] = useActionState<ProfileActionResult | null, FormData>(
    updateProfileAction,
    null,
  )

  return (
    <form action={formAction} className={styles.form}>
      <h2 className={styles.sectionHeading}>Account details</h2>

      {state?.ok === true && (
        <div role="status" className={styles.successMessage}>
          Profile updated successfully.
        </div>
      )}

      {state?.ok === false && state.globalError && (
        <div role="alert" className={styles.errorMessage}>
          {state.globalError}
        </div>
      )}

      <Input
        name="name"
        type="text"
        label="Display name"
        defaultValue={name}
        required
        error={state?.ok === false ? state.fieldErrors.name : undefined}
      />

      <div className={styles.readOnlyField}>
        <span className={styles.readOnlyLabel}>Email address</span>
        <span className={styles.readOnlyValue}>{email}</span>
        <span className={styles.readOnlyNote}>Email is managed by your account and cannot be changed here.</span>
      </div>

      <Input
        name="image"
        type="url"
        label="Avatar URL"
        defaultValue={image ?? ''}
        placeholder="https://example.com/your-photo.jpg"
        error={state?.ok === false ? state.fieldErrors.image : undefined}
      />

      <Button type="submit" variant="primary" disabled={isPending}>
        {isPending ? 'Saving…' : 'Save changes'}
      </Button>
    </form>
  )
}
