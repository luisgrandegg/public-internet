import { db } from '@/lib/db'
import type {
  CreateRestaurantInput,
  RestaurantsQuery,
  UpdateRestaurantInput,
} from '@/lib/schemas/restaurants'

/**
 * Paginated list of active restaurants.
 * Constitution: deterministic alphabetical ordering — no promoted placements.
 */
export async function listRestaurants(query: RestaurantsQuery) {
  const { city, page, limit } = query
  const skip = (page - 1) * limit

  const where = {
    isActive: true,
    ...(city && { city: { equals: city, mode: 'insensitive' as const } }),
  }

  const [restaurants, total] = await Promise.all([
    db.restaurant.findMany({
      where,
      orderBy: [{ city: 'asc' }, { name: 'asc' }],
      skip,
      take: limit,
    }),
    db.restaurant.count({ where }),
  ])

  return { restaurants, total, page, limit }
}

export async function getRestaurantById(id: string, opts: { includeInactive?: boolean } = {}) {
  const restaurant = await db.restaurant.findUnique({ where: { id } })
  if (!restaurant) return null
  if (!opts.includeInactive && !restaurant.isActive) return null
  return restaurant
}

/**
 * Create a restaurant AND set User.isRestaurantOwner = true in one transaction.
 * This keeps the invariant that anyone with a restaurant is flagged as an owner.
 */
export async function createRestaurantForOwner(
  ownerId: string,
  input: CreateRestaurantInput,
) {
  return db.$transaction(async (tx) => {
    const restaurant = await tx.restaurant.create({
      data: {
        ...input,
        ownerId,
      },
    })
    await tx.user.update({
      where: { id: ownerId },
      data: { isRestaurantOwner: true, updatedAt: new Date() },
    })
    return restaurant
  })
}

export async function updateRestaurant(id: string, input: UpdateRestaurantInput) {
  return db.restaurant.update({
    where: { id },
    data: { ...input },
  })
}

export async function listRestaurantsForOwner(ownerId: string) {
  return db.restaurant.findMany({
    where: { ownerId },
    orderBy: { createdAt: 'desc' },
  })
}
