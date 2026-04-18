import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getRestaurantById } from '@/lib/services/restaurants'
import { listMenuItems } from '@/lib/services/menu'
import { MenuManagement } from './MenuManagement'
import styles from './page.module.css'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function MenuManagementPage({ params }: PageProps) {
  const { id } = await params
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/auth/signin')

  const restaurant = await getRestaurantById(id, { includeInactive: true })
  if (!restaurant) notFound()
  if (restaurant.ownerId !== session.user.id) redirect('/restaurant')

  const items = await listMenuItems(id)

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.heading}>Menu — {restaurant.name}</h1>
        <p className={styles.description}>
          Manage your menu here. Prices are entered in euros and stored exactly as shown —
          no platform markup is added. Items marked unavailable stay in your history but are
          hidden from customers.
        </p>
      </header>
      <MenuManagement restaurantId={id} items={items} />
    </div>
  )
}
