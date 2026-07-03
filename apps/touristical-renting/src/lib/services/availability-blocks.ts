import { db } from '@/lib/db'
import type { CreateAvailabilityBlockInput } from '@/lib/schemas/availability-blocks'

export async function getAvailabilityBlocks(listingId: string) {
  return db.availabilityBlock.findMany({
    where: { listingId },
    orderBy: { startDate: 'asc' },
  })
}

export async function getAvailabilityBlockById(id: string) {
  return db.availabilityBlock.findUnique({ where: { id } })
}

export async function createAvailabilityBlock(
  listingId: string,
  input: CreateAvailabilityBlockInput,
) {
  const startDate = new Date(input.startDate)
  const endDate = new Date(input.endDate)

  // A host cannot block dates that a guest has already booked.
  // Overlap rule: existing.start < requested.end AND existing.end > requested.start.
  const overlappingBookings = await db.booking.count({
    where: {
      listingId,
      checkIn: { lt: endDate },
      checkOut: { gt: startDate },
    },
  })
  if (overlappingBookings > 0) throw new Error('RANGE_OVERLAPS_BOOKING')

  return db.availabilityBlock.create({
    data: {
      listingId,
      startDate,
      endDate,
      reason: input.reason?.trim() ? input.reason.trim() : null,
    },
  })
}

export async function deleteAvailabilityBlock(id: string) {
  return db.availabilityBlock.delete({ where: { id } })
}
