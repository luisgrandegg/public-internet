import { db } from '@/lib/db'

export async function getUserProfile(userId: string) {
  return db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      isHost: true,
      createdAt: true,
    },
  })
}

export async function updateUserProfile(
  userId: string,
  input: { name?: string; image?: string },
) {
  return db.user.update({
    where: { id: userId },
    data: input,
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      isHost: true,
    },
  })
}

export async function exportUserData(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      isHost: true,
      createdAt: true,
    },
  })

  const listings = await db.listing.findMany({
    where: { hostId: userId },
    include: { photos: true },
  })

  const bookings = await db.booking.findMany({
    where: { guestId: userId },
    include: {
      listing: {
        select: {
          id: true,
          title: true,
          nightlyRate: true,
          photos: true,
        },
      },
    },
  })

  return { user, listings, bookings }
}

export async function becomeHost(userId: string) {
  return db.user.update({
    where: { id: userId },
    data: { isHost: true },
    select: { isHost: true },
  })
}
