import { Input } from '@public-internet/design-system'
import styles from './PricingStep.module.css'

interface PricingStepProps {
  nightlyRate: string
  maxGuests: string
  bedrooms: string
  bathrooms: string
  onNightlyRateChange: (value: string) => void
  onMaxGuestsChange: (value: string) => void
  onBedroomsChange: (value: string) => void
  onBathroomsChange: (value: string) => void
}

const GUEST_OPTIONS = Array.from({ length: 16 }, (_, i) => ({
  value: String(i + 1),
  label: `${i + 1} guest${i + 1 > 1 ? 's' : ''}`,
}))

// GAP: Requires <Select> component from design system
export function PricingStep({
  nightlyRate,
  maxGuests,
  bedrooms,
  bathrooms,
  onNightlyRateChange,
  onMaxGuestsChange,
  onBedroomsChange,
  onBathroomsChange,
}: PricingStepProps) {
  return (
    <div className={styles.root}>
      <h2 className={styles.heading}>Set your price and capacity</h2>

      <Input
        name="nightlyRate"
        type="number"
        min="1"
        label="€ per night — this is the total price guests will see. No additional fees will be added."
        placeholder="e.g. 85"
        value={nightlyRate}
        onChange={(e) => onNightlyRateChange(e.target.value)}
        required
      />

      <div className={styles.selectWrapper}>
        <label htmlFor="maxGuests" className={styles.selectLabel}>
          Maximum guests
        </label>
        <select
          id="maxGuests"
          name="maxGuests"
          className={styles.nativeSelect}
          value={maxGuests}
          onChange={(e) => onMaxGuestsChange(e.target.value)}
        >
          <option value="" disabled>Select…</option>
          {GUEST_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.twoCol}>
        <Input
          name="bedrooms"
          type="number"
          min="0"
          label="Bedrooms"
          placeholder="e.g. 2"
          value={bedrooms}
          onChange={(e) => onBedroomsChange(e.target.value)}
          required
        />
        <Input
          name="bathrooms"
          type="number"
          min="1"
          label="Bathrooms"
          placeholder="e.g. 1"
          value={bathrooms}
          onChange={(e) => onBathroomsChange(e.target.value)}
          required
        />
      </div>
    </div>
  )
}
