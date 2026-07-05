import Link from 'next/link'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { listOrdersForCustomer } from '@/lib/services/orders'
import { formatEuros, orderStatusLabel, paymentStateLabel } from '@/lib/format'
import styles from './page.module.css'

export default async function OrdersPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/auth/signin')

  const orders = await listOrdersForCustomer(session.user.id)

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Your orders</h1>
      {orders.length === 0 ? (
        <div className={styles.emptyState}>
          <p>You haven&apos;t placed any orders yet.</p>
          <Link href="/restaurants" className={styles.emptyLink}>
            Browse restaurants
          </Link>
        </div>
      ) : (
        <ul className={styles.list}>
          {orders.map((order) => (
            <li key={order.id}>
              <Link href={`/orders/${order.id}`} className={styles.row}>
                <div>
                  <div className={styles.rowTitle}>{order.restaurant.name}</div>
                  <div className={styles.rowMeta}>
                    {new Date(order.createdAt).toLocaleString()} ·{' '}
                    <span className={styles.statusLabel}>
                      {orderStatusLabel(order.status)}
                    </span>
                    {order.payment && (
                      <>
                        {' '}
                        ·{' '}
                        <span className={styles.statusLabel}>
                          {paymentStateLabel(order.payment)}
                          {order.payment.provider !== 'offline' &&
                            order.payment.status === 'PENDING' &&
                            ' — open the order to complete payment'}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <div className={styles.rowTotal}>{formatEuros(order.totalCost)}</div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
