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
  /** Raw URL params — prefill the sidebar form so the user can keep editing them. */
  filters: ListingFilters
  /**
   * The filters the server actually applied to the query (e.g. a half-filled
   * date range is ignored, an invalid guests value is dropped). The active
   * filter chips render from these so they exactly mirror the results.
   */
  appliedFilters: ListingFilters
  /** IDs the signed-in user has saved. Null for signed-out visitors — hides the save toggle. */
  favoritedListingIds?: string[] | null
}

function formatFilterDate(value: string): string {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  // The value is a plain YYYY-MM-DD date parsed as UTC midnight — render it
  // in UTC too, otherwise the day shifts back in timezones west of UTC.
  return parsed.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

export function ListingsClientShell({
  listings,
  filters,
  appliedFilters,
  favoritedListingIds = null,
}: ListingsClientShellProps) {
  const [hoveredListingId, setHoveredListingId] = useState<string | null>(null)

  const activeFilters: Array<{ key: string; label?: string; value: string }> = []
  if (appliedFilters.checkIn) {
    activeFilters.push({ key: 'checkIn', label: 'Check in', value: formatFilterDate(appliedFilters.checkIn) })
  }
  if (appliedFilters.checkOut) {
    activeFilters.push({ key: 'checkOut', label: 'Check out', value: formatFilterDate(appliedFilters.checkOut) })
  }
  if (appliedFilters.guests) {
    activeFilters.push({
      key: 'guests',
      value: appliedFilters.guests === '1' ? '1 guest' : `${appliedFilters.guests} guests`,
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
                favorited={favoritedListingIds ? favoritedListingIds.includes(listing.id) : null}
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
