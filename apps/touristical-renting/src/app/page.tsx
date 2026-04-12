import { Input, Button, Card } from '@public-internet/design-system'
import { getListings } from '@/lib/services/listings'

// This page fetches live data from the database — disable static prerendering.
export const dynamic = 'force-dynamic'
import type { PropertyType } from '@/lib/types'
import { ListingCard } from './listings/_components/ListingCard'
import styles from './page.module.css'

export default async function HomePage() {
  const { listings } = await getListings({ page: 1, limit: 4 })

  const featuredListings = listings.map((l) => ({
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
    rating: null,
    reviewCount: 0,
  }))

  return (
    <>
      {/* Section 1 — Search hero */}
      <section className={styles.hero}>
        <h1 className={styles.heroHeading}>Find your next place to stay</h1>
        <p className={styles.heroSubheading}>
          Commission-free rentals — what you see is what you pay
        </p>
        <form action="/listings" method="GET" className={styles.searchForm}>
          <div className={styles.searchField}>
            <Input
              name="location"
              label="Where are you going?"
              placeholder="City, region…"
            />
          </div>
          <div className={styles.searchField}>
            <Input
              name="checkIn"
              label="Check in"
              type="date"
            />
          </div>
          <div className={styles.searchField}>
            <Input
              name="checkOut"
              label="Check out"
              type="date"
            />
          </div>
          <Button type="submit" variant="primary">
            Search
          </Button>
        </form>
      </section>

      {/* Section 2 — Featured listings */}
      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>Featured places</h2>
        {featuredListings.length === 0 ? (
          <p className={styles.emptyState}>
            Be the first to list your property —{' '}
            <a href="/host/listings/new">List your property</a>
          </p>
        ) : (
          <div className={styles.listingsGrid}>
            {featuredListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </section>

      {/* Section 3 — How it works */}
      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>How it works</h2>
        <div className={styles.howItWorksGrid}>
          <Card variant="bordered" className={styles.howItWorksStep}>
            <div className={styles.stepNumber}>1</div>
            <h3 className={styles.stepTitle}>Search</h3>
            <p className={styles.stepDescription}>
              Browse listings by location, dates, and property type. Every price shown is the complete price — no surprises.
            </p>
          </Card>
          <Card variant="bordered" className={styles.howItWorksStep}>
            <div className={styles.stepNumber}>2</div>
            <h3 className={styles.stepTitle}>Contact the host directly</h3>
            <p className={styles.stepDescription}>
              Send an enquiry to the host. No intermediaries, no booking fees. Communicate and agree terms openly.
            </p>
          </Card>
          <Card variant="bordered" className={styles.howItWorksStep}>
            <div className={styles.stepNumber}>3</div>
            <h3 className={styles.stepTitle}>Stay</h3>
            <p className={styles.stepDescription}>
              Enjoy your stay. After check-out, both you and the host can leave honest reviews — published simultaneously.
            </p>
          </Card>
        </div>
      </section>
    </>
  )
}
