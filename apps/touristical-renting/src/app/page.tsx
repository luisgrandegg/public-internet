import { Input, Button, Card } from '@public-internet/design-system'
import { MOCK_LISTINGS } from '@/lib/mock-data'
import { ListingCard } from './listings/_components/ListingCard'
import styles from './page.module.css'

export default function HomePage() {
  const featuredListings = MOCK_LISTINGS.slice(0, 4)

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
        <div className={styles.listingsGrid}>
          {featuredListings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
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
