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
          <Text variant="body" className={styles.description}>
            {excerpt}
          </Text>
        </Stack>
      </Card>
    </Link>
  )
}
