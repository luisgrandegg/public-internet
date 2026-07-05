'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { setFavoriteAction } from '@/lib/actions/favorites'
import styles from './FavoriteButton.module.css'

interface FavoriteButtonProps {
  listingId: string
  /** Accessible listing name, used in the button's aria-label. */
  listingTitle: string
  initialFavorited: boolean
  className?: string
}

/**
 * Save/unsave toggle for signed-in users. State is conveyed by the text
 * label ("Save" / "Saved") and aria-pressed — never by colour or icon alone.
 * Signed-out users never see this button — render nothing instead.
 */
export function FavoriteButton({
  listingId,
  listingTitle,
  initialFavorited,
  className,
}: FavoriteButtonProps) {
  const router = useRouter()
  const [favorited, setFavorited] = useState(initialFavorited)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleToggle(event: React.MouseEvent<HTMLButtonElement>) {
    // The button may sit next to a card-level link — never trigger navigation.
    event.preventDefault()
    event.stopPropagation()

    const next = !favorited
    setFavorited(next) // optimistic — reverted if the request fails
    setError(null)

    startTransition(async () => {
      const result = await setFavoriteAction(listingId, next)
      if (!result.ok) {
        setFavorited(!next)
        setError(result.error)
        return
      }
      router.refresh()
    })
  }

  return (
    <span className={styles.wrapper}>
      <button
        type="button"
        className={`${styles.root} ${favorited ? styles.favorited : ''} ${className ?? ''}`}
        aria-pressed={favorited}
        aria-label={favorited ? `Remove ${listingTitle} from favorites` : `Save ${listingTitle} to favorites`}
        onClick={handleToggle}
        disabled={isPending}
      >
        <span aria-hidden="true" className={styles.glyph}>
          {favorited ? '♥' : '♡'}
        </span>
        <span className={styles.label}>{favorited ? 'Saved' : 'Save'}</span>
      </button>
      {error && (
        <span role="alert" className={styles.error}>
          {error}
        </span>
      )}
    </span>
  )
}
