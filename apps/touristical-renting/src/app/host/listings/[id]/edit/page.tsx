import { redirect, notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { getListingById } from '@/lib/services/listings'
import { EditListingForm } from './_components/EditListingForm'
import styles from './page.module.css'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditListingPage({ params }: PageProps) {
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

  return (
    <div className={styles.root}>
      <h1 className={styles.heading}>Edit listing</h1>
      <p className={styles.subheading}>{listing.title}</p>
      <EditListingForm listing={listing} />
    </div>
  )
}
