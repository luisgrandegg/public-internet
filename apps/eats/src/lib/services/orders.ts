import { db } from '@/lib/db'
import type { CreateOrderInput } from '@/lib/schemas/orders'
import {
  INFRASTRUCTURE_FEE_CENTS,
  DEFAULT_COURIER_BASE_PAY_CENTS,
  DEFAULT_COURIER_DISTANCE_PAY_CENTS,
} from '@/lib/config'
import {
  isStripeConfigured,
  createCheckoutSession,
  PAYMENT_PROVIDER_STRIPE,
  PAYMENT_PROVIDER_OFFLINE,
} from '@/lib/payments'

/**
 * Published label of the flat per-order charge — must match the label the
 * customer saw in the pre-confirmation breakdown, on the order detail page,
 * and on the Stripe-hosted checkout line item (ADR-006: what is charged
 * online is exactly what the UI showed, item for item).
 */
export const INFRASTRUCTURE_FEE_LABEL = 'Platform infrastructure fee'

/**
 * Orders whose online (Stripe) payment has not SUCCEEDED are inert (ADR-006 §4):
 * they never appear in restaurant incoming-order lists and never produce a
 * courier-visible delivery. Offline-settled orders and legacy orders without a
 * payment record are always active.
 */
export const EXCLUDE_UNPAID_ONLINE_ORDERS = {
  NOT: {
    payment: {
      is: {
        provider: PAYMENT_PROVIDER_STRIPE,
        status: { not: 'SUCCEEDED' as const },
      },
    },
  },
} as const

export type OrderCreationError =
  | { code: 'MENU_ITEM_MISMATCH'; message: string }
  | { code: 'MENU_ITEM_UNAVAILABLE'; message: string }
  | { code: 'MENU_ITEM_NOT_FOUND'; message: string }
  | { code: 'RESTAURANT_NOT_FOUND'; message: string }
  | { code: 'PAYMENT_PROVIDER_ERROR'; message: string }

/**
 * Create an order for a customer. All work happens inside a single Prisma transaction:
 *   1. Validates restaurant is active and menu items belong to it AND are available.
 *   2. Snapshots unitPrice + name for each OrderItem.
 *   3. Computes itemsCost + infrastructureFee + totalCost.
 *   4. Creates the Delivery row in UNASSIGNED with pay breakdown shown to couriers.
 *   5. Creates the Payment row (ADR-006): offline nodes settle directly and the
 *      payment is SUCCEEDED immediately; Stripe nodes create a PENDING payment
 *      and a hosted Checkout Session whose total is exactly order.totalCost.
 *
 * When a checkout session is created, `checkoutUrl` is returned and the client
 * redirects there instead of the internal confirmation route.
 */
export async function createOrderForCustomer(
  customerId: string,
  input: CreateOrderInput,
): Promise<
  | {
      ok: true
      order: Awaited<ReturnType<typeof findOrderWithDetails>>
      checkoutUrl: string | null
    }
  | { ok: false; error: OrderCreationError }
> {
  // Validate restaurant
  const restaurant = await db.restaurant.findUnique({ where: { id: input.restaurantId } })
  if (!restaurant || !restaurant.isActive) {
    return {
      ok: false,
      error: { code: 'RESTAURANT_NOT_FOUND', message: 'Restaurant not available' },
    }
  }

  // Validate all menu items belong to restaurant AND are available.
  const menuItemIds = input.items.map((i) => i.menuItemId)
  const menuItems = await db.menuItem.findMany({
    where: { id: { in: menuItemIds } },
  })

  if (menuItems.length !== menuItemIds.length) {
    return {
      ok: false,
      error: {
        code: 'MENU_ITEM_NOT_FOUND',
        message: 'One or more menu items could not be found',
      },
    }
  }

  for (const item of menuItems) {
    if (item.restaurantId !== input.restaurantId) {
      return {
        ok: false,
        error: {
          code: 'MENU_ITEM_MISMATCH',
          message: 'All items must be from the same restaurant',
        },
      }
    }
    if (!item.isAvailable) {
      return {
        ok: false,
        error: {
          code: 'MENU_ITEM_UNAVAILABLE',
          message: `"${item.name}" is currently unavailable`,
        },
      }
    }
  }

  // Snapshot price and name at order time.
  const itemsById = new Map(menuItems.map((mi) => [mi.id, mi]))
  const orderItemData = input.items.map((i) => {
    const mi = itemsById.get(i.menuItemId)!
    return {
      menuItemId: mi.id,
      nameSnapshot: mi.name,
      quantity: i.quantity,
      unitPrice: mi.price,
    }
  })

  const itemsCost = orderItemData.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0)
  const infrastructureFee = INFRASTRUCTURE_FEE_CENTS
  const totalCost = itemsCost + infrastructureFee

  const stripeMode = isStripeConfigured()

  const { order: created, payment } = await db.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        customerId,
        restaurantId: input.restaurantId,
        itemsCost,
        infrastructureFee,
        totalCost,
        deliveryAddress: input.deliveryAddress,
        notes: input.notes,
        items: {
          create: orderItemData,
        },
      },
    })
    await tx.delivery.create({
      data: {
        orderId: order.id,
        status: 'UNASSIGNED',
        // Courier pay breakdown set when Delivery is created so the
        // worker can see the values before accepting.
        basePay: DEFAULT_COURIER_BASE_PAY_CENTS,
        distancePay: DEFAULT_COURIER_DISTANCE_PAY_CENTS,
      },
    })
    // Payment record in the same transaction (ADR-006). amount is exactly the
    // pre-confirmation total — never recomputed after creation.
    const payment = await tx.payment.create({
      data: {
        orderId: order.id,
        provider: stripeMode ? PAYMENT_PROVIDER_STRIPE : PAYMENT_PROVIDER_OFFLINE,
        // Offline settlement (pay on delivery) is a first-class mode for a
        // commission-free node — the record documents how the money flows.
        status: stripeMode ? 'PENDING' : 'SUCCEEDED',
        amount: totalCost,
      },
    })
    return { order, payment }
  })

  let checkoutUrl: string | null = null
  if (stripeMode) {
    try {
      // One line per order item (unitPrice snapshot) plus exactly one line for
      // the published flat infrastructure fee. The session total equals
      // order.totalCost — nothing else is ever added (constitution: no
      // extraction, no hidden fees).
      const session = await createCheckoutSession({
        orderId: created.id,
        paymentId: payment.id,
        currency: payment.currency,
        lineItems: [
          ...orderItemData.map((item) => ({
            name: item.nameSnapshot,
            unitAmount: item.unitPrice,
            quantity: item.quantity,
          })),
          { name: INFRASTRUCTURE_FEE_LABEL, unitAmount: infrastructureFee, quantity: 1 },
        ],
      })
      await db.payment.update({
        where: { id: payment.id },
        data: { stripeCheckoutSessionId: session.sessionId, stripeCheckoutUrl: session.url },
      })
      checkoutUrl = session.url
    } catch {
      // The payment provider is unreachable or rejected the session. Mark the
      // payment FAILED (the order stays inert per ADR-006 §4) and surface a
      // clear error to the customer.
      await db.payment.update({
        where: { id: payment.id },
        data: { status: 'FAILED' },
      })
      return {
        ok: false,
        error: {
          code: 'PAYMENT_PROVIDER_ERROR',
          message: 'Could not start the online payment. You have not been charged — please try again.',
        },
      }
    }
  }

  const order = await findOrderWithDetails(created.id)
  return { ok: true, order, checkoutUrl }
}

export async function findOrderWithDetails(orderId: string) {
  return db.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
      delivery: true,
      payment: true,
      restaurant: {
        select: { id: true, name: true, city: true, imageUrl: true },
      },
    },
  })
}

export async function listOrdersForCustomer(customerId: string) {
  // The customer always sees their own orders, including unpaid ones —
  // with the payment state so a PENDING checkout can be completed.
  return db.order.findMany({
    where: { customerId },
    orderBy: { createdAt: 'desc' },
    include: {
      restaurant: { select: { id: true, name: true, city: true, imageUrl: true } },
      delivery: { select: { status: true } },
      payment: { select: { provider: true, status: true, stripeCheckoutUrl: true } },
    },
  })
}

export async function listOrdersForOwner(ownerId: string, status?: string) {
  return db.order.findMany({
    where: {
      restaurant: { ownerId },
      ...(status && { status: status as never }),
      // ADR-006 §4: unpaid online orders are inert — a restaurant never sees
      // an order whose Stripe payment has not succeeded.
      ...EXCLUDE_UNPAID_ONLINE_ORDERS,
    },
    orderBy: { createdAt: 'desc' },
    include: {
      items: true,
      restaurant: { select: { id: true, name: true, city: true } },
      customer: { select: { id: true, name: true } },
      delivery: { select: { status: true } },
    },
  })
}
