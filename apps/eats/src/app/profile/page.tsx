import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { SignOutButton } from './SignOutButton'
import styles from './page.module.css'

export default async function ProfilePage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/auth/signin')

  const user = session.user as {
    id: string
    name: string
    email: string
    isRestaurantOwner?: boolean
    isCourier?: boolean
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Your profile</h1>
      <p className={styles.description}>
        This is your account overview. You can sign out below — no friction, no retention
        tactics.
      </p>

      <section className={styles.section} aria-labelledby="identity-heading">
        <h2 id="identity-heading" className={styles.sectionHeading}>
          Identity
        </h2>
        <dl className={styles.list}>
          <div className={styles.row}>
            <dt>Name</dt>
            <dd>{user.name}</dd>
          </div>
          <div className={styles.row}>
            <dt>Email</dt>
            <dd>{user.email}</dd>
          </div>
        </dl>
      </section>

      <section className={styles.section} aria-labelledby="roles-heading">
        <h2 id="roles-heading" className={styles.sectionHeading}>
          Roles on this node
        </h2>
        <ul className={styles.roleList}>
          <li>Customer — everyone can order food</li>
          <li>
            Restaurant owner — {user.isRestaurantOwner ? 'enabled' : 'not enabled'}
          </li>
          <li>Courier — {user.isCourier ? 'enabled' : 'not enabled'}</li>
        </ul>
      </section>

      <section className={styles.section} aria-labelledby="signout-heading">
        <h2 id="signout-heading" className={styles.sectionHeading}>
          Sign out
        </h2>
        <p>
          Signing out ends your session on this device. You can sign back in anytime from
          the home page.
        </p>
        <SignOutButton />
      </section>
    </div>
  )
}
