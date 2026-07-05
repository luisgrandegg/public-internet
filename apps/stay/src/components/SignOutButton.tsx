'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from '@/lib/auth-client'
import styles from './SignOutButton.module.css'

export function SignOutButton() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleSignOut() {
    startTransition(async () => {
      await signOut()
      router.push('/')
      router.refresh()
    })
  }

  return (
    <button
      type="button"
      className={styles.root}
      onClick={handleSignOut}
      disabled={isPending}
    >
      {isPending ? 'Signing out…' : 'Sign out'}
    </button>
  )
}
