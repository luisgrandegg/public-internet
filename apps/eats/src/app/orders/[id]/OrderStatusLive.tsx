'use client'

import * as React from 'react'
import { Stepper } from '@public-internet/design-system'
import { orderStatusLabel, deliveryStatusLabel } from '@/lib/format'
import styles from './page.module.css'

/**
 * Normal order progression. CANCELLED is a terminal state outside the
 * progression and is rendered as a text notice instead of a timeline step.
 */
const ORDER_STATUS_PROGRESSION = [
  'PENDING',
  'ACCEPTED',
  'PREPARING',
  'READY_FOR_PICKUP',
  'IN_DELIVERY',
  'DELIVERED',
] as const

const TERMINAL_STATUSES = new Set(['DELIVERED', 'CANCELLED'])
const POLL_INTERVAL_MS = 5000

export interface LiveDeliveryData {
  status: string
  pickedUpAt: string | null
  deliveredAt: string | null
}

export interface LiveOrderData {
  id: string
  status: string
  createdAt: string
  updatedAt: string
  delivery: LiveDeliveryData | null
}

interface OrderApiPayload {
  data?: {
    id: string
    status: string
    createdAt: string
    updatedAt: string
    delivery?: LiveDeliveryData | null
  }
}

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString()
}

/**
 * Client-side live view of an order's status. Polls GET /api/orders/[id]
 * every few seconds while the tab is visible, pauses when the tab is hidden,
 * and stops for good once the order reaches a terminal state
 * (DELIVERED or CANCELLED).
 *
 * Accessibility: status changes are announced via an aria-live="polite"
 * region, and status is always conveyed with text — never colour alone.
 */
export function OrderStatusLive({ initialOrder }: { initialOrder: LiveOrderData }) {
  const [order, setOrder] = React.useState<LiveOrderData>(initialOrder)
  const isTerminal = TERMINAL_STATUSES.has(order.status)

  React.useEffect(() => {
    if (TERMINAL_STATUSES.has(order.status)) return

    let cancelled = false
    let timer: number | undefined

    async function poll() {
      try {
        const res = await fetch(`/api/orders/${order.id}`, {
          headers: { accept: 'application/json' },
          cache: 'no-store',
        })
        if (cancelled) return
        if (res.status === 401 || res.status === 403 || res.status === 404) {
          // Session expired or order no longer accessible — stop polling.
          stop()
          return
        }
        if (!res.ok) return // transient server error — retry on next tick
        const body = (await res.json()) as OrderApiPayload
        const next = body.data
        if (!next || cancelled) return
        setOrder({
          id: next.id,
          status: next.status,
          createdAt: next.createdAt,
          updatedAt: next.updatedAt,
          delivery: next.delivery
            ? {
                status: next.delivery.status,
                pickedUpAt: next.delivery.pickedUpAt ?? null,
                deliveredAt: next.delivery.deliveredAt ?? null,
              }
            : null,
        })
      } catch {
        // Network hiccup — keep the last known state and retry on next tick.
      }
    }

    function start() {
      if (timer === undefined) timer = window.setInterval(() => void poll(), POLL_INTERVAL_MS)
    }

    function stop() {
      if (timer !== undefined) {
        window.clearInterval(timer)
        timer = undefined
      }
    }

    function onVisibilityChange() {
      if (document.hidden) {
        stop()
      } else {
        void poll() // catch up immediately when the tab becomes visible again
        start()
      }
    }

    if (!document.hidden) start()
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      cancelled = true
      stop()
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
    // Re-run when status changes so polling stops as soon as a terminal state arrives.
  }, [order.id, order.status])

  const isCancelled = order.status === 'CANCELLED'
  const progressionIndex = ORDER_STATUS_PROGRESSION.indexOf(
    order.status as (typeof ORDER_STATUS_PROGRESSION)[number],
  )
  // DELIVERED marks every step complete; unknown states fall back to the first step.
  const currentStep =
    order.status === 'DELIVERED'
      ? ORDER_STATUS_PROGRESSION.length
      : Math.max(0, progressionIndex)

  const steps = ORDER_STATUS_PROGRESSION.map((status, index) => ({
    label: orderStatusLabel(status),
    description: index === currentStep ? 'Current status' : undefined,
  }))

  return (
    <section className={styles.section} aria-label="Order status">
      <h2 className={styles.sectionHeading}>Order status</h2>

      {/* Announced politely to screen readers whenever the status changes. */}
      <p role="status" aria-live="polite" className={styles.liveStatus}>
        Status: <strong>{orderStatusLabel(order.status)}</strong>
        {order.delivery && (
          <>
            {' '}
            · Delivery: <strong>{deliveryStatusLabel(order.delivery.status)}</strong>
          </>
        )}
      </p>

      {isCancelled ? (
        <p className={styles.cancelledNotice}>
          This order was cancelled. No further status updates will occur.
        </p>
      ) : (
        <Stepper steps={steps} currentStep={currentStep} orientation="vertical" />
      )}

      <dl className={styles.timestampList}>
        <div className={styles.timestampRow}>
          <dt>Last updated</dt>
          <dd suppressHydrationWarning>{formatTimestamp(order.updatedAt)}</dd>
        </div>
        {order.delivery?.pickedUpAt && (
          <div className={styles.timestampRow}>
            <dt>Picked up</dt>
            <dd suppressHydrationWarning>{formatTimestamp(order.delivery.pickedUpAt)}</dd>
          </div>
        )}
        {order.delivery?.deliveredAt && (
          <div className={styles.timestampRow}>
            <dt>Delivered</dt>
            <dd suppressHydrationWarning>{formatTimestamp(order.delivery.deliveredAt)}</dd>
          </div>
        )}
      </dl>

      {!isTerminal && (
        <p className={styles.pollNote}>
          This page checks for updates every few seconds while it is open.
        </p>
      )}
    </section>
  )
}
