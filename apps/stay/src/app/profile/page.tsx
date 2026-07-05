import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { getUserProfile } from '@/lib/services/users'
import { ProfileForm } from './_components/ProfileForm'
import { HostToggle } from './_components/HostToggle'
import { DataExport } from './_components/DataExport'
import styles from './page.module.css'

export const metadata = { title: 'Your profile' }

export default async function ProfilePage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/auth/signin')

  const profile = await getUserProfile(session.user.id)
  if (!profile) redirect('/auth/signin')

  return (
    <div className={styles.root}>
      <h1 className={styles.heading}>Your profile</h1>

      <ProfileForm
        name={profile.name}
        email={profile.email}
        image={profile.image ?? null}
      />

      <hr className={styles.divider} />

      <HostToggle isHost={profile.isHost} />

      <hr className={styles.divider} />

      <DataExport />
    </div>
  )
}
