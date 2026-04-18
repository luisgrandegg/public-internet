import { db } from '@/lib/db'
import type { CreateOrderInput } from '@/lib/schemas/orders'
import {
  INFRASTRUCTURE_FEE_CENTS,
  DEFAULT_COURIER_BASE_PAY_CENTS,
  DEFAULT_COURIER_DISTANCE_PAY_CENTS,
} from '@/lib/config'

export type OrderCreationError =
  | { code: 'MENU_ITEM_MISMATCH'; message: string }
  | { code: 'MENU_ITEM_UNAVAILABLE'; message: string }
  | { code: 'MENU_ITEM_NOT_FOUND'; message: string }
  | { code: 'RESTAURANT_NOT_FOUND'; message: string }

/**
 * Create an order for a customer. All work happens inside a single Prisma transaction:
 *   1. Validates restaurant is active and menu items belong to it AND are available.
 *   2. Snapshots unitPrice + name for each OrderItem.
 *   3. Computes itemsCost + infrastructureFee + totalCost.
 *   4. Creates the Delivery row in UNASSIGNED with pay breakdown shown to couriers.
 */
export async function createOrderForCustomer(
  customerId: string,
  input: CreateOrderInput,
): Promise<
  | { ok: true; order: Awaited<ReturnType<typeof findOrderWithDetails>> }
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

  const created = await db.$transaction(async (tx) => {
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
    return order
  })

  const order = await findOrderWithDetails(created.id)
  return { ok: true, order }
}

export async function findOrderWithDetails(orderId: string) {
  return db.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
      delivery: true,
      restaurant: {
        select: { id: true, name: true, city: true, imageUrl: true },
      },
    },
  })
}

export async function listOrdersForCustomer(customerId: string) {
  return db.order.findMany({
    where: { customerId },
    orderBy: { createdAt: 'desc' },
    include: {
      restaurant: { select: { id: true, name: true, city: true, imageUrl: true } },
      delivery: { select: { status: true } },
    },
  })
}

export async function listOrdersForOwner(ownerId: string, status?: string) {
  return db.order.findMany({
    where: {
      restaurant: { ownerId },
      ...(status && { status: status as never }),
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
