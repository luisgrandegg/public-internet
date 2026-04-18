import Link from 'next/link'
import { Card } from '@public-internet/design-system'
import styles from './layout.module.css'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className={styles.root}>
      <Link href="/" className={styles.backLink}>
        ← Back to home
      </Link>
      <div className={styles.cardWrapper}>
        <Card variant="elevated">{children}</Card>
      </div>
    </div>
  )
}
