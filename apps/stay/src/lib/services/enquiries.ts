import { db } from '@/lib/db'
import type { CreateEnquiryInput, ReplyEnquiryInput } from '@/lib/schemas/enquiries'

export async function createEnquiry(
  guestId: string,
  listingId: string,
  input: CreateEnquiryInput,
) {
  const listing = await db.listing.findUnique({
    where: { id: listingId },
    select: { hostId: true },
  })
  if (!listing) throw new Error('LISTING_NOT_FOUND')
  if (listing.hostId === guestId) throw new Error('CANNOT_ENQUIRE_OWN_LISTING')

  return db.enquiry.create({
    data: {
      listingId,
      guestId,
      hostId: listing.hostId,
      message: input.message,
    },
    include: {
      guest: { select: { id: true, name: true } },
      listing: { select: { id: true, title: true } },
    },
  })
}

export async function getGuestEnquiries(guestId: string) {
  return db.enquiry.findMany({
    where: { guestId },
    include: {
      listing: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getHostEnquiries(hostId: string) {
  return db.enquiry.findMany({
    where: { hostId, reply: null },
    include: {
      guest: { select: { id: true, name: true, email: true } },
      listing: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getAllHostEnquiries(hostId: string) {
  return db.enquiry.findMany({
    where: { hostId },
    include: {
      guest: { select: { id: true, name: true, email: true } },
      listing: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function replyToEnquiry(
  hostId: string,
  enquiryId: string,
  input: ReplyEnquiryInput,
) {
  const enquiry = await db.enquiry.findUnique({ where: { id: enquiryId } })
  if (!enquiry) throw new Error('ENQUIRY_NOT_FOUND')
  if (enquiry.hostId !== hostId) throw new Error('NOT_YOUR_ENQUIRY')

  return db.enquiry.update({
    where: { id: enquiryId },
    data: {
      reply: input.reply,
      repliedAt: new Date(),
    },
  })
}
