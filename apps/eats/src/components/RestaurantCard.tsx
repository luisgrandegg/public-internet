import Link from 'next/link'
import { Card, Text, Stack } from '@public-internet/design-system'
import styles from './RestaurantCard.module.css'

export interface RestaurantCardProps {
  id: string
  name: string
  description: string
  city: string
  imageUrl?: string | null
  /**
   * Average review rating (1–5, one decimal) — null/undefined when unrated.
   * Ratings are informational only; they never affect listing order.
   */
  avgRating?: number | null
  /** Number of verified-order reviews. */
  reviewCount?: number
  /**
   * Href to the restaurant detail page.
   * Defaults to `/restaurants/[id]` but can be overridden for the dashboard.
   */
  href?: string
}

/**
 * Shared card used across browse, detail, and dashboard surfaces.
 * Composes only design-system primitives. No styled wrappers.
 */
export function RestaurantCard({
  id,
  name,
  description,
  city,
  imageUrl,
  avgRating,
  reviewCount = 0,
  href,
}: RestaurantCardProps) {
  const targetHref = href ?? `/restaurants/${id}`
  // Keep the description brief on the card — the detail page shows the full text.
  const excerpt = description.length > 140 ? `${description.slice(0, 140).trim()}…` : description

  return (
    <Link href={targetHref} className={styles.link} aria-label={`View ${name}`}>
      <Card variant="bordered" className={styles.card}>
        <div className={styles.imageWrapper}>
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt=""
              className={styles.image}
              loading="lazy"
            />
          ) : (
            <div className={styles.imagePlaceholder} aria-hidden="true">
              {name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <Stack gap={2} className={styles.body}>
          <Text variant="heading" level={3}>
            {name}
          </Text>
          <Text variant="caption" className={styles.city}>
            {city}
          </Text>
          {avgRating != null && reviewCount > 0 ? (
            <Text variant="caption" className={styles.rating}>
              <span aria-hidden="true">{avgRating.toFixed(1)} ★</span>
              <span className={styles.srOnly}>
                Rated {avgRating.toFixed(1)} out of 5
              </span>{' '}
              ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
            </Text>
          ) : (
            <Text variant="caption" className={styles.rating}>
              No reviews yet
            </Text>
          )}
          <Text variant="body" className={styles.description}>
            {excerpt}
          </Text>
        </Stack>
      </Card>
    </Link>
  )
}
