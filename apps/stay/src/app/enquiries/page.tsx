import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { getGuestEnquiries } from '@/lib/services/enquiries'
import styles from './page.module.css'

export const metadata = { title: 'My enquiries' }

function formatDate(value: Date): string {
  return new Date(value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default async function EnquiriesPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/auth/signin')

  const enquiries = await getGuestEnquiries(session.user.id)

  return (
    <div className={styles.root}>
      <h1 className={styles.heading}>My enquiries</h1>

      {enquiries.length === 0 ? (
        <div className={styles.empty}>
          <p>You have not sent any enquiries yet.</p>
          <p>
            <Link href="/listings" className={styles.emptyLink}>
              Browse listings
            </Link>{' '}
            and contact a host to get started.
          </p>
        </div>
      ) : (
        <ul className={styles.enquiriesList}>
          {enquiries.map((enquiry) => (
            <li key={enquiry.id} className={styles.enquiryCard}>
              <div className={styles.enquiryHeader}>
                <Link href={`/listings/${enquiry.listing.id}`} className={styles.listingLink}>
                  {enquiry.listing.title}
                </Link>
                <span
                  className={`${styles.enquiryStatus} ${enquiry.reply ? styles.statusReplied : styles.statusAwaiting}`}
                >
                  {enquiry.reply ? 'Replied' : 'No reply yet'}
                </span>
              </div>

              <div className={styles.message}>
                <div className={styles.messageMeta}>
                  Your message · sent {formatDate(enquiry.createdAt)}
                </div>
                <p className={styles.messageBody}>{enquiry.message}</p>
              </div>

              {enquiry.reply ? (
                <div className={styles.reply}>
                  <div className={styles.messageMeta}>
                    Host reply
                    {enquiry.repliedAt ? ` · ${formatDate(enquiry.repliedAt)}` : ''}
                  </div>
                  <p className={styles.messageBody}>{enquiry.reply}</p>
                </div>
              ) : (
                <p className={styles.noReply}>
                  The host has not replied yet. You will see their reply here.
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
