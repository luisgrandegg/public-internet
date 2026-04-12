import Link from 'next/link'
import styles from './SiteHeader.module.css'

export function SiteHeader() {
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
          <Link href="/restaurant/register" className={styles.navLink}>
            List your restaurant
          </Link>
          <Link href="/courier/register" className={styles.navLink}>
            Deliver with us
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
