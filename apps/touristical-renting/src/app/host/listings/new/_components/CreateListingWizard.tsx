'use client'

import { useState, useActionState } from 'react'
import { Button } from '@public-internet/design-system'
import type { CreateListingDraft, PropertyType } from '@/lib/types'
import { createListing } from '@/lib/actions/listings'
import { WizardProgress } from './WizardProgress'
import { PropertyTypeStep } from './steps/PropertyTypeStep'
import { LocationStep } from './steps/LocationStep'
import { DescriptionStep } from './steps/DescriptionStep'
import { PhotosStep } from './steps/PhotosStep'
import { PricingStep } from './steps/PricingStep'
import { ReviewStep } from './steps/ReviewStep'
import styles from './CreateListingWizard.module.css'

const STEPS = ['Property type', 'Location', 'Description', 'Photos', 'Pricing', 'Review']

const INITIAL_DRAFT: Partial<CreateListingDraft> = {
  propertyType: '',
  city: '',
  country: '',
  title: '',
  description: '',
  photoUrls: ['', '', ''],
  nightlyRate: '',
  maxGuests: '',
  bedrooms: '',
  bathrooms: '',
}

function validateStep(step: number, draft: Partial<CreateListingDraft>): Record<string, string> {
  const errors: Record<string, string> = {}
  switch (step) {
    case 0:
      if (!draft.propertyType) errors.propertyType = 'Select a property type'
      break
    case 1:
      if (!draft.city) errors.city = 'City is required'
      if (!draft.country) errors.country = 'Country is required'
      break
    case 2:
      if (!draft.title) errors.title = 'Title is required'
      if (!draft.description) errors.description = 'Description is required'
      break
    case 4:
      if (!draft.nightlyRate) errors.nightlyRate = 'Nightly rate is required'
      if (!draft.maxGuests) errors.maxGuests = 'Max guests is required'
      if (draft.bedrooms === '') errors.bedrooms = 'Number of bedrooms is required'
      if (!draft.bathrooms) errors.bathrooms = 'Number of bathrooms is required'
      break
    default:
      break
  }
  return errors
}

export function CreateListingWizard() {
  const [currentStep, setCurrentStep] = useState(0)
  const [draft, setDraft] = useState<Partial<CreateListingDraft>>(INITIAL_DRAFT)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [submitState, submitAction, isPending] = useActionState<{ ok: boolean } | null, FormData>(
    createListing,
    null
  )

  function updateDraft(updates: Partial<CreateListingDraft>) {
    setDraft((prev) => ({ ...prev, ...updates }))
  }

  function handleNext() {
    const stepErrors = validateStep(currentStep, draft)
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors)
      return
    }
    setErrors({})
    setCurrentStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  function handleBack() {
    setErrors({})
    setCurrentStep((s) => Math.max(s - 1, 0))
  }

  if (submitState?.ok) {
    return (
      <div className={styles.root}>
        <div className={styles.successMessage}>
          <p className={styles.successHeading}>Your listing is published!</p>
          <p className={styles.successDescription}>
            Guests can now find and enquire about your property.
          </p>
        </div>
      </div>
    )
  }

  const isLastStep = currentStep === STEPS.length - 1

  return (
    <form action={submitAction}>
      {/* Hidden inputs carry draft data into the server action on final submit */}
      {isLastStep &&
        Object.entries(draft).flatMap(([key, value]) =>
          Array.isArray(value)
            ? (value as string[]).map((v, i) => (
                <input key={`${key}-${i}`} type="hidden" name={`${key}[${i}]`} value={v} />
              ))
            : [<input key={key} type="hidden" name={key} value={String(value ?? '')} />]
        )}

      <div className={styles.root}>
        <WizardProgress steps={STEPS} currentStep={currentStep} />

        <div className={styles.stepContent}>
          {currentStep === 0 && (
            <PropertyTypeStep
              value={draft.propertyType ?? ''}
              onChange={(value: PropertyType) => updateDraft({ propertyType: value })}
            />
          )}
          {currentStep === 1 && (
            <LocationStep
              city={draft.city ?? ''}
              country={draft.country ?? ''}
              onCityChange={(v) => updateDraft({ city: v })}
              onCountryChange={(v) => updateDraft({ country: v })}
            />
          )}
          {currentStep === 2 && (
            <DescriptionStep
              title={draft.title ?? ''}
              description={draft.description ?? ''}
              onTitleChange={(v) => updateDraft({ title: v })}
              onDescriptionChange={(v) => updateDraft({ description: v })}
            />
          )}
          {currentStep === 3 && (
            <PhotosStep
              photoUrls={draft.photoUrls ?? ['', '', '']}
              onChange={(index, value) => {
                const updated = [...(draft.photoUrls ?? ['', '', ''])]
                updated[index] = value
                updateDraft({ photoUrls: updated })
              }}
            />
          )}
          {currentStep === 4 && (
            <PricingStep
              nightlyRate={draft.nightlyRate ?? ''}
              maxGuests={draft.maxGuests ?? ''}
              bedrooms={draft.bedrooms ?? ''}
              bathrooms={draft.bathrooms ?? ''}
              onNightlyRateChange={(v) => updateDraft({ nightlyRate: v })}
              onMaxGuestsChange={(v) => updateDraft({ maxGuests: v })}
              onBedroomsChange={(v) => updateDraft({ bedrooms: v })}
              onBathroomsChange={(v) => updateDraft({ bathrooms: v })}
            />
          )}
          {currentStep === 5 && (
            <ReviewStep draft={draft} isPending={isPending} />
          )}

          {Object.keys(errors).length > 0 && (
            <div role="alert" className={styles.stepErrors}>
              {Object.values(errors).map((err) => (
                <p key={err}>{err}</p>
              ))}
            </div>
          )}
        </div>

        <div className={styles.navigation}>
          <Button
            variant="outline"
            type="button"
            onClick={handleBack}
            disabled={currentStep === 0}
          >
            Back
          </Button>

          {!isLastStep && (
            <Button variant="primary" type="button" onClick={handleNext}>
              Next
            </Button>
          )}
        </div>
      </div>
    </form>
  )
}
