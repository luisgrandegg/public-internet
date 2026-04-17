'use client'

import { useTransition } from 'react'
import { Button, Badge } from '@public-internet/design-system'
import { transitionDeliveryAction } from '@/lib/actions/deliveries'
import styles from './page.module.css'

interface Props {
  id: string
  status: 'UNASSIGNED' | 'ASSIGNED' | 'PICKED_UP' | 'DELIVERED' | 'FAILED'
  statusLabel: string
  restaurantName: string
  restaurantAddress: string
  deliveryAddress: string
  basePayLabel: string
  distancePayLabel: string
  totalPayLabel: string
  items: { name: string; quantity: number }[]
}

export function DeliveryCard({
  id,
  status,
  statusLabel,
  restaurantName,
  restaurantAddress,
  deliveryAddress,
  basePayLabel,
  distancePayLabel,
  totalPayLabel,
  items,
}: Props) {
  const [isPending, startTransition] = useTransition()

  const doAction = (action: 'accept' | 'picked_up' | 'delivered' | 'failed') =>
    startTransition(() => transitionDeliveryAction(id, action).then(() => undefined))

  return (
    <article className={styles.card}>
      <header className={styles.cardHeader}>
        <div>
          <div className={styles.rowTitle}>{restaurantName}</div>
          <div className={styles.rowMeta}>Pick up from {restaurantAddress}</div>
          <div className={styles.rowMeta}>Deliver to {deliveryAddress}</div>
        </div>
        <Badge variant={status === 'UNASSIGNED' ? 'warning' : 'neutral'}>
          {statusLabel}
        </Badge>
      </header>

      {/* Pay breakdown — always shown separately (constitution §7) */}
      <div className={styles.payBreakdown} aria-label="Courier pay breakdown">
        <div className={styles.payRow}>
          <span>Base pay</span>
          <strong>{basePayLabel}</strong>
        </div>
        <div className={styles.payRow}>
          <span>Distance pay</span>
          <strong>{distancePayLabel}</strong>
        </div>
        <div className={`${styles.payRow} ${styles.payTotal}`}>
          <span>Total for this delivery</span>
          <strong>{totalPayLabel}</strong>
        </div>
      </div>

      <ul className={styles.itemList}>
        {items.map((item, idx) => (
          <li key={idx}>
            {item.quantity} × {item.name}
          </li>
        ))}
      </ul>

      <div className={styles.actions}>
        {status === 'UNASSIGNED' && (
          <Button onClick={() => doAction('accept')} disabled={isPending} variant="primary">
            Accept delivery
          </Button>
        )}
        {status === 'ASSIGNED' && (
          <Button onClick={() => doAction('picked_up')} disabled={isPending} variant="primary">
            Mark picked up
          </Button>
        )}
        {status === 'PICKED_UP' && (
          <Button onClick={() => doAction('delivered')} disabled={isPending} variant="primary">
            Mark delivered
          </Button>
        )}
        {(status === 'ASSIGNED' || status === 'PICKED_UP') && (
          <Button onClick={() => doAction('failed')} disabled={isPending} variant="destructive">
            Mark failed
          </Button>
        )}
      </div>
    </article>
  )
}
