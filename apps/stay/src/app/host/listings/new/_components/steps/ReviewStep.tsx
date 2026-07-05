import { Button, Card } from '@public-internet/design-system'
import type { CreateListingDraft } from '@/lib/types'
import styles from './ReviewStep.module.css'

interface ReviewStepProps {
  draft: Partial<CreateListingDraft>
  isPending: boolean
}

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  flat: 'Flat',
  house: 'House',
  room: 'Room',
  studio: 'Studio',
}

export function ReviewStep({ draft, isPending }: ReviewStepProps) {
  const filledPhotos = (draft.photoUrls ?? []).filter(Boolean)

  return (
    <div className={styles.root}>
      <h2 className={styles.heading}>Review your listing</h2>

      <Card variant="bordered" className={styles.section}>
        <h3 className={styles.sectionHeading}>Property type</h3>
        <div className={styles.row}>
          <span className={styles.rowLabel}>Type</span>
          <span className={styles.rowValue}>
            {draft.propertyType ? PROPERTY_TYPE_LABELS[draft.propertyType] ?? draft.propertyType : '—'}
          </span>
        </div>
      </Card>

      <Card variant="bordered" className={styles.section}>
        <h3 className={styles.sectionHeading}>Location</h3>
        <div className={styles.row}>
          <span className={styles.rowLabel}>City</span>
          <span className={styles.rowValue}>{draft.city || '—'}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.rowLabel}>Country</span>
          <span className={styles.rowValue}>{draft.country || '—'}</span>
        </div>
      </Card>

      <Card variant="bordered" className={styles.section}>
        <h3 className={styles.sectionHeading}>Description</h3>
        <div className={styles.row}>
          <span className={styles.rowLabel}>Title</span>
          <span className={styles.rowValue}>{draft.title || '—'}</span>
        </div>
        {draft.description && (
          <p className={styles.description}>{draft.description}</p>
        )}
      </Card>

      <Card variant="bordered" className={styles.section}>
        <h3 className={styles.sectionHeading}>Photos</h3>
        {filledPhotos.length > 0 ? (
          <div className={styles.photos}>
            {filledPhotos.map((url, i) => (
              <span key={i} className={styles.photoTag}>{url}</span>
            ))}
          </div>
        ) : (
          <p className={styles.noPhotos}>No photos added</p>
        )}
      </Card>

      <Card variant="bordered" className={styles.section}>
        <h3 className={styles.sectionHeading}>Pricing &amp; capacity</h3>
        <div className={styles.row}>
          <span className={styles.rowLabel}>Nightly rate (total price)</span>
          <span className={styles.rowValue}>
            {draft.nightlyRate ? `€${draft.nightlyRate}` : '—'}
          </span>
        </div>
        <div className={styles.row}>
          <span className={styles.rowLabel}>Max guests</span>
          <span className={styles.rowValue}>{draft.maxGuests || '—'}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.rowLabel}>Bedrooms</span>
          <span className={styles.rowValue}>{draft.bedrooms ?? '—'}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.rowLabel}>Bathrooms</span>
          <span className={styles.rowValue}>{draft.bathrooms || '—'}</span>
        </div>
      </Card>

      <div className={styles.submitRow}>
        <Button variant="primary" type="submit" disabled={isPending}>
          {isPending ? 'Publishing…' : 'Publish listing'}
        </Button>
      </div>
    </div>
  )
}
