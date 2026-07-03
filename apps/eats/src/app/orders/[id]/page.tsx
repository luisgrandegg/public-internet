import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { findOrderWithDetails } from '@/lib/services/orders'
import { findReviewForOrder } from '@/lib/services/reviews'
import { formatEuros } from '@/lib/format'
import { OrderStatusLive } from './OrderStatusLive'
import { ReviewForm } from './ReviewForm'
import styles from './page.module.css'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function OrderDetailPage({ params }: PageProps) {
  const { id } = await params
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/auth/signin')

  const order = await findOrderWithDetails(id)
  if (!order) notFound()
  if (order.customerId !== session.user.id) {
    // Not the owner — treat as not found to avoid leaking existence.
    notFound()
  }

  const review = order.status === 'DELIVERED' ? await findReviewForOrder(order.id) : null

  return (
    <div className={styles.container}>
      <Link href="/orders" className={styles.backLink}>
        ← Back to orders
      </Link>
      <h1 className={styles.heading}>Order from {order.restaurant.name}</h1>
      <div className={styles.meta}>
        <span>Placed {new Date(order.createdAt).toLocaleString()}</span>
      </div>

      <OrderStatusLive
        initialOrder={{
          id: order.id,
          status: order.status,
          createdAt: order.createdAt.toISOString(),
          updatedAt: order.updatedAt.toISOString(),
          delivery: order.delivery
            ? {
                status: order.delivery.status,
                pickedUpAt: order.delivery.pickedUpAt?.toISOString() ?? null,
                deliveredAt: order.delivery.deliveredAt?.toISOString() ?? null,
              }
            : null,
        }}
      />

      <section className={styles.section} aria-label="Items">
        <h2 className={styles.sectionHeading}>Items</h2>
        <ul className={styles.itemList}>
          {order.items.map((item) => (
            <li key={item.id} className={styles.itemRow}>
              <span>
                {item.quantity} × {item.nameSnapshot ?? 'Menu item'}
              </span>
              <span>{formatEuros(item.quantity * item.unitPrice)}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.section} aria-label="Cost breakdown">
        <h2 className={styles.sectionHeading}>Cost breakdown</h2>
        <div className={styles.totals}>
          <div className={styles.totalRow}>
            <span>Items</span>
            <span>{formatEuros(order.itemsCost)}</span>
          </div>
          <div className={styles.totalRow}>
            <span>Platform infrastructure fee</span>
            <span>{formatEuros(order.infrastructureFee)}</span>
          </div>
          <div className={`${styles.totalRow} ${styles.grandTotal}`}>
            <span>Total</span>
            <span>{formatEuros(order.totalCost)}</span>
          </div>
        </div>
      </section>

      <section className={styles.section} aria-label="Delivery details">
        <h2 className={styles.sectionHeading}>Delivery</h2>
        <p>
          <strong>Address:</strong> {order.deliveryAddress}
        </p>
        {order.notes && (
          <p>
            <strong>Notes:</strong> {order.notes}
          </p>
        )}
      </section>

      {order.status === 'DELIVERED' && (
        <section className={styles.section} aria-label="Review">
          <h2 className={styles.sectionHeading}>Your review</h2>
          {review ? (
            <div className={styles.reviewedState}>
              <p className={styles.reviewedBadge}>Reviewed</p>
              <p className={styles.reviewedRating}>
                You rated {order.restaurant.name} {review.rating} out of 5.
              </p>
              {review.body && <p className={styles.reviewedBody}>{review.body}</p>}
              <p className={styles.reviewedDate}>
                Submitted {new Date(review.createdAt).toLocaleDateString()}
              </p>
            </div>
          ) : (
            <ReviewForm orderId={order.id} restaurantName={order.restaurant.name} />
          )}
        </section>
      )}
    </div>
  )
}
