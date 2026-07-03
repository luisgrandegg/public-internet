'use client'

import { useRef, useState, useTransition, useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Input, Button } from '@public-internet/design-system'
import {
  createAvailabilityBlockAction,
  deleteAvailabilityBlockAction,
} from '@/lib/actions/availability-blocks'
import type { AvailabilityBlockActionResult } from '@/lib/actions/availability-blocks'
import styles from './AvailabilityBlocksManager.module.css'

export interface AvailabilityBlockItem {
  id: string
  startDate: string // YYYY-MM-DD
  endDate: string // YYYY-MM-DD
  reason: string | null
}

interface AvailabilityBlocksManagerProps {
  listingId: string
  blocks: AvailabilityBlockItem[]
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function AvailabilityBlocksManager({ listingId, blocks }: AvailabilityBlocksManagerProps) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isDeleting, startDeleteTransition] = useTransition()

  const [createState, createAction, isCreating] = useActionState<
    AvailabilityBlockActionResult | null,
    FormData
  >(createAvailabilityBlockAction, null)

  useEffect(() => {
    if (createState?.ok) {
      formRef.current?.reset()
      router.refresh()
    }
  }, [createState, router])

  function handleDelete(blockId: string) {
    setDeleteError(null)
    setDeletingId(blockId)
    startDeleteTransition(async () => {
      const result = await deleteAvailabilityBlockAction(listingId, blockId)
      if (!result.ok) {
        setDeleteError(result.error)
      }
      setDeletingId(null)
      router.refresh()
    })
  }

  return (
    <div className={styles.root}>
      <section aria-labelledby="add-block-heading" className={styles.formSection}>
        <h2 id="add-block-heading" className={styles.sectionHeading}>
          Block a date range
        </h2>

        <form ref={formRef} action={createAction} className={styles.form}>
          <input type="hidden" name="_listingId" value={listingId} />

          {createState && !createState.ok && (
            <div role="alert" className={styles.error}>
              {createState.error}
            </div>
          )}
          {createState?.ok && (
            <div role="status" className={styles.success}>
              Dates blocked.
            </div>
          )}

          <div className={styles.dateRow}>
            <Input
              name="startDate"
              type="date"
              label="First blocked day"
              required
              disabled={isCreating}
              error={createState && !createState.ok ? createState.fieldErrors?.startDate : undefined}
            />
            <Input
              name="endDate"
              type="date"
              label="First available day after the block"
              required
              disabled={isCreating}
              error={createState && !createState.ok ? createState.fieldErrors?.endDate : undefined}
            />
          </div>

          <Input
            name="reason"
            type="text"
            label="Reason (optional)"
            placeholder="e.g. Personal use, maintenance"
            maxLength={200}
            disabled={isCreating}
            error={createState && !createState.ok ? createState.fieldErrors?.reason : undefined}
          />

          <div>
            <Button type="submit" variant="primary" disabled={isCreating}>
              {isCreating ? 'Blocking…' : 'Block dates'}
            </Button>
          </div>
        </form>
      </section>

      <section aria-labelledby="blocks-heading" className={styles.listSection}>
        <h2 id="blocks-heading" className={styles.sectionHeading}>
          Blocked date ranges ({blocks.length})
        </h2>

        {deleteError && (
          <div role="alert" className={styles.error}>
            {deleteError}
          </div>
        )}

        {blocks.length === 0 ? (
          <p className={styles.empty}>No blocked dates. Your calendar is fully open for bookings.</p>
        ) : (
          <ul className={styles.blocksList}>
            {blocks.map((block) => (
              <li key={block.id} className={styles.blockItem}>
                <div className={styles.blockInfo}>
                  <span className={styles.blockDates}>
                    {formatDate(block.startDate)} → {formatDate(block.endDate)}
                  </span>
                  {block.reason && <span className={styles.blockReason}>{block.reason}</span>}
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(block.id)}
                  disabled={isDeleting && deletingId === block.id}
                  aria-label={`Remove block from ${formatDate(block.startDate)} to ${formatDate(block.endDate)}`}
                >
                  {isDeleting && deletingId === block.id ? 'Removing…' : 'Remove'}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
