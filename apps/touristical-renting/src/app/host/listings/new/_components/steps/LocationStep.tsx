import { Input } from '@public-internet/design-system'
import styles from './LocationStep.module.css'

interface LocationStepProps {
  city: string
  country: string
  onCityChange: (value: string) => void
  onCountryChange: (value: string) => void
}

export function LocationStep({ city, country, onCityChange, onCountryChange }: LocationStepProps) {
  return (
    <div className={styles.root}>
      <h2 className={styles.heading}>Where is your property?</h2>
      <p className={styles.description}>
        Guests will see the city and country. The exact address is only shared once a booking is confirmed.
      </p>
      <div className={styles.fields}>
        <Input
          name="city"
          label="City"
          placeholder="e.g. Barcelona"
          value={city}
          onChange={(e) => onCityChange(e.target.value)}
          required
        />
        <Input
          name="country"
          label="Country"
          placeholder="e.g. Spain"
          value={country}
          onChange={(e) => onCountryChange(e.target.value)}
          required
        />
      </div>
    </div>
  )
}
