import Link from 'next/link'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import styles from './SiteHeader.module.css'

/**
 * Session-aware site header.
 *
 * Shows role-appropriate links to signed-in users:
 *   - everyone: profile, orders
 *   - couriers: courier dashboard
 *   - restaurant owners: restaurant dashboard
 *
 * Signed-out users see sign-in and sign-up CTAs.
 */
export async function SiteHeader() {
  const session = await auth.api.getSession({ headers: await headers() })
  const user = session?.user
  const isRestaurantOwner = Boolean(
    (user as { isRestaurantOwner?: boolean } | undefined)?.isRestaurantOwner,
  )
  const isCourier = Boolean((user as { isCourier?: boolean } | undefined)?.isCourier)

  return (
    <header className={styles.root}>
      <div className={styles.inner}>
        <Link href="/" className={styles.logo}>
          eats
        </Link>
        <nav className={styles.nav} aria-label="Main navigation">
          <Link href="/restaurants" className={styles.navLink}>
            Order food
          </Link>
          {!user && (
            <>
              <Link href="/restaurant/onboarding" className={styles.navLink}>
                List your restaurant
              </Link>
              <Link href="/courier/register" className={styles.navLink}>
                Deliver with us
              </Link>
            </>
          )}
          {user && (
            <>
              <Link href="/orders" className={styles.navLink}>
                My orders
              </Link>
              {isRestaurantOwner && (
                <Link href="/restaurant" className={styles.navLink}>
                  Restaurant
                </Link>
              )}
              {isCourier && (
                <Link href="/courier" className={styles.navLink}>
                  Courier
                </Link>
              )}
              {!isRestaurantOwner && (
                <Link href="/restaurant/onboarding" className={styles.navLink}>
                  List your restaurant
                </Link>
              )}
              {!isCourier && (
                <Link href="/courier/register" className={styles.navLink}>
                  Deliver with us
                </Link>
              )}
            </>
          )}
        </nav>
        <div className={styles.actions}>
          {user ? (
            <Link href="/profile" className={styles.signinLink}>
              Profile
            </Link>
          ) : (
            <>
              <Link href="/auth/signin" className={styles.navLink}>
                Sign in
              </Link>
              <Link href="/auth/signup" className={styles.signinLink}>
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
