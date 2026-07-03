import Link from 'next/link'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { SignOutButton } from './SignOutButton'
import styles from './SiteHeader.module.css'

export async function SiteHeader() {
  const session = await auth.api.getSession({ headers: await headers() })
  const user = session?.user ?? null

  return (
    <header className={styles.root}>
      <div className={styles.inner}>
        <Link href="/" className={styles.logo}>
          touristical
        </Link>
        <nav className={styles.nav} aria-label="Main navigation">
          <Link href="/listings" className={styles.navLink}>
            Find a place
          </Link>
          {user ? (
            <>
              <Link href="/bookings" className={styles.navLink}>
                Bookings
              </Link>
              <Link href="/favorites" className={styles.navLink}>
                Favorites
              </Link>
              <Link href="/enquiries" className={styles.navLink}>
                Enquiries
              </Link>
              <Link href="/profile" className={styles.navLink}>
                Profile
              </Link>
              {user.isHost ? (
                <Link href="/host" className={styles.navLink}>
                  Host dashboard
                </Link>
              ) : (
                <Link href="/host/listings/new" className={styles.navLink}>
                  Host your space
                </Link>
              )}
            </>
          ) : (
            <Link href="/host/listings/new" className={styles.navLink}>
              Host your space
            </Link>
          )}
        </nav>
        <div className={styles.actions}>
          {user ? (
            <SignOutButton />
          ) : (
            <Link href="/auth/signin" className={styles.signinLink}>
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
