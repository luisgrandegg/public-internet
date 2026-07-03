import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Button } from '@public-internet/design-system'
import { getRestaurantById } from '@/lib/services/restaurants'
import { listMenuItems, groupByCategory } from '@/lib/services/menu'
import { listReviewsForRestaurant } from '@/lib/services/reviews'
import { MenuItemCard } from '@/components/MenuItemCard'
import styles from './page.module.css'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function RestaurantDetailPage({ params }: PageProps) {
  const { id } = await params
  const restaurant = await getRestaurantById(id)
  if (!restaurant) notFound()

  // Customer view: only items that are currently available.
  const [items, { reviews }] = await Promise.all([
    listMenuItems(id, true),
    listReviewsForRestaurant(id, { page: 1, limit: 10 }),
  ])
  const groups = groupByCategory(items)

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.heading}>{restaurant.name}</h1>
          <p className={styles.meta}>
            {restaurant.address} · {restaurant.city}
            {restaurant.phone ? ` · ${restaurant.phone}` : ''}
          </p>
          {restaurant.avgRating != null && restaurant.reviewCount > 0 ? (
            <p className={styles.rating}>
              <span aria-hidden="true">{restaurant.avgRating.toFixed(1)} ★</span>
              <span className={styles.srOnly}>
                Rated {restaurant.avgRating.toFixed(1)} out of 5
              </span>{' '}
              ({restaurant.reviewCount}{' '}
              {restaurant.reviewCount === 1 ? 'review' : 'reviews'})
            </p>
          ) : (
            <p className={styles.rating}>No reviews yet</p>
          )}
        </div>
        <Link href={`/restaurants/${restaurant.id}/order`}>
          <Button variant="primary">Start an order</Button>
        </Link>
      </header>

      <p className={styles.description}>{restaurant.description}</p>

      <section className={styles.menuSection} aria-labelledby="menu-heading">
        <h2 id="menu-heading" className={styles.menuHeading}>
          Menu
        </h2>

        {groups.length === 0 ? (
          <p className={styles.empty}>
            This restaurant has no available items at the moment. Please check back later.
          </p>
        ) : (
          groups.map((group) => (
            <div key={group.category} className={styles.group}>
              <h3 className={styles.groupHeading}>{group.category}</h3>
              <ul className={styles.list}>
                {group.items.map((item) => (
                  <li key={item.id}>
                    <MenuItemCard
                      name={item.name}
                      description={item.description}
                      price={item.price}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </section>

      <section className={styles.reviewsSection} aria-labelledby="reviews-heading">
        <h2 id="reviews-heading" className={styles.menuHeading}>
          Recent reviews
        </h2>
        {reviews.length === 0 ? (
          <p className={styles.empty}>
            No reviews yet. Reviews come from customers whose orders were delivered.
          </p>
        ) : (
          <ul className={styles.reviewList}>
            {reviews.map((review) => (
              <li key={review.id} className={styles.reviewItem}>
                <p className={styles.reviewHeader}>
                  <span className={styles.reviewAuthor}>{review.author.name}</span>
                  <span className={styles.reviewRating}>
                    rated it {review.rating} out of 5
                  </span>
                </p>
                {review.body && <p className={styles.reviewBody}>{review.body}</p>}
                <p className={styles.reviewDate}>
                  {new Date(review.createdAt).toLocaleDateString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
