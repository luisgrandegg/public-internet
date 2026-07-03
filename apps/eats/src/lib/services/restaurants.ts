import { db } from '@/lib/db'
import type {
  CreateRestaurantInput,
  RestaurantsQuery,
  UpdateRestaurantInput,
} from '@/lib/schemas/restaurants'
import { getRatingSummaries } from '@/lib/services/reviews'

/**
 * Paginated list of active restaurants.
 * Supports filtering by city (exact, case-insensitive), free-text keyword
 * (`q` — matched against name OR description, case-insensitive) and menu
 * category (`category` — restaurants with at least one available MenuItem
 * in that category, case-insensitive).
 * Constitution: deterministic alphabetical ordering — no promoted placements.
 */
export async function listRestaurants(query: RestaurantsQuery) {
  const { city, q, category, page, limit } = query
  const skip = (page - 1) * limit

  const where = {
    isActive: true,
    ...(city && { city: { equals: city, mode: 'insensitive' as const } }),
    ...(q && {
      OR: [
        { name: { contains: q, mode: 'insensitive' as const } },
        { description: { contains: q, mode: 'insensitive' as const } },
      ],
    }),
    ...(category && {
      menuItems: {
        some: {
          isAvailable: true,
          category: { equals: category, mode: 'insensitive' as const },
        },
      },
    }),
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

  // Attach rating summaries via a single groupBy (no N+1).
  // Constitution: ratings are informational only — ordering stays neutral
  // (alphabetical), never sorted by rating or paid placement.
  const summaries = await getRatingSummaries(restaurants.map((r) => r.id))
  const withRatings = restaurants.map((r) => {
    const summary = summaries.get(r.id)
    return {
      ...r,
      avgRating: summary?.avgRating ?? null,
      reviewCount: summary?.reviewCount ?? 0,
    }
  })

  return { restaurants: withRatings, total, page, limit }
}

/**
 * Distinct categories of available menu items across active restaurants.
 * Feeds the category filter on /restaurants. Deduplicated case-insensitively
 * (first spelling encountered wins) and sorted alphabetically — neutral
 * ordering, no promoted categories.
 */
export async function listMenuItemCategories(): Promise<string[]> {
  // groupBy dedupes in the database — `findMany({ distinct })` would fetch
  // every matching row and deduplicate in memory.
  const rows = await db.menuItem.groupBy({
    by: ['category'],
    where: { isAvailable: true, restaurant: { isActive: true } },
    orderBy: { category: 'asc' },
  })

  const seen = new Set<string>()
  const categories: string[] = []
  for (const { category } of rows) {
    const key = category.toLowerCase()
    if (!seen.has(key)) {
      seen.add(key)
      categories.push(category)
    }
  }
  return categories.sort((a, b) => a.localeCompare(b))
}

export async function getRestaurantById(id: string, opts: { includeInactive?: boolean } = {}) {
  const restaurant = await db.restaurant.findUnique({ where: { id } })
  if (!restaurant) return null
  if (!opts.includeInactive && !restaurant.isActive) return null

  const summaries = await getRatingSummaries([restaurant.id])
  const summary = summaries.get(restaurant.id)
  return {
    ...restaurant,
    avgRating: summary?.avgRating ?? null,
    reviewCount: summary?.reviewCount ?? 0,
  }
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
