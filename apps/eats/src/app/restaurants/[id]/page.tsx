import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Button } from '@public-internet/design-system'
import { getRestaurantById } from '@/lib/services/restaurants'
import { listMenuItems, groupByCategory } from '@/lib/services/menu'
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
  const items = await listMenuItems(id, true)
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
    </div>
  )
}
