import { Card, Text, Stack, Badge } from '@public-internet/design-system'
import { formatEuros } from '@/lib/format'
import styles from './MenuItemCard.module.css'

export interface MenuItemCardProps {
  name: string
  description: string
  /** Price stored in cents. */
  price: number
  category?: string
  isAvailable?: boolean
  /** Optional extra content shown at the bottom (e.g. quantity controls or action buttons). */
  footer?: React.ReactNode
}

/**
 * Shared card that renders a menu item with a price and optional footer controls.
 * Used on the customer detail page, the order flow, and the owner menu management UI.
 */
export function MenuItemCard({
  name,
  description,
  price,
  category,
  isAvailable = true,
  footer,
}: MenuItemCardProps) {
  return (
    <Card variant="bordered" className={styles.card}>
      <Stack gap={2}>
        <div className={styles.header}>
          <Text variant="heading" level={4}>
            {name}
          </Text>
          <span className={styles.price} aria-label={`Price ${formatEuros(price)}`}>
            {formatEuros(price)}
          </span>
        </div>
        {category && (
          <Text variant="caption" className={styles.category}>
            {category}
          </Text>
        )}
        {!isAvailable && (
          <Badge variant="warning">Currently unavailable</Badge>
        )}
        <Text variant="body" className={styles.description}>
          {description}
        </Text>
        {footer && <div className={styles.footer}>{footer}</div>}
      </Stack>
    </Card>
  )
}
