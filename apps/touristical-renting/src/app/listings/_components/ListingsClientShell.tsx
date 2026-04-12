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

export function ListingsClientShell({ listings, filters }: ListingsClientShellProps) {
  const [hoveredListingId, setHoveredListingId] = useState<string | null>(null)

  return (
    <div className={styles.root}>
      <Suspense fallback={<div className={styles.filtersFallback} aria-hidden="true" />}>
        <FiltersSidebar filters={filters} />
      </Suspense>

      <div className={styles.mainContent}>
        <ListingsMap listings={listings} hoveredListingId={hoveredListingId} />

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
