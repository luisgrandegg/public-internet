import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { RegisterRestaurantForm } from './RegisterRestaurantForm'
import styles from './page.module.css'

export default async function RegisterRestaurantPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    redirect('/auth/signin')
  }

  // Non-owners first read the commission-free model and opt in explicitly.
  const user = session.user as { isRestaurantOwner?: boolean }
  if (!user.isRestaurantOwner) redirect('/restaurant/onboarding')

  return (
    <div className={styles.container}>
      <div className={styles.intro}>
        <h1 className={styles.heading}>Register your restaurant</h1>
        <p className={styles.description}>
          Registration is free. The platform takes no commission on your orders — a flat
          per-order infrastructure fee is the only cost, and it is paid by the customer,
          not you. There is no exclusivity agreement, no advertising tier, and no paid placement.
        </p>
      </div>
      <RegisterRestaurantForm />
    </div>
  )
}
