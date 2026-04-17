'use server'

import { revalidatePath } from 'next/cache'
import { forwardAuthHeaders, apiUrl } from './_internal'

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; fieldErrors: Record<string, string>; globalError?: string }

export async function createRestaurant(
  _prev: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const body = {
    name: String(formData.get('name') ?? ''),
    description: String(formData.get('description') ?? ''),
    address: String(formData.get('address') ?? ''),
    city: String(formData.get('city') ?? ''),
    country: String(formData.get('country') ?? ''),
    phone: String(formData.get('phone') ?? ''),
    imageUrl: String(formData.get('imageUrl') ?? ''),
  }

  try {
    const res = await fetch(apiUrl('/api/restaurant/restaurants'), {
      method: 'POST',
      headers: await forwardAuthHeaders(),
      body: JSON.stringify(body),
      cache: 'no-store',
    })

    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      if (res.status === 401) {
        return {
          ok: false,
          fieldErrors: {},
          globalError: 'You must be signed in to register a restaurant.',
        }
      }
      return {
        ok: false,
        fieldErrors: json.error?.fields ?? {},
        globalError: json.error?.message ?? 'Could not register restaurant.',
      }
    }

    const { data } = await res.json()
    revalidatePath('/restaurant')
    revalidatePath('/restaurants')
    return { ok: true, data: { id: data.id } }
  } catch {
    return {
      ok: false,
      fieldErrors: {},
      globalError: 'Network error. Please try again.',
    }
  }
}
