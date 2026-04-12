import type { PropertyType } from '@/lib/types'
import styles from './PropertyTypeStep.module.css'

interface PropertyTypeStepProps {
  value: PropertyType | ''
  onChange: (value: PropertyType) => void
}

const PROPERTY_TYPES: Array<{
  value: PropertyType
  label: string
  description: string
  emoji: string
}> = [
  { value: 'flat', label: 'Flat', description: 'An apartment in a building', emoji: '🏢' },
  { value: 'house', label: 'House', description: 'An entire standalone house', emoji: '🏠' },
  { value: 'room', label: 'Room', description: 'A private room in a shared home', emoji: '🛏️' },
  { value: 'studio', label: 'Studio', description: 'A self-contained studio flat', emoji: '🏠' },
]

// GAP: Requires <RadioGroup> component
export function PropertyTypeStep({ value, onChange }: PropertyTypeStepProps) {
  return (
    <fieldset className={styles.root}>
      <legend className={styles.legend}>What type of property are you listing?</legend>
      <div className={styles.grid}>
        {PROPERTY_TYPES.map((type) => (
          <div key={type.value} className={styles.option}>
            <input
              type="radio"
              id={`propertyType-${type.value}`}
              name="propertyType"
              value={type.value}
              checked={value === type.value}
              onChange={() => onChange(type.value)}
              className={styles.nativeInput}
            />
            <label htmlFor={`propertyType-${type.value}`} className={styles.label}>
              <span className={styles.optionEmoji} aria-hidden="true">{type.emoji}</span>
              <span className={styles.optionTitle}>{type.label}</span>
              <span className={styles.optionDescription}>{type.description}</span>
            </label>
          </div>
        ))}
      </div>
    </fieldset>
  )
}
