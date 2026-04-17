'use client'

import { useTransition } from 'react'
import { Button, Badge } from '@public-internet/design-system'
import { updateOrderStatusAction } from '@/lib/actions/restaurant-orders'
import styles from './page.module.css'

interface Props {
  id: string
  status: 'PENDING' | 'ACCEPTED' | 'PREPARING' | 'READY_FOR_PICKUP' | 'IN_DELIVERY' | 'DELIVERED' | 'CANCELLED'
  statusLabel: string
  restaurantName: string
  customerName: string
  items: { name: string; quantity: number }[]
  totalLabel: string
  createdAt: string
  notes?: string
}

export function OrderRow({
  id,
  status,
  statusLabel,
  customerName,
  items,
  totalLabel,
  createdAt,
  notes,
}: Props) {
  const [isPending, startTransition] = useTransition()

  const next = (value: 'ACCEPTED' | 'PREPARING' | 'READY_FOR_PICKUP') =>
    startTransition(() => updateOrderStatusAction(id, value).then(() => undefined))

  return (
    <article className={styles.orderCard}>
      <header className={styles.orderHeader}>
        <div>
          <div className={styles.rowTitle}>{customerName}</div>
          <div className={styles.rowMeta}>{new Date(createdAt).toLocaleTimeString()}</div>
        </div>
        <Badge variant={status === 'PENDING' ? 'warning' : 'neutral'}>{statusLabel}</Badge>
      </header>
      <ul className={styles.itemList}>
        {items.map((item, idx) => (
          <li key={idx}>
            {item.quantity} × {item.name}
          </li>
        ))}
      </ul>
      {notes && (
        <p className={styles.orderNotes}>
          <strong>Notes:</strong> {notes}
        </p>
      )}
      <div className={styles.orderFooter}>
        <span className={styles.orderTotal}>{totalLabel}</span>
        <div className={styles.orderActions}>
          {status === 'PENDING' && (
            <Button onClick={() => next('ACCEPTED')} disabled={isPending}>
              Accept
            </Button>
          )}
          {status === 'ACCEPTED' && (
            <Button onClick={() => next('PREPARING')} disabled={isPending}>
              Mark preparing
            </Button>
          )}
          {status === 'PREPARING' && (
            <Button onClick={() => next('READY_FOR_PICKUP')} disabled={isPending}>
              Ready for pickup
            </Button>
          )}
        </div>
      </div>
    </article>
  )
}
