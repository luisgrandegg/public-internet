import { notFound, redirect } from 'next/navigation'
import { headers } from 'next/headers'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { getListingById, getListingAvailability } from '@/lib/services/listings'
import { BookingForm } from './_components/BookingForm'
import styles from './page.module.css'

interface BookPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ checkIn?: string; checkOut?: string }>
}

export default async function BookPage({ params, searchParams }: BookPageProps) {
  const { id } = await params
  const { checkIn, checkOut } = await searchParams

  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    redirect(`/auth/signin?returnTo=/listings/${id}/book`)
  }

  const [listing, availability] = await Promise.all([
    getListingById(id),
    getListingAvailability(id),
  ])

  if (!listing) notFound()

  return (
    <div className={styles.root}>
      <h1 className={styles.heading}>Confirm your booking</h1>
      <p className={styles.listingTitle}>
        <Link href={`/listings/${id}`} className={styles.listingLink}>
          {listing.title}
        </Link>
        {' '}— {listing.city}, {listing.country}
      </p>

      <BookingForm
        listingId={listing.id}
        nightlyRate={listing.nightlyRate}
        initialCheckIn={checkIn ?? ''}
        initialCheckOut={checkOut ?? ''}
        blockedRanges={availability.blockedRanges}
      />
    </div>
  )
}
