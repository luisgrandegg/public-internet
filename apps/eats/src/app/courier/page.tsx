import Link from 'next/link'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { listDeliveriesForCourier } from '@/lib/services/deliveries'
import { formatEuros, deliveryStatusLabel } from '@/lib/format'
import { DeliveryCard } from './DeliveryCard'
import styles from './page.module.css'

export default async function CourierDashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/auth/signin')
  const user = session.user as { id: string; isCourier?: boolean; name: string }
  if (!user.isCourier) redirect('/courier/register')

  const [available, mine, history] = await Promise.all([
    listDeliveriesForCourier(user.id, 'UNASSIGNED'),
    listDeliveriesForCourier(user.id, 'ASSIGNED'),
    listDeliveriesForCourier(user.id, null),
  ])

  const completed = history.filter(
    (d) => d.status === 'PICKED_UP' || d.status === 'DELIVERED' || d.status === 'FAILED',
  )

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.heading}>Courier dashboard</h1>
          <p className={styles.description}>
            Welcome back, {user.name}. Every delivery below shows the full pay breakdown
            before you accept.
          </p>
        </div>
        <Link href="#appeal" className={styles.appealLink}>
          Appeal an account decision →
        </Link>
      </header>

      <Section title="Available deliveries" subtitle="Pay is shown before you accept.">
        {available.length === 0 ? (
          <p className={styles.empty}>No deliveries waiting right now. Check back soon.</p>
        ) : (
          <ul className={styles.list}>
            {available.map((d) => (
              <li key={d.id}>
                <DeliveryCard
                  id={d.id}
                  status="UNASSIGNED"
                  statusLabel={deliveryStatusLabel(d.status)}
                  restaurantName={d.order.restaurant.name}
                  restaurantAddress={d.order.restaurant.address}
                  deliveryAddress={d.order.deliveryAddress}
                  basePayLabel={formatEuros(d.basePay)}
                  distancePayLabel={formatEuros(d.distancePay)}
                  totalPayLabel={formatEuros(d.basePay + d.distancePay)}
                  items={d.order.items.map((i) => ({
                    name: i.nameSnapshot ?? 'Menu item',
                    quantity: i.quantity,
                  }))}
                />
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="My active deliveries" subtitle="Update status as you progress.">
        {mine.length === 0 ? (
          <p className={styles.empty}>You have no active deliveries.</p>
        ) : (
          <ul className={styles.list}>
            {mine.map((d) => (
              <li key={d.id}>
                <DeliveryCard
                  id={d.id}
                  status={d.status}
                  statusLabel={deliveryStatusLabel(d.status)}
                  restaurantName={d.order.restaurant.name}
                  restaurantAddress={d.order.restaurant.address}
                  deliveryAddress={d.order.deliveryAddress}
                  basePayLabel={formatEuros(d.basePay)}
                  distancePayLabel={formatEuros(d.distancePay)}
                  totalPayLabel={formatEuros(d.basePay + d.distancePay)}
                  items={d.order.items.map((i) => ({
                    name: i.nameSnapshot ?? 'Menu item',
                    quantity: i.quantity,
                  }))}
                />
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="History" subtitle="Your full delivery history with pay breakdown.">
        {completed.length === 0 ? (
          <p className={styles.empty}>Nothing here yet.</p>
        ) : (
          <ul className={styles.historyList}>
            {completed.map((d) => (
              <li key={d.id} className={styles.historyRow}>
                <div>
                  <div className={styles.rowTitle}>{d.order.restaurant.name}</div>
                  <div className={styles.rowMeta}>
                    {new Date(d.createdAt).toLocaleString()} ·{' '}
                    <strong>{deliveryStatusLabel(d.status)}</strong>
                  </div>
                </div>
                <div className={styles.historyPay}>
                  <div>
                    Base pay: <strong>{formatEuros(d.basePay)}</strong>
                  </div>
                  <div>
                    Distance pay: <strong>{formatEuros(d.distancePay)}</strong>
                  </div>
                  <div className={styles.historyTotal}>
                    Total: {formatEuros(d.basePay + d.distancePay)}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <section className={styles.appealSection} id="appeal" aria-labelledby="appeal-heading">
        <h2 id="appeal-heading" className={styles.sectionHeading}>
          Appeal a decision
        </h2>
        <p>
          If a decision about your account is ever made, you will receive a written
          explanation and a path to appeal. This is a constitutional guarantee — not a
          discretionary favour.
        </p>
        <p>
          To start an appeal, email the node operator with your case and the affected
          deliveries. Your full work history, including pay breakdowns, is available here
          at any time.
        </p>
      </section>
    </div>
  )
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <section className={styles.section}>
      <header className={styles.sectionHeader}>
        <h2 className={styles.sectionHeading}>{title}</h2>
        {subtitle && <span className={styles.caption}>{subtitle}</span>}
      </header>
      {children}
    </section>
  )
}
