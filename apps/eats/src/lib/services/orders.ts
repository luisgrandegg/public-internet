import { db } from '@/lib/db'
import type { CreateOrderInput } from '@/lib/schemas/orders'
import {
  INFRASTRUCTURE_FEE_CENTS,
  DEFAULT_COURIER_BASE_PAY_CENTS,
  DEFAULT_COURIER_DISTANCE_PAY_CENTS,
} from '@/lib/config'
import { paymentProvider, PAYMENT_PROVIDER_OFFLINE } from '@/lib/payments'

/**
 * Published label of the flat per-order charge — must match the label the
 * customer saw in the pre-confirmation breakdown, on the order detail page,
 * and on the provider-hosted checkout line item (ADR-006: what is charged
 * online is exactly what the UI showed, item for item).
 */
export const INFRASTRUCTURE_FEE_LABEL = 'Platform infrastructure fee'

/**
 * Orders whose online payment has not SUCCEEDED are inert (ADR-006 §4):
 * they never appear in restaurant incoming-order lists and never produce a
 * courier-visible delivery. Offline-settled orders and legacy orders without a
 * payment record are always active. Provider-agnostic: any provider other
 * than 'offline' is an online payment (ADR-006 amendment).
 */
export const EXCLUDE_UNPAID_ONLINE_ORDERS = {
  NOT: {
    payment: {
      is: {
        provider: { not: PAYMENT_PROVIDER_OFFLINE },
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
 *      payment is SUCCEEDED immediately; nodes with a configured PaymentProvider
 *      create a PENDING payment and a hosted checkout session whose total is
 *      exactly order.totalCost.
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
        provider: paymentProvider?.id ?? PAYMENT_PROVIDER_OFFLINE,
        // Offline settlement (pay on delivery) is a first-class mode for a
        // commission-free node — the record documents how the money flows.
        status: paymentProvider ? 'PENDING' : 'SUCCEEDED',
        amount: totalCost,
      },
    })
    return { order, payment }
  })

  let checkoutUrl: string | null = null
  if (paymentProvider) {
    try {
      // One line per order item (unitPrice snapshot) plus exactly one line for
      // the published flat infrastructure fee. The session total equals
      // order.totalCost — nothing else is ever added (constitution: no
      // extraction, no hidden fees).
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3001'
      const session = await paymentProvider.createCheckoutSession({
        paymentId: payment.id,
        referenceId: created.id,
        amountCents: totalCost,
        currency: payment.currency,
        lineItems: [
          ...orderItemData.map((item) => ({
            name: item.nameSnapshot,
            amountCents: item.unitPrice,
            quantity: item.quantity,
          })),
          { name: INFRASTRUCTURE_FEE_LABEL, amountCents: infrastructureFee, quantity: 1 },
        ],
        successUrl: `${appUrl}/orders/${created.id}?checkout=success`,
        cancelUrl: `${appUrl}/orders/${created.id}?checkout=canceled`,
      })
      await db.payment.update({
        where: { id: payment.id },
        data: { providerSessionId: session.sessionId, providerCheckoutUrl: session.checkoutUrl },
      })
      checkoutUrl = session.checkoutUrl
    } catch {
      // The payment provider is unreachable or rejected the session. Roll the
      // order back entirely — a phantom order the customer can never pay for
      // must not pollute their history. Deleting the order cascades items and
      // payment (onDelete: Cascade); the delivery has no cascade and is
      // deleted explicitly first, all in one transaction.
      await db.$transaction([
        db.delivery.delete({ where: { orderId: created.id } }),
        db.order.delete({ where: { id: created.id } }),
      ])
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
      payment: { select: { provider: true, status: true, providerCheckoutUrl: true } },
    },
  })
}

/** Statuses a restaurant owner may set. IN_DELIVERY and DELIVERED are courier-driven. */
export type OwnerOrderStatus = 'ACCEPTED' | 'PREPARING' | 'READY_FOR_PICKUP'

export type OwnerOrderUpdateError =
  | { code: 'ORDER_NOT_FOUND'; message: string }
  | { code: 'NOT_ORDER_OWNER'; message: string }
  | { code: 'ORDER_UNPAID'; message: string }

/**
 * Advance an order's status from the restaurant dashboard.
 *
 * This is the chokepoint for the ADR-006 §4 invariant on writes: an order
 * whose online payment has not SUCCEEDED is inert. Excluding unpaid orders
 * from the owner's list (EXCLUDE_UNPAID_ONLINE_ORDERS) is not enough — the
 * owner must also be unable to advance such an order by id.
 */
export async function updateOrderStatusForOwner(
  ownerId: string,
  orderId: string,
  status: OwnerOrderStatus,
): Promise<
  | { ok: true; order: NonNullable<Awaited<ReturnType<typeof findOrderWithDetails>>> }
  | { ok: false; error: OwnerOrderUpdateError }
> {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: {
      restaurant: { select: { ownerId: true } },
      payment: { select: { provider: true, status: true } },
    },
  })
  if (!order) {
    return { ok: false, error: { code: 'ORDER_NOT_FOUND', message: 'Order not found' } }
  }
  if (order.restaurant.ownerId !== ownerId) {
    return { ok: false, error: { code: 'NOT_ORDER_OWNER', message: 'Not your order' } }
  }
  // ADR-006 §4: unpaid online orders are inert — no state transition until
  // the provider-authenticated webhook marks the payment SUCCEEDED.
  if (
    order.payment &&
    order.payment.provider !== PAYMENT_PROVIDER_OFFLINE &&
    order.payment.status !== 'SUCCEEDED'
  ) {
    return {
      ok: false,
      error: {
        code: 'ORDER_UNPAID',
        message: 'The online payment for this order has not completed — it cannot be advanced',
      },
    }
  }

  const updated = await db.order.update({
    where: { id: orderId },
    data: { status },
    include: {
      items: true,
      delivery: true,
      payment: true,
      restaurant: { select: { id: true, name: true, city: true, imageUrl: true } },
    },
  })
  return { ok: true, order: updated }
}

export type PaymentResumeError =
  | { code: 'ORDER_NOT_FOUND'; message: string }
  | { code: 'NOT_ORDER_OWNER'; message: string }
  | { code: 'PAYMENT_NOT_RESUMABLE'; message: string }
  | { code: 'PAYMENT_ALREADY_SETTLING'; message: string }
  | { code: 'PAYMENTS_NOT_CONFIGURED'; message: string }
  | { code: 'PAYMENT_PROVIDER_ERROR'; message: string }

/**
 * Give the customer a live checkout URL for an order whose online payment is
 * still PENDING (ADR-006 §4 — the "Complete payment" path).
 *
 * When the provider reports the stored session state (optional
 * getCheckoutSession): an 'open' session is reused, a 'complete' one means the
 * money is already settling (the webhook will confirm — never offer to pay
 * twice), and an 'expired' one is replaced. When the provider cannot report
 * liveness, or the stored session is gone, a fresh session is created with
 * exactly the same line items and total as the original (never recomputed).
 */
export async function resumePaymentForOrder(
  customerId: string,
  orderId: string,
): Promise<{ ok: true; checkoutUrl: string } | { ok: false; error: PaymentResumeError }> {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { items: true, payment: true },
  })
  if (!order) {
    return { ok: false, error: { code: 'ORDER_NOT_FOUND', message: 'Order not found' } }
  }
  if (order.customerId !== customerId) {
    return { ok: false, error: { code: 'NOT_ORDER_OWNER', message: 'Not your order' } }
  }

  const payment = order.payment
  if (!payment || payment.provider === PAYMENT_PROVIDER_OFFLINE || payment.status !== 'PENDING') {
    return {
      ok: false,
      error: {
        code: 'PAYMENT_NOT_RESUMABLE',
        message: 'This order has no pending online payment to complete',
      },
    }
  }
  if (!paymentProvider) {
    return {
      ok: false,
      error: {
        code: 'PAYMENTS_NOT_CONFIGURED',
        message: 'No payment provider is configured on this node',
      },
    }
  }

  // Prefer the stored session when the provider can vouch it is still live —
  // avoids handing the customer a dead link.
  if (payment.providerSessionId && paymentProvider.getCheckoutSession) {
    try {
      const live = await paymentProvider.getCheckoutSession(payment.providerSessionId)
      if (live.status === 'complete') {
        return {
          ok: false,
          error: {
            code: 'PAYMENT_ALREADY_SETTLING',
            message: 'This payment has already been completed and is being confirmed',
          },
        }
      }
      if (live.status === 'open' && live.checkoutUrl) {
        return { ok: true, checkoutUrl: live.checkoutUrl }
      }
      // 'expired' (or an open session without a URL) → regenerate below.
    } catch {
      // The stored session could not be retrieved (deleted upstream, provider
      // switched) — fall through and create a fresh one.
    }
  }

  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3001'
    // Same line items and the exact original amount (payment.amount) — the
    // regenerated checkout is item-for-item what the customer confirmed.
    const session = await paymentProvider.createCheckoutSession({
      paymentId: payment.id,
      referenceId: order.id,
      amountCents: payment.amount,
      currency: payment.currency,
      lineItems: [
        ...order.items.map((item) => ({
          name: item.nameSnapshot ?? 'Menu item',
          amountCents: item.unitPrice,
          quantity: item.quantity,
        })),
        { name: INFRASTRUCTURE_FEE_LABEL, amountCents: order.infrastructureFee, quantity: 1 },
      ],
      successUrl: `${appUrl}/orders/${order.id}?checkout=success`,
      cancelUrl: `${appUrl}/orders/${order.id}?checkout=canceled`,
    })
    await db.payment.update({
      where: { id: payment.id },
      data: {
        provider: paymentProvider.id,
        providerSessionId: session.sessionId,
        providerCheckoutUrl: session.checkoutUrl,
      },
    })
    return { ok: true, checkoutUrl: session.checkoutUrl }
  } catch {
    return {
      ok: false,
      error: {
        code: 'PAYMENT_PROVIDER_ERROR',
        message: 'Could not start the online payment. You have not been charged — please try again.',
      },
    }
  }
}

export async function listOrdersForOwner(ownerId: string, status?: string) {
  return db.order.findMany({
    where: {
      restaurant: { ownerId },
      ...(status && { status: status as never }),
      // ADR-006 §4: unpaid online orders are inert — a restaurant never sees
      // an order whose online payment has not succeeded.
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
