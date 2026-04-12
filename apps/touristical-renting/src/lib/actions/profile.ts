'use server'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'

export type ProfileActionResult =
  | { ok: true }
  | { ok: false; fieldErrors: Record<string, string>; globalError?: string }

export async function updateProfileAction(
  _prev: ProfileActionResult | null,
  formData: FormData,
): Promise<ProfileActionResult> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return { ok: false, fieldErrors: {}, globalError: 'You must be signed in to update your profile' }
  }

  const name = formData.get('name')
  const image = formData.get('image')

  const body: Record<string, string> = {}
  if (name && String(name).trim()) body.name = String(name).trim()
  if (image && String(image).trim()) body.image = String(image).trim()

  const requestHeaders = await headers()

  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/users/me`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      cookie: requestHeaders.get('cookie') ?? '',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const json = await res.json().catch(() => null)
    const error = json?.error
    return {
      ok: false,
      fieldErrors: error?.fields ?? {},
      globalError: error?.message ?? 'Could not update profile. Please try again.',
    }
  }

  revalidatePath('/profile')
  return { ok: true }
}

export async function becomeHostAction(): Promise<ProfileActionResult> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return { ok: false, fieldErrors: {}, globalError: 'You must be signed in to enable host status' }
  }

  const requestHeaders = await headers()

  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/users/me/become-host`, {
    method: 'POST',
    headers: {
      cookie: requestHeaders.get('cookie') ?? '',
    },
  })

  if (!res.ok) {
    const json = await res.json().catch(() => null)
    return {
      ok: false,
      fieldErrors: {},
      globalError: json?.error?.message ?? 'Could not enable host status. Please try again.',
    }
  }

  revalidatePath('/profile')
  revalidatePath('/host')
  return { ok: true }
}
