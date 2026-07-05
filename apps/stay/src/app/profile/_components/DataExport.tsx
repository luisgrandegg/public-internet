'use client'

import { Button } from '@public-internet/design-system'
import styles from './DataExport.module.css'

export function DataExport() {
  function handleExport() {
    window.location.href = '/api/users/me/export'
  }

  return (
    <div className={styles.root}>
      <h2 className={styles.sectionHeading}>Your data</h2>
      <p className={styles.description}>
        Download a copy of your listings, bookings, and account data in JSON format.
      </p>
      <Button type="button" variant="outline" onClick={handleExport}>
        Export my data
      </Button>
    </div>
  )
}
