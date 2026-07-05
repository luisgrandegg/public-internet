import { db } from '@/lib/db'
import type { CreateListingInput, ListingsQuery, UpdateListingInput } from '@/lib/schemas/listings'

export async function getListings(query: ListingsQuery) {
  const { location, propertyType, minPrice, maxPrice, checkIn, checkOut, guests, page, limit } =
    query
  const skip = (page - 1) * limit

  // Availability: exclude listings with any Booking or AvailabilityBlock overlapping
  // [checkIn, checkOut). Overlap rule: existing.start < requested.end AND existing.end > requested.start.
  const requestedStart = checkIn && checkOut ? new Date(checkIn) : undefined
  const requestedEnd = checkIn && checkOut ? new Date(checkOut) : undefined

  const where = {
    ...(location && {
      OR: [
        { city: { contains: location, mode: 'insensitive' as const } },
        { country: { contains: location, mode: 'insensitive' as const } },
      ],
    }),
    ...(propertyType && { propertyType }),
    ...(minPrice !== undefined && { nightlyRate: { gte: minPrice } }),
    ...(maxPrice !== undefined && { nightlyRate: { lte: maxPrice } }),
    ...(guests !== undefined && { maxGuests: { gte: guests } }),
    ...(requestedStart &&
      requestedEnd && {
        bookings: {
          none: { checkIn: { lt: requestedEnd }, checkOut: { gt: requestedStart } },
        },
        availabilityBlocks: {
          none: { startDate: { lt: requestedEnd }, endDate: { gt: requestedStart } },
        },
      }),
  }

  const [listings, total] = await Promise.all([
    db.listing.findMany({
      where,
      include: { photos: true, host: { select: { id: true, name: true, image: true } } },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    db.listing.count({ where }),
  ])

  // Aggregate published review ratings for the returned page in a single
  // grouped query — avoids an N+1 per listing.
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

  const listingsWithRatings = listings.map((listing) => {
    const agg = aggregatesByListing.get(listing.id)
    return {
      ...listing,
      // null = no published reviews yet — the UI shows its no-reviews state
      rating: agg?.rating ?? null,
      reviewCount: agg?.reviewCount ?? 0,
    }
  })

  return { listings: listingsWithRatings, total, page, limit }
}

export async function getListingById(id: string) {
  return db.listing.findUnique({
    where: { id },
    include: {
      photos: true,
      host: { select: { id: true, name: true, image: true, createdAt: true } },
    },
  })
}

export async function createListing(hostId: string, input: CreateListingInput) {
  const { photos, nightlyRate, ...rest } = input
  return db.listing.create({
    data: {
      ...rest,
      // Convert euros to cents at the service boundary
      nightlyRate: Math.round(nightlyRate * 100),
      hostId,
      photos: { create: photos },
    },
    include: { photos: true },
  })
}

export async function updateListing(id: string, input: UpdateListingInput) {
  const { photos, nightlyRate, ...rest } = input
  return db.listing.update({
    where: { id },
    data: {
      ...rest,
      ...(nightlyRate !== undefined && { nightlyRate: Math.round(nightlyRate * 100) }),
      ...(photos && {
        photos: {
          deleteMany: {},
          create: photos,
        },
      }),
    },
    include: { photos: true },
  })
}

export async function deleteListing(id: string) {
  return db.listing.delete({ where: { id } })
}

export async function getListingAvailability(listingId: string) {
  const [bookings, blocks] = await Promise.all([
    db.booking.findMany({
      where: { listingId },
      select: { checkIn: true, checkOut: true },
    }),
    db.availabilityBlock.findMany({
      where: { listingId },
      select: { startDate: true, endDate: true },
    }),
  ])

  const blockedRanges = [
    ...bookings.map((b) => ({
      start: b.checkIn.toISOString().split('T')[0],
      end: b.checkOut.toISOString().split('T')[0],
    })),
    ...blocks.map((b) => ({
      start: b.startDate.toISOString().split('T')[0],
      end: b.endDate.toISOString().split('T')[0],
    })),
  ]

  return { blockedRanges }
}
