import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { getFavoriteListings } from '@/lib/services/favorites'
import type { PropertyType } from '@/lib/types'
import { ListingCard } from '../listings/_components/ListingCard'
import styles from './page.module.css'

export const metadata = { title: 'My favorites' }

export default async function FavoritesPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/auth/signin')

  const listings = await getFavoriteListings(session.user.id)

  const normalisedListings = listings.map((l) => ({
    id: l.id,
    title: l.title,
    description: l.description,
    propertyType: l.propertyType as PropertyType,
    location: {
      city: l.city,
      country: l.country,
      coordinates: { lat: l.lat, lng: l.lng },
    },
    host: {
      id: l.host.id,
      name: l.host.name,
      avatarUrl: l.host.image ?? null,
      memberSince: '',
      verifiedHost: false,
    },
    photos: l.photos.map((p) => ({ url: p.url, alt: p.alt })),
    amenities: [],
    nightlyRate: l.nightlyRate / 100, // cents → euros for display
    maxGuests: l.maxGuests,
    bedrooms: l.bedrooms,
    bathrooms: l.bathrooms,
    rating: l.rating,
    reviewCount: l.reviewCount,
  }))

  return (
    <div className={styles.root}>
      <h1 className={styles.heading}>My favorites</h1>

      {normalisedListings.length === 0 ? (
        <div className={styles.empty}>
          <p>You have not saved any listings yet.</p>
          <p>
            <Link href="/listings" className={styles.emptyLink}>
              Browse listings
            </Link>{' '}
            and use the Save button to keep the places you like here.
          </p>
        </div>
      ) : (
        <div className={styles.grid}>
          {normalisedListings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} favorited={true} />
          ))}
        </div>
      )}
    </div>
  )
}
