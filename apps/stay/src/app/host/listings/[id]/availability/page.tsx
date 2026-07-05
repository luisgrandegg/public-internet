import { redirect, notFound } from 'next/navigation'
import { headers } from 'next/headers'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { getListingById } from '@/lib/services/listings'
import { getAvailabilityBlocks } from '@/lib/services/availability-blocks'
import { AvailabilityBlocksManager } from './_components/AvailabilityBlocksManager'
import styles from './page.module.css'

export const metadata = { title: 'Manage availability' }

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ManageAvailabilityPage({ params }: PageProps) {
  const { id } = await params

  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    redirect('/auth/signin')
  }

  const listing = await getListingById(id)
  if (!listing) {
    notFound()
  }

  if (listing.hostId !== session.user.id) {
    redirect('/host')
  }

  const blocks = await getAvailabilityBlocks(id)

  return (
    <div className={styles.root}>
      <p>
        <Link href="/host" className={styles.backLink}>
          ← Back to host dashboard
        </Link>
      </p>
      <h1 className={styles.heading}>Manage availability</h1>
      <p className={styles.subheading}>{listing.title}</p>
      <p className={styles.description}>
        Block dates when your place is not available — guests cannot book blocked dates.
        Dates with a confirmed booking cannot be blocked.
      </p>

      <AvailabilityBlocksManager
        listingId={id}
        blocks={blocks.map((block) => ({
          id: block.id,
          startDate: block.startDate.toISOString().split('T')[0],
          endDate: block.endDate.toISOString().split('T')[0],
          reason: block.reason,
        }))}
      />
    </div>
  )
}
