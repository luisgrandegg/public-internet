import { db } from '@/lib/db'

export async function getHostListings(hostId: string) {
  return db.listing.findMany({
    where: { hostId },
    include: { photos: true, _count: { select: { bookings: true } } },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getHostBookings(hostId: string) {
  return db.booking.findMany({
    where: { listing: { hostId } },
    include: {
      listing: { select: { id: true, title: true, nightlyRate: true } },
      guest: { select: { id: true, name: true, email: true } },
      payment: true,
    },
    orderBy: { createdAt: 'desc' },
  })
}
