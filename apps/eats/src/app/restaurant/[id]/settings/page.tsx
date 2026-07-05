import { headers } from 'next/headers'
import { redirect, notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getRestaurantById } from '@/lib/services/restaurants'
import { RestaurantSettingsForm } from './RestaurantSettingsForm'
import styles from './page.module.css'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function RestaurantSettingsPage({ params }: PageProps) {
  const { id } = await params
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/auth/signin')

  const restaurant = await getRestaurantById(id, { includeInactive: true })
  if (!restaurant) notFound()
  if (restaurant.ownerId !== session.user.id) redirect('/restaurant')

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.heading}>Settings — {restaurant.name}</h1>
        <p className={styles.description}>
          Update your restaurant&apos;s public details here. Changes apply immediately.
          Deactivating your listing hides it from customers — you can reactivate it at
          any time, and your menu and history are kept.
        </p>
      </header>
      <RestaurantSettingsForm
        restaurant={{
          id: restaurant.id,
          name: restaurant.name,
          description: restaurant.description,
          address: restaurant.address,
          city: restaurant.city,
          country: restaurant.country,
          phone: restaurant.phone,
          imageUrl: restaurant.imageUrl,
          isActive: restaurant.isActive,
        }}
      />
    </div>
  )
}
