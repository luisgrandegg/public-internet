'use client'

import Link from 'next/link'
import { Badge, Icon } from '@public-internet/design-system'
import type { Listing } from '@/lib/types'
import styles from './ListingCard.module.css'

interface ListingCardProps {
  listing: Listing
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

const PROPERTY_TYPE_LABELS: Record<Listing['propertyType'], string> = {
  flat: 'Flat',
  house: 'House',
  room: 'Room',
  studio: 'Studio',
}

export function ListingCard({ listing, onMouseEnter, onMouseLeave }: ListingCardProps) {
  const firstPhoto = listing.photos[0]

  return (
    <Link
      href={`/listings/${listing.id}`}
      className={styles.root}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className={styles.imageWrapper}>
        {firstPhoto && (
          <img
            src={firstPhoto.url}
            alt={firstPhoto.alt ?? listing.title}
            className={styles.image}
            loading="lazy"
          />
        )}
        <div className={styles.badgeWrapper}>
          <Badge variant="neutral">{PROPERTY_TYPE_LABELS[listing.propertyType]}</Badge>
        </div>
      </div>

      <div className={styles.body}>
        <h3 className={styles.title}>{listing.title}</h3>

        <div className={styles.location}>
          <Icon name="map-pin" size="sm" />
          <span>{listing.location.city}, {listing.location.country}</span>
        </div>

        {listing.rating !== null ? (
          <div className={styles.rating}>
            <Icon name="star" size="sm" />
            <span className={styles.ratingText}>{listing.rating.toFixed(1)}</span>
            <span>({listing.reviewCount} {listing.reviewCount === 1 ? 'review' : 'reviews'})</span>
          </div>
        ) : (
          <p className={styles.noReviews}>No reviews yet</p>
        )}

        <div className={styles.price}>
          <strong className={styles.priceAmount}>€{listing.nightlyRate} / night</strong>
          {' '}— total price
        </div>
      </div>
    </Link>
  )
}
