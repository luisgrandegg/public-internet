'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@public-internet/design-system'
import { signOut } from '@/lib/auth-client'

export function SignOutButton() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  return (
    <Button
      variant="secondary"
      type="button"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await signOut()
          router.push('/')
          router.refresh()
        })
      }
    >
      {isPending ? 'Signing out…' : 'Sign out'}
    </Button>
  )
}
