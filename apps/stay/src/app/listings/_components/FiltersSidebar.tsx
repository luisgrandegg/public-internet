'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@public-internet/design-system'
import type { ListingFilters, PropertyType } from '@/lib/types'
import styles from './FiltersSidebar.module.css'

interface FiltersSidebarProps {
  filters: ListingFilters
}

const PROPERTY_TYPE_OPTIONS: Array<{ value: PropertyType | ''; label: string }> = [
  { value: '', label: 'All types' },
  { value: 'flat', label: 'Flat' },
  { value: 'house', label: 'House' },
  { value: 'room', label: 'Room' },
  { value: 'studio', label: 'Studio' },
]

export function FiltersSidebar({ filters }: FiltersSidebarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function buildUrl(updates: Partial<ListingFilters>): string {
    const params = new URLSearchParams(searchParams.toString())
    const merged = { ...filters, ...updates }
    Object.entries(merged).forEach(([key, value]) => {
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    })
    return `/listings?${params.toString()}`
  }

  function handleChange(field: keyof ListingFilters, value: string) {
    router.push(buildUrl({ [field]: value }))
  }

  return (
    <form
      className={styles.root}
      aria-label="Search filters"
      onSubmit={(e) => e.preventDefault()}
    >
      <h2 className={styles.heading}>Filters</h2>

      <Input
        name="location"
        label="Location"
        placeholder="City or region"
        defaultValue={filters.location}
        onChange={(e) => handleChange('location', e.target.value)}
      />

      <Input
        name="checkIn"
        label="Check in"
        type="date"
        defaultValue={filters.checkIn}
        onChange={(e) => handleChange('checkIn', e.target.value)}
      />

      <Input
        name="checkOut"
        label="Check out"
        type="date"
        defaultValue={filters.checkOut}
        onChange={(e) => handleChange('checkOut', e.target.value)}
      />

      <Input
        name="guests"
        label="Guests"
        type="number"
        min="1"
        defaultValue={filters.guests}
        onChange={(e) => handleChange('guests', e.target.value)}
      />

      {/* GAP: Requires <Select> component */}
      <div className={styles.selectWrapper}>
        <label htmlFor="propertyType" className={styles.selectLabel}>
          Property type
        </label>
        <select
          id="propertyType"
          name="propertyType"
          className={styles.nativeSelect}
          defaultValue={filters.propertyType}
          onChange={(e) => handleChange('propertyType', e.target.value)}
        >
          {PROPERTY_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.priceRow}>
        <Input
          name="minPrice"
          label="Min price (€)"
          type="number"
          min="0"
          placeholder="0"
          defaultValue={filters.minPrice}
          onChange={(e) => handleChange('minPrice', e.target.value)}
        />
        <Input
          name="maxPrice"
          label="Max price (€)"
          type="number"
          min="0"
          placeholder="Any"
          defaultValue={filters.maxPrice}
          onChange={(e) => handleChange('maxPrice', e.target.value)}
        />
      </div>
    </form>
  )
}
