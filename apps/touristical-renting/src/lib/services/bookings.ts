import { db } from '@/lib/db'
import type { CreateBookingInput } from '@/lib/schemas/bookings'

export async function createBooking(guestId: string, input: CreateBookingInput) {
  const { listingId, checkIn, checkOut } = input

  const listing = await db.listing.findUnique({ where: { id: listingId } })
  if (!listing) throw new Error('LISTING_NOT_FOUND')

  // Prevent the host from booking their own listing
  if (listing.hostId === guestId) throw new Error('CANNOT_BOOK_OWN_LISTING')

  // Calculate total cost in cents — complete price, no hidden fees
  const checkInDate = new Date(checkIn)
  const checkOutDate = new Date(checkOut)
  const nights = Math.ceil(
    (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24),
  )
  const totalCost = listing.nightlyRate * nights

  return db.booking.create({
    data: {
      listingId,
      guestId,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      totalCost,
    },
    include: {
      listing: { include: { photos: true } },
    },
  })
}

export async function getBookingById(id: string) {
  return db.booking.findUnique({
    where: { id },
    include: {
      listing: {
        include: { photos: true },
        // hostId is included via the model directly (not a relation select)
      },
      guest: { select: { id: true, name: true, email: true } },
    },
  })
}
