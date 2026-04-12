'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Textarea, Button } from '@public-internet/design-system'
import { createEnquiryAction } from '@/lib/actions/enquiries'
import styles from './ContactHostForm.module.css'

interface ContactHostFormProps {
  listingId: string
  isAuthenticated: boolean
}

export function ContactHostForm({ listingId, isAuthenticated }: ContactHostFormProps) {
  const [message, setMessage] = useState('')
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  if (!isAuthenticated) {
    return (
      <p>
        <Link href="/auth/signin">Sign in</Link> to contact the host.
      </p>
    )
  }

  if (success) {
    return (
      <div className={styles.success} role="status">
        Your message has been sent. The host will reply via the platform.
      </div>
    )
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!message.trim() || message.trim().length < 10) {
      setError('Your message must be at least 10 characters.')
      return
    }
    setError(null)

    startTransition(async () => {
      const result = await createEnquiryAction(listingId, message)
      if (result.ok) {
        setSuccess(true)
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      {error && (
        <div className={styles.error} role="alert">
          {error}
        </div>
      )}

      <Textarea
        name="message"
        label="Message to host"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Hi, I have a question about your listing…"
        rows={4}
        required
        disabled={isPending}
      />

      <Button type="submit" variant="primary" disabled={isPending}>
        {isPending ? 'Sending…' : 'Send enquiry'}
      </Button>
    </form>
  )
}
