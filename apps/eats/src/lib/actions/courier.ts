'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export type CourierRegisterResult =
  | { ok: true }
  | { ok: false; globalError: string }

/**
 * Register the current user as a courier.
 * Directly updates `User.isCourier = true` — no new REST route is needed.
 * The registration UI on the page explains the pay model (basePay + distancePay)
 * and the appeal path before this action runs.
 */
export async function registerAsCourierAction(
  _prev: CourierRegisterResult | null,
  _formData: FormData,
): Promise<CourierRegisterResult> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return { ok: false, globalError: 'You must be signed in to register as a courier.' }
  }

  try {
    await db.user.update({
      where: { id: session.user.id },
      data: { isCourier: true, updatedAt: new Date() },
    })
    revalidatePath('/courier')
    revalidatePath('/profile')
    return { ok: true }
  } catch {
    return { ok: false, globalError: 'Could not register as a courier. Please try again.' }
  }
}
