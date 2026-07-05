import { db } from '@/lib/db'

/**
 * Mark a listing as a favorite for a user. Idempotent — favoriting an
 * already-favorited listing is a no-op.
 */
export async function addFavorite(userId: string, listingId: string) {
  return db.favorite.upsert({
    where: { userId_listingId: { userId, listingId } },
    create: { userId, listingId },
    update: {},
  })
}

/**
 * Remove a listing from a user's favorites. Idempotent — removing a
 * non-favorited listing is a no-op.
 */
export async function removeFavorite(userId: string, listingId: string) {
  await db.favorite.deleteMany({ where: { userId, listingId } })
}

export async function isFavorited(userId: string, listingId: string) {
  const count = await db.favorite.count({ where: { userId, listingId } })
  return count > 0
}

/**
 * Of the given listing IDs, return the ones the user has favorited.
 * Used to decorate listing cards without an N+1 per card.
 */
export async function getFavoritedListingIds(userId: string, listingIds: string[]) {
  if (listingIds.length === 0) return []
  const favorites = await db.favorite.findMany({
    where: { userId, listingId: { in: listingIds } },
    select: { listingId: true },
  })
  return favorites.map((f) => f.listingId)
}

/**
 * The user's favorited listings in the same card shape as getListings —
 * including photos, host summary, and published-review aggregates.
 */
export async function getFavoriteListings(userId: string) {
  const favorites = await db.favorite.findMany({
    where: { userId },
    include: {
      listing: {
        include: { photos: true, host: { select: { id: true, name: true, image: true } } },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const listings = favorites.map((f) => f.listing)
  const listingIds = listings.map((l) => l.id)

  const reviewAggregates =
    listingIds.length > 0
      ? await db.review.groupBy({
          by: ['listingId'],
          where: { listingId: { in: listingIds }, publishedAt: { not: null } },
          _avg: { rating: true },
          _count: { _all: true },
        })
      : []
  const aggregatesByListing = new Map(
    reviewAggregates.map((agg) => [
      agg.listingId,
      { rating: agg._avg.rating, reviewCount: agg._count._all },
    ]),
  )

  return listings.map((listing) => {
    const agg = aggregatesByListing.get(listing.id)
    return {
      ...listing,
      // null = no published reviews yet — the UI shows its no-reviews state
      rating: agg?.rating ?? null,
      reviewCount: agg?.reviewCount ?? 0,
    }
  })
}
