import Link from 'next/link'
import { ResetPasswordForm } from './ResetPasswordForm'
import styles from './page.module.css'

export const metadata = { title: 'Choose a new password' }

interface ResetPasswordPageProps {
  searchParams: Promise<{ token?: string; error?: string }>
}

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const { token, error } = await searchParams

  if (!token || error) {
    return (
      <div className={styles.form}>
        <h1 className={styles.heading}>Reset link not valid</h1>
        <div role="alert" className={styles.globalError}>
          This reset link is invalid or has already been used. Please request a new one.
        </div>
        <div className={styles.footer}>
          <Link href="/auth/forgot-password" className={styles.link}>
            Request a new reset link
          </Link>
          <span className={styles.divider}>or</span>
          <Link href="/auth/signin" className={styles.link}>
            Back to sign in
          </Link>
        </div>
      </div>
    )
  }

  return <ResetPasswordForm token={token} />
}
