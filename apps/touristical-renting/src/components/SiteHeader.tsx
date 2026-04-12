import Link from 'next/link'
import styles from './SiteHeader.module.css'

export function SiteHeader() {
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
          <Link href="/host/listings/new" className={styles.navLink}>
            Host your space
          </Link>
        </nav>
        <div className={styles.actions}>
          <Link href="/auth/signin" className={styles.signinLink}>
            Sign in
          </Link>
        </div>
      </div>
    </header>
  )
}
