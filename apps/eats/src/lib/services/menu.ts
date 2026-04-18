import { db } from '@/lib/db'
import type { CreateMenuItemInput, UpdateMenuItemInput } from '@/lib/schemas/menu'

/**
 * Fetch all menu items for a restaurant.
 * @param onlyAvailable When true, only returns isAvailable = true items (customer view).
 */
export async function listMenuItems(restaurantId: string, onlyAvailable = false) {
  return db.menuItem.findMany({
    where: {
      restaurantId,
      ...(onlyAvailable && { isAvailable: true }),
    },
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
  })
}

/**
 * Group menu items by category — useful for the customer-facing detail page.
 */
export function groupByCategory<T extends { category: string }>(items: T[]) {
  const grouped = new Map<string, T[]>()
  for (const item of items) {
    const bucket = grouped.get(item.category) ?? []
    bucket.push(item)
    grouped.set(item.category, bucket)
  }
  return Array.from(grouped.entries()).map(([category, items]) => ({
    category,
    items,
  }))
}

export async function getMenuItemById(id: string) {
  return db.menuItem.findUnique({ where: { id } })
}

export async function createMenuItem(
  restaurantId: string,
  input: CreateMenuItemInput,
) {
  return db.menuItem.create({
    data: {
      restaurantId,
      name: input.name,
      description: input.description,
      category: input.category,
      price: Math.round(input.price * 100),
    },
  })
}

export async function updateMenuItem(id: string, input: UpdateMenuItemInput) {
  const { price, ...rest } = input
  return db.menuItem.update({
    where: { id },
    data: {
      ...rest,
      ...(price !== undefined && { price: Math.round(price * 100) }),
    },
  })
}

export async function deleteMenuItem(id: string) {
  // OrderItem.menuItemId is nullable with ON DELETE SET NULL — the historical
  // OrderItem rows keep their unitPrice + nameSnapshot, so hard-deleting is safe.
  await db.menuItem.delete({ where: { id } })
}
