import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { Button } from '@public-internet/design-system'
import { getListingById, getListingAvailability } from '@/lib/services/listings'
import { getListingReviews } from '@/lib/services/reviews'
import { isFavorited } from '@/lib/services/favorites'
import { FavoriteButton } from '@/components/FavoriteButton'
import { AvailabilityCalendar } from './_components/AvailabilityCalendar'
import { ContactHostForm } from './_components/ContactHostForm'
import styles from './page.module.css'

interface ListingDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function ListingDetailPage({ params }: ListingDetailPageProps) {
  const { id } = await params

  const [listing, availability, reviews, session] = await Promise.all([
    getListingById(id),
    getListingAvailability(id),
    getListingReviews(id),
    auth.api.getSession({ headers: await headers() }),
  ])

  if (!listing) notFound()

  const favorited = session ? await isFavorited(session.user.id, listing.id) : null

  const nightlyRateEur = (listing.nightlyRate / 100).toFixed(2)
  const memberSinceYear = new Date(listing.host.createdAt).getFullYear()
  const hostInitials = listing.host.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const averageRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : null

  const isAuthenticated = session !== null

  return (
    <div className={styles.root}>
      {/* Photo gallery */}
      {listing.photos.length > 0 ? (
        <div className={styles.gallery} role="list" aria-label="Listing photos">
          {listing.photos.map((photo) => (
            <img
              key={photo.id}
              src={photo.url}
              alt={photo.alt}
              className={styles.photo}
              role="listitem"
            />
          ))}
        </div>
      ) : (
        <div className={styles.gallery}>
          <div className={styles.photoPlaceholder} aria-label="No photos available">
            No photos available
          </div>
        </div>
      )}

      <div className={styles.header}>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>{listing.title}</h1>
          {favorited !== null && (
            <FavoriteButton
              listingId={listing.id}
              listingTitle={listing.title}
              initialFavorited={favorited}
            />
          )}
        </div>
        <div className={styles.meta}>
          <span className={styles.metaItem}>{listing.propertyType.charAt(0).toUpperCase() + listing.propertyType.slice(1)}</span>
          <span className={styles.metaItem}>{listing.city}, {listing.country}</span>
          <span className={styles.metaItem}>{listing.bedrooms} bedroom{listing.bedrooms !== 1 ? 's' : ''}</span>
          <span className={styles.metaItem}>{listing.bathrooms} bathroom{listing.bathrooms !== 1 ? 's' : ''}</span>
          <span className={styles.metaItem}>Up to {listing.maxGuests} guest{listing.maxGuests !== 1 ? 's' : ''}</span>
        </div>
      </div>

      <div className={styles.layout}>
        <main>
          {/* Host card */}
          <div className={styles.hostCard}>
            {listing.host.image ? (
              <img
                src={listing.host.image}
                alt={`${listing.host.name}'s profile photo`}
                className={styles.hostAvatar}
              />
            ) : (
              <div className={styles.hostInitials} aria-hidden="true">
                {hostInitials}
              </div>
            )}
            <div className={styles.hostInfo}>
              <div className={styles.hostName}>Hosted by {listing.host.name}</div>
              <div className={styles.hostSince}>Member since {memberSinceYear}</div>
            </div>
          </div>

          {/* Description */}
          <h2 className={styles.sectionHeading}>About this place</h2>
          <p className={styles.description}>{listing.description}</p>

          {/* Availability calendar */}
          <div className={styles.calendarSection}>
            <h2 className={styles.sectionHeading}>Availability</h2>
            <AvailabilityCalendar blockedRanges={availability.blockedRanges} />
          </div>

          {/* Reviews */}
          <div className={styles.reviewsSection}>
            <h2 className={styles.sectionHeading}>Reviews</h2>
            {reviews.length === 0 ? (
              <p className={styles.noReviews}>No reviews yet.</p>
            ) : (
              <>
                {averageRating && (
                  <div className={styles.aggregateRating}>
                    <span className={styles.aggregateScore}>{averageRating}</span>
                    <span>average from {reviews.length} review{reviews.length !== 1 ? 's' : ''}</span>
                  </div>
                )}
                <ul className={styles.reviewsList}>
                  {reviews.map((review) => (
                    <li key={review.id} className={styles.review}>
                      <div className={styles.reviewHeader}>
                        <span className={styles.reviewAuthor}>{review.author.name}</span>
                        <span className={styles.reviewRating} aria-label={`${review.rating} out of 5`}>
                          {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                        </span>
                        <span className={styles.reviewDate}>
                          {review.publishedAt
                            ? new Date(review.publishedAt).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
                            : ''}
                        </span>
                      </div>
                      <p className={styles.reviewBody}>{review.body}</p>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          {/* Contact host */}
          <div className={styles.contactSection}>
            <h2 className={styles.sectionHeading}>Contact the host</h2>
            <ContactHostForm listingId={listing.id} isAuthenticated={isAuthenticated} />
          </div>
        </main>

        {/* Price sidebar */}
        <aside>
          <div className={styles.priceCard}>
            <div className={styles.price}>€{nightlyRateEur} <span style={{ fontWeight: 400, fontSize: '1rem' }}>per night</span></div>
            <div className={styles.priceNote}>Total price — no additional fees</div>
            <Link href={`/listings/${listing.id}/book`} className={styles.ctaButton}>
              <Button variant="primary" style={{ width: '100%' }}>
                Request to book
              </Button>
            </Link>
          </div>
        </aside>
      </div>
    </div>
  )
}
