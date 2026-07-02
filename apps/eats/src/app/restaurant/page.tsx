import Link from 'next/link'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { listOrdersForOwner } from '@/lib/services/orders'
import { listRestaurantsForOwner } from '@/lib/services/restaurants'
import { formatEuros, orderStatusLabel } from '@/lib/format'
import { OrderRow } from './OrderRow'
import styles from './page.module.css'

export default async function RestaurantDashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/auth/signin')
  const user = session.user as { id: string; isRestaurantOwner?: boolean; name: string }
  if (!user.isRestaurantOwner) redirect('/restaurant/onboarding')

  const [orders, restaurants] = await Promise.all([
    listOrdersForOwner(user.id),
    listRestaurantsForOwner(user.id),
  ])

  const bucket = {
    incoming: orders.filter((o) => o.status === 'PENDING'),
    inProgress: orders.filter(
      (o) => o.status === 'ACCEPTED' || o.status === 'PREPARING',
    ),
    ready: orders.filter((o) => o.status === 'READY_FOR_PICKUP'),
    done: orders.filter((o) =>
      ['IN_DELIVERY', 'DELIVERED', 'CANCELLED'].includes(o.status),
    ),
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.heading}>Restaurant dashboard</h1>
          <p className={styles.description}>
            Welcome back, {user.name}. You are running {restaurants.length}{' '}
            {restaurants.length === 1 ? 'restaurant' : 'restaurants'} on this node.
          </p>
        </div>
        <Link href="/restaurant/register" className={styles.secondaryAction}>
          Register another restaurant
        </Link>
      </header>

      <section className={styles.restaurantList} aria-label="Your restaurants">
        <h2 className={styles.sectionHeading}>Your restaurants</h2>
        {restaurants.length === 0 ? (
          <p className={styles.empty}>You haven&apos;t registered a restaurant yet.</p>
        ) : (
          <ul className={styles.restaurants}>
            {restaurants.map((r) => (
              <li key={r.id} className={styles.restaurantRow}>
                <div>
                  <div className={styles.rowTitle}>{r.name}</div>
                  <div className={styles.rowMeta}>
                    {r.city} · {r.isActive ? 'Active' : 'Inactive'}
                  </div>
                </div>
                <div className={styles.rowActions}>
                  <Link href={`/restaurant/${r.id}/menu`} className={styles.menuLink}>
                    Manage menu →
                  </Link>
                  <Link href={`/restaurant/${r.id}/settings`} className={styles.menuLink}>
                    Settings →
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <OrderColumn title="Incoming" caption="Pending — tap Accept" orders={bucket.incoming} />
      <OrderColumn
        title="In progress"
        caption="Accepted / preparing"
        orders={bucket.inProgress}
      />
      <OrderColumn
        title="Ready for pickup"
        caption="Waiting for a courier"
        orders={bucket.ready}
      />
      <OrderColumn title="Completed" caption="Out for delivery / delivered" orders={bucket.done} />
    </div>
  )
}

function OrderColumn({
  title,
  caption,
  orders,
}: {
  title: string
  caption: string
  orders: Array<
    Awaited<ReturnType<typeof listOrdersForOwner>>[number] & { items: { nameSnapshot: string | null; quantity: number; unitPrice: number }[] }
  >
}) {
  return (
    <section className={styles.column} aria-label={title}>
      <header className={styles.columnHeader}>
        <h2 className={styles.sectionHeading}>{title}</h2>
        <span className={styles.caption}>{caption}</span>
      </header>
      {orders.length === 0 ? (
        <p className={styles.empty}>No orders here yet.</p>
      ) : (
        <ul className={styles.orderList}>
          {orders.map((order) => (
            <li key={order.id}>
              <OrderRow
                id={order.id}
                status={order.status as never}
                statusLabel={orderStatusLabel(order.status)}
                restaurantName={order.restaurant.name}
                customerName={order.customer?.name ?? 'Customer'}
                items={order.items.map((i) => ({
                  name: i.nameSnapshot ?? 'Menu item',
                  quantity: i.quantity,
                }))}
                totalLabel={formatEuros(order.totalCost)}
                createdAt={order.createdAt instanceof Date ? order.createdAt.toISOString() : String(order.createdAt)}
                notes={order.notes ?? undefined}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
