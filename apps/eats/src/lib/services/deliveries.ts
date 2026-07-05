import { db } from '@/lib/db'
import { PAYMENT_PROVIDER_OFFLINE } from '@/lib/payments'
import { EXCLUDE_UNPAID_ONLINE_ORDERS } from '@/lib/services/orders'

export type DeliveryStatus = 'UNASSIGNED' | 'ASSIGNED' | 'PICKED_UP' | 'DELIVERED' | 'FAILED'

/**
 * Deliveries visible to the signed-in courier.
 *   - `status=UNASSIGNED` → available deliveries (anyone can accept)
 *   - `status=ASSIGNED`   → the courier's own active deliveries
 *   - otherwise           → the courier's delivery history (all statuses except UNASSIGNED)
 *
 * ADR-006 §4: unpaid online orders are inert — a delivery whose order's online
 * payment has not SUCCEEDED is never offered to couriers as available.
 */
export async function listDeliveriesForCourier(
  courierId: string,
  status: DeliveryStatus | null,
) {
  const where =
    status === 'UNASSIGNED'
      ? { status: 'UNASSIGNED' as const, order: EXCLUDE_UNPAID_ONLINE_ORDERS }
      : status === 'ASSIGNED'
      ? { courierId, status: 'ASSIGNED' as const }
      : { courierId }

  return db.delivery.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      order: {
        include: {
          restaurant: { select: { id: true, name: true, city: true, address: true } },
          items: { select: { quantity: true, nameSnapshot: true } },
        },
      },
    },
  })
}

export async function getDeliveryById(id: string) {
  return db.delivery.findUnique({
    where: { id },
    include: {
      order: {
        include: {
          payment: { select: { provider: true, status: true } },
        },
      },
    },
  })
}

export type DeliveryAction = 'accept' | 'picked_up' | 'delivered' | 'failed'

export type TransitionError =
  | { code: 'INVALID_TRANSITION'; message: string }
  | { code: 'FORBIDDEN'; message: string }

export async function transitionDelivery(
  deliveryId: string,
  courierId: string,
  action: DeliveryAction,
): Promise<
  | { ok: true; delivery: Awaited<ReturnType<typeof getDeliveryById>> }
  | { ok: false; error: TransitionError }
> {
  const delivery = await getDeliveryById(deliveryId)
  if (!delivery) {
    return {
      ok: false,
      error: { code: 'INVALID_TRANSITION', message: 'Delivery not found' },
    }
  }

  // Ownership checks
  if (action === 'accept') {
    if (delivery.status !== 'UNASSIGNED') {
      return {
        ok: false,
        error: { code: 'INVALID_TRANSITION', message: 'Delivery is no longer available' },
      }
    }
    // ADR-006 §4: an order whose online payment has not succeeded is inert —
    // it is filtered out of the available list, and cannot be accepted directly.
    const payment = delivery.order.payment
    if (payment && payment.provider !== PAYMENT_PROVIDER_OFFLINE && payment.status !== 'SUCCEEDED') {
      return {
        ok: false,
        error: { code: 'INVALID_TRANSITION', message: 'Delivery is no longer available' },
      }
    }
  } else {
    if (delivery.courierId !== courierId) {
      return {
        ok: false,
        error: { code: 'FORBIDDEN', message: 'Not your delivery' },
      }
    }
  }

  // State machine
  const now = new Date()
  switch (action) {
    case 'accept': {
      const updated = await db.delivery.update({
        where: { id: deliveryId },
        data: { status: 'ASSIGNED', courierId },
      })
      return { ok: true, delivery: await reload(updated.id) }
    }
    case 'picked_up': {
      if (delivery.status !== 'ASSIGNED') {
        return {
          ok: false,
          error: { code: 'INVALID_TRANSITION', message: 'Delivery must be assigned first' },
        }
      }
      const updated = await db.$transaction(async (tx) => {
        const d = await tx.delivery.update({
          where: { id: deliveryId },
          data: { status: 'PICKED_UP', pickedUpAt: now },
        })
        await tx.order.update({
          where: { id: delivery.orderId },
          data: { status: 'IN_DELIVERY' },
        })
        return d
      })
      return { ok: true, delivery: await reload(updated.id) }
    }
    case 'delivered': {
      if (delivery.status !== 'PICKED_UP') {
        return {
          ok: false,
          error: { code: 'INVALID_TRANSITION', message: 'Delivery must be picked up first' },
        }
      }
      const updated = await db.$transaction(async (tx) => {
        const d = await tx.delivery.update({
          where: { id: deliveryId },
          data: { status: 'DELIVERED', deliveredAt: now },
        })
        await tx.order.update({
          where: { id: delivery.orderId },
          data: { status: 'DELIVERED' },
        })
        return d
      })
      return { ok: true, delivery: await reload(updated.id) }
    }
    case 'failed': {
      if (delivery.status === 'DELIVERED' || delivery.status === 'FAILED') {
        return {
          ok: false,
          error: {
            code: 'INVALID_TRANSITION',
            message: 'Cannot fail a completed delivery',
          },
        }
      }
      const updated = await db.delivery.update({
        where: { id: deliveryId },
        data: { status: 'FAILED' },
      })
      return { ok: true, delivery: await reload(updated.id) }
    }
    default:
      return {
        ok: false,
        error: { code: 'INVALID_TRANSITION', message: 'Unknown action' },
      }
  }
}

async function reload(id: string) {
  return getDeliveryById(id)
}
