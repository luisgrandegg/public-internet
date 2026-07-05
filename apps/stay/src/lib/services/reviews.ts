import { db } from '@/lib/db'
import type { CreateReviewInput } from '@/lib/schemas/reviews'

export async function createReview(
  authorId: string,
  bookingId: string,
  input: CreateReviewInput,
) {
  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: { listing: { select: { id: true } } },
  })
  if (!booking) throw new Error('BOOKING_NOT_FOUND')
  if (booking.guestId !== authorId && booking.listing.id) {
    // Only guest or host of the booking can review
    const listing = await db.listing.findUnique({
      where: { id: booking.listingId },
      select: { hostId: true },
    })
    if (!listing || (booking.guestId !== authorId && listing.hostId !== authorId)) {
      throw new Error('NOT_BOOKING_PARTICIPANT')
    }
  }

  // Check review hasn't been submitted already
  const existing = await db.review.findUnique({
    where: { bookingId_authorId: { bookingId, authorId } },
  })
  if (existing) throw new Error('ALREADY_REVIEWED')

  const review = await db.review.create({
    data: {
      bookingId,
      listingId: booking.listingId,
      authorId,
      targetId: input.targetId,
      targetRole: input.targetRole,
      rating: input.rating,
      body: input.body,
    },
  })

  // Check if both parties have reviewed — publish both if so
  const allReviews = await db.review.findMany({
    where: { bookingId },
  })
  if (allReviews.length >= 2 && allReviews.every((r) => r.publishedAt === null)) {
    const now = new Date()
    await db.review.updateMany({
      where: { bookingId },
      data: { publishedAt: now },
    })
    return { ...review, publishedAt: now }
  }

  return review
}

export async function getListingReviews(listingId: string) {
  return db.review.findMany({
    where: { listingId, publishedAt: { not: null } },
    include: {
      author: { select: { id: true, name: true, image: true } },
    },
    orderBy: { publishedAt: 'desc' },
  })
}

export async function publishPendingReviews() {
  // Publish reviews where the booking's checkout was more than 14 days ago
  // and only one party reviewed (auto-publish after timeout)
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
  await db.review.updateMany({
    where: {
      publishedAt: null,
      booking: {
        checkOut: { lt: fourteenDaysAgo },
      },
    },
    data: { publishedAt: new Date() },
  })
}
