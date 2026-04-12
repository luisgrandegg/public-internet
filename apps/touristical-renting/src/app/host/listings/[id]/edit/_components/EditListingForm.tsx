'use client'

import { useState, useActionState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Input, Button, Stack, RadioGroup } from '@public-internet/design-system'
import type { RadioOption } from '@public-internet/design-system'
import { updateListing } from '@/lib/actions/listings'
import type { UpdateListingActionResult } from '@/lib/actions/listings'
import styles from './EditListingForm.module.css'

const PROPERTY_TYPE_OPTIONS: RadioOption[] = [
  { value: 'flat', label: 'Flat' },
  { value: 'house', label: 'House' },
  { value: 'room', label: 'Room' },
  { value: 'studio', label: 'Studio' },
]

const GUEST_OPTIONS = Array.from({ length: 16 }, (_, i) => ({
  value: String(i + 1),
  label: `${i + 1} guest${i + 1 > 1 ? 's' : ''}`,
}))

interface Listing {
  id: string
  title: string
  description: string
  propertyType: string
  city: string
  country: string
  nightlyRate: number // stored in cents
  maxGuests: number
  bedrooms: number
  bathrooms: number
}

interface EditListingFormProps {
  listing: Listing
}

export function EditListingForm({ listing }: EditListingFormProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [propertyType, setPropertyType] = useState(listing.propertyType)

  const [state, formAction, isPending] = useActionState<UpdateListingActionResult | null, FormData>(
    updateListing,
    null,
  )

  useEffect(() => {
    if (state?.ok) {
      startTransition(() => {
        router.push('/host')
      })
    }
  }, [state, router])

  const fieldErrors = state && !state.ok ? (state.fieldErrors ?? {}) : {}
  const globalError = state && !state.ok ? state.error : undefined

  return (
    <form action={formAction} className={styles.form}>
      {/* Hidden field carries the listing ID to the server action */}
      <input type="hidden" name="_listingId" value={listing.id} />

      {globalError && (
        <div role="alert" className={styles.globalError}>
          {globalError}
        </div>
      )}

      <Stack gap={6}>
        <Input
          name="title"
          type="text"
          label="Title"
          defaultValue={listing.title}
          required
          error={fieldErrors.title}
        />

        {/* GAP: Textarea from design system is fully controlled — using native textarea for defaultValue support */}
        <div className={styles.fieldGroup}>
          <label htmlFor="description" className={styles.label}>
            Description
          </label>
          <textarea
            id="description"
            name="description"
            className={styles.textarea}
            defaultValue={listing.description}
            rows={5}
            required
            aria-describedby={fieldErrors.description ? 'description-error' : undefined}
          />
          {fieldErrors.description && (
            <p id="description-error" className={styles.fieldError} role="alert">
              {fieldErrors.description}
            </p>
          )}
        </div>

        <RadioGroup
          legend="Property type"
          name="propertyType"
          options={PROPERTY_TYPE_OPTIONS}
          value={propertyType}
          onChange={setPropertyType}
          layout="grid"
          error={fieldErrors.propertyType}
        />

        <div className={styles.twoCol}>
          <Input
            name="city"
            type="text"
            label="City"
            defaultValue={listing.city}
            required
            error={fieldErrors.city}
          />
          <Input
            name="country"
            type="text"
            label="Country"
            defaultValue={listing.country}
            required
            error={fieldErrors.country}
          />
        </div>

        <Input
          name="nightlyRate"
          type="number"
          min="1"
          step="0.01"
          label="€ per night — this is the total price guests will see. No additional fees will be added."
          defaultValue={String((listing.nightlyRate / 100).toFixed(2))}
          required
          error={fieldErrors.nightlyRate}
        />

        {/* GAP: Select from design system is controlled (requires onChange) — using native select for uncontrolled form submission */}
        <div className={styles.fieldGroup}>
          <label htmlFor="maxGuests" className={styles.label}>
            Maximum guests
          </label>
          <select
            id="maxGuests"
            name="maxGuests"
            className={styles.nativeSelect}
            defaultValue={String(listing.maxGuests)}
            aria-describedby={fieldErrors.maxGuests ? 'maxGuests-error' : undefined}
          >
            {GUEST_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {fieldErrors.maxGuests && (
            <p id="maxGuests-error" className={styles.fieldError} role="alert">
              {fieldErrors.maxGuests}
            </p>
          )}
        </div>

        <div className={styles.twoCol}>
          <Input
            name="bedrooms"
            type="number"
            min="0"
            label="Bedrooms"
            defaultValue={String(listing.bedrooms)}
            required
            error={fieldErrors.bedrooms}
          />
          <Input
            name="bathrooms"
            type="number"
            min="1"
            label="Bathrooms"
            defaultValue={String(listing.bathrooms)}
            required
            error={fieldErrors.bathrooms}
          />
        </div>

        <Button type="submit" variant="primary" disabled={isPending}>
          {isPending ? 'Saving…' : 'Save changes'}
        </Button>
      </Stack>
    </form>
  )
}
