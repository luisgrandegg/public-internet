/**
 * Format an integer cents amount as a euro string.
 * Prices in this app are stored in cents to avoid floating-point rounding.
 * Display examples:
 *   formatEuros(1234)  → "€12.34"
 *   formatEuros(0)     → "€0.00"
 *   formatEuros(9999)  → "€99.99"
 */
export function formatEuros(cents: number): string {
  const euros = (cents / 100).toFixed(2)
  return `€${euros}`
}

/**
 * Human-readable labels for OrderStatus.
 * Constitution: status must be conveyed with text — never colour alone.
 */
export const ORDER_STATUS_LABELS = {
  PENDING: 'Pending',
  ACCEPTED: 'Accepted',
  PREPARING: 'Preparing',
  READY_FOR_PICKUP: 'Ready for pickup',
  IN_DELIVERY: 'In delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
} as const

export type OrderStatusKey = keyof typeof ORDER_STATUS_LABELS

export function orderStatusLabel(status: string): string {
  return (ORDER_STATUS_LABELS as Record<string, string>)[status] ?? status
}

/**
 * Human-readable labels for DeliveryStatus.
 */
export const DELIVERY_STATUS_LABELS = {
  UNASSIGNED: 'Unassigned',
  ASSIGNED: 'Assigned',
  PICKED_UP: 'Picked up',
  DELIVERED: 'Delivered',
  FAILED: 'Failed',
} as const

export type DeliveryStatusKey = keyof typeof DELIVERY_STATUS_LABELS

export function deliveryStatusLabel(status: string): string {
  return (DELIVERY_STATUS_LABELS as Record<string, string>)[status] ?? status
}

/**
 * Short, honest payment-state label (ADR-006).
 * Constitution: state is conveyed with plain text — never colour alone,
 * never urgency copy. Offline settlement is a first-class mode, not an error.
 */
export function paymentStateLabel(
  payment: { provider: string; status: string } | null | undefined,
): string {
  if (!payment) return ''
  if (payment.provider === 'offline') return 'Settled directly — pay on delivery'
  switch (payment.status) {
    case 'SUCCEEDED':
      return 'Paid'
    case 'PENDING':
      return 'Payment pending'
    case 'FAILED':
      return 'Payment failed'
    case 'CANCELED':
      return 'Payment canceled'
    default:
      return payment.status
  }
}
