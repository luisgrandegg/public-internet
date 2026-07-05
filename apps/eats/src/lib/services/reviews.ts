import { db } from '@/lib/db'
import type { CreateReviewInput, ReviewsQuery } from '@/lib/schemas/reviews'

export type ReviewCreationError =
  | { code: 'ORDER_NOT_FOUND'; message: string }
  | { code: 'NOT_ORDER_OWNER'; message: string }
  | { code: 'ORDER_NOT_DELIVERED'; message: string }
  | { code: 'ALREADY_REVIEWED'; message: string }

/**
 * Create a review for a delivered order.
 *
 * Constitution: reviews are honest feedback from verified customers.
 * Only the customer who placed the order can review it, only once,
 * and only after the order was actually DELIVERED. There is no way
 * for a restaurant to hide, pay away, or incentivise reviews.
 */
export async function createReviewForOrder(
  customerId: string,
  orderId: string,
  input: CreateReviewInput,
): Promise<
  | { ok: true; review: Awaited<ReturnType<typeof findReviewForOrder>> }
  | { ok: false; error: ReviewCreationError }
> {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { review: { select: { id: true } } },
  })

  if (!order) {
    return { ok: false, error: { code: 'ORDER_NOT_FOUND', message: 'Order not found' } }
  }
  if (order.customerId !== customerId) {
    return { ok: false, error: { code: 'NOT_ORDER_OWNER', message: 'Not your order' } }
  }
  if (order.status !== 'DELIVERED') {
    return {
      ok: false,
      error: {
        code: 'ORDER_NOT_DELIVERED',
        message: 'You can review an order once it has been delivered',
      },
    }
  }
  if (order.review) {
    return {
      ok: false,
      error: { code: 'ALREADY_REVIEWED', message: 'This order has already been reviewed' },
    }
  }

  const review = await db.review.create({
    data: {
      orderId: order.id,
      restaurantId: order.restaurantId,
      authorId: customerId,
      rating: input.rating,
      body: input.body,
    },
    include: { author: { select: { name: true } } },
  })

  return { ok: true, review }
}

export async function findReviewForOrder(orderId: string) {
  return db.review.findUnique({
    where: { orderId },
    include: { author: { select: { name: true } } },
  })
}

/**
 * Recent-first, paginated reviews for a restaurant, with the author's name.
 */
export async function listReviewsForRestaurant(restaurantId: string, query: ReviewsQuery) {
  const { page, limit } = query
  const [reviews, total] = await Promise.all([
    db.review.findMany({
      where: { restaurantId },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: { author: { select: { name: true } } },
    }),
    db.review.count({ where: { restaurantId } }),
  ])
  return { reviews, total, page, limit }
}

export interface RatingSummary {
  /** Average rating (1–5) rounded to one decimal, or null when there are no reviews. */
  avgRating: number | null
  reviewCount: number
}

/**
 * Aggregate rating summaries for a set of restaurants in a single groupBy query
 * (no N+1). Restaurants with no reviews are simply absent from the result map.
 */
export async function getRatingSummaries(
  restaurantIds: string[],
): Promise<Map<string, RatingSummary>> {
  const summaries = new Map<string, RatingSummary>()
  if (restaurantIds.length === 0) return summaries

  const groups = await db.review.groupBy({
    by: ['restaurantId'],
    where: { restaurantId: { in: restaurantIds } },
    _avg: { rating: true },
    _count: { _all: true },
  })

  for (const group of groups) {
    summaries.set(group.restaurantId, {
      avgRating:
        group._avg.rating === null ? null : Math.round(group._avg.rating * 10) / 10,
      reviewCount: group._count._all,
    })
  }
  return summaries
}
