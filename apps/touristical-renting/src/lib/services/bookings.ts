import { db } from '@/lib/db'
import type { CreateBookingInput } from '@/lib/schemas/bookings'
import { paymentProvider, PAYMENT_CURRENCY } from '@/lib/payments'

const bookingInclude = {
  listing: { include: { photos: true } },
  payment: true,
} as const

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
  // Bookings block dates regardless of payment status (ADR-006 §4), so a
  // paying guest is never double-booked mid-checkout.
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

  const provider = paymentProvider

  // Booking + Payment are created in one transaction (ADR-006).
  // Offline mode (no provider configured): settled directly with the host —
  // SUCCEEDED immediately. Online mode: PENDING until the provider's webhook
  // reports payment.succeeded.
  const booking = await db.$transaction(async (tx) => {
    const createdBooking = await tx.booking.create({
      data: {
        listingId,
        guestId,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        totalCost,
      },
    })
    await tx.payment.create({
      data: {
        bookingId: createdBooking.id,
        provider: provider ? provider.id : 'offline',
        status: provider ? 'PENDING' : 'SUCCEEDED',
        // Exactly the pre-confirmation total — never recomputed (ADR-006).
        amount: totalCost,
        currency: PAYMENT_CURRENCY,
      },
    })
    return tx.booking.findUniqueOrThrow({
      where: { id: createdBooking.id },
      include: bookingInclude,
    })
  })

  if (!provider || !booking.payment) {
    return { booking, checkoutUrl: null }
  }

  // Online mode: create the provider's hosted checkout session. A single line
  // item whose amount equals the displayed total exactly — nothing is added
  // on top.
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL
    const { sessionId, checkoutUrl } = await provider.createCheckoutSession({
      paymentId: booking.payment.id,
      referenceId: booking.id,
      amountCents: totalCost,
      currency: PAYMENT_CURRENCY,
      lineItems: [
        {
          name: `${listing.title} — ${nights} night${nights !== 1 ? 's' : ''}`,
          amountCents: totalCost,
          quantity: 1,
        },
      ],
      successUrl: `${appUrl}/bookings/${booking.id}?checkout=success`,
      cancelUrl: `${appUrl}/bookings/${booking.id}?checkout=canceled`,
    })
    // Store the checkout URL so a pending payment can be resumed later
    // without a provider API call.
    const payment = await db.payment.update({
      where: { bookingId: booking.id },
      data: { providerSessionId: sessionId, providerCheckoutUrl: checkoutUrl },
    })
    return { booking: { ...booking, payment }, checkoutUrl }
  } catch (error) {
    // The checkout session could not be created — remove the booking so its
    // dates are released instead of being blocked by an unpayable booking.
    await db.booking.delete({ where: { id: booking.id } }).catch(() => undefined)
    throw error
  }
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
      payment: true,
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
      payment: true,
    },
    orderBy: { checkIn: 'desc' },
  })
}
