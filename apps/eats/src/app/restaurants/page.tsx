import Link from 'next/link'
import { Input, Button } from '@public-internet/design-system'
import { RestaurantCard } from '@/components/RestaurantCard'
import { listRestaurants, listMenuItemCategories } from '@/lib/services/restaurants'
import styles from './page.module.css'

interface PageProps {
  searchParams: Promise<{ city?: string; q?: string; category?: string; page?: string }>
}

/** Build a /restaurants query object, omitting empty params so URLs stay clean. */
function browseQuery(params: {
  city?: string
  q?: string
  category?: string
  page?: number
}): Record<string, string> {
  const query: Record<string, string> = {}
  if (params.city) query.city = params.city
  if (params.q) query.q = params.q
  if (params.category) query.category = params.category
  if (params.page && params.page > 1) query.page = String(params.page)
  return query
}

export default async function RestaurantsPage({ searchParams }: PageProps) {
  const { city, q: qParam, category: categoryParam, page: pageParam } = await searchParams
  const q = qParam?.trim() || undefined
  const category = categoryParam?.trim() || undefined
  const page = Math.max(1, Number.parseInt(pageParam ?? '1', 10) || 1)
  const limit = 20

  const [{ restaurants, total }, categories] = await Promise.all([
    listRestaurants({ city, q, category, page, limit }),
    listMenuItemCategories(),
  ])
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const hasFilters = Boolean(city || q || category)

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
            name="q"
            label="Search by name or keyword"
            defaultValue={q ?? ''}
            placeholder="Restaurant name, dish, cuisine…"
          />
        </div>
        <div className={styles.searchField}>
          <Input
            name="city"
            label="Filter by city"
            defaultValue={city ?? ''}
            placeholder="City or neighbourhood…"
          />
        </div>
        {category && <input type="hidden" name="category" value={category} />}
        <Button type="submit" variant="primary">
          Search
        </Button>
      </form>

      {categories.length > 0 && (
        <nav className={styles.categoryNav} aria-label="Filter by menu category">
          <span className={styles.categoryLabel} id="category-filter-label">
            Category:
          </span>
          <ul className={styles.categoryList} aria-labelledby="category-filter-label">
            <li>
              <Link
                href={{ pathname: '/restaurants', query: browseQuery({ city, q }) }}
                className={styles.categoryLink}
                aria-current={category ? undefined : 'true'}
              >
                All
              </Link>
            </li>
            {categories.map((c) => {
              const isCurrent = category?.toLowerCase() === c.toLowerCase()
              return (
                <li key={c}>
                  <Link
                    href={{
                      pathname: '/restaurants',
                      query: browseQuery({ city, q, category: c }),
                    }}
                    className={styles.categoryLink}
                    aria-current={isCurrent ? 'true' : undefined}
                  >
                    {c}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
      )}

      {restaurants.length === 0 ? (
        <div className={styles.emptyState} role="status">
          <h2 className={styles.emptyHeading}>No restaurants yet</h2>
          <p className={styles.emptyBody}>
            {hasFilters
              ? 'No active restaurants match these filters. Try a different keyword, city, or category.'
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
              href={{
                pathname: '/restaurants',
                query: browseQuery({ city, q, category, page: page - 1 }),
              }}
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
              href={{
                pathname: '/restaurants',
                query: browseQuery({ city, q, category, page: page + 1 }),
              }}
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
