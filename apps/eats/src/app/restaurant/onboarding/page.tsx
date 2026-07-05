import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { OnboardingForm } from './OnboardingForm'
import styles from './page.module.css'

export default async function RestaurantOnboardingPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/auth/signin')

  const user = session.user as { isRestaurantOwner?: boolean }
  if (user.isRestaurantOwner) redirect('/restaurant')

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.heading}>Add your restaurant to Eats</h1>
        <p className={styles.subheading}>
          Eats is commission-free infrastructure, not a marketplace that takes a cut.
          Here is exactly what listing your restaurant costs and how the platform works —
          read it before you continue.
        </p>
      </header>

      <section className={styles.section} aria-labelledby="cost-heading">
        <h2 id="cost-heading" className={styles.sectionHeading}>
          What it costs you: nothing
        </h2>
        <ul className={styles.pointList}>
          <li>
            <strong>Zero commission.</strong> The platform never takes a percentage of your
            orders. Every euro on your menu goes to you.
          </li>
          <li>
            <strong>A flat infrastructure fee, paid by the customer.</strong> It covers
            actual operating costs, is never a percentage, and is published for everyone
            to see before an order is confirmed.
          </li>
          <li>
            <strong>No advertising tiers or paid placement.</strong> Restaurants are listed
            in deterministic alphabetical order. Visibility cannot be bought.
          </li>
        </ul>
      </section>

      <section className={styles.section} aria-labelledby="terms-heading">
        <h2 id="terms-heading" className={styles.sectionHeading}>
          Your restaurant stays yours
        </h2>
        <ul className={styles.pointList}>
          <li>No exclusivity agreement — list anywhere else you like.</li>
          <li>You can deactivate your listing or leave at any time, without friction.</li>
          <li>
            Your data — menu, orders, history — is yours to export. Data sovereignty is a
            constitutional guarantee on this platform.
          </li>
          <li>
            Deliveries are made by couriers who are workers with rights and transparent
            pay — never treated as anonymous contractors.
          </li>
        </ul>
      </section>

      <OnboardingForm />
    </div>
  )
}
