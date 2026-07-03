import { db, serializableTransaction } from '@/lib/db'
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

  // The overlap check runs INSIDE the serializable transaction that creates
  // the block, so a guest booking racing this call cannot slip between the
  // check and the create — the database aborts one transaction, and the retry
  // re-checks against the committed row (→ RANGE_OVERLAPS_BOOKING).
  return serializableTransaction(async (tx) => {
    // A host cannot block dates that a guest has already booked.
    // Overlap rule: existing.start < requested.end AND existing.end > requested.start.
    const overlappingBookings = await tx.booking.count({
      where: {
        listingId,
        checkIn: { lt: endDate },
        checkOut: { gt: startDate },
      },
    })
    if (overlappingBookings > 0) throw new Error('RANGE_OVERLAPS_BOOKING')

    return tx.availabilityBlock.create({
      data: {
        listingId,
        startDate,
        endDate,
        reason: input.reason?.trim() ? input.reason.trim() : null,
      },
    })
  })
}

export async function deleteAvailabilityBlock(id: string) {
  return db.availabilityBlock.delete({ where: { id } })
}
