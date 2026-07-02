'use client'

import { useState, Suspense } from 'react'
import dynamic from 'next/dynamic'
import type { Listing, ListingFilters } from '@/lib/types'
import { FiltersSidebar } from './FiltersSidebar'
import { ListingCard } from './ListingCard'
import styles from './ListingsClientShell.module.css'

const ListingsMap = dynamic(() => import('./ListingsMap'), {
  ssr: false,
  loading: () => (
    <div
      role="status"
      aria-label="Loading map"
      className={styles.mapLoading}
    >
      Loading map…
    </div>
  ),
})

interface ListingsClientShellProps {
  listings: Listing[]
  filters: ListingFilters
}

function formatFilterDate(value: string): string {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function ListingsClientShell({ listings, filters }: ListingsClientShellProps) {
  const [hoveredListingId, setHoveredListingId] = useState<string | null>(null)

  const activeFilters: Array<{ key: string; label?: string; value: string }> = []
  if (filters.checkIn) {
    activeFilters.push({ key: 'checkIn', label: 'Check in', value: formatFilterDate(filters.checkIn) })
  }
  if (filters.checkOut) {
    activeFilters.push({ key: 'checkOut', label: 'Check out', value: formatFilterDate(filters.checkOut) })
  }
  if (filters.guests) {
    activeFilters.push({
      key: 'guests',
      value: filters.guests === '1' ? '1 guest' : `${filters.guests} guests`,
    })
  }

  return (
    <div className={styles.root}>
      <Suspense fallback={<div className={styles.filtersFallback} aria-hidden="true" />}>
        <FiltersSidebar filters={filters} />
      </Suspense>

      <div className={styles.mainContent}>
        <ListingsMap listings={listings} hoveredListingId={hoveredListingId} />

        {activeFilters.length > 0 && (
          <ul className={styles.activeFilters} aria-label="Active search filters">
            {activeFilters.map((filter) => (
              <li key={filter.key} className={styles.activeFilter}>
                {filter.label ? (
                  <span className={styles.activeFilterLabel}>{filter.label}:</span>
                ) : null}
                {filter.value}
              </li>
            ))}
          </ul>
        )}

        <p className={styles.resultsHeading}>
          {listings.length} {listings.length === 1 ? 'place' : 'places'} found
        </p>

        {listings.length > 0 ? (
          <div className={styles.listingsGrid}>
            {listings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                onMouseEnter={() => setHoveredListingId(listing.id)}
                onMouseLeave={() => setHoveredListingId(null)}
              />
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <p>No listings match your search. Try adjusting the filters.</p>
          </div>
        )}
      </div>
    </div>
  )
}
