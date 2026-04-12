import { db } from '@/lib/db'
import type { CreateListingInput, ListingsQuery, UpdateListingInput } from '@/lib/schemas/listings'

export async function getListings(query: ListingsQuery) {
  const { location, propertyType, minPrice, maxPrice, page, limit } = query
  const skip = (page - 1) * limit

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

  return { listings, total, page, limit }
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
