import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { getHostListings } from '@/lib/services/host'
import { getHostBookings } from '@/lib/services/host'
import { getHostEnquiries } from '@/lib/services/enquiries'
import { EnquiryReplyForm } from './_components/EnquiryReplyForm'
import { ReviewGuestForm } from './_components/ReviewGuestForm'
import styles from './page.module.css'

export const metadata = { title: 'Host dashboard' }

// Payment state as plain text — never colour alone (WCAG).
function paymentText(payment: { provider: string; status: string } | null): string {
  if (!payment) return '—'
  if (payment.provider === 'offline') return 'Pay at the property'
  if (payment.status === 'SUCCEEDED') return 'Paid'
  if (payment.status === 'PENDING') return 'Unpaid (pending)'
  if (payment.status === 'CANCELED') return 'Unpaid (canceled)'
  return 'Unpaid (failed)'
}

export default async function HostDashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/auth/signin')
  if (!session.user.isHost) redirect('/')

  const [listings, bookings, enquiries] = await Promise.all([
    getHostListings(session.user.id),
    getHostBookings(session.user.id),
    getHostEnquiries(session.user.id),
  ])

  const now = new Date()
  const upcomingBookings = bookings.filter((b) => new Date(b.checkIn) > now)
  const completedBookings = bookings.filter((b) => new Date(b.checkOut) <= now)

  return (
    <div className={styles.root}>
      <h1 className={styles.heading}>Host dashboard</h1>

      <div className={styles.commissionNote} role="note">
        You receive 100% of the nightly rate — this platform charges no commission.
      </div>

      {/* My Listings */}
      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>My listings ({listings.length})</h2>
        {listings.length === 0 ? (
          <p className={styles.empty}>
            You have no listings yet.{' '}
            <Link href="/host/listings/new" className={styles.actionLink}>
              Create your first listing
            </Link>
          </p>
        ) : (
          <div className={styles.listingsGrid}>
            {listings.map((listing) => {
              const firstPhoto = listing.photos[0]
              return (
                <div key={listing.id} className={styles.listingCard}>
                  {firstPhoto ? (
                    <img
                      src={firstPhoto.url}
                      alt={firstPhoto.alt}
                      className={styles.listingPhoto}
                    />
                  ) : (
                    <div className={styles.listingPhotoPlaceholder} aria-hidden="true" />
                  )}
                  <div className={styles.listingBody}>
                    <div className={styles.listingTitle}>{listing.title}</div>
                    <div className={styles.listingMeta}>
                      {listing.city} · €{(listing.nightlyRate / 100).toFixed(2)}/night ·{' '}
                      {listing._count.bookings} booking{listing._count.bookings !== 1 ? 's' : ''}
                    </div>
                    <div className={styles.listingActions}>
                      <Link href={`/listings/${listing.id}`} className={styles.actionLink}>
                        View
                      </Link>
                      <Link href={`/host/listings/${listing.id}/edit`} className={styles.actionLink}>
                        Edit
                      </Link>
                      <Link
                        href={`/host/listings/${listing.id}/availability`}
                        className={styles.actionLink}
                      >
                        Availability
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Open Enquiries */}
      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>Open enquiries ({enquiries.length})</h2>
        {enquiries.length === 0 ? (
          <p className={styles.empty}>No open enquiries.</p>
        ) : (
          <ul className={styles.enquiriesList}>
            {enquiries.map((enquiry) => (
              <li key={enquiry.id} className={styles.enquiryCard}>
                <div className={styles.enquiryMeta}>
                  From <strong>{enquiry.guest.name}</strong> about{' '}
                  <Link href={`/listings/${enquiry.listingId}`} className={styles.actionLink}>
                    {enquiry.listing.title}
                  </Link>{' '}
                  · {new Date(enquiry.createdAt).toLocaleDateString('en-GB')}
                </div>
                <p className={styles.enquiryMessage}>{enquiry.message}</p>
                <EnquiryReplyForm enquiryId={enquiry.id} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Upcoming bookings */}
      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>Upcoming bookings ({upcomingBookings.length})</h2>
        {upcomingBookings.length === 0 ? (
          <p className={styles.empty}>No upcoming bookings.</p>
        ) : (
          <table className={styles.bookingsTable}>
            <thead>
              <tr>
                <th>Guest</th>
                <th>Listing</th>
                <th>Check-in</th>
                <th>Check-out</th>
                <th>Earned</th>
                <th>Payment</th>
              </tr>
            </thead>
            <tbody>
              {upcomingBookings.map((booking) => (
                <tr key={booking.id}>
                  <td>{booking.guest.name}</td>
                  <td>
                    <Link href={`/listings/${booking.listing.id}`} className={styles.bookingLink}>
                      {booking.listing.title}
                    </Link>
                  </td>
                  <td>{new Date(booking.checkIn).toLocaleDateString('en-GB')}</td>
                  <td>{new Date(booking.checkOut).toLocaleDateString('en-GB')}</td>
                  <td>€{(booking.totalCost / 100).toFixed(2)}</td>
                  <td>{paymentText(booking.payment)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* All bookings */}
      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>All bookings ({bookings.length})</h2>
        {bookings.length === 0 ? (
          <p className={styles.empty}>No bookings yet.</p>
        ) : (
          <table className={styles.bookingsTable}>
            <thead>
              <tr>
                <th>Guest</th>
                <th>Listing</th>
                <th>Check-in</th>
                <th>Check-out</th>
                <th>Earned</th>
                <th>Payment</th>
                <th>Review guest</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => {
                const isCompleted = new Date(booking.checkOut) <= now
                return (
                  <tr key={booking.id}>
                    <td>{booking.guest.name}</td>
                    <td>
                      <Link href={`/listings/${booking.listing.id}`} className={styles.bookingLink}>
                        {booking.listing.title}
                      </Link>
                    </td>
                    <td>{new Date(booking.checkIn).toLocaleDateString('en-GB')}</td>
                    <td>{new Date(booking.checkOut).toLocaleDateString('en-GB')}</td>
                    <td>€{(booking.totalCost / 100).toFixed(2)}</td>
                    <td>{paymentText(booking.payment)}</td>
                    <td>
                      {isCompleted ? (
                        <ReviewGuestForm
                          bookingId={booking.id}
                          guestId={booking.guest.id}
                          guestName={booking.guest.name}
                        />
                      ) : (
                        <span style={{ color: 'var(--color-neutral-400, #9ca3af)', fontSize: '0.875rem' }}>
                          After checkout
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}
