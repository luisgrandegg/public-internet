import Link from 'next/link'
import { Input, Button } from '@public-internet/design-system'
import { RestaurantCard } from '@/components/RestaurantCard'
import { listRestaurants } from '@/lib/services/restaurants'
import styles from './page.module.css'

interface PageProps {
  searchParams: Promise<{ city?: string; page?: string }>
}

export default async function RestaurantsPage({ searchParams }: PageProps) {
  const { city, page: pageParam } = await searchParams
  const page = Math.max(1, Number.parseInt(pageParam ?? '1', 10) || 1)
  const limit = 20

  const { restaurants, total } = await listRestaurants({ city, page, limit })
  const totalPages = Math.max(1, Math.ceil(total / limit))

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.heading}>
          {city ? `Restaurants in ${city}` : 'All restaurants'}
        </h1>
        <p className={styles.subheading}>
          Listings are alphabetical within each city. There is no paid ranking and no
          promoted placement.
        </p>
      </header>

      <form action="/restaurants" method="GET" className={styles.searchForm}>
        <div className={styles.searchField}>
          <Input
            name="city"
            label="Filter by city"
            defaultValue={city ?? ''}
            placeholder="City or neighbourhood…"
          />
        </div>
        <Button type="submit" variant="primary">
          Search
        </Button>
      </form>

      {restaurants.length === 0 ? (
        <div className={styles.emptyState} role="status">
          <h2 className={styles.emptyHeading}>No restaurants yet</h2>
          <p className={styles.emptyBody}>
            {city
              ? `No active restaurants are listed for “${city}”.`
              : 'No active restaurants are listed on this node yet.'}
          </p>
          <Link href="/restaurant/onboarding" className={styles.emptyLink}>
            Own a restaurant? List it for free.
          </Link>
        </div>
      ) : (
        <ul className={styles.grid}>
          {restaurants.map((r) => (
            <li key={r.id}>
              <RestaurantCard
                id={r.id}
                name={r.name}
                description={r.description}
                city={r.city}
                imageUrl={r.imageUrl}
              />
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 && (
        <nav className={styles.pagination} aria-label="Pagination">
          {page > 1 && (
            <Link
              href={{ pathname: '/restaurants', query: { city, page: page - 1 } }}
              className={styles.pageLink}
            >
              ← Previous
            </Link>
          )}
          <span className={styles.pageLabel}>
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={{ pathname: '/restaurants', query: { city, page: page + 1 } }}
              className={styles.pageLink}
            >
              Next →
            </Link>
          )}
        </nav>
      )}
    </div>
  )
}
