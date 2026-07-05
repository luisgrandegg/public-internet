import { db, serializableTransaction } from '@/lib/db'
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
  //
  // The overlap checks run INSIDE the serializable transaction: two guests
  // racing for the same dates cannot both pass the check and commit — the
  // database aborts one, and the retry re-checks against the committed
  // booking, surfacing the normal DATES_UNAVAILABLE conflict.
  const booking = await serializableTransaction(async (tx) => {
    // Check for overlapping bookings (double-booking prevention) and
    // host availability blocks — blocked dates cannot be booked.
    // Bookings block dates regardless of payment status (ADR-006 §4), so a
    // paying guest is never double-booked mid-checkout.
    const [bookingOverlap, blockOverlap] = await Promise.all([
      tx.booking.count({
        where: {
          listingId,
          checkIn: { lt: checkOutDate },
          checkOut: { gt: checkInDate },
        },
      }),
      tx.availabilityBlock.count({
        where: {
          listingId,
          startDate: { lt: checkOutDate },
          endDate: { gt: checkInDate },
        },
      }),
    ])
    if (bookingOverlap > 0 || blockOverlap > 0) throw new Error('DATES_UNAVAILABLE')

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

  // Online mode: create the provider's hosted checkout session — deliberately
  // OUTSIDE the transaction: a slow/failing provider call must not hold a DB
  // transaction open, and a session failure rolls the booking back below.
  // A single line item whose amount equals the displayed total exactly —
  // nothing is added on top.
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
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

/**
 * Return a live hosted-checkout URL for a booking's PENDING online payment.
 *
 * The stored providerCheckoutUrl can go dead (Stripe checkout sessions expire
 * after 24 hours), so it is never handed out directly. When the provider can
 * report the stored session's live status it is preferred: 'open' resumes the
 * original session, 'complete' means the guest already paid and the webhook
 * will confirm shortly (PAYMENT_ALREADY_SETTLING). An expired or unknown
 * session is replaced with a fresh checkout session for exactly the stored
 * payment amount — never recomputed (ADR-006).
 */
export async function resumeBookingPayment(bookingId: string, guestId: string) {
  const provider = paymentProvider
  if (!provider) throw new Error('PAYMENTS_NOT_CONFIGURED')

  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: { payment: true, listing: true },
  })
  if (!booking) throw new Error('BOOKING_NOT_FOUND')
  if (booking.guestId !== guestId) throw new Error('NOT_BOOKING_GUEST')

  const payment = booking.payment
  if (!payment || payment.provider === 'offline' || payment.status !== 'PENDING') {
    throw new Error('NO_PENDING_ONLINE_PAYMENT')
  }

  if (provider.getCheckoutSession && payment.providerSessionId) {
    const live = await provider.getCheckoutSession(payment.providerSessionId)
    if (live.status === 'open' && live.checkoutUrl) {
      return { checkoutUrl: live.checkoutUrl }
    }
    if (live.status === 'complete') throw new Error('PAYMENT_ALREADY_SETTLING')
    // 'expired' → fall through and create a fresh session below.
  }

  const nights = Math.ceil(
    (booking.checkOut.getTime() - booking.checkIn.getTime()) / (1000 * 60 * 60 * 24),
  )
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const { sessionId, checkoutUrl } = await provider.createCheckoutSession({
    paymentId: payment.id,
    referenceId: booking.id,
    // Exactly the stored pre-confirmation total — never recomputed (ADR-006).
    amountCents: payment.amount,
    currency: payment.currency,
    lineItems: [
      {
        name: `${booking.listing.title} — ${nights} night${nights !== 1 ? 's' : ''}`,
        amountCents: payment.amount,
        quantity: 1,
      },
    ],
    successUrl: `${appUrl}/bookings/${booking.id}?checkout=success`,
    cancelUrl: `${appUrl}/bookings/${booking.id}?checkout=canceled`,
  })
  await db.payment.update({
    where: { id: payment.id },
    data: { providerSessionId: sessionId, providerCheckoutUrl: checkoutUrl },
  })
  return { checkoutUrl }
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
