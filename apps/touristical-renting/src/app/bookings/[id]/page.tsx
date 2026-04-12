import { notFound, redirect } from 'next/navigation'
import { headers } from 'next/headers'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { getBookingById } from '@/lib/services/bookings'
import { LeaveReviewForm } from './_components/LeaveReviewForm'
import styles from './page.module.css'

export const metadata = { title: 'Booking details' }

interface BookingDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function BookingDetailPage({ params }: BookingDetailPageProps) {
  const { id } = await params

  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/auth/signin')

  const booking = await getBookingById(id)

  if (!booking || booking.guestId !== session.user.id) notFound()

  const checkInStr = new Date(booking.checkIn).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const checkOutStr = new Date(booking.checkOut).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const nights = Math.ceil(
    (new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) /
      (1000 * 60 * 60 * 24),
  )
  const nightlyRateEur = (booking.listing.nightlyRate / 100).toFixed(2)
  const totalEur = (booking.totalCost / 100).toFixed(2)
  const isCheckoutPassed = new Date(booking.checkOut) < new Date()
  const firstPhoto = booking.listing.photos[0]

  return (
    <div className={styles.root}>
      <h1 className={styles.heading}>Booking details</h1>

      {/* Listing card */}
      <Link href={`/listings/${booking.listingId}`} className={styles.listingCard}>
        {firstPhoto ? (
          <img
            src={firstPhoto.url}
            alt={firstPhoto.alt}
            className={styles.listingPhoto}
          />
        ) : (
          <div className={styles.listingPhotoPlaceholder} aria-hidden="true" />
        )}
        <div>
          <div className={styles.listingTitle}>{booking.listing.title}</div>
          <div className={styles.listingLocation}>
            {booking.listing.city}, {booking.listing.country}
          </div>
          {booking.listing.host && (
            <div className={styles.hostName}>
              Hosted by {booking.listing.host.name}
            </div>
          )}
        </div>
      </Link>

      {/* Dates */}
      <div className={styles.section}>
        <h2 className={styles.sectionHeading}>Stay details</h2>
        <div className={styles.detailRow}>
          <span className={styles.detailLabel}>Check-in</span>
          <span className={styles.detailValue}>{checkInStr}</span>
        </div>
        <div className={styles.detailRow}>
          <span className={styles.detailLabel}>Check-out</span>
          <span className={styles.detailValue}>{checkOutStr}</span>
        </div>
        <div className={styles.detailRow}>
          <span className={styles.detailLabel}>Duration</span>
          <span className={styles.detailValue}>{nights} night{nights !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Price breakdown */}
      <div className={styles.section}>
        <h2 className={styles.sectionHeading}>Price breakdown</h2>
        <div className={styles.detailRow}>
          <span className={styles.detailLabel}>
            €{nightlyRateEur} × {nights} night{nights !== 1 ? 's' : ''}
          </span>
          <span className={styles.detailValue}>€{totalEur}</span>
        </div>
        <div className={styles.totalRow}>
          <span>Total paid</span>
          <span>€{totalEur}</span>
        </div>
        <p className={styles.noFeeNote}>Complete price — no additional fees.</p>
      </div>

      {/* Review section — shown after checkout */}
      {isCheckoutPassed && (
        <div className={styles.section}>
          <h2 className={styles.sectionHeading}>Leave a review</h2>
          <LeaveReviewForm
            bookingId={booking.id}
            targetId={booking.listing.host?.id ?? ''}
            targetRole="host"
            targetName={booking.listing.host?.name ?? 'the host'}
          />
        </div>
      )}
    </div>
  )
}
