'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export type RestaurantOwnerOnboardingResult =
  | { ok: true }
  | { ok: false; globalError: string }

/**
 * Enable the restaurant-owner role for the current user.
 * Directly updates `User.isRestaurantOwner = true` — no new REST route is needed
 * (mirrors the courier registration action). The onboarding page explains the
 * commission-free model and requires an explicit acknowledgement before this runs.
 */
export async function becomeRestaurantOwnerAction(
  _prev: RestaurantOwnerOnboardingResult | null,
  formData: FormData,
): Promise<RestaurantOwnerOnboardingResult> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return { ok: false, globalError: 'You must be signed in to add your restaurant.' }
  }

  if (!formData.get('acknowledge')) {
    return {
      ok: false,
      globalError: 'Please confirm you have read how the commission-free model works.',
    }
  }

  try {
    await db.user.update({
      where: { id: session.user.id },
      data: { isRestaurantOwner: true, updatedAt: new Date() },
    })
    revalidatePath('/restaurant')
    revalidatePath('/profile')
    return { ok: true }
  } catch {
    return {
      ok: false,
      globalError: 'Could not enable the restaurant-owner role. Please try again.',
    }
  }
}
