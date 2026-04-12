'use client'

import { useState, useTransition } from 'react'
import { Textarea, Button } from '@public-internet/design-system'
import { replyToEnquiryAction } from '@/lib/actions/host'
import styles from './EnquiryReplyForm.module.css'

interface EnquiryReplyFormProps {
  enquiryId: string
}

export function EnquiryReplyForm({ enquiryId }: EnquiryReplyFormProps) {
  const [reply, setReply] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  if (sent) {
    return <p className={styles.success}>Reply sent.</p>
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!reply.trim()) {
      setError('Reply cannot be empty.')
      return
    }
    setError(null)
    startTransition(async () => {
      const result = await replyToEnquiryAction(enquiryId, reply)
      if (result.ok) {
        setSent(true)
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      {error && <p className={styles.error} role="alert">{error}</p>}
      <Textarea
        name="reply"
        label="Your reply"
        value={reply}
        onChange={(e) => setReply(e.target.value)}
        rows={3}
        required
        disabled={isPending}
      />
      <Button type="submit" variant="primary" disabled={isPending}>
        {isPending ? 'Sending…' : 'Send reply'}
      </Button>
    </form>
  )
}
