import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { getGuestBookings } from '@/lib/services/bookings'
import styles from './page.module.css'

export const metadata = { title: 'My bookings' }

export default async function BookingsPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/auth/signin')

  const bookings = await getGuestBookings(session.user.id)
  const now = new Date()

  return (
    <div className={styles.root}>
      <h1 className={styles.heading}>My bookings</h1>

      {bookings.length === 0 ? (
        <div className={styles.empty}>
          <p>You have no bookings yet.</p>
          <p>
            <Link href="/listings" className={styles.emptyLink}>
              Browse listings
            </Link>{' '}
            to find your next stay.
          </p>
        </div>
      ) : (
        <ul className={styles.bookingsList}>
          {bookings.map((booking) => {
            const isUpcoming = new Date(booking.checkIn) > now
            const checkInStr = new Date(booking.checkIn).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })
            const checkOutStr = new Date(booking.checkOut).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })
            const totalEur = (booking.totalCost / 100).toFixed(2)
            const firstPhoto = booking.listing.photos[0]

            return (
              <li key={booking.id}>
                <Link href={`/bookings/${booking.id}`} className={styles.bookingCard}>
                  {firstPhoto ? (
                    <img
                      src={firstPhoto.url}
                      alt={firstPhoto.alt}
                      className={styles.bookingPhoto}
                    />
                  ) : (
                    <div className={styles.bookingPhotoPlaceholder} aria-hidden="true" />
                  )}

                  <div className={styles.bookingInfo}>
                    <div className={styles.bookingTitle}>{booking.listing.title}</div>
                    <div className={styles.bookingLocation}>
                      {booking.listing.city}, {booking.listing.country}
                    </div>
                    <div className={styles.bookingDates}>
                      {checkInStr} → {checkOutStr}
                    </div>
                  </div>

                  <div className={styles.bookingMeta}>
                    <div className={styles.bookingCost}>€{totalEur}</div>
                    <span
                      className={`${styles.bookingStatus} ${isUpcoming ? styles.statusUpcoming : styles.statusCompleted}`}
                    >
                      {isUpcoming ? 'Upcoming' : 'Completed'}
                    </span>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
