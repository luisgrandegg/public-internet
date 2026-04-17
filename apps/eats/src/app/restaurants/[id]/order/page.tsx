import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getRestaurantById } from '@/lib/services/restaurants'
import { listMenuItems } from '@/lib/services/menu'
import { INFRASTRUCTURE_FEE_CENTS } from '@/lib/config'
import { OrderFlow } from './OrderFlow'
import styles from './page.module.css'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function OrderFlowPage({ params }: PageProps) {
  const { id } = await params
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/auth/signin')

  const restaurant = await getRestaurantById(id)
  if (!restaurant) notFound()

  const items = await listMenuItems(id, true)

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.heading}>Order from {restaurant.name}</h1>
        <p className={styles.description}>
          Every price you see here is the final price. A flat infrastructure fee of{' '}
          <strong>€{(INFRASTRUCTURE_FEE_CENTS / 100).toFixed(2)}</strong> is added to each
          order — published publicly, never a percentage, never adjusted by demand.
        </p>
      </header>
      <OrderFlow
        restaurantId={restaurant.id}
        restaurantName={restaurant.name}
        infrastructureFee={INFRASTRUCTURE_FEE_CENTS}
        items={items.map((i) => ({
          id: i.id,
          name: i.name,
          description: i.description,
          price: i.price,
          category: i.category,
        }))}
      />
    </div>
  )
}
