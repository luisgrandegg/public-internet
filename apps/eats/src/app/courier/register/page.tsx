import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import {
  DEFAULT_COURIER_BASE_PAY_CENTS,
  DEFAULT_COURIER_DISTANCE_PAY_CENTS,
} from '@/lib/config'
import { formatEuros } from '@/lib/format'
import { CourierRegistrationForm } from './CourierRegistrationForm'
import styles from './page.module.css'

export default async function CourierRegisterPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/auth/signin')

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.heading}>Deliver with Eats</h1>
        <p className={styles.subheading}>
          Eats couriers are workers with rights — not gig-economy piecework.
          Here&apos;s exactly how your pay is calculated and what happens if a decision
          affects your account.
        </p>
      </header>

      <section className={styles.section} aria-labelledby="pay-heading">
        <h2 id="pay-heading" className={styles.sectionHeading}>
          How your pay is calculated
        </h2>
        <p className={styles.sectionBody}>
          For every delivery you accept, you see the exact breakdown{' '}
          <strong>before</strong> you accept. It is always:
        </p>
        <ul className={styles.breakdownList}>
          <li>
            <strong>Base pay</strong> — a flat amount for every delivery. On this node
            it starts at <strong>{formatEuros(DEFAULT_COURIER_BASE_PAY_CENTS)}</strong>.
          </li>
          <li>
            <strong>Distance pay</strong> — calculated from the estimated distance
            between the restaurant and the delivery address. The default component is{' '}
            <strong>{formatEuros(DEFAULT_COURIER_DISTANCE_PAY_CENTS)}</strong>.
          </li>
          <li>
            <strong>Your pay = base pay + distance pay</strong>. Both values are shown
            separately on every delivery and in your history. No opaque totals, no hidden
            deductions, no surge pricing.
          </li>
        </ul>
      </section>

      <section className={styles.section} aria-labelledby="appeal-heading">
        <h2 id="appeal-heading" className={styles.sectionHeading}>
          Your rights and the appeal process
        </h2>
        <ul className={styles.rightsList}>
          <li>Your pay breakdown is always visible — per delivery and in your history.</li>
          <li>
            No account decision will be taken without a written explanation and a documented
            appeal path.
          </li>
          <li>
            You can request your full work history at any time. Data sovereignty is a
            constitutional guarantee on this platform.
          </li>
          <li>
            This platform does not classify you as a contractor. Where local law permits, a
            cooperative or employment model is preferred.
          </li>
        </ul>
      </section>

      <CourierRegistrationForm />
    </div>
  )
}
