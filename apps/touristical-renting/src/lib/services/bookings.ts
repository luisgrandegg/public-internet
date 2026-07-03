import { db } from '@/lib/db'
import type { CreateBookingInput } from '@/lib/schemas/bookings'

export async function createBooking(guestId: string, input: CreateBookingInput) {
  const { listingId, checkIn, checkOut } = input

  const listing = await db.listing.findUnique({ where: { id: listingId } })
  if (!listing) throw new Error('LISTING_NOT_FOUND')

  // Prevent the host from booking their own listing
  if (listing.hostId === guestId) throw new Error('CANNOT_BOOK_OWN_LISTING')

  const checkInDate = new Date(checkIn)
  const checkOutDate = new Date(checkOut)

  // Check for overlapping bookings (double-booking prevention) and
  // host availability blocks — blocked dates cannot be booked.
  const [bookingOverlap, blockOverlap] = await Promise.all([
    db.booking.count({
      where: {
        listingId,
        checkIn: { lt: checkOutDate },
        checkOut: { gt: checkInDate },
      },
    }),
    db.availabilityBlock.count({
      where: {
        listingId,
        startDate: { lt: checkOutDate },
        endDate: { gt: checkInDate },
      },
    }),
  ])
  if (bookingOverlap > 0 || blockOverlap > 0) throw new Error('DATES_UNAVAILABLE')

  // Calculate total cost in cents — complete price, no hidden fees
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
        include: {
          photos: true,
          host: { select: { id: true, name: true, image: true } },
        },
      },
      guest: { select: { id: true, name: true, email: true } },
    },
  })
}

export async function getGuestBookings(guestId: string) {
  return db.booking.findMany({
    where: { guestId },
    include: {
      listing: {
        select: {
          id: true,
          title: true,
          city: true,
          country: true,
          photos: { take: 1 },
          host: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { checkIn: 'desc' },
  })
}
