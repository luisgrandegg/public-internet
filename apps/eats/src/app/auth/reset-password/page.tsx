import { ResetPasswordForm } from './ResetPasswordForm'

interface PageProps {
  searchParams: Promise<{ token?: string; error?: string }>
}

/**
 * Password reset landing page.
 * better-auth redirects here from the emailed reset link with `?token=…`,
 * or with `?error=INVALID_TOKEN` when the link is no longer valid.
 */
export default async function ResetPasswordPage({ searchParams }: PageProps) {
  const { token, error } = await searchParams
  return <ResetPasswordForm token={token ?? null} linkError={Boolean(error)} />
}
